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

    const accounts = await prisma.account.findMany({
      where: {
        OR: [{ tenantId }, { tenantId: "tenant-pbstylehomes" }],
      },
      orderBy: { code: "asc" },
    });

    return NextResponse.json({
      success: true,
      accounts: accounts.map((a) => ({
        id: a.id,
        code: a.code,
        name: a.name,
        type: a.type,
        label: `${a.code} - ${a.name}`,
      })),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch accounts" },
      { status: 500 }
    );
  }
}
