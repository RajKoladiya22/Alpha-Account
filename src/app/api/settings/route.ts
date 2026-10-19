import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma.ts";

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get("x-tenant-id") || "tenant-pbstylehomes";

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      return NextResponse.json({ success: false, error: "Organization not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      settings: {
        organizationName: tenant.name,
        subdomain: tenant.subdomain,
        currency: tenant.currency,
        taxTreatment: "EXCLUSIVE",
        defaultQuoteExpiryDays: 14,
        defaultPaymentTerms: "Standard payment terms are 14 days from invoice.",
        financialYearEnd: "30 June",
        timeZone: "Australia/Brisbane (AEST)",
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const tenantId = request.headers.get("x-tenant-id") || "tenant-pbstylehomes";
    const body = await request.json();

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name: body.organizationName,
        currency: body.currency,
      },
    });

    return NextResponse.json({ success: true, tenant: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update settings" },
      { status: 500 }
    );
  }
}
