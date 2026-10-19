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
 * Checks whether the application has already been initialized with an organization and administrator.
 * Returns { initialized: boolean, organizationName?: string }.
 */
export async function isSystemInitialized(): Promise<SetupStatusResponse> {
  try {
    // 1. Check if the explicit setup completed marker exists
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

    // 2. Fallback check: check if there are already any users with role OWNER or ADMIN
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

    // 3. Fallback check: check if any tenant exists
    const tenantCount = await prisma.tenant.count();
    if (tenantCount > 0) {
      const firstTenant = await prisma.tenant.findFirst();
      return {
        initialized: true,
        organizationName: firstTenant?.name || "Alpha Steel Frames",
        dbReady: true,
      };
    }

    return { initialized: false, dbReady: true };
  } catch (err: any) {
    // Database may not be connected or tables not yet imported
    console.warn("[SetupService] Database query error checking setup status:", err?.message || err);
    return {
      initialized: false,
      dbReady: false,
      error: "Database connection failed. Please ensure the MySQL database is running and schema is imported.",
    };
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
 * - Creates Organization (Tenant)
 * - Hashes password using scrypt and creates Administrator User
 * - Links User to Tenant as OWNER
 * - Seeds default Chart of Accounts and Item catalog
 * - Writes INITIAL_SETUP_COMPLETED marker
 */
export async function initializeSystem(payload: SetupPayload) {
  // 1. Strict validation
  const validation = validateSetupPayload(payload);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // 2. Concurrency check: Ensure setup hasn't already been completed
  const currentStatus = await isSystemInitialized();
  if (currentStatus.initialized) {
    throw new Error("Setup has already been completed. Repeated initialization is strictly prohibited.");
  }

  const cleanAdminEmail = payload.adminEmail.trim().toLowerCase();
  const orgName = payload.organizationName.trim();
  const tradingName = payload.tradingName?.trim() || orgName;
  const currency = payload.currency?.trim() || "AUD";
  const timeZone = payload.timeZone?.trim() || "Australia/Brisbane";
  const quotePrefix = payload.quotePrefix?.trim() || "QU-";
  const logoUrl = payload.logoUrl?.trim() || "/logo.png";
  const subdomain = "alphasteel";

  // Hash administrator password
  const passwordHash = hashPassword(payload.adminPassword);

  // 3. Transactional creation
  return await prisma.$transaction(async (tx) => {
    // Check inside transaction to prevent race conditions
    const existingMarker = await tx.systemSetting.findUnique({
      where: { key: "INITIAL_SETUP_COMPLETED" },
    });
    if (existingMarker) {
      throw new Error("Setup has already been completed by another session.");
    }

    const existingUser = await tx.user.findUnique({
      where: { email: cleanAdminEmail },
    });
    if (existingUser) {
      throw new Error("A user with this email address already exists.");
    }

    // Create or find Tenant
    const tenant = await tx.tenant.upsert({
      where: { subdomain },
      update: {
        name: orgName,
        tradingName,
        currency,
        abn: payload.abn?.trim() || null,
        address: payload.address?.trim() || null,
        phone: payload.phone?.trim() || null,
        email: payload.email?.trim() || cleanAdminEmail,
        timeZone,
        quotePrefix,
        logoUrl,
      },
      create: {
        id: "tenant-alphasteel",
        name: orgName,
        tradingName,
        subdomain,
        currency,
        abn: payload.abn?.trim() || null,
        address: payload.address?.trim() || null,
        phone: payload.phone?.trim() || null,
        email: payload.email?.trim() || cleanAdminEmail,
        timeZone,
        quotePrefix,
        logoUrl,
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

    // Record Setup Completion State
    await tx.systemSetting.upsert({
      where: { key: "INITIAL_SETUP_COMPLETED" },
      update: {
        value: JSON.stringify({
          completedAt: new Date().toISOString(),
          organizationName: orgName,
          tradingName,
          adminEmail: cleanAdminEmail,
          version: "1.0.0",
        }),
      },
      create: {
        key: "INITIAL_SETUP_COMPLETED",
        value: JSON.stringify({
          completedAt: new Date().toISOString(),
          organizationName: orgName,
          tradingName,
          adminEmail: cleanAdminEmail,
          version: "1.0.0",
        }),
      },
    });

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
