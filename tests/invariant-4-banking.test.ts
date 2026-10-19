// Tests: Invariant 4 - Bank Reconciliation Matching Pipeline

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { BankReconciliationEngine } from "../src/core/banking/reconciliation-engine.ts";
import { MatchStage, InvoiceStatus, BillStatus } from "../src/types/index.ts";
import type { InvoiceEntity, BillEntity } from "../src/types/index.ts";

describe("Invariant 4: Bank Reconciliation Hierarchical Resolution Pipeline", () => {
  const engine = new BankReconciliationEngine();
  const tenantId = "tenant_gamma";

  // Configure Step 1 Rules
  engine.addBankRule({
    id: "rule_uber",
    ruleName: "Uber Rides to Travel Expense",
    priority: 1,
    targetType: "SPEND",
    conditions: [{ field: "narration", operator: "CONTAINS", value: "Uber" }],
    targetAccountId: "acc_travel_expense",
    taxRate: 10,
  });

  // Configure Open Invoices for Step 2 and 3
  const invoice1: InvoiceEntity = {
    id: "inv_101",
    tenantId,
    contactId: "Apex Builders",
    invoiceNumber: "INV-8899",
    date: new Date("2026-10-01"),
    dueDate: new Date("2026-10-15"),
    status: InvoiceStatus.AUTHORIZED,
    subtotal: 3000,
    taxTotal: 300,
    totalAmount: 3300,
    amountPaid: 0,
    amountDue: 3300,
    lines: [],
  };

  const invoice2: InvoiceEntity = {
    id: "inv_102",
    tenantId,
    contactId: "Horizon Homes",
    invoiceNumber: "INV-9900",
    date: new Date("2026-10-10"),
    dueDate: new Date("2026-10-24"),
    status: InvoiceStatus.AUTHORIZED,
    subtotal: 1200,
    taxTotal: 120,
    totalAmount: 1320,
    amountPaid: 0,
    amountDue: 1320,
    lines: [],
  };

  engine.setOpenInvoices([invoice1, invoice2]);

  // Configure Historical Memory for Step 3
  engine.recordHistoricalMemory("monthly aws cloud hosting", "acc_hosting_expense", "Amazon Web Services");

  test("Step 1: User-defined conditional Bank Rule is executed first", () => {
    const line = {
      id: "bank_line_01",
      date: new Date("2026-10-18"),
      narration: "UBER TRIP 4810 SYDNEY AU",
      amount: -45.5, // Money Out
      isReconciled: false,
    };

    const result = engine.reconcileLine(line);
    assert.equal(result.stage, MatchStage.RULE);
    assert.equal(result.confidenceScore, 1.0);
    assert.equal(result.targetAccountId, "acc_travel_expense");
    assert.ok(result.reason.includes("Uber Rides to Travel Expense"));
  });

  test("Step 2: Exact 1:1 match when rule does not apply (amount + reference match)", () => {
    const line = {
      id: "bank_line_02",
      date: new Date("2026-10-16"),
      narration: "Direct Credit Apex Builders INV-8899 Settlement",
      amount: 3300.0, // Money In
      isReconciled: false,
    };

    const result = engine.reconcileLine(line);
    assert.equal(result.stage, MatchStage.EXACT);
    assert.equal(result.confidenceScore, 1.0);
    assert.equal(result.matchedDocumentType, "INVOICE");
    assert.equal(result.matchedDocumentId, "inv_101");
    assert.ok(result.reason.includes("INV-8899"));
  });

  test("Step 3: Heuristic / Probabilistic match when reference is absent but contact + amount correlate", () => {
    const line = {
      id: "bank_line_03",
      date: new Date("2026-10-23"), // close to due date of Horizon Homes (2026-10-24)
      narration: "EFT Pmt Horizon Homes Pty Ltd", // Contains contact name, missing invoice number
      amount: 1320.0,
      isReconciled: false,
    };

    const result = engine.reconcileLine(line);
    assert.equal(result.stage, MatchStage.HEURISTIC);
    assert.ok(result.confidenceScore >= 0.7);
    assert.equal(result.matchedDocumentId, "inv_102");
    assert.ok(result.reason.includes("exact amount match"));
    assert.ok(result.reason.includes("contact identifier identified"));
  });

  test("Step 4: Fallback to manual allocation when no rule or strong candidate exists", () => {
    const line = {
      id: "bank_line_04",
      date: new Date("2026-10-19"),
      narration: "MISC UNKNOWN DEPOSIT REF 999000",
      amount: 88.0,
      isReconciled: false,
    };

    const result = engine.reconcileLine(line);
    assert.equal(result.stage, MatchStage.MANUAL);
    assert.equal(result.confidenceScore, 0.0);
    assert.ok(result.reason.includes("Manual allocation required"));
  });
});
