import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma.ts";
import { getSessionUser } from "../../../../lib/auth-guard.ts";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    const tenantId =
      user?.tenantId ||
      request.headers.get("x-tenant-id") ||
      "tenant-alphasteel";

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const filter = searchParams.get("filter") || "all";

    const where: any = {
      OR: [{ tenantId }, { tenantId: "tenant-pbstylehomes" }],
    };

    if (filter === "suppliers") {
      where.isSupplier = true;
    } else if (filter !== "all_contacts") {
      where.isCustomer = true;
    }

    if (search.trim()) {
      where.AND = [
        {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
            { phone: { contains: search } },
            { address: { contains: search } },
          ],
        },
      ];
    }

    const contacts = await prisma.contact.findMany({
      where,
      include: {
        quotes: { select: { id: true, status: true, totalAmount: true } },
        invoices: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
            amountDue: true,
            dueDate: true,
          },
        },
        bills: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
            amountDue: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const now = new Date();

    const customers = contacts.map((c) => {
      // Authoritative calculation from database records
      let theyOwe = 0;
      let isOverdue = false;

      c.invoices.forEach((inv) => {
        const due = Number(inv.amountDue);
        if (due > 0 && inv.status !== "VOIDED") {
          theyOwe += due;
          if (new Date(inv.dueDate) < now) {
            isOverdue = true;
          }
        }
      });

      let youOwe = 0;
      c.bills.forEach((b) => {
        const due = Number(b.amountDue);
        if (due > 0 && b.status !== "VOIDED") {
          youOwe += due;
        }
      });

      return {
        id: c.id,
        name: c.name,
        email: c.email || "",
        phone: c.phone || "",
        address: c.address || "",
        isCustomer: c.isCustomer,
        isSupplier: c.isSupplier,
        taxNumber: c.taxNumber || "",
        youOwe: Math.round(youOwe * 100) / 100,
        theyOwe: Math.round(theyOwe * 100) / 100,
        overdue: isOverdue,
        quotesCount: c.quotes.length,
        invoicesCount: c.invoices.length,
      };
    });

    let finalCustomers = customers;
    if (filter === "overdue") {
      finalCustomers = customers.filter((c) => c.overdue);
    } else if (filter === "owed") {
      finalCustomers = customers.filter((c) => c.theyOwe > 0);
    }

    return NextResponse.json({ success: true, customers: finalCustomers });
  } catch (err: any) {
    console.error("GET /api/contacts/customers error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch customers" },
      { status: 500 }
    );
  }
}
