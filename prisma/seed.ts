import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/core/security/password-hasher.ts";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Alpha Steel Frames database...");

  // 1. Create Default Organization: Alpha Steel Frames
  const tenant = await prisma.tenant.upsert({
    where: { subdomain: "alphasteel" },
    update: {
      name: "Alpha Steel Frames",
      currency: "AUD",
      abn: "45 678 901 234",
      phone: "+61 7 3000 1234",
      email: "info@alphasteelframes.com.au",
      address: "12 Titanium Circuit, Yatala, QLD 4207",
    },
    create: {
      id: "tenant-alphasteel",
      name: "Alpha Steel Frames",
      subdomain: "alphasteel",
      currency: "AUD",
      abn: "45 678 901 234",
      phone: "+61 7 3000 1234",
      email: "info@alphasteelframes.com.au",
      address: "12 Titanium Circuit, Yatala, QLD 4207",
    },
  });

  // Also support the legacy tenant id for backwards compatibility if referenced
  await prisma.tenant.upsert({
    where: { subdomain: "pbstylehomes" },
    update: {
      name: "Alpha Steel Frames",
      currency: "AUD",
      abn: "45 678 901 234",
      phone: "+61 7 3000 1234",
      email: "info@alphasteelframes.com.au",
      address: "12 Titanium Circuit, Yatala, QLD 4207",
    },
    create: {
      id: "tenant-pbstylehomes",
      name: "Alpha Steel Frames",
      subdomain: "pbstylehomes",
      currency: "AUD",
      abn: "45 678 901 234",
      phone: "+61 7 3000 1234",
      email: "info@alphasteelframes.com.au",
      address: "12 Titanium Circuit, Yatala, QLD 4207",
    },
  });

  // 2. Create Administrator Account
  const adminPasswordHash = hashPassword("AlphaAdmin2026!");
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@alphasteelframes.com.au" },
    update: {
      name: "Alpha Admin",
      passwordHash: adminPasswordHash,
    },
    create: {
      id: "user-admin",
      name: "Alpha Admin",
      email: "admin@alphasteelframes.com.au",
      passwordHash: adminPasswordHash,
      backupEmail: "director@alphasteelframes.com.au",
    },
  });

  // Connect Admin to Tenant
  await prisma.userTenant.upsert({
    where: {
      userId_tenantId: {
        userId: adminUser.id,
        tenantId: tenant.id,
      },
    },
    update: { role: "ADMIN" },
    create: {
      userId: adminUser.id,
      tenantId: tenant.id,
      role: "ADMIN",
    },
  });

  // Also link to tenant-pbstylehomes for compatibility
  await prisma.userTenant.upsert({
    where: {
      userId_tenantId: {
        userId: adminUser.id,
        tenantId: "tenant-pbstylehomes",
      },
    },
    update: { role: "ADMIN" },
    create: {
      userId: adminUser.id,
      tenantId: "tenant-pbstylehomes",
      role: "ADMIN",
    },
  });

  // 3. Chart of Accounts
  const accounts = [
    { code: "101", name: "Steel Coil & Raw Material Suppliers", type: "EXPENSE" },
    { code: "200", name: "Steel Framing Sales & Manufacturing", type: "REVENUE" },
    { code: "611", name: "Operating Account (CBA)", type: "ASSET" },
    { code: "620", name: "Client Job Deposits / Prepayments", type: "ASSET" },
    { code: "710", name: "CNC Roll Forming Machinery", type: "ASSET" },
    { code: "725", name: "Steel Framing Work In Progress (WIP)", type: "ASSET" },
    { code: "726", name: "Delivery Vehicles & Flatbeds", type: "ASSET" },
  ];

  for (const acc of accounts) {
    for (const tId of [tenant.id, "tenant-pbstylehomes"]) {
      await prisma.account.upsert({
        where: {
          tenantId_code: {
            tenantId: tId,
            code: acc.code,
          },
        },
        update: { name: acc.name },
        create: {
          tenantId: tId,
          code: acc.code,
          name: acc.name,
          type: acc.type as any,
          currency: "AUD",
        },
      });
    }
  }

  // 4. Steel Framing Products Catalog
  const products = [
    {
      code: "ASF-STUD-90",
      name: "90mm C-Section Light Gauge Steel Stud (0.75mm BMT)",
      description: "Truecore steel stud roll-formed to engineering specification with service punched holes",
      salesUnitPrice: 18.5,
      purchaseUnitPrice: 11.2,
      taxRate: 10,
    },
    {
      code: "ASF-TRACK-92",
      name: "92mm Deflection Head & Bottom Track (0.75mm BMT)",
      description: "Slotted deflection top and bottom track for structural frame assembly",
      salesUnitPrice: 16.2,
      purchaseUnitPrice: 9.8,
      taxRate: 10,
    },
    {
      code: "ASF-TRUSS-STD",
      name: "Prefabricated Steel Roof Truss (Engineered Span to 12m)",
      description: "Full precision assembled lightweight structural steel roof truss module",
      salesUnitPrice: 145.0,
      purchaseUnitPrice: 88.0,
      taxRate: 10,
    },
    {
      code: "ASF-JOIST-150",
      name: "150mm C-Section Floor Joist System (1.2mm BMT)",
      description: "High-load acoustic engineered steel floor joists pre-punched for wiring and plumbing",
      salesUnitPrice: 34.0,
      purchaseUnitPrice: 21.0,
      taxRate: 10,
    },
    {
      code: "ASF-LABOR-INST",
      name: "On-Site Steel Frame Erection & Fixing (per hour)",
      description: "Licensed framing carpenters for erection, tie-downs, bracing, and anchor bolt fixing",
      salesUnitPrice: 95.0,
      purchaseUnitPrice: 65.0,
      taxRate: 10,
    },
    {
      code: "ASF-DESIGN-ENG",
      name: "Engineering 3D CAD Detailing & Form 15 Certification",
      description: "Full frame design detailing from architectural plans with certified Form 15 compliance",
      salesUnitPrice: 1200.0,
      purchaseUnitPrice: 650.0,
      taxRate: 10,
    },
  ];

  for (const prod of products) {
    for (const tId of [tenant.id, "tenant-pbstylehomes"]) {
      await prisma.item.upsert({
        where: {
          tenantId_code: {
            tenantId: tId,
            code: prod.code,
          },
        },
        update: {
          name: prod.name,
          description: prod.description,
          salesUnitPrice: prod.salesUnitPrice,
          purchaseUnitPrice: prod.purchaseUnitPrice,
        },
        create: {
          tenantId: tId,
          code: prod.code,
          name: prod.name,
          description: prod.description,
          salesUnitPrice: prod.salesUnitPrice,
          purchaseUnitPrice: prod.purchaseUnitPrice,
          taxRate: prod.taxRate,
        },
      });
    }
  }

  // 5. Contacts / Customers
  const contactsData = [
    {
      id: "contact-ksb",
      name: "Kuljit Singh Birk",
      email: "Birkk@yahoo.com.au",
      phone: "0431641615",
      address: "3 Loran place, Taigum, Queensland, 4018",
      isCustomer: true,
      isSupplier: false,
    },
    {
      id: "contact-alwindows",
      name: "A&L Windows",
      email: "arvic@alwindows.com.au",
      phone: "1800 259 463",
      address: "14 Steelhead Cct, Stapylton, QLD 4207",
      isCustomer: true,
      isSupplier: true,
    },
    {
      id: "contact-sahota",
      name: "Abhishake Sahota",
      email: "abhisheksahota6@gmail.com",
      phone: "0484865243",
      address: "U38/99 Second ave, Marsden, Queensland, 4132",
      isCustomer: true,
      isSupplier: false,
    },
    {
      id: "contact-ajmer",
      name: "AJMER SINGH & KAMALJEET KAUR",
      email: "singhajmerpb60@gmail.com",
      phone: "0421473853",
      address: "Water Tower Street, Park Ridge, Queensland, 4125",
      isCustomer: true,
      isSupplier: false,
    },
    {
      id: "contact-akash",
      name: "AKASH KUMAR VASWANI",
      email: "akashvaswani1@gmail.com",
      phone: "0405901041",
      address: "42 Rushton st, Runcorn, Queensland, 4113",
      isCustomer: true,
      isSupplier: false,
    },
    {
      id: "contact-paramjeet",
      name: "Paramjeet Kaur & Gurpreet Singh",
      email: "gurpreet@greenbankbuild.com.au",
      phone: "0412345678",
      address: "Lot 3345 Coopers st, Greenbank, QLD 4124",
      isCustomer: true,
      isSupplier: false,
    },
    {
      id: "contact-jitender",
      name: "JITENDER SINGH",
      email: "jitender.singh@gmail.com",
      phone: "0400111222",
      address: "10 Ascot Ave, Forest Lake, QLD 4078",
      isCustomer: true,
      isSupplier: false,
    },
  ];

  for (const c of contactsData) {
    for (const tId of [tenant.id, "tenant-pbstylehomes"]) {
      const existing = await prisma.contact.findFirst({
        where: { tenantId: tId, name: c.name },
      });
      if (!existing) {
        await prisma.contact.create({
          data: {
            id: `${c.id}-${tId}`,
            tenantId: tId,
            name: c.name,
            email: c.email,
            phone: c.phone,
            address: c.address,
            isCustomer: c.isCustomer,
            isSupplier: c.isSupplier,
          },
        });
      }
    }
  }

  // 6. Quotations matching screenshot records
  for (const tId of [tenant.id, "tenant-pbstylehomes"]) {
    const ksb = await prisma.contact.findFirst({ where: { tenantId: tId, name: "Kuljit Singh Birk" } });
    const ajmer = await prisma.contact.findFirst({ where: { tenantId: tId, name: "AJMER SINGH & KAMALJEET KAUR" } });
    const paramjeet = await prisma.contact.findFirst({ where: { tenantId: tId, name: "Paramjeet Kaur & Gurpreet Singh" } });
    const jitender = await prisma.contact.findFirst({ where: { tenantId: tId, name: "JITENDER SINGH" } });

    // Quote QU-0006 (Sent, 22,110.00)
    if (ksb) {
      const q6Exists = await prisma.quote.findUnique({
        where: { tenantId_quoteNumber: { tenantId: tId, quoteNumber: "QU-0006" } },
      });
      if (!q6Exists) {
        await prisma.quote.create({
          data: {
            tenantId: tId,
            contactId: ksb.id,
            quoteNumber: "QU-0006",
            reference: "333 Bridgeman Down rd Bridgeman Down",
            title: "Steel Framing Supply & Remediation",
            summary: "Fabrication and installation of light gauge steel frames and bathroom rectifications",
            date: new Date("2025-07-02"),
            expiryDate: new Date("2025-07-16"),
            status: "SENT",
            taxTreatment: "EXCLUSIVE",
            terms: "Standard 14-day payment terms from delivery. 50% deposit required upon frame detailing approval.",
            subtotal: 20100.0,
            taxTotal: 2010.0,
            totalAmount: 22110.0,
            lines: {
              create: [
                {
                  itemCode: "ASF-STUD-90",
                  description: "Kitchen Paint & Steel Framing Partition",
                  quantity: 1,
                  unitPrice: 6600.0,
                  discount: 0,
                  taxRate: 10,
                  lineAmount: 6600.0,
                  accountId: "200",
                },
                {
                  itemCode: "ASF-STUD-90",
                  description: "2 Bathroom rectification & Wall Framing",
                  quantity: 1,
                  unitPrice: 7800.0,
                  discount: 0,
                  taxRate: 10,
                  lineAmount: 7800.0,
                  accountId: "200",
                },
                {
                  itemCode: "ASF-TRACK-92",
                  description: "Rectification of 1 room & Structural framing",
                  quantity: 1,
                  unitPrice: 4500.0,
                  discount: 0,
                  taxRate: 10,
                  lineAmount: 4500.0,
                  accountId: "200",
                },
                {
                  itemCode: "ASF-LABOR-INST",
                  description: "Take Carpet Off and Polish timber Floor / Erection Labor",
                  quantity: 1,
                  unitPrice: 1200.0,
                  discount: 0,
                  taxRate: 10,
                  lineAmount: 1200.0,
                  accountId: "200",
                },
              ],
            },
            history: {
              create: [
                {
                  user: "Alpha Admin",
                  action: "Created",
                  detail: "Quote QU-0006 created for Kuljit Singh Birk for $22,110.00 AUD.",
                  timestamp: new Date("2025-07-02T07:45:00Z"),
                },
                {
                  user: "Alpha Admin",
                  action: "Sent",
                  detail: "Quote QU-0006 sent to Birkk@yahoo.com.au.",
                  timestamp: new Date("2025-07-02T07:45:00Z"),
                },
                {
                  user: "System Generated",
                  action: "Quote viewed",
                  detail: "This quote has been viewed online by the customer.",
                  timestamp: new Date("2025-07-16T11:36:00Z"),
                },
              ],
            },
          },
        });
      }
    }

    // Quote QU-0005 (Sent, 10,390.60)
    if (ajmer) {
      const q5Exists = await prisma.quote.findUnique({
        where: { tenantId_quoteNumber: { tenantId: tId, quoteNumber: "QU-0005" } },
      });
      if (!q5Exists) {
        await prisma.quote.create({
          data: {
            tenantId: tId,
            contactId: ajmer.id,
            quoteNumber: "QU-0005",
            reference: "36 allan cunningham dr gatton qld 4343",
            title: "Remediation Works & Light Steel Framing",
            date: new Date("2024-11-21"),
            expiryDate: new Date("2024-12-21"),
            status: "SENT",
            taxTreatment: "EXCLUSIVE",
            terms: "Standard 30-day payment terms apply.",
            subtotal: 9446.0,
            taxTotal: 944.6,
            totalAmount: 10390.6,
            lines: {
              create: [
                {
                  description: "36 allan cunningham dr gatton qld 4343 - Remediation Works & Framing",
                  quantity: 1,
                  unitPrice: 9446.0,
                  discount: 0,
                  taxRate: 10,
                  lineAmount: 9446.0,
                  accountId: "200",
                },
              ],
            },
            history: {
              create: [
                {
                  user: "Alpha Admin",
                  action: "Created",
                  detail: "Quote QU-0005 created for AJMER SINGH & KAMALJEET KAUR for $10,390.60 AUD.",
                  timestamp: new Date("2024-11-21T02:15:00Z"),
                },
                {
                  user: "Alpha Admin",
                  action: "Sent",
                  detail: "Quote QU-0005 sent to singhajmerpb60@gmail.com.",
                  timestamp: new Date("2024-11-21T02:15:00Z"),
                },
              ],
            },
          },
        });
      }
    }

    // Quote QU-0004 (Draft, 555,000.00)
    if (paramjeet) {
      const q4Exists = await prisma.quote.findUnique({
        where: { tenantId_quoteNumber: { tenantId: tId, quoteNumber: "QU-0004" } },
      });
      if (!q4Exists) {
        await prisma.quote.create({
          data: {
            tenantId: tId,
            contactId: paramjeet.id,
            quoteNumber: "QU-0004",
            reference: "Lot 3345 Coopers st Greenbank",
            title: "Full Residential Build & Complete Steel Framing Package",
            date: new Date("2024-04-09"),
            expiryDate: new Date("2024-05-09"),
            status: "DRAFT",
            taxTreatment: "EXCLUSIVE",
            terms: "Master Builders contract progress payment schedule applies.",
            subtotal: 504545.45,
            taxTotal: 50454.55,
            totalAmount: 555000.0,
            lines: {
              create: [
                {
                  description: "Lot 3345 Coopers st Greenbank - Full Structural Steel Framing Package",
                  quantity: 1,
                  unitPrice: 504545.45,
                  discount: 0,
                  taxRate: 10,
                  lineAmount: 504545.45,
                  accountId: "200",
                },
              ],
            },
            history: {
              create: [
                {
                  user: "Alpha Admin",
                  action: "Created",
                  detail: "Quote QU-0004 drafted for Paramjeet Kaur & Gurpreet Singh for $555,000.00 AUD.",
                  timestamp: new Date("2024-04-09T05:00:00Z"),
                },
              ],
            },
          },
        });
      }
    }

    // Quote QU-0001 (Sent, 40,370.00)
    if (jitender) {
      const q1Exists = await prisma.quote.findUnique({
        where: { tenantId_quoteNumber: { tenantId: tId, quoteNumber: "QU-0001" } },
      });
      if (!q1Exists) {
        await prisma.quote.create({
          data: {
            tenantId: tId,
            contactId: jitender.id,
            quoteNumber: "QU-0001",
            reference: "10 Ascot Ave Forest Lake",
            title: "External Framing & Patio Structural Package",
            date: new Date("2023-03-04"),
            expiryDate: new Date("2023-04-03"),
            status: "SENT",
            taxTreatment: "EXCLUSIVE",
            terms: "Standard 30-day payment terms apply.",
            subtotal: 36700.0,
            taxTotal: 3670.0,
            totalAmount: 40370.0,
            lines: {
              create: [
                {
                  description: "10 Ascot Ave Forest Lake - External Fencing & Steel Patio Frame",
                  quantity: 1,
                  unitPrice: 36700.0,
                  discount: 0,
                  taxRate: 10,
                  lineAmount: 36700.0,
                  accountId: "200",
                },
              ],
            },
            history: {
              create: [
                {
                  user: "Alpha Admin",
                  action: "Created",
                  detail: "Quote QU-0001 created for JITENDER SINGH for $40,370.00 AUD.",
                  timestamp: new Date("2023-03-04T08:00:00Z"),
                },
                {
                  user: "Alpha Admin",
                  action: "Sent",
                  detail: "Quote QU-0001 sent to customer.",
                  timestamp: new Date("2023-03-04T08:00:00Z"),
                },
              ],
            },
          },
        });
      }
    }
  }

  console.log("Database successfully seeded for Alpha Steel Frames!");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
