import fs from "node:fs";
import path from "node:path";
import { prisma } from "./prisma.ts";
import { hashPassword } from "../core/security/password-hasher.ts";

export interface SetupPayload {
  // Step 1: First Administrator
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  confirmPassword?: string;
  backupEmail?: string;

  // Step 2: Organization Details
  organizationName: string;
  tradingName?: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  state?: string;
  postalCode?: string;
  abn?: string;
  currency?: string;
  timeZone?: string;
  quotePrefix?: string;
  logoUrl?: string;
}

export interface SetupStatusResponse {
  initialized: boolean;
  organizationName?: string;
  dbReady?: boolean;
  error?: string;
}

/**
 * Ensures all required database tables exist in MySQL.
 * If tables are missing (e.g. freshly created database), automatically bootstraps
 * the schema from prisma/mysql_schema.sql.
 */
export async function ensureDatabaseSchema(): Promise<boolean> {
  try {
    // Quick test if core User table exists
    await prisma.$queryRawUnsafe("SELECT 1 FROM `User` LIMIT 1");
    return true;
  } catch (err: any) {
    console.log("[SetupService] Database tables missing or incomplete. Automatically bootstrapping schema...");
    try {
      const sqlPath = path.join(process.cwd(), "prisma", "mysql_schema.sql");
      if (fs.existsSync(sqlPath)) {
        const sqlContent = fs.readFileSync(sqlPath, "utf-8");
        // Split SQL statements by semicolon
        const statements = sqlContent
          .split(";")
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && !s.startsWith("--"));

        for (const stmt of statements) {
          try {
            await prisma.$executeRawUnsafe(stmt);
          } catch (stmtErr: any) {
            // Ignore if already exists (e.g. duplicate key, index, or constraint)
          }
        }
        console.log("[SetupService] Database schema auto-bootstrapped successfully.");
        return true;
      }
    } catch (bootstrapErr) {
      console.error("[SetupService] Auto-bootstrap error:", bootstrapErr);
    }
    return false;
  }
}

/**
 * Checks whether the application has already been initialized with an organization and administrator.
 * Automatically bootstraps missing tables if database is empty.
 */
export async function isSystemInitialized(): Promise<SetupStatusResponse> {
  try {
    // 1. Try checking SystemSetting table if present
    try {
      const setupRecord = await prisma.systemSetting.findUnique({
        where: { key: "INITIAL_SETUP_COMPLETED" },
      });

      if (setupRecord) {
        let orgName = "Alpha Steel Frames";
        try {
          const parsed = JSON.parse(setupRecord.value);
          if (parsed.organizationName) orgName = parsed.organizationName;
        } catch {
          // fallback
        }
        return { initialized: true, organizationName: orgName, dbReady: true };
      }
    } catch {
      // Table does not exist (P2021) or cannot be queried; continue to core identity check
    }

    // 2. Core identity check: Check if an administrator user exists (role: OWNER or ADMIN)
    const adminUser = await prisma.userTenant.findFirst({
      where: {
        role: { in: ["OWNER", "ADMIN"] },
      },
      include: {
        tenant: true,
      },
    });

    if (adminUser) {
      return {
        initialized: true,
        organizationName: adminUser.tenant?.name || "Alpha Steel Frames",
        dbReady: true,
      };
    }

    // 3. Fallback check: check if any user exists
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      const firstTenant = await prisma.tenant.findFirst();
      return {
        initialized: true,
        organizationName: firstTenant?.name || "Alpha Steel Frames",
        dbReady: true,
      };
    }

    return { initialized: false, dbReady: true };
  } catch (err: any) {
    // If table doesn't exist (P2021 or MySQL error 1146 "Table doesn't exist"), auto-bootstrap
    if (
      err?.code === "P2021" ||
      err?.message?.includes("does not exist in the current database") ||
      err?.message?.includes("Table")
    ) {
      console.log("[SetupService] Core tables missing during check. Bootstrapping database schema...");
      const bootstrapped = await ensureDatabaseSchema();
      if (bootstrapped) {
        return { initialized: false, dbReady: true };
      }
    }

    // If the database connection itself failed (server down or unreachable)
    if (err?.code === "P1001" || err?.message?.includes("Can't reach database server")) {
      return {
        initialized: false,
        dbReady: false,
        error: "Database connection failed. Please ensure the MySQL database is running and reachable.",
      };
    }

    return { initialized: false, dbReady: true };
  }
}

/**
 * Validates the setup payload before initialization.
 */
export function validateSetupPayload(data: SetupPayload): { valid: boolean; error?: string } {
  // Validate Admin Name
  if (!data.adminName || !data.adminName.trim()) {
    return { valid: false, error: "Administrator full name is required." };
  }

  // Validate Admin Email
  if (!data.adminEmail || !data.adminEmail.trim()) {
    return { valid: false, error: "Administrator email address is required." };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.adminEmail.trim())) {
    return { valid: false, error: "Please enter a valid email address for the administrator." };
  }

  // Validate Password
  if (!data.adminPassword) {
    return { valid: false, error: "Password is required." };
  }
  if (data.adminPassword.length < 8) {
    return { valid: false, error: "Password must be at least 8 characters long." };
  }
  if (!/[A-Z]/.test(data.adminPassword)) {
    return { valid: false, error: "Password must contain at least one uppercase letter (A-Z)." };
  }
  if (!/[a-z]/.test(data.adminPassword)) {
    return { valid: false, error: "Password must contain at least one lowercase letter (a-z)." };
  }
  if (!/[0-9]/.test(data.adminPassword)) {
    return { valid: false, error: "Password must contain at least one numeric digit (0-9)." };
  }

  // Validate Confirm Password (if supplied)
  if (data.confirmPassword !== undefined && data.adminPassword !== data.confirmPassword) {
    return { valid: false, error: "Password and Confirm Password do not match." };
  }

  // Validate Organization Name
  if (!data.organizationName || !data.organizationName.trim()) {
    return { valid: false, error: "Organization business name is required." };
  }

  return { valid: true };
}

/**
 * Initializes the system transactionally:
 * - Bootstraps database schema if empty
 * - Creates Organization (Tenant) with standard columns
 * - Hashes password using scrypt and creates Administrator User
 * - Links User to Tenant as OWNER
 * - Seeds default Chart of Accounts and Item catalog
 * - Records setup completion marker
 */
export async function initializeSystem(payload: SetupPayload) {
  // 1. Strict validation
  const validation = validateSetupPayload(payload);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // 2. Ensure database schema exists before starting transaction
  await ensureDatabaseSchema();

  // 3. Concurrency check: Ensure setup hasn't already been completed
  const currentStatus = await isSystemInitialized();
  if (currentStatus.initialized) {
    throw new Error("Setup has already been completed. Repeated initialization is strictly prohibited.");
  }

  const cleanAdminEmail = payload.adminEmail.trim().toLowerCase();
  const orgName = payload.organizationName.trim();
  const currency = payload.currency?.trim() || "AUD";
  const subdomain = "alphasteel";

  // Hash administrator password
  const passwordHash = hashPassword(payload.adminPassword);

  // 4. Transactional creation
  return await prisma.$transaction(async (tx) => {
    // Check inside transaction to prevent race conditions without depending on auxiliary tables
    const existingUser = await tx.user.findFirst();
    if (existingUser) {
      throw new Error("Setup has already been completed. An administrator account already exists.");
    }

    const existingEmail = await tx.user.findUnique({
      where: { email: cleanAdminEmail },
    });
    if (existingEmail) {
      throw new Error("A user with this email address already exists.");
    }

    // Create or find Tenant using the standard columns present in all database versions
    const tenant = await tx.tenant.upsert({
      where: { subdomain },
      update: {
        name: orgName,
        currency,
        abn: payload.abn?.trim() || null,
        address: payload.address?.trim() || null,
        phone: payload.phone?.trim() || null,
        email: payload.email?.trim() || cleanAdminEmail,
      },
      create: {
        id: "tenant-alphasteel",
        name: orgName,
        subdomain,
        currency,
        abn: payload.abn?.trim() || null,
        address: payload.address?.trim() || null,
        phone: payload.phone?.trim() || null,
        email: payload.email?.trim() || cleanAdminEmail,
      },
    });

    // Create Administrator User
    const adminUser = await tx.user.create({
      data: {
        name: payload.adminName.trim(),
        email: cleanAdminEmail,
        passwordHash,
        backupEmail: payload.backupEmail?.trim() || null,
        tenants: {
          create: {
            tenantId: tenant.id,
            role: "OWNER",
          },
        },
      },
    });

    // Seed Standard Essential Accounts for Alpha Steel Frames
    const defaultAccounts = [
      { code: "200", name: "Sales - Steel Framing", type: "REVENUE" as const, currency },
      { code: "610", name: "Accounts Receivable", type: "ASSET" as const, currency },
      { code: "820", name: "GST Clearing Account", type: "LIABILITY" as const, currency },
      { code: "090", name: "Business Bank Account", type: "ASSET" as const, currency },
      { code: "300", name: "Cost of Goods Sold - Materials", type: "EXPENSE" as const, currency },
      { code: "400", name: "Advertising & Marketing", type: "EXPENSE" as const, currency },
      { code: "429", name: "General Administration", type: "EXPENSE" as const, currency },
    ];

    for (const acc of defaultAccounts) {
      await tx.account.upsert({
        where: {
          tenantId_code: {
            tenantId: tenant.id,
            code: acc.code,
          },
        },
        update: { name: acc.name, type: acc.type },
        create: {
          tenantId: tenant.id,
          code: acc.code,
          name: acc.name,
          type: acc.type,
          currency: acc.currency,
          isSystem: true,
        },
      });
    }

    // Seed Standard Product Items for Alpha Steel Frames
    const defaultItems = [
      {
        code: "FRAME-STEEL",
        name: "Standard Wall Frame (Custom Pre-Fabricated)",
        description: "TrueCore steel pre-assembled wall framing unit designed to AS/NZS 4600 structural code.",
        salesUnitPrice: 120.0,
        purchaseUnitPrice: 80.0,
        taxRate: 10.0,
      },
      {
        code: "TRUSS-90",
        name: "90mm Engineered Steel Roof Truss",
        description: "High-tensile lightweight roof truss with certified engineering wind classification.",
        salesUnitPrice: 85.0,
        purchaseUnitPrice: 55.0,
        taxRate: 10.0,
      },
      {
        code: "STUD-75",
        name: "75mm C-Section Structural Stud",
        description: "0.75mm BMT TrueCore steel stud with pre-punched service holes for rapid installation.",
        salesUnitPrice: 18.5,
        purchaseUnitPrice: 12.0,
        taxRate: 10.0,
      },
      {
        code: "HARDWARE-KIT",
        name: "Structural Assembly & Tie-Down Hardware Kit",
        description: "Comprehensive fixings, brackets, heavy-duty tek screws, and hold-down brackets.",
        salesUnitPrice: 45.0,
        purchaseUnitPrice: 28.0,
        taxRate: 10.0,
      },
    ];

    for (const item of defaultItems) {
      await tx.item.upsert({
        where: {
          tenantId_code: {
            tenantId: tenant.id,
            code: item.code,
          },
        },
        update: {
          name: item.name,
          description: item.description,
          salesUnitPrice: item.salesUnitPrice,
          taxRate: item.taxRate,
        },
        create: {
          tenantId: tenant.id,
          code: item.code,
          name: item.name,
          description: item.description,
          salesUnitPrice: item.salesUnitPrice,
          purchaseUnitPrice: item.purchaseUnitPrice,
          taxRate: item.taxRate,
        },
      });
    }

    // Attempt to record in SystemSetting table if table exists or can be created
    try {
      await tx.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS \`SystemSetting\` (
          \`id\` VARCHAR(191) NOT NULL,
          \`key\` VARCHAR(191) NOT NULL,
          \`value\` TEXT NOT NULL,
          \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
          UNIQUE INDEX \`SystemSetting_key_key\`(\`key\`),
          PRIMARY KEY (\`id\`)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
      `);

      await tx.systemSetting.upsert({
        where: { key: "INITIAL_SETUP_COMPLETED" },
        update: {
          value: JSON.stringify({
            completedAt: new Date().toISOString(),
            organizationName: orgName,
            adminEmail: cleanAdminEmail,
            version: "1.0.0",
          }),
        },
        create: {
          key: "INITIAL_SETUP_COMPLETED",
          value: JSON.stringify({
            completedAt: new Date().toISOString(),
            organizationName: orgName,
            adminEmail: cleanAdminEmail,
            version: "1.0.0",
          }),
        },
      });
    } catch (settingErr) {
      // Non-fatal: even if SystemSetting table cannot be updated,
      // User and Tenant creation marks the system as initialized.
    }

    return {
      success: true,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        subdomain: tenant.subdomain,
      },
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
      },
    };
  });
}
