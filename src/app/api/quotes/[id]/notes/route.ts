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
    const body = await request.json();

    if (!body.note || !body.note.trim()) {
      return NextResponse.json({ success: false, error: "Note text is required" }, { status: 400 });
    }

    const quote = await prisma.quote.findFirst({
      where: {
        OR: [{ id: quoteId }, { quoteNumber: quoteId }],
      },
    });

    if (!quote) {
      return NextResponse.json({ success: false, error: "Quote not found" }, { status: 404 });
    }

    const authorName = body.author || user?.name || "Alpha Admin";

    const historyEntry = await prisma.quoteHistory.create({
      data: {
        quoteId: quote.id,
        user: authorName,
        action: "Note Added",
        detail: body.note.trim(),
        isNote: true,
      },
    });

    return NextResponse.json({
      success: true,
      note: {
        id: historyEntry.id,
        timestamp: historyEntry.timestamp.toISOString(),
        user: historyEntry.user,
        action: historyEntry.action,
        detail: historyEntry.detail,
        isNote: true,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to add note" },
      { status: 500 }
    );
  }
}
