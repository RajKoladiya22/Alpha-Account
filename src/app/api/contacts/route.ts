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
    const search = searchParams.get("search") || "";

    const where: any = {
      OR: [{ tenantId }, { tenantId: "tenant-pbstylehomes" }],
    };

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
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, contacts });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    const tenantId =
      user?.tenantId ||
      request.headers.get("x-tenant-id") ||
      "tenant-alphasteel";

    const body = await request.json();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ success: false, error: "Contact name is required" }, { status: 400 });
    }

    let formattedAddress: string | null = null;
    if (typeof body.address === "string") {
      formattedAddress = body.address.trim() || null;
    } else if (body.address && typeof body.address === "object") {
      const parts = [
        body.address.street,
        body.address.city,
        body.address.state,
        body.address.postalCode,
        body.address.country,
      ].filter(Boolean);
      formattedAddress = parts.join(", ") || null;
    }

    const contact = await prisma.contact.create({
      data: {
        tenantId,
        name: body.name.trim(),
        email: body.email ? body.email.trim() : null,
        phone: body.phone ? body.phone.trim() : null,
        address: formattedAddress,
        isCustomer: body.isCustomer !== undefined ? Boolean(body.isCustomer) : true,
        isSupplier: body.isSupplier !== undefined ? Boolean(body.isSupplier) : false,
        taxNumber: body.taxNumber ? body.taxNumber.trim() : null,
      },
    });

    return NextResponse.json({ success: true, contact }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create contact" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    const body = await request.json();
    const { ids } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "Array of contact IDs is required" },
        { status: 400 }
      );
    }

    // Batch hard delete of contacts and their foreign relations
    await prisma.$transaction(async (tx) => {
      const quotes = await tx.quote.findMany({
        where: { contactId: { in: ids } },
        select: { id: true },
      });
      const quoteIds = quotes.map((q) => q.id);

      if (quoteIds.length > 0) {
        await tx.quoteLine.deleteMany({ where: { quoteId: { in: quoteIds } } });
        await tx.quoteNote.deleteMany({ where: { quoteId: { in: quoteIds } } });
        await tx.quoteHistory.deleteMany({ where: { quoteId: { in: quoteIds } } });
        await tx.quote.deleteMany({ where: { id: { in: quoteIds } } });
      }

      const invoices = await tx.invoice.findMany({
        where: { contactId: { in: ids } },
        select: { id: true },
      });
      const invoiceIds = invoices.map((i) => i.id);
      if (invoiceIds.length > 0) {
        await tx.invoiceLine.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
        await tx.invoice.deleteMany({ where: { id: { in: invoiceIds } } });
      }

      const bills = await tx.bill.findMany({
        where: { contactId: { in: ids } },
        select: { id: true },
      });
      const billIds = bills.map((b) => b.id);
      if (billIds.length > 0) {
        await tx.billLine.deleteMany({ where: { billId: { in: billIds } } });
        await tx.bill.deleteMany({ where: { id: { in: billIds } } });
      }

      const pos = await tx.purchaseOrder.findMany({
        where: { contactId: { in: ids } },
        select: { id: true },
      });
      const poIds = pos.map((p) => p.id);
      if (poIds.length > 0) {
        await tx.purchaseOrderLine.deleteMany({ where: { purchaseOrderId: { in: poIds } } });
        await tx.purchaseOrder.deleteMany({ where: { id: { in: poIds } } });
      }

      await tx.contact.deleteMany({
        where: { id: { in: ids } },
      });
    });

    return NextResponse.json({ success: true, count: ids.length });
  } catch (err: any) {
    console.error("DELETE /api/contacts error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to batch delete contacts" },
      { status: 500 }
    );
  }
}
