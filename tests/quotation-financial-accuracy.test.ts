import { describe, test } from "node:test";
import assert from "node:assert/strict";
import {
  calculateQuoteFinancials,
  roundToCents,
  validateLineItems,
  formatAUD,
  evaluateQtyExpression,
  sanitizeQtyInput,
  sanitizePriceInput,
  sanitizeDiscountInput,
} from "../src/core/quotes/quote-calculator.ts";
import { hashPassword, verifyPassword } from "../src/core/security/password-hasher.ts";

describe("Quotation Calculation Engine: Authoritative 100% Mathematical Accuracy", () => {
  test("Tax Exclusive: Calculates subtotal, 10% GST, and reconciles perfectly to cents", () => {
    const lines = [
      {
        description: "ASF-STUD-90 90mm Steel C-Section Stud (3000mm)",
        quantity: 100,
        unitPrice: 24.5,
        discount: 10, // 10% discount
        taxRate: 10,
      },
      {
        description: "ASF-TRUSS-STD Roof Truss Standard 24° Pitch",
        quantity: 5,
        unitPrice: 450.0,
        discount: 0,
        taxRate: 10,
      },
    ];

    const result = calculateQuoteFinancials(lines, "EXCLUSIVE");

    // Line 1:
    // Gross: 100 * 24.50 = 2450.00
    // Discount 10%: 245.00
    // Net: 2205.00
    // Tax 10%: 220.50
    // Total with Tax: 2425.50
    assert.equal(result.lines[0].grossAmount, 2450.0);
    assert.equal(result.lines[0].discountAmount, 245.0);
    assert.equal(result.lines[0].netAmount, 2205.0);
    assert.equal(result.lines[0].taxAmount, 220.5);
    assert.equal(result.lines[0].totalWithTax, 2425.5);

    // Line 2:
    // Gross: 5 * 450.00 = 2250.00
    // Discount: 0
    // Net: 2250.00
    // Tax 10%: 225.00
    // Total with Tax: 2475.00
    assert.equal(result.lines[1].grossAmount, 2250.0);
    assert.equal(result.lines[1].discountAmount, 0.0);
    assert.equal(result.lines[1].netAmount, 2250.0);
    assert.equal(result.lines[1].taxAmount, 225.0);
    assert.equal(result.lines[1].totalWithTax, 2475.0);

    // Overall Totals:
    // Subtotal: 2205 + 2250 = 4455.00
    // Tax: 220.50 + 225.00 = 445.50
    // Total: 4900.50
    assert.equal(result.subtotal, 4455.0);
    assert.equal(result.taxTotal, 445.5);
    assert.equal(result.totalAmount, 4900.5);
    assert.equal(result.totalDiscount, 245.0);
    assert.equal(roundToCents(result.subtotal + result.taxTotal), result.totalAmount);
  });

  test("Tax Inclusive: Gross price includes 10% GST, tax is backed out without rounding discrepancies", () => {
    const lines = [
      {
        description: "ASF-BATT-40 40mm Top Hat Roof Batten",
        quantity: 20,
        unitPrice: 16.5, // 16.50 inclusive of GST ($15.00 ex + $1.50 GST)
        discount: 0,
        taxRate: 10,
      },
    ];

    const result = calculateQuoteFinancials(lines, "INCLUSIVE");

    // Full line: 20 * 16.50 = 330.00
    // Tax backed out: 330 * (10 / 110) = 30.00
    // Net line: 330.00 - 30.00 = 300.00
    assert.equal(result.lines[0].netAmount, 300.0);
    assert.equal(result.lines[0].taxAmount, 30.0);
    assert.equal(result.lines[0].totalWithTax, 330.0);

    assert.equal(result.subtotal, 300.0);
    assert.equal(result.taxTotal, 30.0);
    assert.equal(result.totalAmount, 330.0);
    assert.equal(roundToCents(result.subtotal + result.taxTotal), result.totalAmount);
  });

  test("Tax Exempt (NO_TAX): Tax total is exactly 0.00", () => {
    const lines = [
      {
        description: "Export structural steel package",
        quantity: 2,
        unitPrice: 3500.0,
        discount: 5, // 5% discount = 350
        taxRate: 10, // Even if 10 is specified, NO_TAX zeroes out tax
      },
    ];

    const result = calculateQuoteFinancials(lines, "NO_TAX");

    assert.equal(result.lines[0].taxAmount, 0.0);
    assert.equal(result.lines[0].netAmount, 6650.0);
    assert.equal(result.subtotal, 6650.0);
    assert.equal(result.taxTotal, 0.0);
    assert.equal(result.totalAmount, 6650.0);
  });

  test("Boundary Values & Edge Cases: fractional quantities, zero amounts, half-cent commercial rounding", () => {
    const lines = [
      {
        description: "Custom cut length stud",
        quantity: 3.333,
        unitPrice: 29.99,
        discount: 7.5,
        taxRate: 10,
      },
    ];

    const result = calculateQuoteFinancials(lines, "EXCLUSIVE");

    // Gross: Math.round(3.333 * 29.99 * 100) = Math.round(9995.667) = 9996 cents = 99.96
    assert.equal(result.lines[0].grossAmount, 99.96);
    // Discount 7.5%: Math.round(9996 * 0.075) = Math.round(749.7) = 750 cents = 7.50
    assert.equal(result.lines[0].discountAmount, 7.5);
    // Net: 99.96 - 7.50 = 92.46
    assert.equal(result.lines[0].netAmount, 92.46);
    // Tax: Math.round(9246 * 0.10) = 925 cents = 9.25
    assert.equal(result.lines[0].taxAmount, 9.25);
    // Total with Tax: 92.46 + 9.25 = 101.71
    assert.equal(result.lines[0].totalWithTax, 101.71);
    assert.equal(result.totalAmount, 101.71);
    assert.equal(roundToCents(result.subtotal + result.taxTotal), result.totalAmount);
  });

  test("Input Validation: Catches empty descriptions, zero quantities, negative prices, excessive discounts", () => {
    const emptyLines: any[] = [];
    const valEmpty = validateLineItems(emptyLines);
    assert.equal(valEmpty.valid, false);
    assert.ok(valEmpty.errors.some((e) => e.includes("at least one line item")));

    const invalidLines = [
      {
        description: "",
        quantity: 0,
        unitPrice: -50,
        discount: 150,
        taxRate: 120,
      },
    ];
    const valInvalid = validateLineItems(invalidLines);
    assert.equal(valInvalid.valid, false);
    assert.equal(valInvalid.errors.length, 5);
  });

  test("Format AUD: Correctly formats Australian currency values", () => {
    assert.equal(formatAUD(1250.5), "$1,250.50");
    assert.equal(formatAUD(0), "$0.00");
    assert.equal(formatAUD(1000000), "$1,000,000.00");
  });

  test("Inbuilt Qty Calculator: Evaluates + and - expressions accurately", () => {
    // 9+2 -> 11
    assert.equal(evaluateQtyExpression("9+2"), 11);
    // 10-3 -> 7
    assert.equal(evaluateQtyExpression("10-3"), 7);
    // multiple operations: 12+8-4+1.5 -> 17.5
    assert.equal(evaluateQtyExpression("12+8-4+1.5"), 17.5);
    // trailing operator: 9+ -> 9
    assert.equal(evaluateQtyExpression("9+"), 9);
    // decimals: 2.5 + 3.5 -> 6
    assert.equal(evaluateQtyExpression("2.5 + 3.5"), 6);
    // spaces: 100 - 15 -> 85
    assert.equal(evaluateQtyExpression("100 - 15"), 85);
    // empty string defaults to fallback
    assert.equal(evaluateQtyExpression("", 1), 1);
    // invalid string defaults to fallback
    assert.equal(evaluateQtyExpression("abc", 1), 1);
    // negative sum clamped to 0
    assert.equal(evaluateQtyExpression("5-10"), 0);
  });

  test("Numeric Input Sanitizers: Strictly enforce numeric constraints", () => {
    // Qty allows numbers, decimal, +, -
    assert.equal(sanitizeQtyInput("9+2abc"), "9+2");
    assert.equal(sanitizeQtyInput("10-3.5!@#"), "10-3.5");

    // Price allows only numbers and one decimal
    assert.equal(sanitizePriceInput("125.50abc"), "125.50");
    assert.equal(sanitizePriceInput("12.5.3"), "12.53");
    assert.equal(sanitizePriceInput("$45.00"), "45.00");

    // Discount allows numbers and one decimal, capped at 100
    assert.equal(sanitizeDiscountInput("15%"), "15");
    assert.equal(sanitizeDiscountInput("150"), "100");
    assert.equal(sanitizeDiscountInput("25.5"), "25.5");
  });
});

describe("Authentication & Cryptographic Security", () => {
  test("Password Hasher: generates unique salt and verifies password correctly with scrypt", () => {
    const password = "AlphaAdmin2026!";
    const hash1 = hashPassword(password);
    const hash2 = hashPassword(password);

    // Each hash must have a unique random salt
    assert.notEqual(hash1, hash2);

    // Verification must succeed for correct password
    assert.equal(verifyPassword(password, hash1), true);
    assert.equal(verifyPassword(password, hash2), true);

    // Verification must fail for incorrect password
    assert.equal(verifyPassword("WrongPassword!", hash1), false);
    assert.equal(verifyPassword("", hash1), false);
  });
});
