export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "../../../../lib/prisma.ts";
import { verifyPassword } from "../../../../core/security/password-hasher.ts";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, organizationId } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        tenants: {
          include: { tenant: true },
        },
        lockoutState: true,
      },
    });

    if (!user) {
      // Return generic invalid credentials without timing leak
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Check account lockout
    if (user.lockoutState?.lockedUntil && user.lockoutState.lockedUntil.getTime() > Date.now()) {
      const waitSeconds = Math.ceil((user.lockoutState.lockedUntil.getTime() - Date.now()) / 1000);
      return NextResponse.json(
        {
          success: false,
          error: `Account is temporarily locked due to multiple failed login attempts. Please retry in ${waitSeconds} seconds.`,
        },
        { status: 429 }
      );
    }

    // Verify password
    let passwordValid = false;
    if (user.passwordHash) {
      passwordValid = verifyPassword(password, user.passwordHash);
    } else {
      // Legacy fallback check: if passwordHash is null, reject and require password reset
      passwordValid = false;
    }

    if (!passwordValid) {
      // Increment failed attempts
      const currentAttempts = (user.lockoutState?.failedAttempts || 0) + 1;
      const willLock = currentAttempts >= 5;
      const lockedUntil = willLock ? new Date(Date.now() + 15 * 60 * 1000) : null;

      await prisma.accountLockout.upsert({
        where: { userId: user.id },
        update: {
          failedAttempts: willLock ? 0 : currentAttempts,
          lockedUntil,
          lastFailedAt: new Date(),
        },
        create: {
          userId: user.id,
          failedAttempts: currentAttempts,
          lockedUntil,
          lastFailedAt: new Date(),
        },
      });

      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Password is valid - reset failed attempts
    if (user.lockoutState) {
      await prisma.accountLockout.update({
        where: { userId: user.id },
        data: { failedAttempts: 0, lockedUntil: null },
      });
    }

    // Determine active tenant
    const activeUserTenant =
      user.tenants.find((ut) => ut.tenantId === organizationId) ||
      user.tenants[0];

    const activeTenant = activeUserTenant?.tenant || (await prisma.tenant.findFirst());
    const role = activeUserTenant?.role || "STANDARD";

    // Issue JWT token
    const secret = process.env.JWT_SECRET || "fintech_super_secure_jwt_signing_key_32bytes_long!";
    const header = { alg: "HS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      activeTenantId: activeTenant?.id,
      organizationName: activeTenant?.name || "Alpha Steel Frames",
      role,
      iat: now,
      exp: now + 86400 * 7, // 7 days
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
        role,
        activeTenantId: payload.activeTenantId,
        organizationName: payload.organizationName,
      },
      token,
    });

    const isProd = process.env.NODE_ENV === "production";

    // Set secure HTTP-only cookies
    response.cookies.set("asf_session", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 86400 * 7,
    });

    response.cookies.set("xero_session", token, {
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      path: "/",
      maxAge: 86400 * 7,
    });

    return response;
  } catch (err: any) {
    console.error("POST /api/auth/login error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error during authentication." },
      { status: 500 }
    );
  }
}
