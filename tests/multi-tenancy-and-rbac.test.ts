import test from "node:test";
import assert from "node:assert/strict";
import { QuoteService } from "../src/core/quotes/quote-service.ts";
import { TenantService } from "../src/core/tenancy/tenant-service.ts";
import { RbacService } from "../src/core/auth/rbac-service.ts";
import { UserRole } from "../src/types/index.ts";

test("Multi-Tenancy: Strict Data Isolation Between Organizations", async (t) => {
  const quoteService = new QuoteService();
  const tenantA = "tenant-alpha";
  const tenantB = "tenant-beta";

  // Create quote for Tenant Alpha
  const quoteA = quoteService.createQuote({
    tenantId: tenantA,
    contactId: "customer-alpha",
    lines: [{ description: "Alpha Service", quantity: 1, unitPrice: 500 }],
  });

  // Create quote for Tenant Beta
  const quoteB = quoteService.createQuote({
    tenantId: tenantB,
    contactId: "customer-beta",
    lines: [{ description: "Beta Service", quantity: 1, unitPrice: 750 }],
  });

  await t.test("Tenant Alpha cannot retrieve Tenant Beta's quote", () => {
    const leakAttempt = quoteService.getQuoteById(tenantA, quoteB.id);
    assert.equal(leakAttempt, null);
  });

  await t.test("Tenant Beta cannot retrieve Tenant Alpha's quote", () => {
    const leakAttempt = quoteService.getQuoteById(tenantB, quoteA.id);
    assert.equal(leakAttempt, null);
  });

  await t.test("Quotes list queries are strictly filtered by tenantId", () => {
    const listA = quoteService.listQuotes(tenantA);
    const listB = quoteService.listQuotes(tenantB);

    assert.equal(listA.quotes.length, 1);
    assert.equal(listA.quotes[0].id, quoteA.id);

    assert.equal(listB.quotes.length, 1);
    assert.equal(listB.quotes[0].id, quoteB.id);
  });
});

test("RBAC: Role Permissions Enforcement (OWNER, ADVISER, STANDARD, READONLY)", async (t) => {
  const rbac = new RbacService();

  await t.test("OWNER has full permissions across all workflows", () => {
    assert.equal(rbac.hasPermission(UserRole.OWNER, "VIEW_QUOTES"), true);
    assert.equal(rbac.hasPermission(UserRole.OWNER, "CREATE_QUOTE"), true);
    assert.equal(rbac.hasPermission(UserRole.OWNER, "CONVERT_QUOTE"), true);
    assert.equal(rbac.hasPermission(UserRole.OWNER, "MANAGE_SETTINGS"), true);
  });

  await t.test("STANDARD user can view and edit quotes, but cannot change settings", () => {
    assert.equal(rbac.hasPermission(UserRole.STANDARD, "VIEW_QUOTES"), true);
    assert.equal(rbac.hasPermission(UserRole.STANDARD, "CREATE_QUOTE"), true);
    assert.equal(rbac.hasPermission(UserRole.STANDARD, "CONVERT_QUOTE"), true);
    assert.equal(rbac.hasPermission(UserRole.STANDARD, "MANAGE_SETTINGS"), false);

    assert.throws(
      () => rbac.assertPermission(UserRole.STANDARD, "MANAGE_SETTINGS"),
      /RBAC Authorization Denied/
    );
  });

  await t.test("READONLY user can only view quotes, not mutate", () => {
    assert.equal(rbac.hasPermission(UserRole.READONLY, "VIEW_QUOTES"), true);
    assert.equal(rbac.hasPermission(UserRole.READONLY, "CREATE_QUOTE"), false);
    assert.equal(rbac.hasPermission(UserRole.READONLY, "CONVERT_QUOTE"), false);

    assert.throws(
      () => rbac.assertPermission(UserRole.READONLY, "CREATE_QUOTE"),
      /RBAC Authorization Denied/
    );
  });
});
