import test from "node:test";
import assert from "node:assert/strict";
import { QuoteService } from "../src/core/quotes/quote-service.ts";
import { ClientPortalService } from "../src/core/portal/client-portal-service.ts";
import { QuoteStatus } from "../src/types/index.ts";

test("ClientPortalService: Cryptographic Token Security & Client Actions", async (t) => {
  const quoteService = new QuoteService();
  const portalService = new ClientPortalService(quoteService, "super-secret-hmac-key");
  const tenantId = "tenant-portal-test";

  const quote = quoteService.createQuote({
    tenantId,
    contactId: "client-john",
    lines: [{ description: "Consulting", quantity: 5, unitPrice: 200, taxRate: 10 }],
  });

  // Transition quote to SENT
  quoteService.sendQuote(tenantId, quote.id);

  let validToken = "";

  await t.test("Generates valid HMAC-SHA256 signed portal token", () => {
    validToken = portalService.generatePortalToken(tenantId, quote.id, 30);
    assert.ok(validToken.includes("."));
    const verified = portalService.verifyPortalToken(validToken);
    assert.equal(verified.tenantId, tenantId);
    assert.equal(verified.quoteId, quote.id);
  });

  await t.test("Tampered token payload is strictly rejected", () => {
    const [payloadB64, signature] = validToken.split(".");
    // Modify the base64 payload
    const tamperedPayload = Buffer.from(
      JSON.stringify({ tenantId, quoteId: "different-quote-id", issuedAt: Date.now(), expiresAt: Date.now() + 100000 })
    ).toString("base64url");
    const tamperedToken = `${tamperedPayload}.${signature}`;

    assert.throws(() => portalService.verifyPortalToken(tamperedToken), /Cryptographic verification failed/);
  });

  await t.test("Tampered signature is strictly rejected", () => {
    const [payloadB64] = validToken.split(".");
    const invalidSignature = "invalid_signature_string_here_1234567890";
    const tamperedToken = `${payloadB64}.${invalidSignature}`;

    assert.throws(() => portalService.verifyPortalToken(tamperedToken), /Cryptographic verification failed/);
  });

  await t.test("Expired token is rejected", () => {
    const expiredToken = portalService.generatePortalToken(tenantId, quote.id, -1); // negative validity -> expired in past
    assert.throws(() => portalService.verifyPortalToken(expiredToken), /Portal token has expired/);
  });

  await t.test("Client fetches quote details via portal token", () => {
    const fetched = portalService.getQuoteForClient(validToken);
    assert.equal(fetched.id, quote.id);
    assert.equal(fetched.totalAmount, 1100);
  });

  await t.test("Client accepts quote via portal with comment", () => {
    const accepted = portalService.clientAcceptQuote(validToken, "Approved! Purchase Order PO-9872");
    assert.equal(accepted.status, QuoteStatus.ACCEPTED);
    assert.ok(
      accepted.history?.some((h) => h.detail.includes("Approved! Purchase Order PO-9872"))
    );
  });
});
