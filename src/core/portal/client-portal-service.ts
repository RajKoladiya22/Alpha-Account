import crypto from "node:crypto";
import type { QuoteService } from "../quotes/quote-service.ts";
import type { QuoteEntity, PortalTokenPayload } from "../../types/index.ts";

export class ClientPortalService {
  private secretKey: string;
  private quoteService: QuoteService;

  constructor(quoteService: QuoteService, secretKey = "portal-signing-secret-key-prod-001") {
    this.quoteService = quoteService;
    this.secretKey = secretKey;
  }

  /**
   * Generates a tamper-proof HMAC-SHA256 signed token for public customer quote access
   */
  public generatePortalToken(tenantId: string, quoteId: string, validityDays = 60): string {
    const issuedAt = Date.now();
    const expiresAt = issuedAt + validityDays * 24 * 60 * 60 * 1000;

    const payload: PortalTokenPayload = {
      tenantId,
      quoteId,
      issuedAt,
      expiresAt,
    };

    const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const hmac = crypto.createHmac("sha256", this.secretKey);
    hmac.update(payloadB64);
    const signature = hmac.digest("base64url");

    return `${payloadB64}.${signature}`;
  }

  /**
   * Verifies the cryptographic signature and expiration of a portal token
   */
  public verifyPortalToken(token: string): PortalTokenPayload {
    const parts = token.split(".");
    if (parts.length !== 2) {
      throw new Error("Invalid portal token format");
    }

    const [payloadB64, providedSignature] = parts;
    const hmac = crypto.createHmac("sha256", this.secretKey);
    hmac.update(payloadB64);
    const expectedSignature = hmac.digest("base64url");

    const provBuf = Buffer.from(providedSignature);
    const expBuf = Buffer.from(expectedSignature);

    if (
      provBuf.length !== expBuf.length ||
      !crypto.timingSafeEqual(provBuf, expBuf)
    ) {
      throw new Error("Cryptographic verification failed: Token signature is invalid or tampered");
    }

    const payload: PortalTokenPayload = JSON.parse(
      Buffer.from(payloadB64, "base64url").toString("utf-8")
    );

    if (Date.now() > payload.expiresAt) {
      throw new Error("Portal token has expired");
    }

    return payload;
  }

  /**
   * Fetches quote details for client viewing
   */
  public getQuoteForClient(token: string): QuoteEntity {
    const payload = this.verifyPortalToken(token);
    const quote = this.quoteService.getQuoteById(payload.tenantId, payload.quoteId);
    if (!quote) {
      throw new Error("Quote not found or invalid tenant context");
    }
    return quote;
  }

  /**
   * Client accepts the quote via portal with optional customer comments
   */
  public clientAcceptQuote(token: string, comment?: string): QuoteEntity {
    const payload = this.verifyPortalToken(token);
    return this.quoteService.acceptQuote(payload.tenantId, payload.quoteId, {
      source: "CLIENT_PORTAL",
      note: comment,
    });
  }

  /**
   * Client declines the quote via portal with required feedback
   */
  public clientDeclineQuote(token: string, reason: string): QuoteEntity {
    const payload = this.verifyPortalToken(token);
    return this.quoteService.declineQuote(payload.tenantId, payload.quoteId, {
      reason,
      authorName: "Client Portal",
    });
  }
}
