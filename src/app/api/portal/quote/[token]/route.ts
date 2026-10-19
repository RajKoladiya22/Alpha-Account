import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "../../../../../lib/prisma.ts";

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

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const payload = verifyPortalToken(params.token);
    const quote = await prisma.quote.findUnique({
      where: { id: payload.quoteId },
      include: {
        contact: true,
        lines: true,
        tenant: true,
      },
    });

    if (!quote) {
      return NextResponse.json({ success: false, error: "Quote not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      quote: {
        id: quote.id,
        quoteNumber: quote.quoteNumber,
        date: quote.date.toISOString(),
        expiryDate: quote.expiryDate.toISOString(),
        status: quote.status,
        subtotal: Number(quote.subtotal),
        taxTotal: Number(quote.taxTotal),
        totalAmount: Number(quote.totalAmount),
        organizationName: quote.tenant.name,
        customerName: quote.contact.name,
        customerEmail: quote.contact.email,
        lines: quote.lines.map((l) => ({
          description: l.description,
          quantity: Number(l.quantity),
          unitPrice: Number(l.unitPrice),
          discount: Number(l.discount),
          taxRate: Number(l.taxRate),
          lineAmount: Number(l.lineAmount),
        })),
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Invalid or expired token" },
      { status: 403 }
    );
  }
}
