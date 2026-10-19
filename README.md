# Multi-Tenant Financial Accounting & Document Lifecycle Engine

A production-grade, clean-room financial accounting and quoting engine designed with strict adherence to enterprise accounting invariants, multi-tenant data isolation, WebAuthn passkeys, Next.js client/server security boundaries, and an integrated **Reverse Engineer Anything (REA)** agent toolchain.

---

## 1. Quick Start & Test Suite

Run the full verification suite across all 7 domain subsystems using Node's native test runner (zero external dependencies required):

```bash
npm test
```

---

## 1.1 Running the Application & Supported Commands

The engine supports full production workflows, local development, database synchronization, and continuous integration:

### 1. Database Connection & Schema Seeding (`connect db`)
To push the multi-tenant Prisma schema to PostgreSQL (or MySQL on Hostinger) and automatically seed the database with all default accounts, contacts, and quote references matching `/Screenshort/quotes`:
```bash
./connect db
# or
connect db
# or
npm run connect-db
```

### 2. Next.js Development Server (`npm run dev`)
Starts the fast local development server with hot-module reloading and Tailwind CSS styling:
```bash
npm run dev
```
Available at `http://localhost:3000`.

### 3. Production Build (`npm run build`)
Compiles and optimizes all 23 static pages, server-rendered dynamic routes, and API endpoints:
```bash
npm run build
```

### 4. Production Start (`npm run start`)
Launches the production-ready Next.js application server:
```bash
npm run start
```

### 5. Production Server with Socket.io (`npm run start:custom`)
Launches the custom Node.js server integrating Next.js with real-time Socket.io streaming for the JAX AI financial assistant:
```bash
npm run start:custom
```

---

## 1.2 Screenshot-to-Component Mapping (`/Screenshort/quotes`)

All 19 high-resolution UI screenshots have been faithfully recreated as responsive, accessible PWA components:

| Screenshot | UI View / Module | Route / Component | Features Implemented |
|---|---|---|---|
| `image.png` | Quotes Directory | `/quotes` (`QuoteList.tsx`) | Status filter tabs (All, Draft, Sent, Accepted, Invoiced), search filter, multi-select batch actions, action dropdowns, quote summary totals |
| `image copy.png` - `image copy 9.png` | New Quote Editor & Modals | `/quotes/new` (`QuoteEditor.tsx`) | Interactive line item grid, tax treatment toggle (Exclusive, Inclusive, None), account selector, drag-drop handles, Save/Send split-buttons, customer autocomplete |
| `image copy 10.png` - `image copy 12.png` | Quote Details & Workflow History | `/quotes/[id]` (`QuoteView.tsx`) | Status badges, Send/Print/PDF toolbar, Copy to Invoice conversion, client portal preview, internal team audit notes & activity timeline |
| `image copy 13.png` | Customer Detail & 12-Month Sales Graph | `/contacts/[id]` | Customer overview, outstanding balances, interactive 12-month bar chart, transaction tabs (All, Invoices, Quotes) |
| `image copy 14.png` - `image copy 16.png` | Organization & Financial Settings | `/settings` (`OrganizationSettings.tsx`) | Organization name, legal details, currency, financial year end, tax rates, chart of accounts directory |
| `image copy 17.png` | Customers Directory | `/contacts/customers` (`CustomerList.tsx`) | Customer balances (You Owe / They Owe / Overdue), search, alphabetic jump bar, quick contact action buttons |
| `image copy 18.png` | Add Contact Modal | `/contacts/add` (`AddContactForm.tsx`) | Contact details, postal/physical addresses, primary person, tax numbers, supplier/customer flags |
| Public View | Cryptographic Client Portal | `/portal/quote/[token]` (`ClientPortalView.tsx`) | Responsive customer portal, Accept/Decline action cards, digital signature, PDF export, tamper-proof HMAC verification |

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
