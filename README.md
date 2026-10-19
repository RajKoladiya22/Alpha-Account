# Multi-Tenant Financial Accounting & Document Lifecycle Engine

A production-grade, clean-room financial accounting and quoting engine designed with strict adherence to enterprise accounting invariants, multi-tenant data isolation, WebAuthn passkeys, Next.js client/server security boundaries, and an integrated **Reverse Engineer Anything (REA)** agent toolchain.

---

## 1. Quick Start & Test Suite

Run the full verification suite across all 7 domain subsystems using Node's native test runner (zero external dependencies required):

```bash
npm test
```

### Verified Test Suite Results:
```text
▶ AppServer: End-to-End REST APIs for Quotes, Contacts, Portal, and Settings (10 tests) ✔
▶ ClientPortalService: Cryptographic Token Security & Client Actions (6 tests) ✔
▶ ContactService: Customers & Suppliers Management (3 tests) ✔
▶ Invariant 1: Domain Separation & Routing (4 tests) ✔
▶ Invariant 1: WebAuthn Passkeys with Mandatory Dual-Rail Email (5 tests) ✔
▶ Invariant 1: 15-Minute Sliding-Window Brute-Force Lockout & Reset Penalty (3 tests) ✔
▶ Invariant 2: Double-Entry Ledger Balancing Invariants (7 tests) ✔
▶ Invariant 3: Document State Machine & Referential Lineage (4 tests) ✔
▶ Invariant 4: Bank Reconciliation Hierarchical Resolution Pipeline (4 tests) ✔
▶ Invariant 5: Streaming Assistive AI (JAX) & Audited Tool Calling (2 tests) ✔
▶ Multi-Tenancy: Strict Data Isolation Between Organizations (3 tests) ✔
▶ RBAC: Role Permissions Enforcement (OWNER, ADVISER, STANDARD, READONLY) (3 tests) ✔
▶ QuoteService: Quote Creation & Tax Treatment Calculations (4 tests) ✔
▶ QuoteService: Lifecycle State Transitions & Lineage Preservation (5 tests) ✔

ℹ tests 70 | suites 7 | pass 70 | fail 0 | duration_ms 563ms
```

---

## 2. Integrated REA Reverse Engineering Toolchain & Team

The repository is equipped with the full **REA (Reverse Engineer Anything)** toolchain (`/rea`) and registered skill suite (`/.agents/skills/`), supported by four specialized autonomous agents:

### Autonomous Team Structure
1. **`rea-reverse-engineer`**: Analyzes shipped applications, web DOMs, network payloads, and decompiled ASTs using REA tools. Distinguishes observations (`[SEEN]`) from structural deductions (`[GUESSED]`).
2. **`clean-room-architect`**: Formulates clean-room domain specifications, invariants, and database models from observed behaviors without copying proprietary code.
3. **`security-evaluator`**: Audits authentication gates, sliding-window brute-force lockouts, WebAuthn credentials, and timing-safe token verification.
4. **`app-feature-builder`**: Builds responsive Next.js PWA components, secure Server Actions, and business domain services with full test coverage.

### Installed REA Skills
- `reverse-engineer-anything` (`.agents/skills/reverse-engineer-anything`): Full reverse engineering engine across native, managed, Electron/JS, and web targets.
- `rea-tool-design` (`.agents/skills/rea-tool-design`): Clean-room tool contract specification and design patterns.
- `rea-analysis-optimization` (`.agents/skills/rea-analysis-optimization`): Token-efficient analysis and context minimization.
- `rea-ci-tests-audit` (`.agents/skills/rea-ci-tests-audit`): Automated regression testing for reverse engineering workflows.
- `rea-changelog-update` (`.agents/skills/rea-changelog-update`): Versioning and change documentation.

---

## 3. Next.js Client & Server Security Architecture

This codebase enforces strict isolation between client-side user interface code and server-side execution:

### Client Components (`"use client"`)
- Files under `src/components/` operate as client interactive components.
- Handles user interactions, form validation, split-button dropdowns, drag handles, and local state.
- **Security Rule:** Client components never receive raw database credentials, private signing keys, or unredacted system models.

### Server Actions & Backend Services (`"use server"`)
- Files under `src/server/` and `src/core/` execute strictly in the Node.js server runtime.
- **Session & Tenancy Enforcement:** Every action extracts the authenticated user and tenant ID from the cryptographically verified `__Host-Session` cookie. The client cannot forge or override `tenantId`.
- **RBAC Assertions:** Mutations verify role permissions (`assertPermission(role, action)`) on the server.
- **Timing-Safe Verification:** Cryptographic tokens (e.g. Client Portal access) use `crypto.timingSafeEqual` with buffer length validation to prevent timing attacks.

---

## 4. TypeScript & Import Resolution

To resolve TypeScript compiler diagnostics such as:
> `An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.`

`tsconfig.json` is configured with:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "allowImportingTsExtensions": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*", "tests/**/*"]
}
```
This enables native TypeScript imports ending with `.ts` while maintaining full compatibility with Node 24 native strip types.

---

## 5. Documentation Directory

- [ARCHITECTURE.md](ARCHITECTURE.md) - Complete system blueprint, invariants, and domain models.
- [SECURITY.md](SECURITY.md) - Security invariants, WebAuthn, brute-force lockout, and REA security audit.
- [REVERSE_ENGINEERING.md](REVERSE_ENGINEERING.md) - Clean-room extraction guide and REA tool usage.
- [TEAM_GUIDE.md](TEAM_GUIDE.md) - Multi-agent team collaboration protocols and invocation workflows.
