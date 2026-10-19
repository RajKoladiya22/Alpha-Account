// Tests: Invariant 2 - Double-Entry Ledger Integrity

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { DoubleEntryLedgerEngine } from "../src/core/ledger/double-entry-engine.ts";
import { InvoiceStatus, BillStatus } from "../src/types/index.ts";
import type { InvoiceEntity, BillEntity } from "../src/types/index.ts";

describe("Invariant 2: Double-Entry Ledger Balancing Invariants", () => {
  const engine = new DoubleEntryLedgerEngine();
  const tenantId = "tenant_alpha";

  test("valid balanced journal entry is successfully posted", () => {
    const journal = engine.postJournalEntry(tenantId, {
      entryNumber: "JRN-001",
      date: new Date(),
      narration: "Owner Equity Contribution",
      lines: [
        { accountId: "acc_bank", description: "Deposit to Bank", debit: 5000.0, credit: 0 },
        { accountId: "acc_equity", description: "Owner Equity", debit: 0, credit: 5000.0 },
      ],
    });

    assert.ok(journal.id);
    assert.equal(journal.entryNumber, "JRN-001");
    assert.equal(journal.lines.length, 2);
    assert.equal(journal.isReversed, false);
  });

  test("unbalanced journal entry is strictly rejected", () => {
    assert.throws(
      () =>
        engine.postJournalEntry(tenantId, {
          entryNumber: "JRN-UNBALANCED",
          date: new Date(),
          narration: "Illegal unbalance",
          lines: [
            { accountId: "acc_bank", debit: 1000.0, credit: 0 },
            { accountId: "acc_sales", debit: 0, credit: 950.0 }, // $50 mismatch
          ],
        }),
      /INVARIANT_VIOLATION: Unbalanced journal entry! Total Debits \(\$1000\) != Total Credits \(\$950\)/
    );
  });

  test("journal with fewer than two lines is rejected", () => {
    assert.throws(
      () =>
        engine.postJournalEntry(tenantId, {
          entryNumber: "JRN-ONE-LINE",
          date: new Date(),
          narration: "Single line invalid",
          lines: [{ accountId: "acc_bank", debit: 100.0, credit: 0 }],
        }),
      /INVARIANT_VIOLATION: A valid double-entry journal requires at least two lines/
    );
  });

  test("negative amounts or dual debit/credit on same line are rejected", () => {
    assert.throws(
      () =>
        engine.postJournalEntry(tenantId, {
          entryNumber: "JRN-NEG",
          date: new Date(),
          narration: "Negative amount",
          lines: [
            { accountId: "acc_bank", debit: -100.0, credit: 0 },
            { accountId: "acc_sales", debit: 0, credit: -100.0 },
          ],
        }),
      /INVARIANT_VIOLATION: Debit and credit amounts must be non-negative/
    );

    assert.throws(
      () =>
        engine.postJournalEntry(tenantId, {
          entryNumber: "JRN-DUAL",
          date: new Date(),
          narration: "Dual amounts",
          lines: [
            { accountId: "acc_bank", debit: 100.0, credit: 50.0 },
            { accountId: "acc_sales", debit: 0, credit: 50.0 },
          ],
        }),
      /INVARIANT_VIOLATION: A line item cannot have both a debit and credit simultaneously/
    );
  });

  test("posted journal entry is strictly immutable and cannot be modified or deleted", () => {
    assert.throws(() => engine.updateJournalEntry(), /INVARIANT_VIOLATION: Journal entries are strictly immutable/);
    assert.throws(() => engine.deleteJournalEntry(), /INVARIANT_VIOLATION: Journal entries cannot be deleted/);
  });

  test("journal reversal produces an equal and opposite append-only entry", () => {
    const original = engine.postJournalEntry(tenantId, {
      entryNumber: "JRN-EXPENSE-01",
      date: new Date(),
      narration: "Office Supplies",
      lines: [
        { accountId: "acc_expense", debit: 250.0, credit: 0 },
        { accountId: "acc_bank", debit: 0, credit: 250.0 },
      ],
    });

    const { original: updatedOrig, reversing } = engine.reverseJournalEntry(
      tenantId,
      original.id,
      "Duplicate entry correction"
    );

    assert.equal(updatedOrig.isReversed, true);
    assert.equal(updatedOrig.reversingJournalId, reversing.id);
    assert.equal(reversing.entryNumber, `REV-${original.entryNumber}`);
    assert.equal(reversing.lines[0].accountId, "acc_expense");
    assert.equal(reversing.lines[0].debit, 0);
    assert.equal(reversing.lines[0].credit, 250.0); // Debits and credits inverted
    assert.equal(reversing.lines[1].accountId, "acc_bank");
    assert.equal(reversing.lines[1].debit, 250.0);
    assert.equal(reversing.lines[1].credit, 0);

    // Verify net balance on expense is now zero
    const expenseBal = engine.getAccountBalance("acc_expense");
    assert.equal(expenseBal.netBalance, 0);
  });

  test("invoice approval generates balanced AR, Revenue, and Tax journal lines", () => {
    const dummyInvoice: InvoiceEntity = {
      id: "inv_999",
      tenantId,
      contactId: "Customer X",
      invoiceNumber: "INV-2026-001",
      date: new Date(),
      dueDate: new Date(),
      status: InvoiceStatus.AUTHORIZED,
      subtotal: 1000.0,
      taxTotal: 150.0,
      totalAmount: 1150.0,
      amountPaid: 0,
      amountDue: 1150.0,
      lines: [],
    };

    const invJournal = engine.createInvoiceJournal(tenantId, dummyInvoice, {
      arAccountId: "acc_ar",
      revenueAccountId: "acc_sales",
      taxLiabilityAccountId: "acc_tax_payable",
    });

    assert.equal(invJournal.lines.length, 3);
    assert.equal(invJournal.lines[0].debit, 1150.0); // AR (Debit)
    assert.equal(invJournal.lines[1].credit, 1000.0); // Revenue (Credit)
    assert.equal(invJournal.lines[2].credit, 150.0);  // Tax (Credit)
  });
});
