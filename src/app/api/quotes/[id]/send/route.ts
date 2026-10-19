import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma.ts";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tenantId = request.headers.get("x-tenant-id") || "tenant-pbstylehomes";
    const quoteId = params.id;
    const body = await request.json().catch(() => ({}));

    const quote = await prisma.quote.findFirst({
      where: {
        tenantId,
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

    // Record audit log
    await prisma.auditLog.create({
      data: {
        tenantId,
        action: "Sent",
        entityType: "QUOTE",
        entityId: quote.id,
        payload: {
          detail: `Quote ${quote.quoteNumber} to ${quote.contact.name} for ${Number(quote.totalAmount).toLocaleString("en-AU", { minimumFractionDigits: 2 })} sent to ${recipient}.`,
        },
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
