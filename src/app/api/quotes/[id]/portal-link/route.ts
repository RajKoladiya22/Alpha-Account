export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "../../../../../lib/prisma.ts";

export async function GET(
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
    });

    if (!quote) {
      return NextResponse.json({ success: false, error: "Quote not found" }, { status: 404 });
    }

    const secret = process.env.JWT_SECRET || "fintech_super_secure_jwt_signing_key_32bytes_long!";
    const payload = {
      tenantId: quote.tenantId,
      quoteId: quote.id,
      exp: Math.floor(Date.now() / 1000) + 30 * 86400, // 30 days
    };

    const b64Payload = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const sig = crypto.createHmac("sha256", secret).update(b64Payload).digest("base64url");
    const token = `${b64Payload}.${sig}`;

    const link = `/portal/quote/${token}`;

    return NextResponse.json({
      success: true,
      token,
      link,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to generate portal link" },
      { status: 500 }
    );
  }
}
