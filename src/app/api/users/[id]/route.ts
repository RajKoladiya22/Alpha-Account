export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "../../../../lib/auth-guard.ts";
import { prisma } from "../../../../lib/prisma.ts";

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAdmin(request);
  if ("response" in authResult) return authResult.response;
  const { user: adminUser } = authResult;

  try {
    const userId = params.id;
    const body = await request.json();
    const { role, name } = body;

    const userTenant = await prisma.userTenant.findFirst({
      where: { userId, tenantId: adminUser.tenantId },
    });

    if (!userTenant) {
      return NextResponse.json(
        { success: false, error: "User not found in organization" },
        { status: 404 }
      );
    }

    if (role) {
      await prisma.userTenant.update({
        where: { id: userTenant.id },
        data: { role: role.toUpperCase() },
      });
    }

    if (name) {
      await prisma.user.update({
        where: { id: userId },
        data: { name: name.trim() },
      });
    }

    await prisma.auditLog.create({
      data: {
        tenantId: adminUser.tenantId,
        userId: adminUser.id,
        action: "UPDATE_USER",
        entityType: "USER",
        entityId: userId,
        payload: { updatedRole: role, updatedName: name, updatedBy: adminUser.email },
      },
    });

    return NextResponse.json({ success: true, message: "User updated successfully" });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await requireAdmin(request);
  if ("response" in authResult) return authResult.response;
  const { user: adminUser } = authResult;

  try {
    const userId = params.id;

    if (userId === adminUser.id) {
      return NextResponse.json(
        { success: false, error: "You cannot remove your own administrator account" },
        { status: 400 }
      );
    }

    const userTenant = await prisma.userTenant.findFirst({
      where: { userId, tenantId: adminUser.tenantId },
    });

    if (!userTenant) {
      return NextResponse.json(
        { success: false, error: "User not found in organization" },
        { status: 404 }
      );
    }

    await prisma.userTenant.delete({
      where: { id: userTenant.id },
    });

    await prisma.auditLog.create({
      data: {
        tenantId: adminUser.tenantId,
        userId: adminUser.id,
        action: "REMOVE_USER",
        entityType: "USER",
        entityId: userId,
        payload: { removedBy: adminUser.email },
      },
    });

    return NextResponse.json({ success: true, message: "User removed from organization" });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to remove user" },
      { status: 500 }
    );
  }
}
