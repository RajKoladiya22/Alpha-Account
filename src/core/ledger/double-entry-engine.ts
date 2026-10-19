// Invariant 2: Double-Entry Ledger Integrity Engine

import type { JournalEntryRecord, JournalLineInput, InvoiceEntity, BillEntity } from "../../types/index.ts";
import crypto from "node:crypto";

export interface AccountBalance {
  accountId: string;
  totalDebit: number;
  totalCredit: number;
  netBalance: number;
}

export class DoubleEntryLedgerEngine {
  private journals = new Map<string, JournalEntryRecord>();

  // Invariant 2 Rule: sum(debits) === sum(credits) to 4 decimal places
  public static validateBalance(lines: JournalLineInput[]): { isBalanced: boolean; totalDebit: number; totalCredit: number; diff: number } {
    if (!lines || lines.length < 2) {
      throw new Error("INVARIANT_VIOLATION: A valid double-entry journal requires at least two lines.");
    }

    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of lines) {
      if (line.debit < 0 || line.credit < 0) {
        throw new Error("INVARIANT_VIOLATION: Debit and credit amounts must be non-negative.");
      }
      if (line.debit > 0 && line.credit > 0) {
        throw new Error("INVARIANT_VIOLATION: A line item cannot have both a debit and credit simultaneously.");
      }
      totalDebit += line.debit;
      totalCredit += line.credit;
    }

    // Round to 4 decimal places to prevent IEEE floating point rounding bugs
    const roundedDebit = Math.round(totalDebit * 10000) / 10000;
    const roundedCredit = Math.round(totalCredit * 10000) / 10000;
    const diff = Math.abs(roundedDebit - roundedCredit);

    return {
      isBalanced: diff < 0.0001,
      totalDebit: roundedDebit,
      totalCredit: roundedCredit,
      diff,
    };
  }

  public postJournalEntry(
    tenantId: string,
    entryInput: {
      entryNumber: string;
      date: Date;
      narration: string;
      sourceDocumentType?: string;
      sourceDocumentId?: string;
      lines: JournalLineInput[];
    }
  ): JournalEntryRecord {
    const balanceCheck = DoubleEntryLedgerEngine.validateBalance(entryInput.lines);

    if (!balanceCheck.isBalanced) {
      throw new Error(
        `INVARIANT_VIOLATION: Unbalanced journal entry! Total Debits ($${balanceCheck.totalDebit}) != Total Credits ($${balanceCheck.totalCredit}). Difference: $${balanceCheck.diff}`
      );
    }

    const id = `jrn_${crypto.randomUUID()}`;
    const record: JournalEntryRecord = {
      id,
      tenantId,
      entryNumber: entryInput.entryNumber,
      date: entryInput.date,
      narration: entryInput.narration,
      sourceDocumentType: entryInput.sourceDocumentType,
      sourceDocumentId: entryInput.sourceDocumentId,
      isReversed: false,
      lines: entryInput.lines.map((l) => ({ ...l })),
      createdAt: new Date(),
    };

    this.journals.set(id, record);
    return record;
  }

  public getJournalEntry(id: string): JournalEntryRecord | undefined {
    return this.journals.get(id);
  }

  // Invariant 2 Rule: Once posted, journal entries are strictly immutable. Modifications/deletions must be rejected.
  public updateJournalEntry(): never {
    throw new Error("INVARIANT_VIOLATION: Journal entries are strictly immutable once posted. Modifications are prohibited.");
  }

  public deleteJournalEntry(): never {
    throw new Error("INVARIANT_VIOLATION: Journal entries cannot be deleted. Cancellations must be executed via reverseJournalEntry().");
  }

  // Invariant 2 Rule: Reversals must generate an equal and opposite append-only journal
  public reverseJournalEntry(
    tenantId: string,
    originalJournalId: string,
    reason: string
  ): { original: JournalEntryRecord; reversing: JournalEntryRecord } {
    const original = this.journals.get(originalJournalId);
    if (!original) {
      throw new Error(`Journal ${originalJournalId} not found.`);
    }
    if (original.tenantId !== tenantId) {
      throw new Error("Tenant isolation violation.");
    }
    if (original.isReversed) {
      throw new Error(`Journal ${originalJournalId} is already reversed.`);
    }

    // Invert all lines: debits become credits, credits become debits
    const invertedLines: JournalLineInput[] = original.lines.map((line) => ({
      accountId: line.accountId,
      description: `Reversal of ${original.entryNumber}: ${line.description || ""}`.trim(),
      debit: line.credit,
      credit: line.debit,
    }));

    const reversingId = `jrn_${crypto.randomUUID()}`;
    const reversingEntry: JournalEntryRecord = {
      id: reversingId,
      tenantId,
      entryNumber: `REV-${original.entryNumber}`,
      date: new Date(),
      narration: `REVERSAL of ${original.entryNumber} - Reason: ${reason}`,
      sourceDocumentType: "REVERSAL",
      sourceDocumentId: originalJournalId,
      isReversed: false,
      reversingJournalId: originalJournalId,
      lines: invertedLines,
      createdAt: new Date(),
    };

    // Update original pointer
    original.isReversed = true;
    original.reversingJournalId = reversingId;

    this.journals.set(reversingId, reversingEntry);
    return { original, reversing: reversingEntry };
  }

  // Helper: Invoicing financial mutation builder
  public createInvoiceJournal(
    tenantId: string,
    invoice: InvoiceEntity,
    accounts: { arAccountId: string; revenueAccountId: string; taxLiabilityAccountId: string }
  ): JournalEntryRecord {
    const lines: JournalLineInput[] = [
      {
        accountId: accounts.arAccountId,
        description: `Accounts Receivable for Invoice ${invoice.invoiceNumber}`,
        debit: invoice.totalAmount,
        credit: 0,
      },
      {
        accountId: accounts.revenueAccountId,
        description: `Sales Revenue from Invoice ${invoice.invoiceNumber}`,
        debit: 0,
        credit: invoice.subtotal,
      },
    ];

    if (invoice.taxTotal > 0) {
      lines.push({
        accountId: accounts.taxLiabilityAccountId,
        description: `Sales Tax Payable for Invoice ${invoice.invoiceNumber}`,
        debit: 0,
        credit: invoice.taxTotal,
      });
    }

    return this.postJournalEntry(tenantId, {
      entryNumber: `JRN-INV-${invoice.invoiceNumber}`,
      date: invoice.date,
      narration: `Invoice posted to ${invoice.contactId}`,
      sourceDocumentType: "INVOICE",
      sourceDocumentId: invoice.id,
      lines,
    });
  }

  // Helper: Bill financial mutation builder
  public createBillJournal(
    tenantId: string,
    bill: BillEntity,
    accounts: { apAccountId: string; expenseAccountId: string; taxReceivableAccountId: string }
  ): JournalEntryRecord {
    const lines: JournalLineInput[] = [
      {
        accountId: accounts.expenseAccountId,
        description: `Expense incurred from Bill ${bill.billNumber}`,
        debit: bill.subtotal,
        credit: 0,
      },
    ];

    if (bill.taxTotal > 0) {
      lines.push({
        accountId: accounts.taxReceivableAccountId,
        description: `Input Tax Receivable for Bill ${bill.billNumber}`,
        debit: bill.taxTotal,
        credit: 0,
      });
    }

    lines.push({
      accountId: accounts.apAccountId,
      description: `Accounts Payable for Bill ${bill.billNumber}`,
      debit: 0,
      credit: bill.totalAmount,
    });

    return this.postJournalEntry(tenantId, {
      entryNumber: `JRN-BILL-${bill.billNumber}`,
      date: bill.date,
      narration: `Bill recognized for ${bill.contactId}`,
      sourceDocumentType: "BILL",
      sourceDocumentId: bill.id,
      lines,
    });
  }

  // Ledger summary
  public getAccountBalance(accountId: string): AccountBalance {
    let totalDebit = 0;
    let totalCredit = 0;

    for (const journal of this.journals.values()) {
      for (const line of journal.lines) {
        if (line.accountId === accountId) {
          totalDebit += line.debit;
          totalCredit += line.credit;
        }
      }
    }

    return {
      accountId,
      totalDebit: Math.round(totalDebit * 10000) / 10000,
      totalCredit: Math.round(totalCredit * 10000) / 10000,
      netBalance: Math.round((totalDebit - totalCredit) * 10000) / 10000,
    };
  }
}
