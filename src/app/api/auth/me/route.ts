export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "../../../../lib/auth-guard.ts";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);

    if (!user) {
      return NextResponse.json(
        { success: false, authenticated: false, error: "Unauthenticated" },
        { status: 401 }
      );
    }

    // Determine initials
    const parts = user.name.trim().split(" ");
    const initials =
      parts.length > 1
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : user.name.slice(0, 2).toUpperCase();

    return NextResponse.json({
      success: true,
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        initials,
        role: user.role,
        activeTenantId: user.tenantId,
        organizationName: user.tenantName,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, authenticated: false, error: "Authentication verification failed" },
      { status: 401 }
    );
  }
}
