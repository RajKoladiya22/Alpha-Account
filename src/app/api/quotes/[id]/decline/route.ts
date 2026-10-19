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
    });

    if (!quote) {
      return NextResponse.json({ success: false, error: "Quote not found" }, { status: 404 });
    }

    const updated = await prisma.quote.update({
      where: { id: quote.id },
      data: { status: "DECLINED" },
    });

    const authorName = user?.name || "Alpha Admin";
    const detail = body.reason ? `Declined: ${body.reason}` : "Quote marked as declined.";

    await prisma.quoteHistory.create({
      data: {
        quoteId: quote.id,
        user: authorName,
        action: "Declined",
        detail,
      },
    });

    return NextResponse.json({ success: true, quote: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to decline quote" },
      { status: 500 }
    );
  }
}
