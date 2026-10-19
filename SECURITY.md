# Security Policy & Cryptographic Verification

This document outlines the security invariants, cryptographic specifications, multi-tenant isolation guarantees, and REA toolkit security audit results implemented in this platform.

---

## 1. Next.js Client & Server Security Model

### Strict Execution Boundary
1. **Zero Secret Leakage to Client**:
   - Database credentials, HMAC secret keys, private passkey challenges, and password hashes are strictly restricted to the Node.js server runtime (`src/server/`, `src/core/`).
   - Client components (`"use client"`) receive only sanitized Data Transfer Objects (DTOs).
2. **Untrusted Client Inputs**:
   - The server **never** trusts client-supplied user identifiers or tenant IDs.
   - The authenticated `userId` and `tenantId` are extracted strictly from the cryptographically verified `__Host-Session` cookie.
3. **Hardened Cookie Policy**:
   - `Name`: `__Host-Session` (enforces Secure flag, Path=/, and origin lockdown).
   - `HttpOnly`: `true` (prevents XSS access).
   - `Secure`: `true` (HTTPS only).
   - `SameSite`: `Strict` (prevents CSRF attacks).

---

## 2. Invariant 1: Identity Security & Lockout Rules

### 15-Minute Sliding-Window Brute-Force Lockout
- **Threshold**: 5 consecutive failed authentication attempts within a 15-minute sliding window.
- **Lockout Duration**: Exactly **900 seconds (15 minutes)**.
- **The Reset Penalty Invariant**:
  If a password reset request is received while an account is in active lockout, the system **resets the countdown timer back to 900 seconds**.
  *Rationale*: This prevents attackers from resetting lockout counters or automating denial-of-service floods against legitimate users.

### WebAuthn Passkeys & Dual-Rail Fallback
- Hardware-backed FIDO2 authenticators (TouchID, FaceID, YubiKey).
- Registration strictly requires a distinct secondary email (`backupEmail != email`).
- Account recovery dispatches a one-time cryptographic code to the verified dual-rail backup email.

---

## 3. Cryptographic Token Verification

Client Portal quote links (`/portal/quote/:token`) allow external customers to view, accept, or decline quotations without user accounts:
- **Token Composition**: `base64url(payload) . hmac_sha256(payload, secretKey)`
- **Payload Schema**: `{ tenantId, quoteId, issuedAt, expiresAt }`
- **Timing-Safe Equal Verification**:
  ```ts
  const provBuf = Buffer.from(providedSignature);
  const expBuf = Buffer.from(expectedSignature);

  if (provBuf.length !== expBuf.length || !crypto.timingSafeEqual(provBuf, expBuf)) {
    throw new Error("Cryptographic verification failed: Token signature is invalid or tampered");
  }
  ```
  *Protection*: Pre-checking buffer lengths before executing `crypto.timingSafeEqual` prevents length-mismatch exceptions and defeats side-channel timing attacks.

---

## 4. Multi-Tenant Isolation & Role-Based Access Control (RBAC)

Every database query and service invocation includes the verified `tenantId` as an indexed predicate. Cross-tenant leakage is strictly prevented.

### Role Permission Matrix
| Role | View Quotes | Create/Edit Quotes | Send Quotes | Convert to Invoice | Manage Settings | Audit Logs |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **OWNER** | Allowed | Allowed | Allowed | Allowed | Allowed | Allowed |
| **ADVISER** | Allowed | Allowed | Allowed | Allowed | Allowed | Allowed |
| **STANDARD** | Allowed | Allowed | Allowed | Allowed | Denied | View Own |
| **READONLY** | Allowed | Denied | Denied | Denied | Denied | Denied |

---

## 5. Security Audit of Installed REA Toolchain (`morluto/rea`)

Prior to local installation, a security audit was performed on the cloned repository:

| Check Category | Audit Findings & Verification | Status |
| :--- | :--- | :---: |
| **Package Lifecycle Hooks** | `package.json` contains no dangerous `preinstall`, `postinstall`, or unverified script executions. `allowScripts` is scoped only to optional `frida`. | **PASSED** |
| **Installation Script** | `install.sh` uses POSIX-safe compound braces, validates Node versions (>=22.19/24.11), and downloads directly from official GitHub releases. | **PASSED** |
| **Network & Telemetry** | Zero outbound webhooks (Discord, Telegram, Ngrok, Pastebin) or exfiltration endpoints. | **PASSED** |
| **Local Bridge IPC** | Bridge adapters (Hopper, Ghidra, Jadx, Cutter) use ephemeral current-user Unix domain sockets authenticated with per-session random capability tokens. | **PASSED** |
| **Filesystem Safety** | Operations run within caller-specified project boundaries and isolated scratch directories. | **PASSED** |

**Conclusion**: The REA repository (`morluto/rea`) is clean, safe, and approved for local development and reverse engineering operations.
