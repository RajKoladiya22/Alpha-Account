# Clean-Room Reverse Engineering & Feature Extraction Guide

This guide outlines the methodology for reverse engineering existing applications and reconstructing their operational features using the **Reverse Engineer Anything (REA)** toolchain.

---

## 1. Clean-Room Reverse Engineering Principles

Clean-room reverse engineering separates the investigation of an existing product from the development of the replacement system to avoid copyright contamination:

```
[Target Application / UI]
          │
          ▼
┌─────────────────────────────────┐
│       Stage 1 & 2: REA          │
│  - DOM & Layout Inspection      │ ──► Evidence Packet [SEEN]
│  - Network Payload Interception │
│  - AST & Decompilation Trace    │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│     Stage 3: Systems Analyst    │
│  - Invariant Extraction         │ ──► Functional Blueprint
│  - Mathematical Contracts       │
│  - State Machine Specification  │
└────────────────┬────────────────┘
                 │
                 ▼
┌─────────────────────────────────┐
│    Stage 4: Clean-Room Team     │
│  - Independent Implementation   │ ──► Verified Open-Source Code
│  - Zero Proprietary Copying     │
└─────────────────────────────────┘
```

---

## 2. Four-Stage Investigation Workflow

### Stage 1: Static & Rendering Analysis
1. **Layout & Component Decomposition**: Inspect page layout grids, navigation headers, tab bars, split buttons, and table columns.
2. **Style & Token Extraction**: Capture brand color values (e.g. Deep Navy `#001e4d`, Action Blue `#006fe6`, Success Green `#137333`), typography scales, and responsive breakpoints.
3. **Artifact Analysis**: When inspecting packaged desktop applications (Electron, ASAR) or mobile APKs, use REA CLI:
   ```bash
   npx -y rea-agents@latest analyze-javascript-application /path/to/extracted/app --json
   ```

### Stage 2: Network & State-Flow Isolation
1. **Authentication Handshakes**: Intercept how public forms delegate credential submission to the auth gateway (`login.domain.com`).
2. **Lockout State Tracing**: Trace the client-side state machine handling consecutive login failures:
   - Identify the 5-attempt threshold.
   - Record the 900-second countdown timer.
   - Test whether password reset requests reset the timer back to 900 seconds.
3. **Session Cookies**: Verify cookie flags (`__Host-Session`, `HttpOnly`, `Secure`, `SameSite=Strict`).

### Stage 3: Reconstruct Invariants & Mathematical Models
Convert observed behavior into formal engineering invariants:
- **Double-Entry Ledger Invariant**: Balance equation $\sum \text{Debits} == \sum \text{Credits}$.
- **Tax Treatments**:
  - Exclusive: $Subtotal = \sum Net$, $Tax = \sum (Net \times r)$, $Total = Subtotal + Tax$.
  - Inclusive: $Gross = Qty \times Price$, $Tax = Gross \times \frac{r}{100+r}$, $Net = Gross - Tax$.
  - No Tax: $Tax = 0$, $Total = Subtotal$.
- **Referential Lineage**: Conversion of Quote $\rightarrow$ Invoice with preserved `sourceQuoteId` and line items.

### Stage 4: Clean-Room Code Generation & Testing
- Write modular, idiomatic TypeScript / Next.js components and services from the specifications.
- Strictly label all conclusions:
  - **`[SEEN]`**: Observations directly proven by telemetry, screenshots, or DOM dumps.
  - **`[GUESSED]`**: Architectural patterns and backend inferences.
- Execute unit and integration tests proving functional parity with zero dependency on the original binary.

---

## 3. Installed REA Skill Reference

The following REA skills are installed locally in `.agents/skills/`:
- **`reverse-engineer-anything`**: Primary skill for native binaries, JavaScript bundles, Electron ASARs, APKs, and browser workflows.
- **`rea-tool-design`**: Guidelines for authoring clean, failure-safe tool contracts.
- **`rea-analysis-optimization`**: Minimizing token context and accelerating decompilation pipelines.
- **`rea-ci-tests-audit`**: Validating reverse engineering coverage through automated regressions.
