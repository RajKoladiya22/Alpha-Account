import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "../../../../lib/prisma.ts";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, organizationId } = body;

    if (!email) {
      return NextResponse.json({ success: false, error: "Email is required" }, { status: 400 });
    }

    let user = await prisma.user.findUnique({
      where: { email },
      include: {
        tenants: {
          include: { tenant: true },
        },
      },
    });

    if (!user) {
      // Create user on demand for seamless demo / test flow
      const defaultTenant = await prisma.tenant.findFirst();
      user = await prisma.user.create({
        data: {
          name: email.split("@")[0],
          email,
          backupEmail: `backup.${email}`,
          tenants: defaultTenant
            ? {
                create: {
                  tenantId: defaultTenant.id,
                  role: "OWNER",
                },
              }
            : undefined,
        },
        include: {
          tenants: {
            include: { tenant: true },
          },
        },
      });
    }

    // Select active organization
    const activeUserTenant =
      user.tenants.find((ut) => ut.tenantId === organizationId) ||
      user.tenants[0];

    const activeTenant = activeUserTenant?.tenant || (await prisma.tenant.findFirst());

    // Generate JWT token
    const secret = process.env.JWT_SECRET || "fintech_super_secure_jwt_signing_key_32bytes_long!";
    const header = { alg: "HS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      activeTenantId: activeTenant?.id,
      organizationName: activeTenant?.name,
      role: activeUserTenant?.role || "OWNER",
      iat: now,
      exp: now + 86400 * 7,
    };

    const b64Header = Buffer.from(JSON.stringify(header)).toString("base64url");
    const b64Payload = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const signature = crypto
      .createHmac("sha256", secret)
      .update(`${b64Header}.${b64Payload}`)
      .digest("base64url");
    const token = `${b64Header}.${b64Payload}.${signature}`;

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: payload.role,
        activeTenantId: payload.activeTenantId,
        organizationName: payload.organizationName,
      },
      token,
    });

    // Set HTTP-only secure cookie
    response.cookies.set("xero_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 86400 * 7,
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Login failed" },
      { status: 500 }
    );
  }
}
