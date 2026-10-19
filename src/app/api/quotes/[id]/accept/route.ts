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

    if (quote.status === "CONVERTED_TO_INVOICE") {
      return NextResponse.json(
        { success: false, error: "Quote is already converted to an invoice" },
        { status: 400 }
      );
    }

    const updated = await prisma.quote.update({
      where: { id: quote.id },
      data: { status: "ACCEPTED" },
    });

    const authorName = user?.name || "Alpha Admin";
    const detail = body.note ? `Accepted: ${body.note}` : "Quote marked as accepted.";

    await prisma.quoteHistory.create({
      data: {
        quoteId: quote.id,
        user: authorName,
        action: "Accepted",
        detail,
      },
    });

    return NextResponse.json({ success: true, quote: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to accept quote" },
      { status: 500 }
    );
  }
}
