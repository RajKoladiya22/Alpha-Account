import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Xero database...");

  // 1. Create Default Organization (Tenant) matching PB Style Homes Pty Ltd
  const tenant = await prisma.tenant.upsert({
    where: { subdomain: "pbstylehomes" },
    update: {},
    create: {
      id: "tenant-pbstylehomes",
      name: "PB Style Homes Pty Ltd",
      subdomain: "pbstylehomes",
      currency: "AUD",
    },
  });

  // 2. Create Default Owner User (Barinder singh / SB)
  const user = await prisma.user.upsert({
    where: { email: "estimate@pbstylehomes.com.au" },
    update: {},
    create: {
      id: "user-barinder",
      name: "Barinder singh",
      email: "estimate@pbstylehomes.com.au",
      backupEmail: "barinder.backup@gmail.com",
    },
  });

  // Connect User to Tenant with OWNER role
  await prisma.userTenant.upsert({
    where: {
      userId_tenantId: {
        userId: user.id,
        tenantId: tenant.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      tenantId: tenant.id,
      role: "OWNER",
    },
  });

  // 3. Chart of Accounts matching screenshot image copy 2.png
  const accounts = [
    { code: "101", name: "Suppliers", type: "EXPENSE" },
    { code: "200", name: "Sales", type: "REVENUE" },
    { code: "611", name: "Cash on Hand", type: "ASSET" },
    { code: "620", name: "Prepayments", type: "ASSET" },
    { code: "710", name: "Office Equipment", type: "ASSET" },
    { code: "711", name: "Less Accumulated Depreciation on Office Equipment", type: "ASSET" },
    { code: "720", name: "Computer Equipment", type: "ASSET" },
    { code: "721", name: "Less Accumulated Depreciation on Computer Equipment", type: "ASSET" },
    { code: "725", name: "Project work in progress", type: "ASSET" },
    { code: "726", name: "Motor Vehicle", type: "ASSET" },
    { code: "726.1", name: "Less Accumulated Depreciation on Motor Vehicle", type: "ASSET" },
  ];

  for (const acc of accounts) {
    await prisma.account.upsert({
      where: {
        tenantId_code: {
          tenantId: tenant.id,
          code: acc.code,
        },
      },
      update: {},
      create: {
        tenantId: tenant.id,
        code: acc.code,
        name: acc.name,
        type: acc.type as any,
        currency: "AUD",
      },
    });
  }

  // 4. Contacts matching image copy 17.png and image copy 13.png
  const contactsData = [
    {
      id: "contact-ksb",
      name: "Kuljit Singh Birk",
      email: "Birkk@yahoo.com.au",
      phone: "0431641615",
      isCustomer: true,
      isSupplier: false,
    },
    {
      id: "contact-alwindows",
      name: "A&L Windows",
      email: "arvic@alwindows.com.au",
      isCustomer: true,
      isSupplier: true,
    },
    {
      id: "contact-sahota",
      name: "Abhishake Sahota",
      email: "abhisheksahota6@gmail.com",
      phone: "0484865243",
      isCustomer: true,
      isSupplier: false,
    },
    {
      id: "contact-ajmer",
      name: "AJMER SINGH & KAMALJEET KAUR",
      email: "singhajmerpb60@gmail.com",
      phone: "0421473853",
      isCustomer: true,
      isSupplier: false,
    },
    {
      id: "contact-akash",
      name: "AKASH KUMAR VASWANI",
      email: "akashvaswani1@gmail.com",
      phone: "0405901041",
      isCustomer: true,
      isSupplier: false,
    },
    {
      id: "contact-painting",
      name: "All State Painting",
      email: "allstatepainting@bigpond.com",
      isCustomer: true,
      isSupplier: false,
    },
    {
      id: "contact-amandeep",
      name: "Amandeep Kaur & Amandeep Singh",
      email: "amandeep12594@gmail.com",
      phone: "0478511781",
      isCustomer: true,
      isSupplier: false,
    },
    {
      id: "contact-paramjeet",
      name: "Paramjeet Kaur & Gurpreet Singh",
      isCustomer: true,
      isSupplier: false,
    },
    {
      id: "contact-jitender",
      name: "JITENDER SINGH",
      isCustomer: true,
      isSupplier: false,
    },
  ];

  for (const c of contactsData) {
    const existing = await prisma.contact.findFirst({
      where: { tenantId: tenant.id, name: c.name },
    });
    if (!existing) {
      await prisma.contact.create({
        data: {
          id: c.id,
          tenantId: tenant.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          isCustomer: c.isCustomer,
          isSupplier: c.isSupplier,
        },
      });
    }
  }

  // 5. Quotes matching image.png & image copy 10.png
  const ksbContact = await prisma.contact.findFirst({ where: { name: "Kuljit Singh Birk" } });
  const ajmerContact = await prisma.contact.findFirst({ where: { name: "AJMER SINGH & KAMALJEET KAUR" } });
  const paramjeetContact = await prisma.contact.findFirst({ where: { name: "Paramjeet Kaur & Gurpreet Singh" } });
  const jitenderContact = await prisma.contact.findFirst({ where: { name: "JITENDER SINGH" } });

  // Quote QU-0006 (Sent, 22,110.00)
  if (ksbContact) {
    const existingQ6 = await prisma.quote.findUnique({
      where: { tenantId_quoteNumber: { tenantId: tenant.id, quoteNumber: "QU-0006" } },
    });
    if (!existingQ6) {
      await prisma.quote.create({
        data: {
          id: "quote-qu-0006",
          tenantId: tenant.id,
          contactId: ksbContact.id,
          quoteNumber: "QU-0006",
          date: new Date("2025-07-02"),
          expiryDate: new Date("2025-07-16"),
          status: "SENT",
          subtotal: 20100.0,
          taxTotal: 2010.0,
          totalAmount: 22110.0,
          lines: {
            create: [
              {
                description: "Kitchen Paint",
                quantity: 1,
                unitPrice: 6600.0,
                discount: 0,
                taxRate: 10,
                lineAmount: 6600.0,
              },
              {
                description: "2 Bathroom rectification",
                quantity: 1,
                unitPrice: 7800.0,
                discount: 0,
                taxRate: 10,
                lineAmount: 7800.0,
              },
              {
                description: "rectification of 1 room",
                quantity: 1,
                unitPrice: 4500.0,
                discount: 0,
                taxRate: 10,
                lineAmount: 4500.0,
              },
              {
                description: "Take Carpet Off and Polish timber Floor",
                quantity: 1,
                unitPrice: 1200.0,
                discount: 0,
                taxRate: 10,
                lineAmount: 1200.0,
              },
            ],
          },
        },
      });
    }
  }

  // Quote QU-0005 (Sent, 10,390.60)
  if (ajmerContact) {
    const existingQ5 = await prisma.quote.findUnique({
      where: { tenantId_quoteNumber: { tenantId: tenant.id, quoteNumber: "QU-0005" } },
    });
    if (!existingQ5) {
      await prisma.quote.create({
        data: {
          id: "quote-qu-0005",
          tenantId: tenant.id,
          contactId: ajmerContact.id,
          quoteNumber: "QU-0005",
          date: new Date("2024-11-21"),
          expiryDate: new Date("2024-12-21"),
          status: "SENT",
          subtotal: 9446.0,
          taxTotal: 944.6,
          totalAmount: 10390.6,
          lines: {
            create: [
              {
                description: "36 allan cunningham dr gatton qld 4343 - Remediation Works",
                quantity: 1,
                unitPrice: 9446.0,
                discount: 0,
                taxRate: 10,
                lineAmount: 9446.0,
              },
            ],
          },
        },
      });
    }
  }

  // Quote QU-0004 (Draft, 555,000.00)
  if (paramjeetContact) {
    const existingQ4 = await prisma.quote.findUnique({
      where: { tenantId_quoteNumber: { tenantId: tenant.id, quoteNumber: "QU-0004" } },
    });
    if (!existingQ4) {
      await prisma.quote.create({
        data: {
          id: "quote-qu-0004",
          tenantId: tenant.id,
          contactId: paramjeetContact.id,
          quoteNumber: "QU-0004",
          date: new Date("2024-04-09"),
          expiryDate: new Date("2024-05-09"),
          status: "DRAFT",
          subtotal: 504545.45,
          taxTotal: 50454.55,
          totalAmount: 555000.0,
          lines: {
            create: [
              {
                description: "Lot 3345 Coopers st Greenbank - Full Residential Build Contract",
                quantity: 1,
                unitPrice: 504545.45,
                discount: 0,
                taxRate: 10,
                lineAmount: 504545.45,
              },
            ],
          },
        },
      });
    }
  }

  // Quote QU-0001 (Sent, 40,370.00)
  if (jitenderContact) {
    const existingQ1 = await prisma.quote.findUnique({
      where: { tenantId_quoteNumber: { tenantId: tenant.id, quoteNumber: "QU-0001" } },
    });
    if (!existingQ1) {
      await prisma.quote.create({
        data: {
          id: "quote-qu-0001",
          tenantId: tenant.id,
          contactId: jitenderContact.id,
          quoteNumber: "QU-0001",
          date: new Date("2023-03-04"),
          expiryDate: new Date("2023-04-03"),
          status: "SENT",
          subtotal: 36700.0,
          taxTotal: 3670.0,
          totalAmount: 40370.0,
          lines: {
            create: [
              {
                description: "10 Ascot Ave Forest Lake - External Fencing & Patio",
                quantity: 1,
                unitPrice: 36700.0,
                discount: 0,
                taxRate: 10,
                lineAmount: 36700.0,
              },
            ],
          },
        },
      });
    }
  }

  console.log("Database seeded successfully with screenshot reference data!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
