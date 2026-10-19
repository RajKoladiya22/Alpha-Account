import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "../../../../../../lib/prisma.ts";

function verifyPortalToken(token: string) {
  const parts = token.split(".");
  if (parts.length !== 2) throw new Error("Invalid token format");
  const [b64Payload, sig] = parts;
  const secret = process.env.JWT_SECRET || "fintech_super_secure_jwt_signing_key_32bytes_long!";
  const expected = crypto.createHmac("sha256", secret).update(b64Payload).digest("base64url");
  if (sig !== expected) throw new Error("Tampered token signature");
  const payload = JSON.parse(Buffer.from(b64Payload, "base64url").toString("utf8"));
  if (payload.exp < Math.floor(Date.now() / 1000)) throw new Error("Portal link has expired");
  return payload;
}

export async function POST(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const payload = verifyPortalToken(params.token);
    const body = await request.json().catch(() => ({}));

    if (!body.reason || !body.reason.trim()) {
      return NextResponse.json({ success: false, error: "Decline reason is required" }, { status: 400 });
    }

    const quote = await prisma.quote.update({
      where: { id: payload.quoteId },
      data: { status: "DECLINED" },
    });

    await prisma.auditLog.create({
      data: {
        tenantId: payload.tenantId,
        action: "Declined Online",
        entityType: "QUOTE",
        entityId: quote.id,
        payload: {
          detail: `Declined online by customer. Reason: "${body.reason}"`,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Quote declined",
      quote,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to decline quote" },
      { status: 400 }
    );
  }
}
