export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/auth-guard.ts";
import { prisma } from "../../../lib/prisma.ts";
import { hashPassword } from "../../../core/security/password-hasher.ts";

export async function GET(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if ("response" in authResult) return authResult.response;
  const { user: adminUser } = authResult;

  try {
    const userTenants = await prisma.userTenant.findMany({
      where: { tenantId: adminUser.tenantId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            backupEmail: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const users = userTenants.map((ut) => ({
      id: ut.user.id,
      name: ut.user.name,
      email: ut.user.email,
      role: ut.role,
      backupEmail: ut.user.backupEmail,
      createdAt: ut.user.createdAt,
    }));

    return NextResponse.json({ success: true, users });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authResult = await requireAdmin(request);
  if ("response" in authResult) return authResult.response;
  const { user: adminUser } = authResult;

  try {
    const body = await request.json();
    const { name, email, role = "STANDARD", password = "AlphaUser2026!", backupEmail } = body;

    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: "Name and email are required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: { tenants: true },
    });

    if (user) {
      const alreadyInTenant = user.tenants.some((t) => t.tenantId === adminUser.tenantId);
      if (alreadyInTenant) {
        return NextResponse.json(
          { success: false, error: "User is already a member of this organization" },
          { status: 409 }
        );
      }

      // Add existing user to this tenant
      await prisma.userTenant.create({
        data: {
          userId: user.id,
          tenantId: adminUser.tenantId,
          role: role.toUpperCase(),
        },
      });

      return NextResponse.json({
        success: true,
        message: "User added to organization",
        user: { id: user.id, name: user.name, email: user.email, role },
      });
    }

    // Create fresh user
    const passwordHash = hashPassword(password);
    user = await prisma.user.create({
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
    });

    // Record audit log
    await prisma.auditLog.create({
      data: {
        tenantId: adminUser.tenantId,
        userId: adminUser.id,
        action: "CREATE_USER",
        entityType: "USER",
        entityId: user.id,
        payload: { email: cleanEmail, role, createdBy: adminUser.email },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "User account created successfully",
        user: { id: user.id, name: user.name, email: user.email, role },
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create user" },
      { status: 500 }
    );
  }
}
