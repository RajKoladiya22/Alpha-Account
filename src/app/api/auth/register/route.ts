export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/auth-guard.ts";
import { prisma } from "../../../../lib/prisma.ts";
import { hashPassword } from "../../../../core/security/password-hasher.ts";

export async function POST(request: NextRequest) {
  // Public registration is strictly disabled.
  // Only authenticated administrators may create users.
  const authResult = await requireAdmin(request);
  if ("response" in authResult) {
    return NextResponse.json(
      {
        success: false,
        error: "Public registration is disabled. Only organization administrators may create user accounts.",
      },
      { status: 403 }
    );
  }

  const { user: adminUser } = authResult;

  try {
    const body = await request.json();
    const { name, email, role = "STANDARD", password, backupEmail } = body;

    if (!email || !name) {
      return NextResponse.json(
        { success: false, error: "Name and email are required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "A user with this email address already exists." },
        { status: 409 }
      );
    }

    const initialPassword = password || "AlphaUser2026!";
    const passwordHash = hashPassword(initialPassword);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        passwordHash,
        backupEmail: backupEmail ? backupEmail.trim() : null,
        tenants: {
          create: {
            tenantId: adminUser.tenantId,
            role: role.toUpperCase(),
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        tenants: {
          select: {
            role: true,
            tenantId: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "User account created successfully by administrator.",
        user: newUser,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("User registration error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to create user account." },
      { status: 500 }
    );
  }
}
