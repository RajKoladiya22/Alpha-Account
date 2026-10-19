import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "../../../../lib/prisma.ts";

export async function GET(request: NextRequest) {
  try {
    const cookie = request.cookies.get("xero_session")?.value;
    const authHeader = request.headers.get("authorization")?.replace("Bearer ", "");
    const token = cookie || authHeader;

    if (!token) {
      // Default fallback demo user for smooth testing
      const defaultTenant = await prisma.tenant.findFirst();
      const defaultUser = await prisma.user.findFirst();
      return NextResponse.json({
        success: true,
        authenticated: true,
        user: {
          id: defaultUser?.id || "user-barinder",
          name: defaultUser?.name || "Barinder singh",
          email: defaultUser?.email || "estimate@pbstylehomes.com.au",
          initials: "SB",
          role: "OWNER",
          activeTenantId: defaultTenant?.id || "tenant-pbstylehomes",
          organizationName: defaultTenant?.name || "PB Style Homes Pty Ltd",
        },
      });
    }

    const parts = token.split(".");
    if (parts.length !== 3) {
      return NextResponse.json({ success: false, authenticated: false }, { status: 401 });
    }

    const [b64Header, b64Payload, sig] = parts;
    const secret = process.env.JWT_SECRET || "fintech_super_secure_jwt_signing_key_32bytes_long!";
    const expected = crypto.createHmac("sha256", secret).update(`${b64Header}.${b64Payload}`).digest("base64url");
    if (sig !== expected) {
      return NextResponse.json({ success: false, authenticated: false }, { status: 401 });
    }

    const payload = JSON.parse(Buffer.from(b64Payload, "base64url").toString("utf8"));
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return NextResponse.json({ success: false, authenticated: false, error: "Session expired" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: payload.userId,
        name: payload.name,
        email: payload.email,
        initials: "SB",
        role: payload.role,
        activeTenantId: payload.activeTenantId,
        organizationName: payload.organizationName,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, authenticated: false }, { status: 401 });
  }
}
