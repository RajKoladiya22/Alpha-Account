export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma.ts";
import { getSessionUser } from "../../../../../lib/auth-guard.ts";
import { formatAUD } from "../../../../../core/quotes/quote-calculator.ts";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(request);
    const quoteId = params.id;
    const body = await request.json().catch(() => ({}));

    const quote = await prisma.quote.findFirst({
      where: {
        OR: [{ id: quoteId }, { quoteNumber: quoteId }],
      },
      include: { contact: true },
    });

    if (!quote) {
      return NextResponse.json({ success: false, error: "Quote not found" }, { status: 404 });
    }

    const updated = await prisma.quote.update({
      where: { id: quote.id },
      data: { status: "SENT" },
    });

    const recipient = body.recipientEmail || quote.contact.email || "client@email.com";
    const authorName = user?.name || "Alpha Admin";
    const detail = body.markOnly
      ? `Quote marked as sent by ${authorName}.`
      : `Quote ${quote.quoteNumber} to ${quote.contact.name} for ${formatAUD(Number(quote.totalAmount))} sent to ${recipient}.`;

    // Persist to QuoteHistory
    await prisma.quoteHistory.create({
      data: {
        quoteId: quote.id,
        user: authorName,
        action: "Sent",
        detail,
      },
    });

    return NextResponse.json({ success: true, quote: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to send quote" },
      { status: 500 }
    );
  }
}
