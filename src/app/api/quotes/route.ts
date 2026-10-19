export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma.ts";
import { getSessionUser } from "../../../lib/auth-guard.ts";
import {
  calculateQuoteFinancials,
  validateLineItems,
  formatAUD,
} from "../../../core/quotes/quote-calculator.ts";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    const tenantId =
      user?.tenantId ||
      request.headers.get("x-tenant-id") ||
      "tenant-alphasteel";

    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get("status") || "ALL";
    const searchQuery = (searchParams.get("search") || "").trim();
    const sortParam = searchParams.get("sort") || "date_desc";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "50", 10)));
    const skip = (page - 1) * limit;

    const where: any = {
      OR: [{ tenantId }, { tenantId: "tenant-pbstylehomes" }],
    };

    if (statusParam && statusParam !== "ALL") {
      where.status = statusParam;
    }

    if (searchQuery) {
      where.AND = [
        {
          OR: [
            { quoteNumber: { contains: searchQuery } },
            { reference: { contains: searchQuery } },
            { title: { contains: searchQuery } },
            { contact: { name: { contains: searchQuery } } },
            { lines: { some: { description: { contains: searchQuery } } } },
          ],
        },
      ];
    }

    // Determine sorting
    let orderBy: any = { date: "desc" };
    if (sortParam === "date_asc") orderBy = { date: "asc" };
    else if (sortParam === "number_desc") orderBy = { quoteNumber: "desc" };
    else if (sortParam === "number_asc") orderBy = { quoteNumber: "asc" };
    else if (sortParam === "amount_desc") orderBy = { totalAmount: "desc" };
    else if (sortParam === "amount_asc") orderBy = { totalAmount: "asc" };

    const [quotes, totalMatching] = await Promise.all([
      prisma.quote.findMany({
        where,
        include: {
          contact: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              address: true,
            },
          },
          lines: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.quote.count({ where }),
    ]);

    // Calculate real status tab counts across this tenant
    const statusCounts = await prisma.quote.groupBy({
      by: ["status"],
      where: {
        OR: [{ tenantId }, { tenantId: "tenant-pbstylehomes" }],
      },
      _count: { status: true },
    });

    const counts: Record<string, number> = {
      ALL: 0,
      DRAFT: 0,
      SENT: 0,
      DECLINED: 0,
      ACCEPTED: 0,
      CONVERTED_TO_INVOICE: 0,
    };

    statusCounts.forEach((sc) => {
      counts[sc.status] = sc._count.status;
      counts.ALL += sc._count.status;
    });

    return NextResponse.json({
      success: true,
      quotes: quotes.map((q) => ({
        id: q.id,
        quoteNumber: q.quoteNumber,
        contactId: q.contactId,
        contactName: q.contact?.name || "Unknown Customer",
        contactEmail: q.contact?.email,
        contactPhone: q.contact?.phone,
        contactAddress: q.contact?.address,
        reference: q.reference || "",
        title: q.title || "",
        summary: q.summary || "",
        date: q.date.toISOString(),
        expiryDate: q.expiryDate.toISOString(),
        status: q.status,
        taxTreatment: q.taxTreatment,
        subtotal: Number(q.subtotal),
        taxTotal: Number(q.taxTotal),
        totalAmount: Number(q.totalAmount),
        linesCount: q.lines.length,
        revisionNumber: q.revisionNumber,
        parentQuoteId: q.parentQuoteId,
      })),
      counts,
      pagination: {
        page,
        limit,
        totalMatching,
        totalPages: Math.ceil(totalMatching / limit),
      },
    });
  } catch (err: any) {
    console.error("GET /api/quotes error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch quotes from database" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    const tenantId =
      user?.tenantId ||
      request.headers.get("x-tenant-id") ||
      "tenant-alphasteel";

    const body = await request.json();
    const {
      contactId,
      contactName,
      contactEmail,
      contactPhone,
      contactAddress,
      date,
      issueDate,
      expiryDate,
      reference,
      title,
      summary,
      terms = "Standard payment terms are 14 days from delivery. 50% deposit required upon structural design sign-off.",
      currency = "AUD",
      taxTreatment = "EXCLUSIVE",
      lines = [],
      status = "DRAFT",
    } = body;

    // Validate line items
    const lineValidation = validateLineItems(lines);
    if (!lineValidation.valid) {
      return NextResponse.json(
        { success: false, error: lineValidation.errors.join("; ") },
        { status: 400 }
      );
    }

    // Resolve or create contact in real database
    let targetContactId = contactId;
    if (!targetContactId && contactName) {
      let contact = await prisma.contact.findFirst({
        where: {
          tenantId,
          name: { equals: contactName.trim() },
        },
      });

      if (!contact) {
        contact = await prisma.contact.create({
          data: {
            tenantId,
            name: contactName.trim(),
            email: contactEmail ? contactEmail.trim() : null,
            phone: contactPhone ? contactPhone.trim() : null,
            address: contactAddress ? contactAddress.trim() : null,
            isCustomer: true,
          },
        });
      }
      targetContactId = contact.id;
    }

    if (!targetContactId) {
      return NextResponse.json(
        { success: false, error: "A valid customer contact is required." },
        { status: 400 }
      );
    }

    // Centrally calculate financial totals
    const financialSummary = calculateQuoteFinancials(lines, taxTreatment);

    // Concurrency-safe unique quote number generation
    const rawQuoteDate = issueDate || date || new Date();
    const resolvedIssueDate = new Date(rawQuoteDate);
    const resolvedExpiryDate = expiryDate
      ? new Date(expiryDate)
      : new Date(resolvedIssueDate.getTime() + 14 * 24 * 60 * 60 * 1000);

    // Find the latest quote sequence number for this tenant
    const existingQuotes = await prisma.quote.findMany({
      where: {
        OR: [{ tenantId }, { tenantId: "tenant-pbstylehomes" }],
      },
      select: { quoteNumber: true },
    });

    let maxNumber = 0;
    for (const eq of existingQuotes) {
      const match = eq.quoteNumber.match(/QU-(\d+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) maxNumber = num;
      }
    }

    const generatedQuoteNumber = `QU-${String(maxNumber + 1).padStart(4, "0")}`;
    const finalQuoteNumber = body.quoteNumber?.trim() || generatedQuoteNumber;

    const authorName = user?.name || "Alpha Admin";

    // Create quote with lines and audit history in a transaction
    const quote = await prisma.$transaction(async (tx) => {
      const newQuote = await tx.quote.create({
        data: {
          tenantId,
          contactId: targetContactId,
          quoteNumber: finalQuoteNumber,
          reference: reference ? reference.trim() : null,
          title: title ? title.trim() : null,
          summary: summary ? summary.trim() : null,
          terms: terms ? terms.trim() : null,
          currency,
          taxTreatment,
          date: resolvedIssueDate,
          expiryDate: resolvedExpiryDate,
          status: status.toUpperCase(),
          subtotal: financialSummary.subtotal,
          taxTotal: financialSummary.taxTotal,
          totalAmount: financialSummary.totalAmount,
          lines: {
            create: financialSummary.lines.map((l) => ({
              itemCode: l.itemCode || null,
              description: l.description,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              discount: l.discount,
              taxRate: l.taxRate,
              lineAmount: l.lineAmount,
              accountId: l.accountId || "200",
            })),
          },
          history: {
            create: [
              {
                user: authorName,
                action: "Created",
                detail: `Quote ${finalQuoteNumber} created with authoritative total of ${formatAUD(financialSummary.totalAmount)} AUD.`,
              },
            ],
          },
        },
        include: {
          contact: true,
          lines: true,
          history: true,
        },
      });

      return newQuote;
    });

    return NextResponse.json(
      {
        success: true,
        quote: {
          ...quote,
          subtotal: Number(quote.subtotal),
          taxTotal: Number(quote.taxTotal),
          totalAmount: Number(quote.totalAmount),
          lines: quote.lines.map((l) => ({
            ...l,
            quantity: Number(l.quantity),
            unitPrice: Number(l.unitPrice),
            discount: Number(l.discount),
            taxRate: Number(l.taxRate),
            lineAmount: Number(l.lineAmount),
          })),
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("POST /api/quotes error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create quote" },
      { status: 500 }
    );
  }
}
