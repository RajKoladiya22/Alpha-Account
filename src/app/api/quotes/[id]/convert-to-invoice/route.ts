import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma.ts";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = request.headers.get("x-tenant-id") || "tenant-pbstylehomes";
    const quoteId = params.id;

    const quote = await prisma.quote.findFirst({
      where: {
        tenantId,
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

    // Auto-generate invoice number
    const invCount = await prisma.invoice.count({ where: { tenantId } });
    const invoiceNumber = `INV-${String(invCount + 1).padStart(4, "0")}`;

    // Create Invoice with referential lineage
    const invoice = await prisma.invoice.create({
      data: {
        tenantId,
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
            accountId: "200", // Default Sales account
          })),
        },
      },
    });

    // Update quote status
    await prisma.quote.update({
      where: { id: quote.id },
      data: {
        status: "CONVERTED_TO_INVOICE",
        convertedToInvoiceId: invoice.id,
      },
    });

    // Add audit log
    await prisma.auditLog.create({
      data: {
        tenantId,
        action: "CONVERT_TO_INVOICE",
        entityType: "QUOTE",
        entityId: quote.id,
        payload: {
          detail: `Converted to Invoice ${invoiceNumber}.`,
          invoiceId: invoice.id,
        },
      },
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
