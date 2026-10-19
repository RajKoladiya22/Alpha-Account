import crypto from "node:crypto";
import type { OrganizationEntity, TenantSettings } from "../../types/index.ts";

export class TenantService {
  private organizations: Map<string, OrganizationEntity> = new Map();
  private settings: Map<string, TenantSettings> = new Map();
  private userTenants: Map<string, Set<string>> = new Map(); // userId -> Set of tenantIds

  constructor() {
    this.seedDefaultOrganization();
  }

  private seedDefaultOrganization() {
    const defaultOrg: OrganizationEntity = {
      id: "tenant-default",
      name: "PB Style Homes Pty Ltd",
      subdomain: "pbstylehomes",
      currency: "AUD",
      legalTradingName: "PB Style Homes Proprietary Limited",
      registrationNumber: "ABN 51 824 753 556",
      organizationType: "Company",
      createdAt: new Date(),
    };

    const defaultSettings: TenantSettings = {
      tenantId: defaultOrg.id,
      financialYearEndMonth: 6, // 30 June (Australian Financial Year)
      taxBasis: "ACCRUAL",
      defaultQuoteExpiryDays: 30,
      quoteNumberPrefix: "QU-",
      quoteDefaultTerms: "1. All prices are in Australian Dollars (AUD).\n2. Payment terms are 14 days from invoice.\n3. Validity: 30 days from issue date.",
      currency: "AUD",
    };

    this.organizations.set(defaultOrg.id, defaultOrg);
    this.settings.set(defaultOrg.id, defaultSettings);

    // Seed default user access
    const userSet = new Set<string>();
    userSet.add(defaultOrg.id);
    this.userTenants.set("user-sb", userSet);
  }

  public getOrganization(tenantId: string): OrganizationEntity | null {
    return this.organizations.get(tenantId) || null;
  }

  public getSettings(tenantId: string): TenantSettings {
    const s = this.settings.get(tenantId);
    if (!s) {
      return {
        tenantId,
        financialYearEndMonth: 6,
        taxBasis: "ACCRUAL",
        defaultQuoteExpiryDays: 30,
        quoteNumberPrefix: "QU-",
        currency: "AUD",
      };
    }
    return s;
  }

  public updateSettings(tenantId: string, updates: Partial<TenantSettings>): TenantSettings {
    const current = this.getSettings(tenantId);
    const updated = { ...current, ...updates };
    this.settings.set(tenantId, updated);
    return updated;
  }

  public listUserOrganizations(userId: string): OrganizationEntity[] {
    const allowed = this.userTenants.get(userId) || new Set<string>();
    return Array.from(this.organizations.values()).filter((org) => allowed.has(org.id));
  }

  public verifyUserMembership(userId: string, tenantId: string): boolean {
    const userOrgs = this.userTenants.get(userId);
    return userOrgs ? userOrgs.has(tenantId) : false;
  }
}
