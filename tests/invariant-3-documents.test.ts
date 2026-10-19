// Tests: Invariant 3 - Document Mutation Lifecycle & Lineage

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { DocumentLifecycleEngine } from "../src/core/documents/state-machine.ts";
import { QuoteStatus, InvoiceStatus, PurchaseOrderStatus, BillStatus } from "../src/types/index.ts";

describe("Invariant 3: Document State Machine & Referential Lineage", () => {
  const engine = new DocumentLifecycleEngine();
  const tenantId = "tenant_beta";

  test("quotes follow strict state progression: DRAFT -> SENT -> ACCEPTED -> CONVERTED_TO_INVOICE", () => {
    const quote = engine.createQuote({
      tenantId,
      contactId: "Raj Patel",
      quoteNumber: "QTE-1001",
      date: new Date(),
      expiryDate: new Date(Date.now() + 30 * 86400000),
      subtotal: 2000.0,
      taxTotal: 200.0,
      totalAmount: 2200.0,
      lines: [
        {
          id: "qline_1",
          itemCode: "CIVIL_FOUNDATION",
          description: "Excavation and foundation laying",
          quantity: 1,
          unitPrice: 2000.0,
          discount: 0,
          taxRate: 10,
          lineAmount: 2000.0,
        },
      ],
    });

    assert.equal(quote.status, QuoteStatus.DRAFT);

    // Cannot jump directly from DRAFT to ACCEPTED or CONVERTED
    assert.throws(
      () => engine.transitionQuote(quote.id, QuoteStatus.ACCEPTED),
      /INVARIANT_VIOLATION: Invalid Quote state transition from DRAFT to ACCEPTED/
    );

    // Step 1: Send Quote
    engine.transitionQuote(quote.id, QuoteStatus.SENT);
    assert.equal(quote.status, QuoteStatus.SENT);

    // Step 2: Client Accepts Quote
    engine.transitionQuote(quote.id, QuoteStatus.ACCEPTED);
    assert.equal(quote.status, QuoteStatus.ACCEPTED);

    // Step 3: Convert Accepted Quote to Invoice with Preserved Lineage
    const invoice = engine.convertQuoteToInvoice(quote.id, "INV-2026-Q1001", new Date(Date.now() + 14 * 86400000));

    // Invariant 3 Verification: Referential lineage preserved
    assert.equal(invoice.sourceQuoteId, quote.id);
    assert.equal(quote.status, QuoteStatus.CONVERTED_TO_INVOICE);
    assert.equal(quote.convertedToInvoiceId, invoice.id);

    // Verify itemized pricing structure preserved verbatim
    assert.equal(invoice.lines.length, 1);
    assert.equal(invoice.lines[0].itemCode, "CIVIL_FOUNDATION");
    assert.equal(invoice.lines[0].unitPrice, 2000.0);
    assert.equal(invoice.lines[0].taxRate, 10);
    assert.equal(invoice.lines[0].lineAmount, 2000.0);
    assert.equal(invoice.totalAmount, 2200.0);
  });

  test("cannot convert a draft or declined quote to invoice", () => {
    const draftQuote = engine.createQuote({
      tenantId,
      contactId: "Acme Corp",
      quoteNumber: "QTE-DRAFT-1",
      date: new Date(),
      expiryDate: new Date(),
      subtotal: 500,
      taxTotal: 50,
      totalAmount: 550,
      lines: [],
    });

    assert.throws(
      () => engine.convertQuoteToInvoice(draftQuote.id, "INV-ILLEGAL", new Date()),
      /INVARIANT_VIOLATION: Cannot convert quote to invoice.*Current status: DRAFT/
    );
  });

  test("purchase orders follow DRAFT -> APPROVED -> BILLED with preserved lineage", () => {
    const po = engine.createPurchaseOrder({
      tenantId,
      contactId: "Steel Supplier Inc",
      poNumber: "PO-7788",
      date: new Date(),
      subtotal: 4500.0,
      taxTotal: 450.0,
      totalAmount: 4950.0,
      lines: [
        {
          id: "poline_1",
          itemCode: "REBAR_STEEL",
          description: "High tensile steel rebar 12mm",
          quantity: 3,
          unitPrice: 1500.0,
          discount: 0,
          taxRate: 10,
          lineAmount: 4500.0,
        },
      ],
    });

    assert.equal(po.status, PurchaseOrderStatus.DRAFT);

    // Cannot convert draft PO to bill
    assert.throws(
      () => engine.convertPurchaseOrderToBill(po.id, "BILL-999", new Date()),
      /INVARIANT_VIOLATION: Cannot convert Purchase Order to Bill.*Current status: DRAFT/
    );

    // Approve PO
    engine.transitionPurchaseOrder(po.id, PurchaseOrderStatus.APPROVED);
    assert.equal(po.status, PurchaseOrderStatus.APPROVED);

    // Convert to Accounts Payable Bill
    const bill = engine.convertPurchaseOrderToBill(po.id, "BILL-SUPPLIER-7788", new Date(Date.now() + 30 * 86400000));

    // Invariant 3 Verification: Referential lineage preserved
    assert.equal(bill.sourcePurchaseOrderId, po.id);
    assert.equal(po.status, PurchaseOrderStatus.BILLED);
    assert.equal(po.convertedToBillId, bill.id);
    assert.equal(bill.lines[0].itemCode, "REBAR_STEEL");
    assert.equal(bill.totalAmount, 4950.0);
  });

  test("invoice payment lifecycle progresses AUTHORIZED -> PARTIALLY_PAID -> PAID", () => {
    const invoice = engine.createInvoice({
      tenantId,
      contactId: "Customer Y",
      invoiceNumber: "INV-PAY-01",
      date: new Date(),
      dueDate: new Date(),
      subtotal: 1000.0,
      taxTotal: 100.0,
      totalAmount: 1100.0,
      lines: [],
    });

    // Authorize invoice
    engine.transitionInvoice(invoice.id, InvoiceStatus.AUTHORIZED);
    assert.equal(invoice.status, InvoiceStatus.AUTHORIZED);
    assert.equal(invoice.amountDue, 1100.0);

    // Partial payment of $600
    engine.applyInvoicePayment(invoice.id, 600.0);
    assert.equal(invoice.status, InvoiceStatus.PARTIALLY_PAID);
    assert.equal(invoice.amountPaid, 600.0);
    assert.equal(invoice.amountDue, 500.0);

    // Final settlement of $500
    engine.applyInvoicePayment(invoice.id, 500.0);
    assert.equal(invoice.status, InvoiceStatus.PAID);
    assert.equal(invoice.amountDue, 0.0);

    // Overpayment rejection
    assert.throws(() => engine.applyInvoicePayment(invoice.id, 50.0), /INVARIANT_VIOLATION: Cannot apply payment/);
  });
});
