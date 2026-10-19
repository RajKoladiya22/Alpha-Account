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

    const originalQuote = await prisma.quote.findFirst({
      where: {
        OR: [{ id: quoteId }, { quoteNumber: quoteId }],
      },
      include: {
        lines: true,
        revisions: true,
      },
    });

    if (!originalQuote) {
      return NextResponse.json({ success: false, error: "Quote not found" }, { status: 404 });
    }

    const baseNumber = originalQuote.quoteNumber.replace(/-R\d+$/, "");
    const nextRevisionIndex = (originalQuote.revisions?.length || 0) + 1;
    const newQuoteNumber = `${baseNumber}-R${nextRevisionIndex}`;
    const authorName = user?.name || "Alpha Admin";

    // Transaction to create revision
    const revisedQuote = await prisma.$transaction(async (tx) => {
      const newQuote = await tx.quote.create({
        data: {
          tenantId: originalQuote.tenantId,
          contactId: originalQuote.contactId,
          quoteNumber: newQuoteNumber,
          reference: originalQuote.reference,
          title: originalQuote.title,
          summary: originalQuote.summary,
          terms: originalQuote.terms,
          currency: originalQuote.currency,
          taxTreatment: originalQuote.taxTreatment,
          date: new Date(),
          expiryDate: new Date(Date.now() + 14 * 86400000),
          status: "DRAFT",
          subtotal: originalQuote.subtotal,
          taxTotal: originalQuote.taxTotal,
          totalAmount: originalQuote.totalAmount,
          revisionNumber: (originalQuote.revisionNumber || 1) + 1,
          parentQuoteId: originalQuote.id,
          lines: {
            create: originalQuote.lines.map((l) => ({
              itemCode: l.itemCode,
              description: l.description,
              quantity: l.quantity,
              unitPrice: l.unitPrice,
              discount: l.discount,
              taxRate: l.taxRate,
              lineAmount: l.lineAmount,
              accountId: l.accountId,
            })),
          },
          history: {
            create: [
              {
                user: authorName,
                action: "Revised",
                detail: `Revision ${nextRevisionIndex} created from quote ${originalQuote.quoteNumber}.`,
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

      // Add audit history to original quote
      await tx.quoteHistory.create({
        data: {
          quoteId: originalQuote.id,
          user: authorName,
          action: "Revised",
          detail: `Created revised quotation ${newQuoteNumber}.`,
        },
      });

      return newQuote;
    });

    return NextResponse.json(
      {
        success: true,
        message: `Created revision ${newQuoteNumber}`,
        quote: {
          ...revisedQuote,
          subtotal: Number(revisedQuote.subtotal),
          taxTotal: Number(revisedQuote.taxTotal),
          totalAmount: Number(revisedQuote.totalAmount),
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Revision error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create quotation revision" },
      { status: 500 }
    );
  }
}
