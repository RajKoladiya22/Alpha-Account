export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { isSystemInitialized, initializeSystem } from "../../../lib/setup-service.ts";

export async function GET() {
  const status = await isSystemInitialized();
  return NextResponse.json({
    success: true,
    ...status,
  });
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verify that setup has not already been completed
    const currentStatus = await isSystemInitialized();
    if (currentStatus.initialized) {
      return NextResponse.json(
        {
          success: false,
          error: "Setup has already been completed. This endpoint is permanently disabled.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();

    // 2. Perform initialization
    const result = await initializeSystem(body);

    // 3. Issue session token for the newly created administrator
    const secret = process.env.JWT_SECRET || "fintech_super_secure_jwt_signing_key_32bytes_long!";
    const header = { alg: "HS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      userId: result.user.id,
      email: result.user.email,
      name: result.user.name,
      activeTenantId: result.tenant.id,
      organizationName: result.tenant.name,
      role: "OWNER",
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

    const isProd = process.env.NODE_ENV === "production";

    const response = NextResponse.json({
      success: true,
      message: "Application initialized successfully. Administrator and organization created.",
      tenant: result.tenant,
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: "OWNER",
      },
      token,
    });

    // Set secure HttpOnly cookies
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
    console.error("[POST /api/setup] Initialization failed:", err);
    const message = err.message || "An unexpected error occurred during application initialization.";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 400 }
    );
  }
}
