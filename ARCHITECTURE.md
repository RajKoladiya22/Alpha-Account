# System Architecture & Technical Blueprint

## 1. Domain Separation & Infrastructure Topology

The architecture separates the presentation surface, application runtime, and authentication boundaries across distinct subdomain tiers:

```
[Internet Traffic]
       │
       ├───► www.yourdomain.com   (Public Marketing Tier - Static / SSG)
       │
       ├───► go.yourdomain.com    (Secure Portal Shell - Multi-Tenant PWA)
       │        └── [Unauthenticated] ──► Redirect to login with returnUrl
       │
       └───► login.yourdomain.com (Identity Gateway - WebAuthn & Lockout Tier)
```

### Subdomain Boundaries
- **Public Surface (`www.yourdomain.com`)**: Marketing pages, customer guides, pricing. Zero data mutation capability and no access to private tenant ledgers.
- **Portal Shell (`go.yourdomain.com`)**: The authenticated multi-tenant application shell. Unauthenticated requests are intercepted by edge middleware and redirected with a secure `returnUrl`.
- **Identity Gateway (`login.yourdomain.com`)**: Isolated authentication layer managing WebAuthn credentials, biometric verification, dual-rail email dispatches, and brute-force lockout counters.

---

## 2. The 5 Core System Invariants

### Invariant 1: Identity Security & 15-Minute Sliding-Window Lockout
- **WebAuthn Passkeys**: Hardware-backed cryptographic credentials (FIDO2 / WebAuthn). Passkey registration strictly requires a distinct secondary email (`backupEmail != email`) for dual-rail verification fallback.
- **Sliding-Window Lockout**:
  - After 5 consecutive failed login attempts within 15 minutes, the account transitions to a hard lockout for exactly **900 seconds (15 minutes)**.
  - **Reset Penalty**: Any password reset request submitted while the 900-second lockout is active **resets the countdown timer back to 900 seconds**, defeating automated credential stuffing and denial-of-service reset floods.

### Invariant 2: Double-Entry General Ledger Balancing
- **Balance Invariant**: Every financial transaction must produce balanced debits and credits:
  $$\sum \text{Debits} \equiv \sum \text{Credits}$$
- **Immutability**: Once written, journal entries are strictly append-only. Modification and deletion are prohibited.
- **Reversals**: Corrections occur exclusively via `reverseJournalEntry()`, creating an equal and opposite entry referencing the original journal ID (`reversingJournalId`).

### Invariant 3: Document Mutation Lifecycle & Lineage
- **Deterministic State Machines**:
  - **Quotes**: `DRAFT` $\rightarrow$ `SENT` $\rightarrow$ `ACCEPTED` / `DECLINED` $\rightarrow$ `CONVERTED_TO_INVOICE`
  - **Invoices**: `DRAFT` $\rightarrow$ `AUTHORIZED` $\rightarrow$ `PARTIALLY_PAID` $\rightarrow$ `PAID` $\rightarrow$ `VOIDED`
  - **Purchase Orders**: `DRAFT` $\rightarrow$ `APPROVED` $\rightarrow$ `BILLED`
- **Referential Lineage**:
  - Invoices converted from Quotes retain `sourceQuoteId` and line-item unit pricing verbatim.
  - Bills converted from Purchase Orders retain `sourcePurchaseOrderId`.

### Invariant 4: Bank Reconciliation Hierarchical Matching Pipeline
Incoming bank statement lines pass through a strict four-step resolution pipeline:
1. **Step 1 (Conditional Bank Rules)**: User-defined deterministic rules matching narration patterns (`CONTAINS`, `EQUALS`, `REGEX`) or amount thresholds.
2. **Step 2 (Exact Matches)**: 1:1 match on sign, exact decimal amount, and document reference identifier (`INV-xxxx`, `BILL-xxxx`).
3. **Step 3 (Heuristic Matches)**: Weighted multi-factor scoring combining date proximity ($\le 7$ days), fuzzy contact name matching, and historical transaction coding memory.
4. **Step 4 (Manual Fallback)**: Unmatched statement lines are queued for human review or manual nominal code allocation.

### Invariant 5: Streaming Assistive AI (JAX) & Micro-Frontends
- **Decoupled MFEs**: Independent functional modules (Invoicing, Bills, Banking) communicate asynchronously via `CrossMfeEventBus`.
- **Audited Streaming Gateway**: The assistive AI companion (JAX) operates over bi-directional streaming channels (SSE / WebSockets). All actions execute via audited tool calls recorded in `AuditLog`.

---

## 3. Quoting & Estimating Responsive PWA Module

### UI Component Hierarchy (`src/components/`)
- **`AppHeader.tsx`**: Global deep navy (`#001e4d`) header with organization switcher, active tab highlight, quick actions (`+`), JAX AI companion, notifications, and user avatar.
- **`QuoteList.tsx`**: Filterable quote table with status tabs (`All`, `Draft`, `Sent`, `Declined`, `Accepted`, `Invoiced`), dynamic badge counts, search, and overdue calendar alerts.
- **`QuoteEditor.tsx`**: Interactive creation/editing interface with split `Save` (`Save & close`, `Save & add another`), split `Send` (`Send`, `Mark as sent`), contact autocomplete, expandable Title & Summary, line-item grid with real-time tax calculation, drag handles, account selector, and file attachment popovers.
- **`QuoteView.tsx`**: Detail view with document preview, action bar (`Print PDF`, `Mark as accepted`, `Revise`, `Copy to`, `Get link`), and collapsible `History and notes` timeline.
- **`CustomerList.tsx`**: Contacts directory with initials avatar badges, address/contact details, `You owe` and `They owe` balance tracking.
- **`AddContactForm.tsx`**: Multi-section contact registration form with vertical sidebar navigation.
- **`OrganizationSettings.tsx`**: Tenant settings dashboard covering General, Sales (quote defaults), Purchases, and Accounting (tax basis).
- **`ClientPortalView.tsx`**: Public customer view accessible via tamper-proof signed link allowing one-click `Accept` and `Decline` actions.

---

## 4. Next.js Client & Server Boundaries

```
┌────────────────────────────────────────────────────────┐
│               Client Tier ("use client")               │
│  - AppHeader, QuoteList, QuoteEditor, CustomerList     │
│  - Form validation, DOM events, optimistic state       │
└───────────────────────────┬────────────────────────────┘
                            │  Server Actions / REST APIs
┌───────────────────────────▼────────────────────────────┐
│               Server Tier ("use server")               │
│  - Session validation via __Host-Session cookie        │
│  - Tenant context extraction (x-tenant-id verified)    │
│  - RBAC authorization check (assertPermission)         │
│  - QuoteService & Double-Entry Ledger Engine           │
│  - Database / Prisma ORM                               │
└────────────────────────────────────────────────────────┘
```
