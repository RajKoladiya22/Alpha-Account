# Autonomous Reverse Engineering & Feature Building Team Guide

This document defines the roles, responsibilities, handover protocols, and invocation patterns for the specialized multi-agent engineering team configured in this workspace.

---

## 1. Team Composition & Role Matrix

| Subagent Name | Role Title | Core Specialty | Key Tooling |
| :--- | :--- | :--- | :--- |
| **`rea-reverse-engineer`** | Lead Reverse Engineer | Artifact analysis, network interception, DOM tracing, decompiled ASTs. | REA CLI, Playwright, Ghidra/Hopper bridge, AST parsers. |
| **`clean-room-architect`** | Clean-Room Systems Architect | Domain models, system invariants, state machines, and API contracts. | Data modeling, Mermaid diagrams, API specification. |
| **`security-evaluator`** | Application Security Auditor | Authentication boundaries, lockout windows, WebAuthn, HMAC, RBAC. | Crypto verification, timingSafeEqual checks, security tests. |
| **`app-feature-builder`** | Full-Stack Feature Engineer | Responsive Next.js PWA components, secure Server Actions, test suites. | Next.js App Router, React TSX, Node test runner. |

---

## 2. Multi-Agent Handover Pipeline

When reverse engineering a feature from a target application and implementing its clean-room counterpart, the team executes the following four-stage sequence:

```
[Target URL / Binary / Screenshot]
               │
               ▼
┌──────────────────────────────┐
│     rea-reverse-engineer     │  Analyzes DOM, styles, payloads, and state machines.
│                              │  Produces: Evidence Record [SEEN] vs [GUESSED].
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│    clean-room-architect      │  Transforms evidence into clean-room specifications.
│                              │  Produces: Data models, state machines, API contracts.
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│     security-evaluator       │  Audits authentication, lockout rules, and RBAC matrix.
│                              │  Produces: Security invariants & tamper-resistance tests.
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│     app-feature-builder      │  Implements client components, server actions, & tests.
│                              │  Produces: Tested, responsive PWA features & 100% test pass.
└──────────────────────────────┘
```

---

## 3. Subagent Invocation Examples

### Invoking the Reverse Engineer:
```ts
invoke_subagent({
  Subagents: [{
    TypeName: "rea-reverse-engineer",
    Role: "Lead Reverse Engineer",
    Prompt: "Analyze the pricing calculation and discount handling on target page https://target.app/quote/new. Extract tax treatment options and line item state transitions."
  }]
})
```

### Invoking the Clean-Room Architect:
```ts
invoke_subagent({
  Subagents: [{
    TypeName: "clean-room-architect",
    Role: "Clean-Room Systems Architect",
    Prompt: "Using the evidence packet from the reverse engineer, design a clean-room TypeScript data model and state machine for Quote -> Invoice conversion preserving referential lineage."
  }]
})
```

### Invoking the Security Evaluator:
```ts
invoke_subagent({
  Subagents: [{
    TypeName: "security-evaluator",
    Role: "Security & Cryptographic Auditor",
    Prompt: "Audit the client portal token generation and verification logic. Ensure HMAC-SHA256 signatures use timingSafeEqual with buffer length validation and tests verify tamper-resistance."
  }]
})
```

### Invoking the Feature Builder:
```ts
invoke_subagent({
  Subagents: [{
    TypeName: "app-feature-builder",
    Role: "Full-Stack Feature Engineer",
    Prompt: "Build the responsive Next.js QuoteView component and history notes timeline matching the approved architectural specification. Include automated integration tests."
  }]
})
```
