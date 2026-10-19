// Invariant 1: JWT Session & Hardened Cookie Management

import crypto from "node:crypto";

export interface SessionPayload {
  userId: string;
  email: string;
  activeTenantId: string;
  role: string;
  exp: number; // Unix epoch seconds
  iat: number;
}

export class JwtSessionManager {
  private secret: string;

  constructor(secret = "fintech_super_secure_jwt_signing_key_32bytes_long!") {
    this.secret = secret;
  }

  public createToken(payload: Omit<SessionPayload, "exp" | "iat">, durationSeconds = 86400): string {
    const header = { alg: "HS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const fullPayload: SessionPayload = {
      ...payload,
      iat: now,
      exp: now + durationSeconds,
    };

    const b64Header = Buffer.from(JSON.stringify(header)).toString("base64url");
    const b64Payload = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
    const signature = crypto
      .createHmac("sha256", this.secret)
      .update(`${b64Header}.${b64Payload}`)
      .digest("base64url");

    return `${b64Header}.${b64Payload}.${signature}`;
  }

  public verifyToken(token: string): SessionPayload {
    const parts = token.split(".");
    if (parts.length !== 3) {
      throw new Error("Invalid JWT format.");
    }

    const [b64Header, b64Payload, signature] = parts;
    const expectedSig = crypto
      .createHmac("sha256", this.secret)
      .update(`${b64Header}.${b64Payload}`)
      .digest("base64url");

    if (signature !== expectedSig) {
      throw new Error("JWT signature verification failed.");
    }

    const payload: SessionPayload = JSON.parse(Buffer.from(b64Payload, "base64url").toString("utf-8"));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      throw new Error("JWT has expired.");
    }

    return payload;
  }

  public formatSessionCookie(token: string, maxAge = 86400): string {
    // Invariant 1: __Host- prefix guarantees Secure, Path=/, and Host-Only boundary
    return `__Host-Session=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
  }
}
