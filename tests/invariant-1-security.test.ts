// Tests: Invariant 1 - Domain Separation & Security Boundaries

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { LockoutManager } from "../src/core/security/lockout-manager.ts";
import { WebAuthnManager } from "../src/core/security/webauthn-manager.ts";
import { handleSubdomainRouting } from "../src/middleware/subdomain-router.ts";
import { JwtSessionManager } from "../src/core/security/jwt-session.ts";

describe("Invariant 1: Domain Separation & Routing", () => {
  test("public presentation surface routes to marketing path", () => {
    const res = handleSubdomainRouting({
      headers: { host: "www.fintech-platform.local" },
      url: "/small-businesses/construction",
    });
    assert.equal(res.routeType, "PUBLIC_MARKETING");
    assert.equal(res.rewrittenPath, "/marketing/small-businesses/construction");
    assert.equal(res.redirect, undefined);
  });

  test("unauthenticated portal shell access (go.domain) redirects to auth gateway with returnUrl", () => {
    const res = handleSubdomainRouting({
      headers: { host: "go.fintech-platform.local" },
      url: "/invoicing",
      cookies: {},
    });
    assert.equal(res.routeType, "PORTAL_SHELL");
    assert.ok(res.redirect?.includes("login.fintech-platform.local/identity/user/login"));
    assert.ok(res.redirect?.includes("returnUrl="));
  });

  test("authenticated portal shell access proceeds to app layout", () => {
    const res = handleSubdomainRouting({
      headers: { host: "go.fintech-platform.local" },
      url: "/invoicing",
      cookies: { "__Host-Session": "valid_token_xyz" },
    });
    assert.equal(res.routeType, "PORTAL_SHELL");
    assert.equal(res.rewrittenPath, "/app/invoicing");
    assert.equal(res.redirect, undefined);
  });

  test("auth gateway subdomain routes to isolated login boundary", () => {
    const res = handleSubdomainRouting({
      headers: { host: "login.fintech-platform.local" },
      url: "/identity/user/login",
    });
    assert.equal(res.routeType, "AUTH_GATEWAY");
    assert.equal(res.rewrittenPath, "/auth/identity/user/login");
  });
});

describe("Invariant 1: WebAuthn Passkeys with Mandatory Dual-Rail Email", () => {
  const webauthn = new WebAuthnManager();

  test("rejects passkey registration when backup email is missing", () => {
    assert.throws(
      () => webauthn.registerUser("u1", "user@company.com", ""),
      /INVARIANT_VIOLATION.*mandatory dual-rail backup email/
    );
  });

  test("rejects passkey registration when backup email matches primary email", () => {
    assert.throws(
      () => webauthn.registerUser("u1", "user@company.com", "user@company.com"),
      /INVARIANT_VIOLATION.*separate address/
    );
  });

  test("successfully registers user with distinct dual-rail fallback email", () => {
    const profile = webauthn.registerUser("u1", "user@company.com", "user-backup@personal.com");
    assert.equal(profile.userId, "u1");
    assert.equal(profile.backupEmail, "user-backup@personal.com");
  });

  test("generates and verifies passkey registration challenge", () => {
    const options = webauthn.generateRegistrationOptions("u1");
    assert.ok(options.challenge);
    assert.equal(options.rp.id, "fintech-platform.local");

    const clientDataJSON = Buffer.from(
      JSON.stringify({ type: "webauthn.create", challenge: options.challenge, origin: "https://login.fintech-platform.local" })
    ).toString("base64url");

    const success = webauthn.verifyRegistration("u1", clientDataJSON, "cred_123", "pk_base64_abc");
    assert.equal(success, true);

    const user = webauthn.getUser("u1");
    assert.equal(user?.passkeys.length, 1);
  });

  test("triggers dual-rail fallback dispatching code to backup email", () => {
    const fallback = webauthn.triggerDualRailFallback("u1");
    assert.equal(fallback.fallbackDispatchedTo, "user-backup@personal.com");
    assert.ok(fallback.verificationCode.length >= 6);
  });
});

describe("Invariant 1: 15-Minute Sliding-Window Brute-Force Lockout & Reset Penalty", () => {
  test("locks account for exactly 900 seconds after 5 failed attempts", () => {
    const lockout = new LockoutManager();
    const userId = "victim_user_1";
    const baseTime = new Date("2026-10-19T10:00:00Z");

    // Attempts 1 to 4 should fail but not lock
    for (let i = 1; i <= 4; i++) {
      const status = lockout.recordFailedAttempt(userId, new Date(baseTime.getTime() + i * 1000));
      assert.equal(status.isLocked, false);
      assert.equal(status.failedAttempts, i);
    }

    // 5th attempt locks the account
    const fifthAttempt = lockout.recordFailedAttempt(userId, new Date(baseTime.getTime() + 5000));
    assert.equal(fifthAttempt.isLocked, true);
    assert.equal(fifthAttempt.failedAttempts, 5);
    assert.equal(fifthAttempt.remainingSeconds, 900);
    assert.equal(
      fifthAttempt.lockedUntil?.toISOString(),
      new Date(baseTime.getTime() + 5000 + 900 * 1000).toISOString()
    );

    // 6th attempt while locked is strictly rejected
    const checkWhileLocked = lockout.checkLockStatus(userId, new Date(baseTime.getTime() + 60000));
    assert.equal(checkWhileLocked.isLocked, true);
    assert.equal(checkWhileLocked.remainingSeconds, 845); // 900 - 55s
  });

  test("password reset request during active lockout resets countdown back to 900 seconds", () => {
    const lockout = new LockoutManager();
    const userId = "victim_user_2";
    const baseTime = new Date("2026-10-19T10:00:00Z");

    // Trigger 5 failed attempts
    for (let i = 1; i <= 5; i++) {
      lockout.recordFailedAttempt(userId, baseTime);
    }

    // Advance 600 seconds (10 minutes in, 5 minutes remaining)
    const tenMinutesLater = new Date(baseTime.getTime() + 600 * 1000);
    const midStatus = lockout.checkLockStatus(userId, tenMinutesLater);
    assert.equal(midStatus.isLocked, true);
    assert.equal(midStatus.remainingSeconds, 300);

    // Invariant 1 Rule: Requesting password reset during lock extends/resets timer back to 900 seconds!
    const resetRes = lockout.requestPasswordReset(userId, tenMinutesLater);
    assert.equal(resetRes.success, false);
    assert.equal(resetRes.penalized, true);
    assert.ok(resetRes.message.includes("reset the lockout window to 15 minutes (900 seconds)"));

    // Check status immediately after reset attempt: remaining time is reset to 900s
    const penalizedStatus = lockout.checkLockStatus(userId, tenMinutesLater);
    assert.equal(penalizedStatus.isLocked, true);
    assert.equal(penalizedStatus.remainingSeconds, 900);
    assert.equal(
      penalizedStatus.lockedUntil?.toISOString(),
      new Date(tenMinutesLater.getTime() + 900 * 1000).toISOString()
    );
  });

  test("unlocked account can request password reset normally", () => {
    const lockout = new LockoutManager();
    const userId = "normal_user";
    const res = lockout.requestPasswordReset(userId);
    assert.equal(res.success, true);
    assert.equal(res.penalized, false);
    assert.ok(res.message.includes("security@alphasteelframes.com.au"));
    assert.ok(res.resetToken);
  });
});
