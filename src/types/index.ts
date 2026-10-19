// Core Domain Types & Invariant Contracts (Node strip-only mode compatible)

export type DecimalLike = number | string;

export const AccountType = {
  ASSET: "ASSET",
  LIABILITY: "LIABILITY",
  EQUITY: "EQUITY",
  REVENUE: "REVENUE",
  EXPENSE: "EXPENSE",
} as const;
export type AccountType = (typeof AccountType)[keyof typeof AccountType];

export interface JournalLineInput {
  accountId: string;
  description?: string;
  debit: number;
  credit: number;
}

export interface JournalEntryRecord {
  id: string;
  tenantId: string;
  entryNumber: string;
  date: Date;
  narration: string;
  sourceDocumentType?: string;
  sourceDocumentId?: string;
  isReversed: boolean;
  reversingJournalId?: string;
  lines: JournalLineInput[];
  createdAt: Date;
}

export const QuoteStatus = {
  DRAFT: "DRAFT",
  SENT: "SENT",
  ACCEPTED: "ACCEPTED",
  DECLINED: "DECLINED",
  CONVERTED_TO_INVOICE: "CONVERTED_TO_INVOICE",
} as const;
export type QuoteStatus = (typeof QuoteStatus)[keyof typeof QuoteStatus];

export const InvoiceStatus = {
  DRAFT: "DRAFT",
  AUTHORIZED: "AUTHORIZED",
  PARTIALLY_PAID: "PARTIALLY_PAID",
  PAID: "PAID",
  VOIDED: "VOIDED",
} as const;
export type InvoiceStatus = (typeof InvoiceStatus)[keyof typeof InvoiceStatus];

export const PurchaseOrderStatus = {
  DRAFT: "DRAFT",
  APPROVED: "APPROVED",
  BILLED: "BILLED",
} as const;
export type PurchaseOrderStatus = (typeof PurchaseOrderStatus)[keyof typeof PurchaseOrderStatus];

export const BillStatus = {
  DRAFT: "DRAFT",
  AUTHORIZED: "AUTHORIZED",
  PARTIALLY_PAID: "PARTIALLY_PAID",
  PAID: "PAID",
  VOIDED: "VOIDED",
} as const;
export type BillStatus = (typeof BillStatus)[keyof typeof BillStatus];

export interface DocumentLineItem {
  id: string;
  itemCode?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number; // percentage, e.g. 10 = 10%
  taxRate: number;  // percentage, e.g. 15 = 15%
  lineAmount: number;
  accountId?: string;
}

export interface QuoteEntity {
  id: string;
  tenantId: string;
  contactId: string;
  quoteNumber: string;
  date: Date;
  expiryDate: Date;
  status: QuoteStatus;
  subtotal: number;
  taxTotal: number;
  totalAmount: number;
  convertedToInvoiceId?: string;
  lines: DocumentLineItem[];
}

export interface InvoiceEntity {
  id: string;
  tenantId: string;
  contactId: string;
  invoiceNumber: string;
  date: Date;
  dueDate: Date;
  status: InvoiceStatus;
  subtotal: number;
  taxTotal: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  sourceQuoteId?: string;
  lines: DocumentLineItem[];
}

export interface PurchaseOrderEntity {
  id: string;
  tenantId: string;
  contactId: string;
  poNumber: string;
  date: Date;
  deliveryDate?: Date;
  status: PurchaseOrderStatus;
  subtotal: number;
  taxTotal: number;
  totalAmount: number;
  convertedToBillId?: string;
  lines: DocumentLineItem[];
}

export interface BillEntity {
  id: string;
  tenantId: string;
  contactId: string;
  billNumber: string;
  date: Date;
  dueDate: Date;
  status: BillStatus;
  subtotal: number;
  taxTotal: number;
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  sourcePurchaseOrderId?: string;
  lines: DocumentLineItem[];
}

// Invariant 4: Bank Reconciliation Types
export interface BankStatementLineItem {
  id: string;
  date: Date;
  narration: string;
  amount: number; // positive = Money In, negative = Money Out
  isReconciled: boolean;
}

export interface RuleCondition {
  field: "narration" | "amount";
  operator: "CONTAINS" | "EQUALS" | "STARTS_WITH" | "REGEX";
  value: string | number;
}

export interface BankRuleItem {
  id: string;
  ruleName: string;
  priority: number;
  targetType: "SPEND" | "RECEIVE";
  conditions: RuleCondition[];
  targetAccountId: string;
  targetContactId?: string;
  taxRate: number;
}

export const MatchStage = {
  RULE: "RULE",
  EXACT: "EXACT",
  HEURISTIC: "HEURISTIC",
  MANUAL: "MANUAL",
} as const;
export type MatchStage = (typeof MatchStage)[keyof typeof MatchStage];

export interface MatchResult {
  statementLineId: string;
  stage: MatchStage;
  confidenceScore: number; // 0.00 to 1.00
  matchedDocumentType?: "INVOICE" | "BILL" | "JOURNAL" | "RULE";
  matchedDocumentId?: string;
  targetAccountId?: string;
  targetContactId?: string;
  reason: string;
}

// Invariant 5: JAX Tool Calling & Streaming Contracts
export interface JaxToolCall {
  toolName: "lookup_item_prices" | "create_draft_invoice" | "draft_customer_email" | "authorize_invoice";
  parameters: Record<string, any>;
}

export interface JaxAuditRecord {
  id: string;
  tenantId: string;
  userId?: string;
  toolName: string;
  parameters: Record<string, any>;
  result: Record<string, any>;
  timestamp: Date;
}
