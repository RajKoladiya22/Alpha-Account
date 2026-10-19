# Multi-Tenant Financial Accounting & Document Lifecycle Engine

A production-grade, clean-room financial accounting engine designed with strict adherence to enterprise accounting invariants, multi-tenant isolation, WebAuthn passkeys, and real-time streaming conversational AI (JAX).

---

## The 5 Absolute Architectural Invariants

### 1. Domain Separation & Security Boundaries
* **Isolated Subdomains:**
  * **Public Marketing:** `www.yourdomain.com` (SSG / SSR landing pages, zero operational mutation routes).
  * **Portal Shell:** `go.yourdomain.com` (Authenticated application shell; unauthenticated requests redirect with `returnUrl` to auth gateway).
  * **Identity Gateway:** `login.yourdomain.com` (Isolated credential and authentication boundary).
* **WebAuthn (Passkeys) with Dual-Rail Fallback:**
  * Mandatory cryptographic WebAuthn credentials backed by biometric and hardware authenticators.
  * Mandatory dual-rail backup email enforcement.
* **15-Minute Sliding-Window Lockout with Reset Penalty:**
  * 5 consecutive failed attempts trigger an immediate 900-second (15-minute) account lock.
  * Attempting a password reset while the lock is active **resets the countdown timer back to 900 seconds**.

### 2. Double-Entry Ledger Integrity
* **Strict Balance Constraint:**
  $$\sum \text{Debits} \equiv \sum \text{Credits}$$
  Unbalanced journals are rejected with `INVARIANT_VIOLATION`.
* **Immutable & Append-Only:**
  * Once posted, journal entries cannot be edited or deleted.
  * Cancellations occur strictly via `reverseJournalEntry()`, generating an equal and opposite journal linking `reversingJournalId`.

### 3. Document Mutation Lifecycle & Lineage
* **Deterministic State Machines:**
  * **Quotes:** `DRAFT` $\rightarrow$ `SENT` $\rightarrow$ `ACCEPTED` / `DECLINED` $\rightarrow$ `CONVERTED_TO_INVOICE`
  * **Invoices:** `DRAFT` $\rightarrow$ `AUTHORIZED` $\rightarrow$ `PARTIALLY_PAID` $\rightarrow$ `PAID` $\rightarrow$ `VOIDED`
  * **Purchase Orders:** `DRAFT` $\rightarrow$ `APPROVED` $\rightarrow$ `BILLED`
* **Referential Lineage:**
  * Invoices converted from Quotes retain `sourceQuoteId` and line-item unit pricing verbatim.
  * Bills converted from Purchase Orders retain `sourcePurchaseOrderId`.

### 4. Bank Reconciliation Hierarchical Matching Pipeline
Incoming bank statement lines are resolved using a 4-step hierarchy:
1. **Step 1 (Conditional Bank Rules):** Deterministic evaluation of user-defined conditions (`CONTAINS`, `EQUALS`, `REGEX`, amounts).
2. **Step 2 (Exact Matches):** 1:1 match on amount, sign/polarity, and document reference identifier (`INV-xxxx`, `BILL-xxxx`).
3. **Step 3 (Heuristic Matches):** Multi-factor scoring ($0.00$ to $1.00$) weighting amount proximity, date window ($\le 7$ days), string similarity, and historical transaction memory.
4. **Step 4 (Manual Fallback):** Unmatched items are flagged for human split or manual journal creation.

### 5. Hybrid Micro-Frontend & Streaming AI Assistant (JAX)
* **Decoupled MFEs:** Invoicing, Bills, and Banking modules communicate across an asynchronous `CrossMfeEventBus`.
* **Streaming JAX Companion:** Operates over a bi-directional streaming channel (SSE / WebSockets). All actions (price lookups, draft invoices, customer emails) execute strictly via audited tool calls recorded in `AuditLog`.

---

## Directory Scaffolding

```text
├── docker/
│   ├── Dockerfile                 # Multi-stage production container
│   └── docker-compose.yml         # App + PostgreSQL + Redis orchestration
├── prisma/
│   └── schema.prisma              # PostgreSQL / MySQL multi-tenant schema
├── src/
│   ├── config/domains.ts          # Subdomain mapping & resolution
│   ├── core/
│   │   ├── ai/jax-agent-gateway.ts# Audited JAX AI tool engine & stream generator
│   │   ├── banking/reconciliation-engine.ts # 4-step hierarchical matcher
│   │   ├── documents/state-machine.ts       # Quote, Invoice, PO state machines
│   │   ├── ledger/double-entry-engine.ts    # sum(D) == sum(C) ledger engine
│   │   └── security/
│   │       ├── jwt-session.ts     # Hardened __Host- session cookies
│   │       ├── lockout-manager.ts # 15-min sliding window & reset penalty
│   │       └── webauthn-manager.ts# Passkeys & dual-rail email fallback
│   ├── mfe/event-bus.ts           # Decoupled cross-MFE communication bridge
│   ├── middleware/subdomain-router.ts # Next.js edge routing middleware
│   ├── server/socket-handler.ts   # WebSocket / Socket.io server adapter
│   └── types/index.ts             # Domain contracts & invariants
└── tests/
    ├── invariant-1-security.test.ts
    ├── invariant-2-ledger.test.ts
    ├── invariant-3-documents.test.ts
    ├── invariant-4-banking.test.ts
    └── invariant-5-jax-ai.test.ts
```

---

## Running the Automated Invariant Verification Suite

Run the full test suite using Node's native test runner (zero external dependencies required):

```bash
npm test
```

### Test Suite Execution Output
```text
▶ Invariant 1: Domain Separation & Routing (4 tests) ✔
▶ Invariant 1: WebAuthn Passkeys with Mandatory Dual-Rail Email (5 tests) ✔
▶ Invariant 1: 15-Minute Sliding-Window Brute-Force Lockout & Reset Penalty (3 tests) ✔
▶ Invariant 2: Double-Entry Ledger Balancing Invariants (7 tests) ✔
▶ Invariant 3: Document State Machine & Referential Lineage (4 tests) ✔
▶ Invariant 4: Bank Reconciliation Hierarchical Resolution Pipeline (4 tests) ✔
▶ Invariant 5: Streaming Assistive AI (JAX) & Audited Tool Calling (2 tests) ✔

ℹ tests 29
ℹ suites 7
ℹ pass 29
ℹ fail 0
```

---

## Hostinger VPS Deployment Walkthrough

### 1. Provision Ubuntu VPS & Point DNS Records
Configure your DNS A-records in Hostinger hPanel to point your server IP to:
* `yourdomain.com` & `www.yourdomain.com` (Marketing)
* `go.yourdomain.com` (Portal Shell)
* `login.yourdomain.com` (Identity Gateway)

### 2. Launch via Docker Compose
SSH into your Hostinger VPS and deploy:

```bash
# Clone repository
git clone <repo-url> /opt/fintech-platform
cd /opt/fintech-platform/docker

# Launch PostgreSQL 16, Redis 7, and Node.js App
docker compose up -d --build
```

### 3. Apply Prisma Migrations
```bash
docker compose exec app npx prisma migrate deploy
```

### 4. Configure Nginx Reverse Proxy with SSL (Certbot)
Configure Nginx to proxy incoming traffic on port 80/443 with wildcard or multi-domain SSL certificates (`certbot --nginx -d yourdomain.com -d www.yourdomain.com -d go.yourdomain.com -d login.yourdomain.com`).
