import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma.ts";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = request.headers.get("x-tenant-id") || "tenant-pbstylehomes";
    const statusParam = searchParams.get("status") || "ALL";
    const searchQuery = searchParams.get("search") || "";

    const where: any = {
      tenantId,
    };

    if (statusParam && statusParam !== "ALL") {
      where.status = statusParam;
    }

    if (searchQuery.trim()) {
      where.OR = [
        { quoteNumber: { contains: searchQuery, mode: "insensitive" } },
        { contact: { name: { contains: searchQuery, mode: "insensitive" } } },
      ];
    }

    const quotes = await prisma.quote.findMany({
      where,
      include: {
        contact: true,
        lines: true,
      },
      orderBy: { date: "desc" },
    });

    // Calculate status tab counts
    const allQuotes = await prisma.quote.findMany({
      where: { tenantId },
      select: { status: true },
    });

    const counts: Record<string, number> = {
      ALL: allQuotes.length,
      DRAFT: 0,
      SENT: 0,
      DECLINED: 0,
      ACCEPTED: 0,
      CONVERTED_TO_INVOICE: 0,
    };

    allQuotes.forEach((q) => {
      if (counts[q.status] !== undefined) {
        counts[q.status]++;
      }
    });

    return NextResponse.json({
      success: true,
      quotes: quotes.map((q) => ({
        id: q.id,
        quoteNumber: q.quoteNumber,
        contactId: q.contactId,
        contactName: q.contact?.name || "Unknown",
        reference: "",
        date: q.date.toISOString(),
        expiryDate: q.expiryDate.toISOString(),
        status: q.status,
        subtotal: Number(q.subtotal),
        taxTotal: Number(q.taxTotal),
        totalAmount: Number(q.totalAmount),
        linesCount: q.lines.length,
      })),
      counts,
    });
  } catch (err: any) {
    console.error("GET /api/quotes error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch quotes" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenantId = request.headers.get("x-tenant-id") || "tenant-pbstylehomes";
    const body = await request.json();

    const {
      contactId,
      contactName,
      issueDate,
      expiryDate,
      title,
      summary,
      reference,
      currency = "AUD",
      taxTreatment = "EXCLUSIVE",
      terms,
      lines = [],
    } = body;

    let targetContactId = contactId;

    // If contact name was provided instead of contactId, find or create
    if (!targetContactId && contactName) {
      let contact = await prisma.contact.findFirst({
        where: { tenantId, name: contactName },
      });
      if (!contact) {
        contact = await prisma.contact.create({
          data: {
            tenantId,
            name: contactName,
            isCustomer: true,
          },
        });
      }
      targetContactId = contact.id;
    }

    if (!targetContactId) {
      return NextResponse.json(
        { success: false, error: "A valid contact is required" },
        { status: 400 }
      );
    }

    // Auto-generate next sequential quote number
    const totalCount = await prisma.quote.count({ where: { tenantId } });
    const nextNum = `QU-${String(totalCount + 1).padStart(4, "0")}`;

    // Calculate totals
    let subtotal = 0;
    let taxTotal = 0;

    const formattedLines = lines.map((l: any) => {
      const qty = Number(l.quantity) || 1;
      const price = Number(l.unitPrice) || 0;
      const discount = Number(l.discount) || 0;
      const taxRate = Number(l.taxRate) || 10;
      const gross = qty * price * (1 - discount / 100);

      let lineAmt = 0;
      let taxAmt = 0;

      if (taxTreatment === "EXCLUSIVE") {
        lineAmt = Math.round(gross * 100) / 100;
        taxAmt = Math.round(lineAmt * (taxRate / 100) * 100) / 100;
      } else if (taxTreatment === "INCLUSIVE") {
        const full = Math.round(gross * 100) / 100;
        taxAmt = taxRate > 0 ? Math.round((full * (taxRate / (100 + taxRate))) * 100) / 100 : 0;
        lineAmt = Math.round((full - taxAmt) * 100) / 100;
      } else {
        lineAmt = Math.round(gross * 100) / 100;
        taxAmt = 0;
      }

      subtotal += lineAmt;
      taxTotal += taxAmt;

      return {
        description: l.description || "Service / Goods",
        quantity: qty,
        unitPrice: price,
        discount: discount,
        taxRate: taxRate,
        lineAmount: lineAmt,
      };
    });

    const totalAmount = Math.round((subtotal + taxTotal) * 100) / 100;

    const quote = await prisma.quote.create({
      data: {
        tenantId,
        contactId: targetContactId,
        quoteNumber: body.quoteNumber || nextNum,
        date: issueDate ? new Date(issueDate) : new Date(),
        expiryDate: expiryDate ? new Date(expiryDate) : new Date(Date.now() + 14 * 86400000),
        status: body.status || "DRAFT",
        subtotal,
        taxTotal,
        totalAmount,
        lines: {
          create: formattedLines,
        },
      },
      include: {
        contact: true,
        lines: true,
      },
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        tenantId,
        action: "CREATE_QUOTE",
        entityType: "QUOTE",
        entityId: quote.id,
        payload: {
          quoteNumber: quote.quoteNumber,
          totalAmount,
          title,
          summary,
        },
      },
    });

    return NextResponse.json({ success: true, quote }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/quotes error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create quote" },
      { status: 500 }
    );
  }
}
