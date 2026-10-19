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

export const TaxTreatment = {
  EXCLUSIVE: "EXCLUSIVE",
  INCLUSIVE: "INCLUSIVE",
  NO_TAX: "NO_TAX",
} as const;
export type TaxTreatment = (typeof TaxTreatment)[keyof typeof TaxTreatment];

export interface QuoteAttachment {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
  url: string;
}

export interface QuoteHistoryItem {
  id: string;
  timestamp: Date;
  user: string;
  action: string;
  detail: string;
  isNote?: boolean;
}

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
  reference?: string;
  title?: string;
  summary?: string;
  date: Date;
  expiryDate: Date;
  currency?: string;
  projectId?: string;
  taxTreatment?: TaxTreatment;
  status: QuoteStatus;
  terms?: string;
  subtotal: number;
  taxTotal: number;
  totalAmount: number;
  convertedToInvoiceId?: string;
  lines: DocumentLineItem[];
  attachments?: QuoteAttachment[];
  history?: QuoteHistoryItem[];
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


// Contacts & Customers
export interface ContactAddress {
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface PrimaryPerson {
  firstName: string;
  lastName: string;
  email: string;
}

export interface ContactEntity {
  id: string;
  tenantId: string;
  name: string;
  accountNumber?: string;
  primaryPerson?: PrimaryPerson;
  email?: string;
  phone?: string;
  address?: ContactAddress;
  postalAddress?: ContactAddress;
  isCustomer: boolean;
  isSupplier: boolean;
  taxNumber?: string;
  youOwe: number;
  theyOwe: number;
  isOverdue?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Tenancy & RBAC
export const UserRole = {
  OWNER: "OWNER",
  ADVISER: "ADVISER",
  STANDARD: "STANDARD",
  READONLY: "READONLY",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export interface OrganizationEntity {
  id: string;
  name: string;
  subdomain: string;
  currency: string;
  legalTradingName?: string;
  registrationNumber?: string;
  organizationType?: string;
  createdAt: Date;
}

export interface TenantSettings {
  tenantId: string;
  financialYearEndMonth: number; // e.g. 6 for June 30
  taxBasis: "ACCRUAL" | "CASH";
  defaultQuoteExpiryDays: number; // default 30
  quoteNumberPrefix: string; // default "QU-"
  quoteDefaultTerms?: string;
  currency: string;
}

// Client Portal Signed Token
export interface PortalTokenPayload {
  tenantId: string;
  quoteId: string;
  issuedAt: number;
  expiresAt: number;
}

