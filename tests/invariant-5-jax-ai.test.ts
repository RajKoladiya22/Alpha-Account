// Tests: Invariant 5 - Streaming Assistant (JAX) & Cross-MFE Event Bus

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { DocumentLifecycleEngine } from "../src/core/documents/state-machine.ts";
import { JaxAgentGateway } from "../src/core/ai/jax-agent-gateway.ts";
import type { JaxStreamChunk } from "../src/core/ai/jax-agent-gateway.ts";
import { CrossMfeEventBus } from "../src/mfe/event-bus.ts";
import type { MfeEvent } from "../src/mfe/event-bus.ts";

describe("Invariant 5: Streaming Assistive AI (JAX) & Audited Tool Calling", () => {
  const docEngine = new DocumentLifecycleEngine();
  const jaxGateway = new JaxAgentGateway(docEngine);
  const tenantId = "tenant_delta";
  const userId = "user_raj_1";

  // Pre-seed catalog item
  jaxGateway.registerCatalogItem(tenantId, {
    itemCode: "LANDSCAPING",
    name: "Ground Maintenance & Landscaping",
    salesUnitPrice: 180.0,
    taxRate: 10.0,
  });

  test("JAX processes natural language instruction with audited tool calls", async () => {
    const prompt = "Invoice Raj for last week's landscaping work";
    const chunks: JaxStreamChunk[] = [];

    for await (const chunk of jaxGateway.processStreamingPrompt(tenantId, userId, prompt)) {
      chunks.push(chunk);
    }

    // 1. Verify stream chunk progression
    assert.ok(chunks.some((c) => c.type === "THINKING"));
    assert.ok(chunks.some((c) => c.type === "TOOL_CALL_START" && c.toolName === "lookup_item_prices"));
    assert.ok(chunks.some((c) => c.type === "TOOL_CALL_RESULT" && c.toolName === "lookup_item_prices"));
    assert.ok(chunks.some((c) => c.type === "TOOL_CALL_START" && c.toolName === "create_draft_invoice"));
    assert.ok(chunks.some((c) => c.type === "TOOL_CALL_RESULT" && c.toolName === "create_draft_invoice"));
    assert.ok(chunks.some((c) => c.type === "TOOL_CALL_START" && c.toolName === "draft_customer_email"));
    assert.ok(chunks.some((c) => c.type === "MESSAGE_CHUNK"));
    assert.ok(chunks.some((c) => c.type === "COMPLETE"));

    // 2. Invariant 5 Verification: Check audit log
    const auditLogs = jaxGateway.getAuditLog(tenantId);
    assert.equal(auditLogs.length, 3); // lookup_item_prices, create_draft_invoice, draft_customer_email

    const lookupAudit = auditLogs.find((a) => a.toolName === "lookup_item_prices");
    assert.ok(lookupAudit);
    assert.equal(lookupAudit.userId, userId);

    const invoiceAudit = auditLogs.find((a) => a.toolName === "create_draft_invoice");
    assert.ok(invoiceAudit);
    assert.equal(invoiceAudit.parameters.contactId, "Raj");

    // 3. Verify actual invoice was created in DocumentLifecycleEngine
    const createdInvoiceId = invoiceAudit.result.invoiceId;
    const inv = docEngine.getInvoice(createdInvoiceId);
    assert.ok(inv);
    assert.equal(inv.contactId, "Raj");
    assert.equal(inv.lines[0].itemCode, "LANDSCAPING");
    assert.equal(inv.lines[0].unitPrice, 180.0); // Catalog price retrieved
    // 8 hours * 180 = 1440 subtotal + 10% tax (144) = 1584 total
    assert.equal(inv.totalAmount, 1584.0);
  });

  test("Cross-MFE Event Bus decouples micro-frontends", () => {
    const eventBus = new CrossMfeEventBus();
    const receivedEvents: MfeEvent[] = [];

    // Subscribe Invoicing MFE
    const unbind = eventBus.subscribe("INVOICE_CREATED", (event) => {
      receivedEvents.push(event);
    });

    // Publish event from JAX Assistant MFE
    eventBus.publish({
      type: "INVOICE_CREATED",
      tenantId: "tenant_delta",
      sourceMfe: "JAX",
      payload: { invoiceNumber: "INV-JAX-001", amount: 1584.0 },
      timestamp: new Date(),
    });

    assert.equal(receivedEvents.length, 1);
    assert.equal(receivedEvents[0].sourceMfe, "JAX");
    assert.equal(receivedEvents[0].payload.invoiceNumber, "INV-JAX-001");

    // Test unbind
    unbind();
    eventBus.publish({
      type: "INVOICE_CREATED",
      tenantId: "tenant_delta",
      sourceMfe: "JAX",
      payload: { invoiceNumber: "INV-JAX-002", amount: 200.0 },
      timestamp: new Date(),
    });
    // Should still be 1 because listener was unbound
    assert.equal(receivedEvents.length, 1);
  });
});
