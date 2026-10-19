import test from "node:test";
import assert from "node:assert/strict";
import { QuoteService } from "../src/core/quotes/quote-service.ts";
import { QuoteStatus, TaxTreatment, InvoiceStatus } from "../src/types/index.ts";

test("QuoteService: Quote Creation & Tax Treatment Calculations", async (t) => {
  const quoteService = new QuoteService();
  const tenantId = "tenant-test-1";

  await t.test("Tax Exclusive: subtotal = net, tax is added on top", () => {
    const lines = [
      { quantity: 2, unitPrice: 100, discount: 10, taxRate: 10 }, // 200 * 0.9 = 180 net; tax = 18
      { quantity: 1, unitPrice: 50, discount: 0, taxRate: 10 },   // 50 net; tax = 5
    ];
    const totals = quoteService.calculateQuoteTotals(lines, TaxTreatment.EXCLUSIVE);
    assert.equal(totals.subtotal, 230);
    assert.equal(totals.taxTotal, 23);
    assert.equal(totals.totalAmount, 253);
  });

  await t.test("Tax Inclusive: gross line amount includes tax, backed out", () => {
    const lines = [
      { quantity: 1, unitPrice: 110, discount: 0, taxRate: 10 }, // 110 gross; tax = 10; net = 100
    ];
    const totals = quoteService.calculateQuoteTotals(lines, TaxTreatment.INCLUSIVE);
    assert.equal(totals.subtotal, 100);
    assert.equal(totals.taxTotal, 10);
    assert.equal(totals.totalAmount, 110);
  });

  await t.test("No Tax: taxTotal is 0", () => {
    const lines = [
      { quantity: 3, unitPrice: 40, discount: 0, taxRate: 15 },
    ];
    const totals = quoteService.calculateQuoteTotals(lines, TaxTreatment.NO_TAX);
    assert.equal(totals.subtotal, 120);
    assert.equal(totals.taxTotal, 0);
    assert.equal(totals.totalAmount, 120);
  });

  await t.test("Sequential Quote Number Generation (QU-0001, QU-0002)", () => {
    const q1 = quoteService.createQuote({
      tenantId,
      contactId: "contact-1",
      lines: [{ description: "Work 1", quantity: 1, unitPrice: 100 }],
    });
    assert.equal(q1.quoteNumber, "QU-0001");

    const q2 = quoteService.createQuote({
      tenantId,
      contactId: "contact-2",
      lines: [{ description: "Work 2", quantity: 2, unitPrice: 50 }],
    });
    assert.equal(q2.quoteNumber, "QU-0002");
  });
});

test("QuoteService: Lifecycle State Transitions & Lineage Preservation", async (t) => {
  const quoteService = new QuoteService();
  const tenantId = "tenant-test-2";

  const quote = quoteService.createQuote({
    tenantId,
    contactId: "contact-smith",
    reference: "REF-100",
    title: "Bathroom Renovation",
    summary: "Complete demo and tile installation",
    lines: [
      { description: "Tiles", quantity: 10, unitPrice: 45, taxRate: 10 },
      { description: "Labor", quantity: 20, unitPrice: 85, taxRate: 10 },
    ],
  });

  assert.equal(quote.status, QuoteStatus.DRAFT);
  assert.equal(quote.history?.length, 1);
  assert.equal(quote.history[0].action, "Created");

  await t.test("Send Quote transitions to SENT", () => {
    const sent = quoteService.sendQuote(tenantId, quote.id, {
      emailRecipient: "client@smith.com",
    });
    assert.equal(sent.status, QuoteStatus.SENT);
    assert.equal(sent.history?.length, 2);
    assert.equal(sent.history[1].action, "Sent");
  });

  await t.test("Accept Quote transitions to ACCEPTED", () => {
    const accepted = quoteService.acceptQuote(tenantId, quote.id, {
      source: "CLIENT_PORTAL",
      note: "Looks good, proceed please",
    });
    assert.equal(accepted.status, QuoteStatus.ACCEPTED);
    assert.equal(accepted.history?.length, 3);
    assert.equal(accepted.history[2].action, "Accepted");
  });

  await t.test("Transactional Conversion to Invoice (Invariant 3)", () => {
    const { quote: invoicedQuote, invoice } = quoteService.convertToInvoice(
      tenantId,
      quote.id,
      "Accountant Sam"
    );

    assert.equal(invoicedQuote.status, QuoteStatus.CONVERTED_TO_INVOICE);
    assert.equal(invoicedQuote.convertedToInvoiceId, invoice.id);
    assert.equal(invoice.sourceQuoteId, quote.id); // Referential Lineage!
    assert.equal(invoice.status, InvoiceStatus.DRAFT);
    assert.equal(invoice.lines.length, 2);
    assert.equal(invoice.totalAmount, quote.totalAmount);
    assert.equal(invoice.contactId, quote.contactId);
  });

  await t.test("Cannot convert already invoiced quote again", () => {
    assert.throws(
      () => quoteService.convertToInvoice(tenantId, quote.id),
      /Invariant 3 Violation/
    );
  });

  await t.test("Adding Internal Team Note to History", () => {
    const note = quoteService.addNote(
      tenantId,
      quote.id,
      "Spoke to client regarding scheduling next Monday.",
      "Project Manager"
    );
    assert.equal(note.isNote, true);
    assert.equal(note.user, "Project Manager");

    const fetched = quoteService.getQuoteById(tenantId, quote.id);
    assert.equal(fetched?.history?.some((h) => h.id === note.id), true);
  });
});
