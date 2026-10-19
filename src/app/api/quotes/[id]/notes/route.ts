import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma.ts";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = request.headers.get("x-tenant-id") || "tenant-pbstylehomes";
    const quoteId = params.id;
    const body = await request.json();

    if (!body.note || !body.note.trim()) {
      return NextResponse.json({ success: false, error: "Note text is required" }, { status: 400 });
    }

    const quote = await prisma.quote.findFirst({
      where: {
        tenantId,
        OR: [{ id: quoteId }, { quoteNumber: quoteId }],
      },
    });

    if (!quote) {
      return NextResponse.json({ success: false, error: "Quote not found" }, { status: 404 });
    }

    const log = await prisma.auditLog.create({
      data: {
        tenantId,
        action: "NOTE_ADDED",
        entityType: "QUOTE",
        entityId: quote.id,
        payload: {
          note: body.note.trim(),
          detail: body.note.trim(),
          author: body.author || "Barinder singh",
        },
      },
    });

    return NextResponse.json({
      success: true,
      note: {
        id: log.id,
        timestamp: log.timestamp.toISOString(),
        user: body.author || "Barinder singh",
        action: "Note",
        detail: body.note.trim(),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to add note" },
      { status: 500 }
    );
  }
}
