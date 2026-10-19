import crypto from "node:crypto";
import {
  QuoteStatus,
  TaxTreatment,
  InvoiceStatus,
  PurchaseOrderStatus,
} from "../../types/index.ts";
import type {
  QuoteEntity,
  DocumentLineItem,
  QuoteAttachment,
  QuoteHistoryItem,
  InvoiceEntity,
  PurchaseOrderEntity,
} from "../../types/index.ts";

export interface CreateQuoteInput {
  tenantId: string;
  contactId: string;
  quoteNumber?: string;
  reference?: string;
  title?: string;
  summary?: string;
  date?: Date;
  expiryDate?: Date;
  currency?: string;
  projectId?: string;
  taxTreatment?: TaxTreatment;
  terms?: string;
  lines: Array<{
    itemCode?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
    taxRate?: number;
    accountId?: string;
  }>;
  authorName?: string;
}

export class QuoteService {
  // In-memory tenant isolated store for quotes, invoices, and sequence counters
  private quotes: Map<string, QuoteEntity> = new Map();
  private invoices: Map<string, InvoiceEntity> = new Map();
  private purchaseOrders: Map<string, PurchaseOrderEntity> = new Map();
  private tenantQuoteCounters: Map<string, number> = new Map();

  /**
   * Generates the next sequential quote number for the tenant (e.g., QU-0001, QU-0002)
   */
  public generateNextQuoteNumber(tenantId: string, prefix = "QU-"): string {
    const current = this.tenantQuoteCounters.get(tenantId) || 0;
    const next = current + 1;
    this.tenantQuoteCounters.set(tenantId, next);
    return `${prefix}${String(next).padStart(4, "0")}`;
  }

  /**
   * Deterministically calculates line amounts, subtotal, taxTotal, and total
   * according to TaxTreatment (EXCLUSIVE, INCLUSIVE, NO_TAX)
   */
  public calculateQuoteTotals(
    lines: Array<{
      quantity: number;
      unitPrice: number;
      discount?: number;
      taxRate?: number;
    }>,
    taxTreatment: TaxTreatment = TaxTreatment.EXCLUSIVE
  ): {
    calculatedLines: Array<{ lineAmount: number; taxAmount: number }>;
    subtotal: number;
    taxTotal: number;
    totalAmount: number;
  } {
    let subtotal = 0;
    let taxTotal = 0;
    let totalAmount = 0;

    const calculatedLines = lines.map((line) => {
      const qty = Number(line.quantity) || 0;
      const price = Number(line.unitPrice) || 0;
      const discPercent = Number(line.discount) || 0;
      const taxRate = Number(line.taxRate) || 0;

      // Base gross line before tax adjustment
      const undiscounted = qty * price;
      const discounted = undiscounted * (1 - discPercent / 100);

      let lineAmount = 0;
      let taxAmount = 0;

      if (taxTreatment === TaxTreatment.EXCLUSIVE) {
        // Line amount is net of tax; tax is added on top
        lineAmount = Math.round(discounted * 100) / 100;
        taxAmount = Math.round(lineAmount * (taxRate / 100) * 100) / 100;
        subtotal += lineAmount;
        taxTotal += taxAmount;
      } else if (taxTreatment === TaxTreatment.INCLUSIVE) {
        // Line amount contains tax; tax must be backed out
        const gross = Math.round(discounted * 100) / 100;
        taxAmount = taxRate > 0 ? Math.round((gross * (taxRate / (100 + taxRate))) * 100) / 100 : 0;
        lineAmount = Math.round((gross - taxAmount) * 100) / 100;
        subtotal += lineAmount;
        taxTotal += taxAmount;
      } else {
        // NO_TAX
        lineAmount = Math.round(discounted * 100) / 100;
        taxAmount = 0;
        subtotal += lineAmount;
      }

      return { lineAmount, taxAmount };
    });

    if (taxTreatment === TaxTreatment.EXCLUSIVE) {
      totalAmount = Math.round((subtotal + taxTotal) * 100) / 100;
    } else if (taxTreatment === TaxTreatment.INCLUSIVE) {
      totalAmount = Math.round((subtotal + taxTotal) * 100) / 100;
    } else {
      totalAmount = Math.round(subtotal * 100) / 100;
    }

    return {
      calculatedLines,
      subtotal: Math.round(subtotal * 100) / 100,
      taxTotal: Math.round(taxTotal * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
    };
  }

  /**
   * Creates a new Quote in DRAFT status with initial history log
   */
  public createQuote(input: CreateQuoteInput): QuoteEntity {
    const id = crypto.randomUUID();
    const issueDate = input.date || new Date();
    const expiryDate =
      input.expiryDate || new Date(issueDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const quoteNumber =
      input.quoteNumber || this.generateNextQuoteNumber(input.tenantId);
    const taxTreatment = input.taxTreatment || TaxTreatment.EXCLUSIVE;

    const totals = this.calculateQuoteTotals(input.lines, taxTreatment);

    const lines: DocumentLineItem[] = input.lines.map((l, idx) => ({
      id: crypto.randomUUID(),
      itemCode: l.itemCode,
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      discount: l.discount || 0,
      taxRate: l.taxRate || 0,
      lineAmount: totals.calculatedLines[idx]?.lineAmount ?? 0,
      accountId: l.accountId,
    }));

    const author = input.authorName || "System";
    const initialHistory: QuoteHistoryItem[] = [
      {
        id: crypto.randomUUID(),
        timestamp: new Date(),
        user: author,
        action: "Created",
        detail: `Quote ${quoteNumber} created with total ${input.currency || "AUD"} ${totals.totalAmount.toFixed(2)}`,
      },
    ];

    const quote: QuoteEntity = {
      id,
      tenantId: input.tenantId,
      contactId: input.contactId,
      quoteNumber,
      reference: input.reference,
      title: input.title,
      summary: input.summary,
      date: issueDate,
      expiryDate,
      currency: input.currency || "AUD",
      projectId: input.projectId,
      taxTreatment,
      status: QuoteStatus.DRAFT,
      terms: input.terms || "Standard 30-day payment terms apply.",
      subtotal: totals.subtotal,
      taxTotal: totals.taxTotal,
      totalAmount: totals.totalAmount,
      lines,
      attachments: [],
      history: initialHistory,
    };

    this.quotes.set(id, quote);
    return quote;
  }

  /**
   * Retrieves a quote by ID with strict tenant isolation
   */
  public getQuoteById(tenantId: string, quoteId: string): QuoteEntity | null {
    const quote = this.quotes.get(quoteId);
    if (!quote || quote.tenantId !== tenantId) {
      return null;
    }
    return quote;
  }

  /**
   * Lists all quotes for a tenant with optional status filtering and search
   */
  public listQuotes(
    tenantId: string,
    filter?: {
      status?: QuoteStatus | "ALL";
      search?: string;
    }
  ): {
    quotes: QuoteEntity[];
    counts: Record<string, number>;
  } {
    const allTenantQuotes = Array.from(this.quotes.values()).filter(
      (q) => q.tenantId === tenantId
    );

    // Compute status tab counts
    const counts: Record<string, number> = {
      ALL: allTenantQuotes.length,
      [QuoteStatus.DRAFT]: 0,
      [QuoteStatus.SENT]: 0,
      [QuoteStatus.ACCEPTED]: 0,
      [QuoteStatus.DECLINED]: 0,
      [QuoteStatus.CONVERTED_TO_INVOICE]: 0,
    };

    for (const q of allTenantQuotes) {
      if (counts[q.status] !== undefined) {
        counts[q.status]++;
      }
    }

    let result = allTenantQuotes;

    if (filter?.status && filter.status !== "ALL") {
      result = result.filter((q) => q.status === filter.status);
    }

    if (filter?.search) {
      const qLower = filter.search.toLowerCase().trim();
      result = result.filter(
        (q) =>
          q.quoteNumber.toLowerCase().includes(qLower) ||
          (q.reference && q.reference.toLowerCase().includes(qLower)) ||
          (q.title && q.title.toLowerCase().includes(qLower))
      );
    }

    // Sort descending by date
    result.sort((a, b) => b.date.getTime() - a.date.getTime());

    return { quotes: result, counts };
  }

  /**
   * Updates an existing quote
   */
  public updateQuote(
    tenantId: string,
    quoteId: string,
    updates: Partial<CreateQuoteInput>,
    authorName = "System"
  ): QuoteEntity {
    const existing = this.getQuoteById(tenantId, quoteId);
    if (!existing) {
      throw new Error(`Quote not found: ${quoteId}`);
    }

    if (
      existing.status === QuoteStatus.CONVERTED_TO_INVOICE ||
      existing.status === QuoteStatus.ACCEPTED
    ) {
      throw new Error(`Cannot modify quote in status ${existing.status}`);
    }

    const taxTreatment = updates.taxTreatment || existing.taxTreatment || TaxTreatment.EXCLUSIVE;
    const linesToCalculate = updates.lines || existing.lines;
    const totals = this.calculateQuoteTotals(linesToCalculate, taxTreatment);

    const updatedLines: DocumentLineItem[] = linesToCalculate.map((l, idx) => ({
      id: (l as any).id || crypto.randomUUID(),
      itemCode: l.itemCode,
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      discount: l.discount || 0,
      taxRate: l.taxRate || 0,
      lineAmount: totals.calculatedLines[idx]?.lineAmount ?? 0,
      accountId: l.accountId,
    }));

    const historyEntry: QuoteHistoryItem = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      user: authorName,
      action: "Edited",
      detail: `Quote updated. New total: ${existing.currency || "AUD"} ${totals.totalAmount.toFixed(2)}`,
    };

    const updated: QuoteEntity = {
      ...existing,
      reference: updates.reference !== undefined ? updates.reference : existing.reference,
      title: updates.title !== undefined ? updates.title : existing.title,
      summary: updates.summary !== undefined ? updates.summary : existing.summary,
      date: updates.date || existing.date,
      expiryDate: updates.expiryDate || existing.expiryDate,
      currency: updates.currency || existing.currency,
      projectId: updates.projectId !== undefined ? updates.projectId : existing.projectId,
      taxTreatment,
      terms: updates.terms !== undefined ? updates.terms : existing.terms,
      subtotal: totals.subtotal,
      taxTotal: totals.taxTotal,
      totalAmount: totals.totalAmount,
      lines: updatedLines,
      history: [...(existing.history || []), historyEntry],
    };

    this.quotes.set(quoteId, updated);
    return updated;
  }

  /**
   * Transitions quote to SENT status
   */
  public sendQuote(
    tenantId: string,
    quoteId: string,
    options: { markOnly?: boolean; emailRecipient?: string; authorName?: string } = {}
  ): QuoteEntity {
    const quote = this.getQuoteById(tenantId, quoteId);
    if (!quote) throw new Error("Quote not found");

    if (quote.status === QuoteStatus.CONVERTED_TO_INVOICE) {
      throw new Error("Cannot send an already invoiced quote");
    }

    const author = options.authorName || "System";
    const detail = options.markOnly
      ? `Quote marked as sent by ${author}`
      : `Quote sent via email to ${options.emailRecipient || "client"}`;

    const updated: QuoteEntity = {
      ...quote,
      status: QuoteStatus.SENT,
      history: [
        ...(quote.history || []),
        {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          user: author,
          action: "Sent",
          detail,
        },
      ],
    };

    this.quotes.set(quoteId, updated);
    return updated;
  }

  /**
   * Transitions quote to ACCEPTED status
   */
  public acceptQuote(
    tenantId: string,
    quoteId: string,
    options: { source?: "CLIENT_PORTAL" | "MANUAL"; note?: string; authorName?: string } = {}
  ): QuoteEntity {
    const quote = this.getQuoteById(tenantId, quoteId);
    if (!quote) throw new Error("Quote not found");

    if (quote.status === QuoteStatus.CONVERTED_TO_INVOICE) {
      throw new Error("Quote is already converted to invoice");
    }

    const author = options.authorName || (options.source === "CLIENT_PORTAL" ? "Client Portal" : "System");
    const detail = options.note
      ? `Accepted: ${options.note}`
      : options.source === "CLIENT_PORTAL"
      ? "Accepted online by customer"
      : "Marked as accepted manually";

    const updated: QuoteEntity = {
      ...quote,
      status: QuoteStatus.ACCEPTED,
      history: [
        ...(quote.history || []),
        {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          user: author,
          action: "Accepted",
          detail,
        },
      ],
    };

    this.quotes.set(quoteId, updated);
    return updated;
  }

  /**
   * Transitions quote to DECLINED status
   */
  public declineQuote(
    tenantId: string,
    quoteId: string,
    options: { reason?: string; authorName?: string } = {}
  ): QuoteEntity {
    const quote = this.getQuoteById(tenantId, quoteId);
    if (!quote) throw new Error("Quote not found");

    const author = options.authorName || "System";
    const detail = options.reason ? `Declined: ${options.reason}` : "Marked as declined";

    const updated: QuoteEntity = {
      ...quote,
      status: QuoteStatus.DECLINED,
      history: [
        ...(quote.history || []),
        {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          user: author,
          action: "Declined",
          detail,
        },
      ],
    };

    this.quotes.set(quoteId, updated);
    return updated;
  }

  /**
   * Invariant 3: Transactional Quote -> Invoice conversion preserving full referential lineage
   */
  public convertToInvoice(
    tenantId: string,
    quoteId: string,
    authorName = "System"
  ): { quote: QuoteEntity; invoice: InvoiceEntity } {
    const quote = this.getQuoteById(tenantId, quoteId);
    if (!quote) {
      throw new Error(`Quote not found: ${quoteId}`);
    }

    if (quote.status !== QuoteStatus.ACCEPTED && quote.status !== QuoteStatus.SENT) {
      throw new Error(
        `Invariant 3 Violation: Cannot convert quote in status ${quote.status} to invoice. Must be ACCEPTED or SENT.`
      );
    }

    const invoiceId = crypto.randomUUID();
    const invoiceNumber = `INV-${quote.quoteNumber.replace(/^QU-/, "")}`;
    const today = new Date();
    const dueDate = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000); // 14-day default

    // Clone line items preserving item codes, descriptions, prices, discounts, and accounts
    const invoiceLines: DocumentLineItem[] = quote.lines.map((l) => ({
      id: crypto.randomUUID(),
      itemCode: l.itemCode,
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      discount: l.discount,
      taxRate: l.taxRate,
      lineAmount: l.lineAmount,
      accountId: l.accountId || "200", // Default Sales account
    }));

    const invoice: InvoiceEntity = {
      id: invoiceId,
      tenantId: quote.tenantId,
      contactId: quote.contactId,
      invoiceNumber,
      date: today,
      dueDate,
      status: InvoiceStatus.DRAFT,
      subtotal: quote.subtotal,
      taxTotal: quote.taxTotal,
      totalAmount: quote.totalAmount,
      amountPaid: 0,
      amountDue: quote.totalAmount,
      sourceQuoteId: quote.id, // Invariant 3 referential lineage!
      lines: invoiceLines,
    };

    this.invoices.set(invoiceId, invoice);

    // Update Quote status and link to created invoice
    const updatedQuote: QuoteEntity = {
      ...quote,
      status: QuoteStatus.CONVERTED_TO_INVOICE,
      convertedToInvoiceId: invoiceId,
      history: [
        ...(quote.history || []),
        {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          user: authorName,
          action: "Invoiced",
          detail: `Converted to invoice ${invoiceNumber} (ID: ${invoiceId})`,
        },
      ],
    };

    this.quotes.set(quoteId, updatedQuote);
    return { quote: updatedQuote, invoice };
  }

  /**
   * Invariant 3: Copy Quote to Purchase Order
   */
  public copyToPurchaseOrder(
    tenantId: string,
    quoteId: string,
    supplierContactId: string
  ): PurchaseOrderEntity {
    const quote = this.getQuoteById(tenantId, quoteId);
    if (!quote) throw new Error("Quote not found");

    const poId = crypto.randomUUID();
    const poNumber = `PO-${quote.quoteNumber.replace(/^QU-/, "")}`;
    const today = new Date();

    const poLines: DocumentLineItem[] = quote.lines.map((l) => ({
      id: crypto.randomUUID(),
      itemCode: l.itemCode,
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      discount: l.discount,
      taxRate: l.taxRate,
      lineAmount: l.lineAmount,
    }));

    const po: PurchaseOrderEntity = {
      id: poId,
      tenantId: quote.tenantId,
      contactId: supplierContactId,
      poNumber,
      date: today,
      status: PurchaseOrderStatus.DRAFT,
      subtotal: quote.subtotal,
      taxTotal: quote.taxTotal,
      totalAmount: quote.totalAmount,
      lines: poLines,
    };

    this.purchaseOrders.set(poId, po);
    return po;
  }

  /**
   * Adds an internal note to the quote's History and Notes timeline
   */
  public addNote(
    tenantId: string,
    quoteId: string,
    noteText: string,
    authorName: string
  ): QuoteHistoryItem {
    const quote = this.getQuoteById(tenantId, quoteId);
    if (!quote) throw new Error("Quote not found");

    const noteItem: QuoteHistoryItem = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      user: authorName,
      action: "Note Added",
      detail: noteText,
      isNote: true,
    };

    quote.history = [...(quote.history || []), noteItem];
    this.quotes.set(quoteId, quote);
    return noteItem;
  }

  /**
   * Adds an uploaded file attachment to the quote
   */
  public addAttachment(
    tenantId: string,
    quoteId: string,
    attachment: Omit<QuoteAttachment, "id" | "uploadedAt">
  ): QuoteAttachment {
    const quote = this.getQuoteById(tenantId, quoteId);
    if (!quote) throw new Error("Quote not found");

    const newAttachment: QuoteAttachment = {
      id: crypto.randomUUID(),
      ...attachment,
      uploadedAt: new Date(),
    };

    quote.attachments = [...(quote.attachments || []), newAttachment];
    this.quotes.set(quoteId, quote);
    return newAttachment;
  }
}
