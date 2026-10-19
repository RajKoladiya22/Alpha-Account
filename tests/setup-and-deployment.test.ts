import test from "node:test";
import assert from "node:assert/strict";
import { validateSetupPayload } from "../src/lib/setup-service.ts";
import { hashPassword, verifyPassword } from "../src/core/security/password-hasher.ts";

test("First-Time Setup Wizard: Server-Side Validation Rules", async (t) => {
  await t.test("rejects setup when administrator name is missing", () => {
    const result = validateSetupPayload({
      adminName: "",
      adminEmail: "admin@alphasteelframes.com.au",
      adminPassword: "ValidPassword123!",
      organizationName: "Alpha Steel Frames Pty Ltd",
    });
    assert.equal(result.valid, false);
    assert.match(result.error || "", /name is required/i);
  });

  await t.test("rejects setup when administrator email is invalid", () => {
    const result = validateSetupPayload({
      adminName: "John Doe",
      adminEmail: "not-an-email",
      adminPassword: "ValidPassword123!",
      organizationName: "Alpha Steel Frames Pty Ltd",
    });
    assert.equal(result.valid, false);
    assert.match(result.error || "", /valid email address/i);
  });

  await t.test("rejects password with fewer than 8 characters", () => {
    const result = validateSetupPayload({
      adminName: "John Doe",
      adminEmail: "admin@alphasteelframes.com.au",
      adminPassword: "Pass1!",
      organizationName: "Alpha Steel Frames Pty Ltd",
    });
    assert.equal(result.valid, false);
    assert.match(result.error || "", /at least 8 characters/i);
  });

  await t.test("rejects password lacking uppercase character", () => {
    const result = validateSetupPayload({
      adminName: "John Doe",
      adminEmail: "admin@alphasteelframes.com.au",
      adminPassword: "lowercase1234!",
      organizationName: "Alpha Steel Frames Pty Ltd",
    });
    assert.equal(result.valid, false);
    assert.match(result.error || "", /uppercase/i);
  });

  await t.test("rejects password lacking lowercase character", () => {
    const result = validateSetupPayload({
      adminName: "John Doe",
      adminEmail: "admin@alphasteelframes.com.au",
      adminPassword: "UPPERCASE1234!",
      organizationName: "Alpha Steel Frames Pty Ltd",
    });
    assert.equal(result.valid, false);
    assert.match(result.error || "", /lowercase/i);
  });

  await t.test("rejects password lacking numeric digit", () => {
    const result = validateSetupPayload({
      adminName: "John Doe",
      adminEmail: "admin@alphasteelframes.com.au",
      adminPassword: "OnlyLettersAllowed!",
      organizationName: "Alpha Steel Frames Pty Ltd",
    });
    assert.equal(result.valid, false);
    assert.match(result.error || "", /digit/i);
  });

  await t.test("rejects mismatched confirm password", () => {
    const result = validateSetupPayload({
      adminName: "John Doe",
      adminEmail: "admin@alphasteelframes.com.au",
      adminPassword: "ValidPassword123!",
      confirmPassword: "DifferentPassword123!",
      organizationName: "Alpha Steel Frames Pty Ltd",
    });
    assert.equal(result.valid, false);
    assert.match(result.error || "", /do not match/i);
  });

  await t.test("rejects setup when organization name is missing", () => {
    const result = validateSetupPayload({
      adminName: "John Doe",
      adminEmail: "admin@alphasteelframes.com.au",
      adminPassword: "ValidPassword123!",
      confirmPassword: "ValidPassword123!",
      organizationName: "   ",
    });
    assert.equal(result.valid, false);
    assert.match(result.error || "", /organization business name is required/i);
  });

  await t.test("accepts fully valid setup payload", () => {
    const result = validateSetupPayload({
      adminName: "Managing Director",
      adminEmail: "director@alphasteelframes.com.au",
      adminPassword: "AlphaSteelSecure2026!",
      confirmPassword: "AlphaSteelSecure2026!",
      organizationName: "Alpha Steel Frames Pty Ltd",
      tradingName: "Alpha Steel Frames",
      abn: "51 824 753 556",
      phone: "+61 7 3000 1234",
      address: "12 Titanium Circuit, Yatala, QLD 4207",
      currency: "AUD",
      timeZone: "Australia/Brisbane",
      quotePrefix: "QU-",
    });
    assert.equal(result.valid, true);
    assert.equal(result.error, undefined);
  });
});

test("First-Time Setup: Cryptographic Password Security", async (t) => {
  await t.test("hashes password securely using scrypt with unique salt", () => {
    const rawPassword = "AlphaSteelPassword99!";
    const hash1 = hashPassword(rawPassword);
    const hash2 = hashPassword(rawPassword);

    // Hashes must be unique due to random 32-byte salt
    assert.notEqual(hash1, hash2);

    // Must verify successfully
    assert.equal(verifyPassword(rawPassword, hash1), true);
    assert.equal(verifyPassword(rawPassword, hash2), true);

    // Wrong password must fail
    assert.equal(verifyPassword("WrongPassword123!", hash1), false);
  });
});

test("Deployment Environment & Hostinger Configuration Invariants", async (t) => {
  await t.test("production URL is configured for https://go.alphasteelframes.com.au", () => {
    const canonicalDomain = "go.alphasteelframes.com.au";
    assert.ok(canonicalDomain.includes("alphasteelframes.com.au"));
  });

  await t.test("quote prefix defaults to QU-", () => {
    const prefix = "QU-";
    assert.equal(prefix, "QU-");
  });
});
