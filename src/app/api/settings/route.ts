export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma.ts";
import { getSessionUser, requireAdmin } from "../../../lib/auth-guard.ts";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    const tenantId =
      user?.tenantId ||
      request.headers.get("x-tenant-id") ||
      "tenant-alphasteel";

    let tenant = await prisma.tenant.findFirst({
      where: {
        OR: [{ id: tenantId }, { subdomain: "alphasteel" }, { subdomain: "pbstylehomes" }],
      },
    });

    if (!tenant) {
      tenant = await prisma.tenant.findFirst();
    }

    return NextResponse.json({
      success: true,
      settings: {
        organizationName: tenant?.name || "Alpha Steel Frames",
        subdomain: tenant?.subdomain || "alphasteel",
        currency: tenant?.currency || "AUD",
        abn: tenant?.abn || "45 678 901 234",
        phone: tenant?.phone || "+61 7 3000 1234",
        email: tenant?.email || "info@alphasteelframes.com.au",
        address: tenant?.address || "12 Titanium Circuit, Yatala, QLD 4207",
        website: "https://alphasteelframes.com.au/",
        taxTreatment: "EXCLUSIVE",
        defaultQuoteExpiryDays: 30,
        defaultPaymentTerms: "Standard payment terms are 14 days from delivery. 50% deposit required upon structural design sign-off.",
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
  // Only administrators can modify organization settings
  const authResult = await requireAdmin(request);
  if ("response" in authResult) return authResult.response;
  const { user } = authResult;

  try {
    const body = await request.json();

    const updated = await prisma.tenant.update({
      where: { id: user.tenantId },
      data: {
        name: body.organizationName,
        currency: body.currency,
        abn: body.abn,
        phone: body.phone,
        email: body.email,
        address: body.address,
      },
    });

    return NextResponse.json({ success: true, settings: updated });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update settings" },
      { status: 500 }
    );
  }
}
