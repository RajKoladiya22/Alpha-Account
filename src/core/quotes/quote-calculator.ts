/**
 * Authoritative financial calculation engine for Alpha Steel Frames.
 * All financial math is executed in integer cents (or rounded decimal cents)
 * to avoid IEEE 754 floating-point inaccuracies.
 */

export type TaxTreatmentType = "EXCLUSIVE" | "INCLUSIVE" | "NO_TAX";

export interface LineItemInput {
  id?: string;
  itemCode?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number; // 0 - 100 percentage
  taxRate?: number; // e.g., 10 for 10% Australian GST
  accountId?: string;
}

export interface CalculatedLineItem {
  id?: string;
  itemCode?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  taxRate: number;
  grossAmount: number; // Qty * UnitPrice
  discountAmount: number;
  netAmount: number; // Discounted amount (excluding tax if EXCLUSIVE, excluding tax backed out if INCLUSIVE)
  taxAmount: number; // Tax for this line
  lineAmount: number; // Displayed line amount (net of tax)
  totalWithTax: number; // Line net + Line tax
  accountId?: string;
}

export interface QuoteFinancialSummary {
  lines: CalculatedLineItem[];
  subtotal: number; // Total net amount across all lines
  taxTotal: number; // Total tax across all lines
  totalAmount: number; // Authoritative final quotation amount (Subtotal + TaxTotal)
  totalDiscount: number; // Total discount amount applied
  taxTreatment: TaxTreatmentType;
}

/**
 * Rounds a number to exactly two decimal places using banker's/commercial half-up rounding.
 */
export function roundToCents(amount: number): number {
  if (!Number.isFinite(amount)) return 0;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Validates line items before calculation or saving.
 */
export function validateLineItems(lines: LineItemInput[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!Array.isArray(lines) || lines.length === 0) {
    errors.push("Quotation must contain at least one line item.");
    return { valid: false, errors };
  }

  lines.forEach((line, index) => {
    const idx = index + 1;
    if (!line.description || line.description.trim() === "") {
      errors.push(`Line ${idx}: Description cannot be empty.`);
    }

    const qty = Number(line.quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      errors.push(`Line ${idx}: Quantity must be greater than zero.`);
    }

    const price = Number(line.unitPrice);
    if (!Number.isFinite(price) || price < 0) {
      errors.push(`Line ${idx}: Unit price cannot be negative.`);
    }

    const disc = Number(line.discount || 0);
    if (!Number.isFinite(disc) || disc < 0 || disc > 100) {
      errors.push(`Line ${idx}: Discount percentage must be between 0% and 100%.`);
    }

    const tax = Number(line.taxRate !== undefined ? line.taxRate : 10);
    if (!Number.isFinite(tax) || tax < 0 || tax > 100) {
      errors.push(`Line ${idx}: Tax rate must be between 0% and 100%.`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Centrally calculates financial totals for a quote with full mathematical reconciliation.
 */
export function calculateQuoteFinancials(
  lines: LineItemInput[],
  taxTreatment: TaxTreatmentType = "EXCLUSIVE"
): QuoteFinancialSummary {
  let subtotalCents = 0;
  let taxTotalCents = 0;
  let totalDiscountCents = 0;

  const calculatedLines: CalculatedLineItem[] = lines.map((line) => {
    const qty = Math.max(0, Number(line.quantity) || 0);
    const unitPrice = Math.max(0, Number(line.unitPrice) || 0);
    const discountPercent = Math.min(100, Math.max(0, Number(line.discount) || 0));
    const taxRate = Math.min(100, Math.max(0, Number(line.taxRate !== undefined ? line.taxRate : 10)));

    // Gross line before discount (in cents)
    const grossCents = Math.round(qty * unitPrice * 100);
    // Discount amount (in cents)
    const discCents = Math.round(grossCents * (discountPercent / 100));
    const netBaseCents = grossCents - discCents;

    totalDiscountCents += discCents;

    let lineNetCents = 0;
    let lineTaxCents = 0;

    if (taxTreatment === "EXCLUSIVE") {
      // Prices entered are exclusive of tax. Line amount is netBase, tax is added on top.
      lineNetCents = netBaseCents;
      lineTaxCents = Math.round(lineNetCents * (taxRate / 100));
    } else if (taxTreatment === "INCLUSIVE") {
      // Prices entered are inclusive of tax. Tax is backed out from gross discounted base.
      const fullCents = netBaseCents;
      lineTaxCents = taxRate > 0 ? Math.round(fullCents * (taxRate / (100 + taxRate))) : 0;
      lineNetCents = fullCents - lineTaxCents;
    } else {
      // NO_TAX
      lineNetCents = netBaseCents;
      lineTaxCents = 0;
    }

    subtotalCents += lineNetCents;
    taxTotalCents += lineTaxCents;

    const netAmount = lineNetCents / 100;
    const taxAmount = lineTaxCents / 100;
    const totalWithTax = (lineNetCents + lineTaxCents) / 100;

    return {
      id: line.id,
      itemCode: line.itemCode,
      description: line.description,
      quantity: qty,
      unitPrice: roundToCents(unitPrice),
      discount: discountPercent,
      taxRate,
      grossAmount: grossCents / 100,
      discountAmount: discCents / 100,
      netAmount,
      taxAmount,
      lineAmount: netAmount,
      totalWithTax,
      accountId: line.accountId,
    };
  });

  const subtotal = subtotalCents / 100;
  const taxTotal = taxTotalCents / 100;
  const totalAmount = (subtotalCents + taxTotalCents) / 100;
  const totalDiscount = totalDiscountCents / 100;

  return {
    lines: calculatedLines,
    subtotal: roundToCents(subtotal),
    taxTotal: roundToCents(taxTotal),
    totalAmount: roundToCents(totalAmount),
    totalDiscount: roundToCents(totalDiscount),
    taxTreatment,
  };
}

/**
 * Currency formatter for Australian Dollars (AUD).
 */
export function formatAUD(amount: number): string {
  if (!Number.isFinite(amount)) return "$0.00";
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Safely evaluates an arithmetic quantity expression supporting addition and subtraction (e.g. "9+2", "10-3", "4.5+5.5", "12+8-2").
 * Restricts input strictly to numbers, +, - and decimal points. No unsafe eval().
 */
export function evaluateQtyExpression(input: string, fallback: number = 1): number {
  if (!input || !input.trim()) return fallback;
  const cleaned = input.replace(/\s+/g, "");
  // Strictly validate permitted characters: digits, decimal points, + and -
  if (!/^[\d\.\+\-]+$/.test(cleaned)) {
    return fallback;
  }
  // Strip trailing operators like "9+" or "10-"
  const sanitized = cleaned.replace(/[+-]+$/, "");
  if (!sanitized) return fallback;

  // Extract signed tokens: e.g. "9+2-3.5" -> ["9", "+2", "-3.5"]
  const tokens = sanitized.match(/([+-]?\d+(?:\.\d+)?)/g);
  if (!tokens || tokens.length === 0) return fallback;

  let total = 0;
  for (const token of tokens) {
    const val = parseFloat(token);
    if (!isNaN(val)) {
      total += val;
    }
  }
  // Precision rounded to 4 decimals, min 0 (quantities cannot be negative)
  const rounded = Math.round(total * 10000) / 10000;
  return Math.max(0, rounded);
}

/**
 * Sanitizes Qty input string in real time:
 * Strictly allows only digits, decimal point, +, and -
 */
export function sanitizeQtyInput(val: string): string {
  return val.replace(/[^0-9.+-]/g, "");
}

/**
 * Sanitizes Unit price input in real time:
 * Strictly allows digits and at most one decimal point
 */
export function sanitizePriceInput(val: string): string {
  let cleaned = val.replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length > 2) {
    cleaned = parts[0] + "." + parts.slice(1).join("");
  }
  return cleaned;
}

/**
 * Sanitizes Discount % input in real time:
 * Strictly allows digits and at most one decimal point, max 100
 */
export function sanitizeDiscountInput(val: string): string {
  let cleaned = val.replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length > 2) {
    cleaned = parts[0] + "." + parts.slice(1).join("");
  }
  const num = parseFloat(cleaned);
  if (!isNaN(num) && num > 100) {
    return "100";
  }
  return cleaned;
}
