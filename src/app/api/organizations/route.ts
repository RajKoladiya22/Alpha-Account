export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma.ts";

export async function GET(request: NextRequest) {
  try {
    const tenants = await prisma.tenant.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { quotes: true, contacts: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      organizations: tenants.map((t) => ({
        id: t.id,
        name: t.name,
        subdomain: t.subdomain,
        currency: t.currency,
        quotesCount: t._count.quotes,
        contactsCount: t._count.contacts,
      })),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to list organizations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ success: false, error: "Organization name is required" }, { status: 400 });
    }

    const subdomain = (body.subdomain || body.name)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    const tenant = await prisma.tenant.create({
      data: {
        name: body.name.trim(),
        subdomain,
        currency: body.currency || "AUD",
      },
    });

    return NextResponse.json({ success: true, organization: tenant }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create organization" },
      { status: 500 }
    );
  }
}
