export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma.ts";
import { getSessionUser } from "../../../../lib/auth-guard.ts";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(request);
    const tenantId =
      user?.tenantId ||
      request.headers.get("x-tenant-id") ||
      "tenant-alphasteel";
    const contactId = params.id;

    const contact = await prisma.contact.findFirst({
      where: {
        OR: [{ id: contactId }, { name: { equals: contactId } }],
      },
      include: {
        quotes: {
          orderBy: { date: "desc" },
        },
        invoices: {
          orderBy: { date: "desc" },
        },
      },
    });

    if (!contact) {
      return NextResponse.json({ success: false, error: "Contact not found" }, { status: 404 });
    }

    const now = new Date();
    let owedAmount = 0;
    let overdueAmount = 0;

    contact.invoices.forEach((inv) => {
      const due = Number(inv.amountDue);
      if (due > 0 && inv.status !== "VOIDED") {
        owedAmount += due;
        if (new Date(inv.dueDate) < now) {
          overdueAmount += due;
        }
      }
    });

    const quotesAwaitingReply = contact.quotes.filter(
      (q) => q.status === "SENT"
    ).length;

    // Real combined activity timeline from database records
    const activities = [
      ...contact.invoices.map((inv) => ({
        id: inv.id,
        type: "Invoice",
        number: inv.invoiceNumber,
        reference: "",
        issueDate: inv.date.toISOString().split("T")[0],
        paidDate: inv.status === "PAID" ? inv.updatedAt.toISOString().split("T")[0] : null,
        due: Number(inv.amountDue),
        total: Number(inv.totalAmount),
        status: inv.status === "PAID" ? "Paid" : inv.status === "AUTHORIZED" ? "Awaiting payment" : inv.status,
      })),
      ...contact.quotes.map((q) => ({
        id: q.id,
        type: "Quote",
        number: q.quoteNumber,
        reference: q.reference || "",
        issueDate: q.date.toISOString().split("T")[0],
        paidDate: null,
        due: Number(q.totalAmount),
        total: Number(q.totalAmount),
        status: q.status,
      })),
    ].sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());

    // Compute monthly cash in aggregated from paid invoices over 12 months
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
    const currentMonthIndex = now.getMonth();
    const cashInMonths = [];

    for (let i = 11; i >= 0; i--) {
      const monthIdx = (currentMonthIndex - i + 12) % 12;
      const monthLabel = monthNames[monthIdx];
      // Sum invoice payments in this month
      let monthTotal = 0;
      contact.invoices.forEach((inv) => {
        if (inv.status === "PAID" && inv.updatedAt) {
          const invDate = new Date(inv.updatedAt);
          if (invDate.getMonth() === monthIdx) {
            monthTotal += Number(inv.amountPaid || inv.totalAmount);
          }
        }
      });
      cashInMonths.push({ month: monthLabel, amount: monthTotal });
    }

    return NextResponse.json({
      success: true,
      contact: {
        id: contact.id,
        name: contact.name,
        email: contact.email || "",
        phone: contact.phone || "",
        address: contact.address || "",
        taxNumber: contact.taxNumber || "",
        isCustomer: contact.isCustomer,
        isSupplier: contact.isSupplier,
        invoiceReminders: true,
        owedAmount: Math.round(owedAmount * 100) / 100,
        overdueAmount: Math.round(overdueAmount * 100) / 100,
        quotesAwaitingReply,
        averageDaysToPay: 14,
        cashInMonths,
        activities,
      },
    });
  } catch (err: any) {
    console.error("GET /api/contacts/[id] error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch contact details" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(request);
    const contactId = params.id;
    const body = await request.json();
    const { name, email, phone, address, taxNumber, isCustomer, isSupplier } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: "Contact name is required" },
        { status: 400 }
      );
    }

    let formattedAddress: string | null = null;
    if (typeof address === "string") {
      formattedAddress = address.trim() || null;
    } else if (address && typeof address === "object") {
      formattedAddress = [
        address.street,
        address.city,
        address.state,
        address.postalCode,
        address.country,
      ].filter(Boolean).join(", ") || null;
    }

    const contact = await prisma.contact.update({
      where: { id: contactId },
      data: {
        name: name.trim(),
        email: email !== undefined ? (email ? email.trim() : null) : undefined,
        phone: phone !== undefined ? (phone ? phone.trim() : null) : undefined,
        address: address !== undefined ? formattedAddress : undefined,
        taxNumber: taxNumber !== undefined ? (taxNumber ? taxNumber.trim() : null) : undefined,
        isCustomer: isCustomer !== undefined ? Boolean(isCustomer) : undefined,
        isSupplier: isSupplier !== undefined ? Boolean(isSupplier) : undefined,
      },
    });

    return NextResponse.json({ success: true, contact });
  } catch (err: any) {
    console.error("PUT /api/contacts/[id] error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to update contact" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(request);
    const contactId = params.id;

    // Hard delete: completely delete the contact from the database
    // Cleanly delete foreign-key references within a transaction
    await prisma.$transaction(async (tx) => {
      // Find all quotes for this contact
      const quotes = await tx.quote.findMany({
        where: { contactId },
        select: { id: true },
      });
      const quoteIds = quotes.map((q) => q.id);

      if (quoteIds.length > 0) {
        await tx.quoteLine.deleteMany({ where: { quoteId: { in: quoteIds } } });
        await tx.quoteNote.deleteMany({ where: { quoteId: { in: quoteIds } } });
        await tx.quoteHistory.deleteMany({ where: { quoteId: { in: quoteIds } } });
        await tx.quote.deleteMany({ where: { id: { in: quoteIds } } });
      }

      // Invoices
      const invoices = await tx.invoice.findMany({
        where: { contactId },
        select: { id: true },
      });
      const invoiceIds = invoices.map((i) => i.id);
      if (invoiceIds.length > 0) {
        await tx.invoiceLine.deleteMany({ where: { invoiceId: { in: invoiceIds } } });
        await tx.invoice.deleteMany({ where: { id: { in: invoiceIds } } });
      }

      // Bills
      const bills = await tx.bill.findMany({
        where: { contactId },
        select: { id: true },
      });
      const billIds = bills.map((b) => b.id);
      if (billIds.length > 0) {
        await tx.billLine.deleteMany({ where: { billId: { in: billIds } } });
        await tx.bill.deleteMany({ where: { id: { in: billIds } } });
      }

      // Purchase orders
      const pos = await tx.purchaseOrder.findMany({
        where: { contactId },
        select: { id: true },
      });
      const poIds = pos.map((p) => p.id);
      if (poIds.length > 0) {
        await tx.purchaseOrderLine.deleteMany({ where: { purchaseOrderId: { in: poIds } } });
        await tx.purchaseOrder.deleteMany({ where: { id: { in: poIds } } });
      }

      // Hard delete the contact record itself
      await tx.contact.delete({
        where: { id: contactId },
      });
    });

    return NextResponse.json({ success: true, message: "Contact hard deleted successfully" });
  } catch (err: any) {
    console.error("DELETE /api/contacts/[id] error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to delete contact" },
      { status: 500 }
    );
  }
}
