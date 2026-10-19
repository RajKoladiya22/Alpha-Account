import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma.ts";

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get("x-tenant-id") || "tenant-pbstylehomes";
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";

    const where: any = { tenantId };
    if (search.trim()) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
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
    const tenantId = request.headers.get("x-tenant-id") || "tenant-pbstylehomes";
    const body = await request.json();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ success: false, error: "Contact name is required" }, { status: 400 });
    }

    const contact = await prisma.contact.create({
      data: {
        tenantId,
        name: body.name.trim(),
        email: body.email,
        phone: body.phone,
        isCustomer: body.isCustomer !== undefined ? body.isCustomer : true,
        isSupplier: body.isSupplier !== undefined ? body.isSupplier : false,
        taxNumber: body.taxNumber,
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
