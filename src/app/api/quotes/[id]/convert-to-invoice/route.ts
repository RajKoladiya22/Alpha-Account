export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma.ts";
import { getSessionUser } from "../../../../../lib/auth-guard.ts";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(request);
    const quoteId = params.id;

    const quote = await prisma.quote.findFirst({
      where: {
        OR: [{ id: quoteId }, { quoteNumber: quoteId }],
      },
      include: {
        contact: true,
        lines: true,
      },
    });

    if (!quote) {
      return NextResponse.json({ success: false, error: "Quote not found" }, { status: 404 });
    }

    if (quote.status === "CONVERTED_TO_INVOICE") {
      return NextResponse.json(
        { success: false, error: "Quote has already been converted to an invoice" },
        { status: 400 }
      );
    }

    const authorName = user?.name || "Alpha Admin";

    // Auto-generate invoice number
    const invCount = await prisma.invoice.count({ where: { tenantId: quote.tenantId } });
    const invoiceNumber = `INV-${String(invCount + 1).padStart(4, "0")}`;

    // Create Invoice with referential lineage in transaction
    const invoice = await prisma.$transaction(async (tx) => {
      const inv = await tx.invoice.create({
        data: {
          tenantId: quote.tenantId,
          contactId: quote.contactId,
          invoiceNumber,
          date: new Date(),
          dueDate: new Date(Date.now() + 14 * 86400000),
          status: "AUTHORIZED",
          subtotal: quote.subtotal,
          taxTotal: quote.taxTotal,
          totalAmount: quote.totalAmount,
          amountDue: quote.totalAmount,
          amountPaid: 0,
          sourceQuoteId: quote.id,
          lines: {
            create: quote.lines.map((l) => ({
              itemCode: l.itemCode,
              description: l.description,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              discount: l.discount,
              taxRate: l.taxRate,
              lineAmount: l.lineAmount,
              accountId: l.accountId || "200",
            })),
          },
        },
      });

      // Update quote status
      await tx.quote.update({
        where: { id: quote.id },
        data: {
          status: "CONVERTED_TO_INVOICE",
          convertedToInvoiceId: inv.id,
        },
      });

      // Add to QuoteHistory
      await tx.quoteHistory.create({
        data: {
          quoteId: quote.id,
          user: authorName,
          action: "Invoiced",
          detail: `Converted to Invoice ${invoiceNumber}.`,
        },
      });

      return inv;
    });

    return NextResponse.json({
      success: true,
      message: "Quote converted to invoice successfully",
      invoice,
    });
  } catch (err: any) {
    console.error("Conversion error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to convert quote to invoice" },
      { status: 500 }
    );
  }
}
