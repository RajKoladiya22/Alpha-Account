export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma.ts";
import { getSessionUser } from "../../../../lib/auth-guard.ts";
import {
  calculateQuoteFinancials,
  validateLineItems,
  formatAUD,
} from "../../../../core/quotes/quote-calculator.ts";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(request);
    const tenantId =
      user?.tenantId ||
      request.headers.get("x-tenant-id") ||
      "tenant-alphasteel";
    const quoteId = params.id;

    const quote = await prisma.quote.findFirst({
      where: {
        OR: [
          { id: quoteId },
          { quoteNumber: quoteId },
        ],
      },
      include: {
        contact: true,
        lines: true,
        history: {
          orderBy: { timestamp: "desc" },
        },
        parentQuote: {
          select: { id: true, quoteNumber: true, totalAmount: true },
        },
        revisions: {
          select: { id: true, quoteNumber: true, totalAmount: true, status: true, revisionNumber: true },
          orderBy: { revisionNumber: "asc" },
        },
      },
    });

    if (!quote) {
      return NextResponse.json(
        { success: false, error: "Quote not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      quote: {
        id: quote.id,
        tenantId: quote.tenantId,
        quoteNumber: quote.quoteNumber,
        reference: quote.reference || "",
        title: quote.title || "",
        summary: quote.summary || "",
        terms: quote.terms || "",
        currency: quote.currency,
        taxTreatment: quote.taxTreatment,
        date: quote.date.toISOString(),
        expiryDate: quote.expiryDate.toISOString(),
        status: quote.status,
        subtotal: Number(quote.subtotal),
        taxTotal: Number(quote.taxTotal),
        totalAmount: Number(quote.totalAmount),
        revisionNumber: quote.revisionNumber,
        parentQuoteId: quote.parentQuoteId,
        parentQuote: quote.parentQuote,
        revisions: quote.revisions,
        contact: quote.contact
          ? {
              id: quote.contact.id,
              name: quote.contact.name,
              email: quote.contact.email,
              phone: quote.contact.phone,
              address: quote.contact.address,
            }
          : null,
        lines: quote.lines.map((l) => ({
          id: l.id,
          itemCode: l.itemCode || "",
          description: l.description,
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice),
          discount: Number(l.discount),
          taxRate: Number(l.taxRate),
          lineAmount: Number(l.lineAmount),
          accountId: l.accountId || "200",
        })),
        history: quote.history.map((h) => ({
          id: h.id,
          timestamp: h.timestamp.toISOString(),
          user: h.user,
          action: h.action,
          detail: h.detail,
          isNote: h.isNote,
        })),
      },
    });
  } catch (err: any) {
    console.error("GET /api/quotes/[id] error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch quote" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(request);
    const quoteId = params.id;
    const body = await request.json();

    const existingQuote = await prisma.quote.findFirst({
      where: {
        OR: [{ id: quoteId }, { quoteNumber: quoteId }],
      },
      include: { lines: true },
    });

    if (!existingQuote) {
      return NextResponse.json(
        { success: false, error: "Quote not found" },
        { status: 404 }
      );
    }

    if (
      existingQuote.status === "CONVERTED_TO_INVOICE" ||
      existingQuote.status === "ACCEPTED"
    ) {
      // If only updating status
      if (body.status && Object.keys(body).length === 1) {
        await prisma.quote.update({
          where: { id: existingQuote.id },
          data: { status: body.status },
        });
        return NextResponse.json({ success: true, message: "Status updated" });
      }

      return NextResponse.json(
        {
          success: false,
          error: `Cannot modify lines or details of quote in status ${existingQuote.status}. Use 'Revise' to create a new revision.`,
        },
        { status: 400 }
      );
    }

    const {
      contactId,
      issueDate,
      expiryDate,
      reference,
      title,
      summary,
      terms,
      currency = existingQuote.currency || "AUD",
      taxTreatment = existingQuote.taxTreatment || "EXCLUSIVE",
      lines = existingQuote.lines,
      status = existingQuote.status,
    } = body;

    // Validate line items
    if (lines && lines.length > 0) {
      const lineValidation = validateLineItems(lines);
      if (!lineValidation.valid) {
        return NextResponse.json(
          { success: false, error: lineValidation.errors.join("; ") },
          { status: 400 }
        );
      }
    }

    const financialSummary = calculateQuoteFinancials(lines, taxTreatment);
    const authorName = user?.name || "Alpha Admin";

    const updatedQuote = await prisma.$transaction(async (tx) => {
      // Delete old lines
      await tx.quoteLine.deleteMany({
        where: { quoteId: existingQuote.id },
      });

      // Update quote record
      const quote = await tx.quote.update({
        where: { id: existingQuote.id },
        data: {
          contactId: contactId || existingQuote.contactId,
          reference: reference !== undefined ? reference : existingQuote.reference,
          title: title !== undefined ? title : existingQuote.title,
          summary: summary !== undefined ? summary : existingQuote.summary,
          terms: terms !== undefined ? terms : existingQuote.terms,
          currency,
          taxTreatment,
          date: issueDate ? new Date(issueDate) : existingQuote.date,
          expiryDate: expiryDate ? new Date(expiryDate) : existingQuote.expiryDate,
          status: status || existingQuote.status,
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
                action: "Edited",
                detail: `Quote updated. Authoritative total: ${formatAUD(financialSummary.totalAmount)} AUD.`,
              },
            ],
          },
        },
        include: {
          contact: true,
          lines: true,
          history: { orderBy: { timestamp: "desc" } },
        },
      });

      return quote;
    });

    return NextResponse.json({
      success: true,
      quote: {
        ...updatedQuote,
        subtotal: Number(updatedQuote.subtotal),
        taxTotal: Number(updatedQuote.taxTotal),
        totalAmount: Number(updatedQuote.totalAmount),
      },
    });
  } catch (err: any) {
    console.error("PUT /api/quotes/[id] error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update quote" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const quoteId = params.id;
    const existing = await prisma.quote.findFirst({
      where: {
        OR: [{ id: quoteId }, { quoteNumber: quoteId }],
      },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Quote not found" },
        { status: 404 }
      );
    }

    if (existing.status === "CONVERTED_TO_INVOICE") {
      return NextResponse.json(
        { success: false, error: "Cannot delete quote that has already been converted to an invoice" },
        { status: 400 }
      );
    }

    await prisma.quote.delete({
      where: { id: existing.id },
    });

    return NextResponse.json({ success: true, message: "Quote deleted successfully" });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to delete quote" },
      { status: 500 }
    );
  }
}
