import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma.ts";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, organizationName, backupEmail } = body;

    if (!email || !organizationName) {
      return NextResponse.json(
        { success: false, error: "Email and organization name are required" },
        { status: 400 }
      );
    }

    const subdomain = organizationName.toLowerCase().replace(/[^a-z0-9]/g, "");

    // Create Organization Tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: organizationName.trim(),
        subdomain,
        currency: "AUD",
      },
    });

    // Create User
    const user = await prisma.user.create({
      data: {
        name: name || email.split("@")[0],
        email,
        backupEmail: backupEmail || `backup.${email}`,
        tenants: {
          create: {
            tenantId: tenant.id,
            role: "OWNER",
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Organization and user registered successfully",
        user,
        organization: tenant,
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Registration failed" },
      { status: 500 }
    );
  }
}
