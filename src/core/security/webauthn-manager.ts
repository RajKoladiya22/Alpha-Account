// Invariant 1: WebAuthn (Passkey) Manager with Mandatory Dual-Rail Email Fallback

import crypto from "node:crypto";

export interface StoredPasskey {
  credentialId: string;
  publicKey: string; // base64 encoded public key
  counter: number;
  transports: string[];
  createdAt: Date;
}

export interface UserSecurityProfile {
  userId: string;
  primaryEmail: string;
  backupEmail: string; // Invariant 1: Mandatory dual-rail fallback email
  passwordHash?: string;
  passkeys: StoredPasskey[];
}

export interface WebAuthnRegistrationOptions {
  challenge: string;
  rp: { name: string; id: string };
  user: { id: string; name: string; displayName: string };
  pubKeyCredParams: { type: "public-key"; alg: number }[];
  timeout: number;
  attestation: string;
}

export interface WebAuthnAuthenticationOptions {
  challenge: string;
  timeout: number;
  rpId: string;
  allowCredentials: { id: string; type: "public-key"; transports?: string[] }[];
}

export class WebAuthnManager {
  private rpName: string;
  private rpId: string;
  private origin: string;
  private activeChallenges = new Map<string, { challenge: string; expiresAt: Date }>();
  private users = new Map<string, UserSecurityProfile>();

  constructor(rpName = "Fintech Accounting", rpId = "fintech-platform.local", origin = "https://login.fintech-platform.local") {
    this.rpName = rpName;
    this.rpId = rpId;
    this.origin = origin;
  }

  public registerUser(userId: string, primaryEmail: string, backupEmail: string, passwordHash?: string): UserSecurityProfile {
    // Invariant 1: Mandatory dual-rail email fallback enforcement
    if (!backupEmail || backupEmail.trim() === "") {
      throw new Error("INVARIANT_VIOLATION: Passkey security requires a mandatory dual-rail backup email.");
    }
    if (backupEmail.toLowerCase() === primaryEmail.toLowerCase()) {
      throw new Error("INVARIANT_VIOLATION: Backup email must be a separate address from the primary identity email.");
    }

    const profile: UserSecurityProfile = {
      userId,
      primaryEmail,
      backupEmail,
      passwordHash,
      passkeys: [],
    };
    this.users.set(userId, profile);
    return profile;
  }

  public getUser(userId: string): UserSecurityProfile | undefined {
    return this.users.get(userId);
  }

  public generateRegistrationOptions(userId: string): WebAuthnRegistrationOptions {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error("User not found.");
    }
    if (!user.backupEmail) {
      throw new Error("INVARIANT_VIOLATION: Cannot initialize passkey without verified dual-rail backup email.");
    }

    const challenge = crypto.randomBytes(32).toString("base64url");
    this.activeChallenges.set(userId, {
      challenge,
      expiresAt: new Date(Date.now() + 60000), // 1 minute challenge expiry
    });

    return {
      challenge,
      rp: { name: this.rpName, id: this.rpId },
      user: {
        id: Buffer.from(userId).toString("base64url"),
        name: user.primaryEmail,
        displayName: user.primaryEmail,
      },
      pubKeyCredParams: [
        { type: "public-key", alg: -7 }, // ES256
        { type: "public-key", alg: -257 }, // RS256
      ],
      timeout: 60000,
      attestation: "none",
    };
  }

  public verifyRegistration(
    userId: string,
    clientDataJSON: string,
    credentialId: string,
    publicKeyBase64: string,
    transports: string[] = ["internal"]
  ): boolean {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found.");

    const challengeRecord = this.activeChallenges.get(userId);
    if (!challengeRecord || challengeRecord.expiresAt < new Date()) {
      throw new Error("Passkey registration challenge expired or not found.");
    }

    // Verify challenge in clientDataJSON
    const clientData = JSON.parse(Buffer.from(clientDataJSON, "base64url").toString("utf-8"));
    if (clientData.challenge !== challengeRecord.challenge) {
      throw new Error("Challenge mismatch during passkey registration.");
    }

    // Store passkey
    user.passkeys.push({
      credentialId,
      publicKey: publicKeyBase64,
      counter: 0,
      transports,
      createdAt: new Date(),
    });

    this.activeChallenges.delete(userId);
    return true;
  }

  public generateAuthenticationOptions(userId: string): WebAuthnAuthenticationOptions {
    const user = this.users.get(userId);
    if (!user || user.passkeys.length === 0) {
      throw new Error("No passkeys registered for this user.");
    }

    const challenge = crypto.randomBytes(32).toString("base64url");
    this.activeChallenges.set(userId, {
      challenge,
      expiresAt: new Date(Date.now() + 60000),
    });

    return {
      challenge,
      timeout: 60000,
      rpId: this.rpId,
      allowCredentials: user.passkeys.map((p) => ({
        id: p.credentialId,
        type: "public-key",
        transports: p.transports,
      })),
    };
  }

  public verifyAuthentication(userId: string, credentialId: string, clientDataJSON: string, newCounter: number): boolean {
    const user = this.users.get(userId);
    if (!user) throw new Error("User not found.");

    const passkey = user.passkeys.find((p) => p.credentialId === credentialId);
    if (!passkey) throw new Error("Passkey credential not found.");

    const challengeRecord = this.activeChallenges.get(userId);
    if (!challengeRecord || challengeRecord.expiresAt < new Date()) {
      throw new Error("Authentication challenge expired.");
    }

    const clientData = JSON.parse(Buffer.from(clientDataJSON, "base64url").toString("utf-8"));
    if (clientData.challenge !== challengeRecord.challenge) {
      throw new Error("Challenge mismatch during authentication.");
    }

    // Verify replay protection (counter must strictly increase if supported)
    if (newCounter > 0 && newCounter <= passkey.counter) {
      throw new Error("POTENTIAL_REPLAY_ATTACK: Passkey counter did not increment.");
    }

    passkey.counter = newCounter;
    this.activeChallenges.delete(userId);
    return true;
  }

  // Dual-rail fallback trigger when passkey hardware is unavailable
  public triggerDualRailFallback(userId: string): { fallbackDispatchedTo: string; verificationCode: string } {
    const user = this.users.get(userId);
    if (!user || !user.backupEmail) {
      throw new Error("No verified dual-rail backup email configured.");
    }

    const verificationCode = crypto.randomInt(100000, 999999).toString();
    return {
      fallbackDispatchedTo: user.backupEmail,
      verificationCode,
    };
  }
}
