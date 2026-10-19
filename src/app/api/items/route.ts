export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma.ts";
import { getSessionUser } from "../../../lib/auth-guard.ts";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    const tenantId =
      user?.tenantId ||
      request.headers.get("x-tenant-id") ||
      "tenant-alphasteel";

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim();

    const where: any = {
      OR: [{ tenantId }, { tenantId: "tenant-pbstylehomes" }],
    };

    if (search) {
      where.AND = [
        {
          OR: [
            { code: { contains: search } },
            { name: { contains: search } },
            { description: { contains: search } },
          ],
        },
      ];
    }

    const items = await prisma.item.findMany({
      where,
      orderBy: { code: "asc" },
    });

    return NextResponse.json({
      success: true,
      items: items.map((i) => ({
        id: i.id,
        code: i.code,
        name: i.name,
        description: i.description || "",
        salesUnitPrice: Number(i.salesUnitPrice),
        purchaseUnitPrice: Number(i.purchaseUnitPrice),
        taxRate: Number(i.taxRate),
        salesAccountId: i.salesAccountId || "200",
      })),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch items" },
      { status: 500 }
    );
  }
}
