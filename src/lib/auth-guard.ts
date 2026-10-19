import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { prisma } from "./prisma.ts";

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "OWNER" | "STANDARD" | "READONLY";
  tenantId: string;
  tenantName: string;
}

/**
 * Extracts and verifies JWT session token from request cookies or Authorization header.
 * Returns null if missing, invalid, or expired.
 */
export async function getSessionUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  const cookie =
    request.cookies.get("asf_session")?.value ||
    request.cookies.get("xero_session")?.value;
  const authHeader = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const token = cookie || authHeader;

  if (!token) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [b64Header, b64Payload, signature] = parts;
  const secret = process.env.JWT_SECRET || "fintech_super_secure_jwt_signing_key_32bytes_long!";
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(`${b64Header}.${b64Payload}`)
    .digest("base64url");

  if (signature !== expectedSig) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(b64Payload, "base64url").toString("utf-8"));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }

    // Verify user exists in database and is active
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        tenants: {
          include: { tenant: true },
        },
      },
    });

    if (!user) {
      return null;
    }

    const userTenant =
      user.tenants.find((ut) => ut.tenantId === payload.activeTenantId) ||
      user.tenants[0];

    const role = (userTenant?.role?.toUpperCase() || "STANDARD") as AuthenticatedUser["role"];
    const tenantId = userTenant?.tenantId || "tenant-alphasteel";
    const tenantName = userTenant?.tenant?.name || "Alpha Steel Frames";

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role,
      tenantId,
      tenantName,
    };
  } catch (e) {
    return null;
  }
}

/**
 * Guard that requires an authenticated user.
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ user: AuthenticatedUser } | { response: NextResponse }> {
  const user = await getSessionUser(request);
  if (!user) {
    return {
      response: NextResponse.json(
        { success: false, error: "Authentication required. Please log in." },
        { status: 401 }
      ),
    };
  }
  return { user };
}

/**
 * Guard that requires Admin / Owner permissions.
 */
export async function requireAdmin(
  request: NextRequest
): Promise<{ user: AuthenticatedUser } | { response: NextResponse }> {
  const authResult = await requireAuth(request);
  if ("response" in authResult) {
    return authResult;
  }

  const { user } = authResult;
  if (user.role !== "ADMIN" && user.role !== "OWNER") {
    return {
      response: NextResponse.json(
        { success: false, error: "Forbidden: Administrator privileges required." },
        { status: 403 }
      ),
    };
  }

  return { user };
}
