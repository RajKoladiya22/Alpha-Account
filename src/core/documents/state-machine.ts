// Invariant 3: Document Mutation Lifecycle & Referential Lineage Engine

import {
  QuoteStatus,
  InvoiceStatus,
  PurchaseOrderStatus,
  BillStatus,
} from "../../types/index.ts";
import type {
  QuoteEntity,
  InvoiceEntity,
  PurchaseOrderEntity,
  BillEntity,
  DocumentLineItem,
} from "../../types/index.ts";
import crypto from "node:crypto";

export class DocumentLifecycleEngine {
  private quotes = new Map<string, QuoteEntity>();
  private invoices = new Map<string, InvoiceEntity>();
  private purchaseOrders = new Map<string, PurchaseOrderEntity>();
  private bills = new Map<string, BillEntity>();

  // ==========================================
  // QUOTES LIFECYCLE
  // ==========================================

  public createQuote(quote: Omit<QuoteEntity, "id" | "status" | "convertedToInvoiceId">): QuoteEntity {
    const id = `qte_${crypto.randomUUID()}`;
    const entity: QuoteEntity = {
      ...quote,
      id,
      status: QuoteStatus.DRAFT,
      lines: quote.lines.map((l) => ({ ...l })),
    };
    this.quotes.set(id, entity);
    return entity;
  }

  public getQuote(id: string): QuoteEntity | undefined {
    return this.quotes.get(id);
  }

  public transitionQuote(quoteId: string, targetStatus: QuoteStatus): QuoteEntity {
    const quote = this.quotes.get(quoteId);
    if (!quote) throw new Error(`Quote ${quoteId} not found.`);

    const current = quote.status;

    // Invariant 3: Deterministic transitions: DRAFT -> SENT -> ACCEPTED / DECLINED -> CONVERTED_TO_INVOICE
    const allowedTransitions: Record<QuoteStatus, QuoteStatus[]> = {
      [QuoteStatus.DRAFT]: [QuoteStatus.SENT],
      [QuoteStatus.SENT]: [QuoteStatus.ACCEPTED, QuoteStatus.DECLINED],
      [QuoteStatus.ACCEPTED]: [QuoteStatus.CONVERTED_TO_INVOICE],
      [QuoteStatus.DECLINED]: [QuoteStatus.DRAFT], // allow revising
      [QuoteStatus.CONVERTED_TO_INVOICE]: [], // Terminal state
    };

    if (!allowedTransitions[current].includes(targetStatus)) {
      throw new Error(
        `INVARIANT_VIOLATION: Invalid Quote state transition from ${current} to ${targetStatus}. Allowed: [${allowedTransitions[current].join(", ")}]`
      );
    }

    quote.status = targetStatus;
    return quote;
  }

  // Invariant 3: Convert accepted quote into invoice with preserved referential lineage and pricing
  public convertQuoteToInvoice(quoteId: string, invoiceNumber: string, dueDate: Date): InvoiceEntity {
    const quote = this.quotes.get(quoteId);
    if (!quote) throw new Error(`Quote ${quoteId} not found.`);

    if (quote.status !== QuoteStatus.ACCEPTED) {
      throw new Error(
        `INVARIANT_VIOLATION: Cannot convert quote to invoice. Quote must be in ACCEPTED status (Current status: ${quote.status}).`
      );
    }

    const invoiceId = `inv_${crypto.randomUUID()}`;

    // Line items preserved verbatim (item code, description, quantity, price, tax, discount)
    const clonedLines: DocumentLineItem[] = quote.lines.map((l) => ({
      ...l,
      id: `inv_line_${crypto.randomUUID()}`,
    }));

    const invoice: InvoiceEntity = {
      id: invoiceId,
      tenantId: quote.tenantId,
      contactId: quote.contactId,
      invoiceNumber,
      date: new Date(),
      dueDate,
      status: InvoiceStatus.DRAFT,
      subtotal: quote.subtotal,
      taxTotal: quote.taxTotal,
      totalAmount: quote.totalAmount,
      amountPaid: 0,
      amountDue: quote.totalAmount,
      sourceQuoteId: quoteId, // Referential Lineage preserved
      lines: clonedLines,
    };

    // Transition quote to CONVERTED_TO_INVOICE and link
    quote.status = QuoteStatus.CONVERTED_TO_INVOICE;
    quote.convertedToInvoiceId = invoiceId;

    this.invoices.set(invoiceId, invoice);
    return invoice;
  }

  // ==========================================
  // INVOICES LIFECYCLE
  // ==========================================

  public createInvoice(invoice: Omit<InvoiceEntity, "id" | "status" | "amountPaid" | "amountDue">): InvoiceEntity {
    const id = `inv_${crypto.randomUUID()}`;
    const entity: InvoiceEntity = {
      ...invoice,
      id,
      status: InvoiceStatus.DRAFT,
      amountPaid: 0,
      amountDue: invoice.totalAmount,
      lines: invoice.lines.map((l) => ({ ...l })),
    };
    this.invoices.set(id, entity);
    return entity;
  }

  public getInvoice(id: string): InvoiceEntity | undefined {
    return this.invoices.get(id);
  }

  public transitionInvoice(invoiceId: string, targetStatus: InvoiceStatus): InvoiceEntity {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) throw new Error(`Invoice ${invoiceId} not found.`);

    const current = invoice.status;

    // Invariant 3: DRAFT -> AUTHORIZED -> PARTIALLY_PAID -> PAID -> VOIDED
    const allowedTransitions: Record<InvoiceStatus, InvoiceStatus[]> = {
      [InvoiceStatus.DRAFT]: [InvoiceStatus.AUTHORIZED, InvoiceStatus.VOIDED],
      [InvoiceStatus.AUTHORIZED]: [InvoiceStatus.PARTIALLY_PAID, InvoiceStatus.PAID, InvoiceStatus.VOIDED],
      [InvoiceStatus.PARTIALLY_PAID]: [InvoiceStatus.PAID, InvoiceStatus.VOIDED],
      [InvoiceStatus.PAID]: [], // Terminal: must be settled via credit note or reversing journal
      [InvoiceStatus.VOIDED]: [], // Terminal
    };

    if (!allowedTransitions[current].includes(targetStatus)) {
      throw new Error(
        `INVARIANT_VIOLATION: Invalid Invoice state transition from ${current} to ${targetStatus}. Allowed: [${allowedTransitions[current].join(", ")}]`
      );
    }

    invoice.status = targetStatus;
    return invoice;
  }

  public applyInvoicePayment(invoiceId: string, paymentAmount: number): InvoiceEntity {
    const invoice = this.invoices.get(invoiceId);
    if (!invoice) throw new Error(`Invoice ${invoiceId} not found.`);

    if (invoice.status !== InvoiceStatus.AUTHORIZED && invoice.status !== InvoiceStatus.PARTIALLY_PAID) {
      throw new Error(`INVARIANT_VIOLATION: Cannot apply payment to invoice in status ${invoice.status}.`);
    }

    if (paymentAmount <= 0) {
      throw new Error("Payment amount must be greater than zero.");
    }

    if (paymentAmount > invoice.amountDue) {
      throw new Error(`Payment amount ($${paymentAmount}) exceeds outstanding balance ($${invoice.amountDue}).`);
    }

    invoice.amountPaid += paymentAmount;
    invoice.amountDue = Math.round((invoice.totalAmount - invoice.amountPaid) * 10000) / 10000;

    if (invoice.amountDue <= 0.0001) {
      invoice.status = InvoiceStatus.PAID;
      invoice.amountDue = 0;
    } else {
      invoice.status = InvoiceStatus.PARTIALLY_PAID;
    }

    return invoice;
  }

  // ==========================================
  // PURCHASE ORDERS LIFECYCLE
  // ==========================================

  public createPurchaseOrder(po: Omit<PurchaseOrderEntity, "id" | "status" | "convertedToBillId">): PurchaseOrderEntity {
    const id = `po_${crypto.randomUUID()}`;
    const entity: PurchaseOrderEntity = {
      ...po,
      id,
      status: PurchaseOrderStatus.DRAFT,
      lines: po.lines.map((l) => ({ ...l })),
    };
    this.purchaseOrders.set(id, entity);
    return entity;
  }

  public getPurchaseOrder(id: string): PurchaseOrderEntity | undefined {
    return this.purchaseOrders.get(id);
  }

  public transitionPurchaseOrder(poId: string, targetStatus: PurchaseOrderStatus): PurchaseOrderEntity {
    const po = this.purchaseOrders.get(poId);
    if (!po) throw new Error(`Purchase order ${poId} not found.`);

    const current = po.status;

    // Invariant 3: DRAFT -> APPROVED -> BILLED
    const allowedTransitions: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> = {
      [PurchaseOrderStatus.DRAFT]: [PurchaseOrderStatus.APPROVED],
      [PurchaseOrderStatus.APPROVED]: [PurchaseOrderStatus.BILLED],
      [PurchaseOrderStatus.BILLED]: [], // Terminal
    };

    if (!allowedTransitions[current].includes(targetStatus)) {
      throw new Error(
        `INVARIANT_VIOLATION: Invalid Purchase Order state transition from ${current} to ${targetStatus}. Allowed: [${allowedTransitions[current].join(", ")}]`
      );
    }

    po.status = targetStatus;
    return po;
  }

  // Invariant 3: Convert approved PO to Bill preserving referential lineage and pricing
  public convertPurchaseOrderToBill(poId: string, billNumber: string, dueDate: Date): BillEntity {
    const po = this.purchaseOrders.get(poId);
    if (!po) throw new Error(`Purchase order ${poId} not found.`);

    if (po.status !== PurchaseOrderStatus.APPROVED) {
      throw new Error(
        `INVARIANT_VIOLATION: Cannot convert Purchase Order to Bill. PO must be in APPROVED status (Current status: ${po.status}).`
      );
    }

    const billId = `bill_${crypto.randomUUID()}`;

    const clonedLines: DocumentLineItem[] = po.lines.map((l) => ({
      ...l,
      id: `bill_line_${crypto.randomUUID()}`,
    }));

    const bill: BillEntity = {
      id: billId,
      tenantId: po.tenantId,
      contactId: po.contactId,
      billNumber,
      date: new Date(),
      dueDate,
      status: BillStatus.DRAFT,
      subtotal: po.subtotal,
      taxTotal: po.taxTotal,
      totalAmount: po.totalAmount,
      amountPaid: 0,
      amountDue: po.totalAmount,
      sourcePurchaseOrderId: poId, // Lineage preserved
      lines: clonedLines,
    };

    po.status = PurchaseOrderStatus.BILLED;
    po.convertedToBillId = billId;

    this.bills.set(billId, bill);
    return bill;
  }

  public getBill(id: string): BillEntity | undefined {
    return this.bills.get(id);
  }

  public transitionBill(billId: string, targetStatus: BillStatus): BillEntity {
    const bill = this.bills.get(billId);
    if (!bill) throw new Error(`Bill ${billId} not found.`);

    const current = bill.status;

    const allowedTransitions: Record<BillStatus, BillStatus[]> = {
      [BillStatus.DRAFT]: [BillStatus.AUTHORIZED, BillStatus.VOIDED],
      [BillStatus.AUTHORIZED]: [BillStatus.PARTIALLY_PAID, BillStatus.PAID, BillStatus.VOIDED],
      [BillStatus.PARTIALLY_PAID]: [BillStatus.PAID, BillStatus.VOIDED],
      [BillStatus.PAID]: [],
      [BillStatus.VOIDED]: [],
    };

    if (!allowedTransitions[current].includes(targetStatus)) {
      throw new Error(
        `INVARIANT_VIOLATION: Invalid Bill state transition from ${current} to ${targetStatus}. Allowed: [${allowedTransitions[current].join(", ")}]`
      );
    }

    bill.status = targetStatus;
    return bill;
  }
}
