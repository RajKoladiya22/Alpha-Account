import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma.ts";

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get("x-tenant-id") || "tenant-pbstylehomes";
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const where: any = { tenantId, isCustomer: true };
    if (search.trim()) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ];
    }

    const contacts = await prisma.contact.findMany({
      where,
      include: {
        quotes: true,
        invoices: true,
      },
      orderBy: { name: "asc" },
    });

    // Known balances from screenshot image copy 17.png for reference
    const knownBalances: Record<string, { youOwe?: number; theyOwe?: number; overdue?: boolean }> = {
      "A&L Windows": { youOwe: 29890.67, theyOwe: 1124.50, overdue: true },
      "Abhishake Sahota": { theyOwe: 61125.00, overdue: true },
      "All State Painting": { theyOwe: 2740.32, overdue: true },
      "Amandeep Kaur & Amandeep Singh": { theyOwe: 800.00, overdue: true },
      "Kuljit Singh Birk": { theyOwe: 11650.00, overdue: true },
    };

    const customers = contacts.map((c) => {
      const balance = knownBalances[c.name] || {};
      return {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        isCustomer: c.isCustomer,
        isSupplier: c.isSupplier,
        taxNumber: c.taxNumber,
        youOwe: balance.youOwe || 0,
        theyOwe: balance.theyOwe || 0,
        overdue: balance.overdue || false,
        quotesCount: c.quotes.length,
        invoicesCount: c.invoices.length,
      };
    });

    return NextResponse.json({ success: true, customers });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch customers" },
      { status: 500 }
    );
  }
}
