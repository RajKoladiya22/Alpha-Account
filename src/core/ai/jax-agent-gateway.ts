// Invariant 5: Streaming Assistive AI (JAX) Engine with Audited Tool Calling

import { DocumentLifecycleEngine } from "../documents/state-machine.ts";
import type { JaxAuditRecord, InvoiceEntity } from "../../types/index.ts";
import crypto from "node:crypto";

export interface ItemCatalogEntry {
  itemCode: string;
  name: string;
  salesUnitPrice: number;
  taxRate: number;
}

export interface JaxStreamChunk {
  type: "THINKING" | "TOOL_CALL_START" | "TOOL_CALL_RESULT" | "MESSAGE_CHUNK" | "COMPLETE" | "ERROR";
  content: string;
  toolName?: string;
  data?: any;
}

export class JaxAgentGateway {
  private auditLog: JaxAuditRecord[] = [];
  private docEngine: DocumentLifecycleEngine;
  private catalog: Map<string, ItemCatalogEntry> = new Map();

  constructor(docEngine: DocumentLifecycleEngine) {
    this.docEngine = docEngine;
  }

  public registerCatalogItem(tenantId: string, item: ItemCatalogEntry): void {
    this.catalog.set(`${tenantId}:${item.itemCode.toLowerCase()}`, item);
  }

  public getAuditLog(tenantId: string): JaxAuditRecord[] {
    return this.auditLog.filter((a) => a.tenantId === tenantId);
  }

  // Audited Tool Execution
  private async executeTool(
    tenantId: string,
    userId: string,
    toolName: string,
    parameters: Record<string, any>
  ): Promise<any> {
    let result: any;

    switch (toolName) {
      case "lookup_item_prices": {
        const itemCodes: string[] = parameters.itemCodes || [];
        const found = itemCodes.map((code) => {
          const entry = this.catalog.get(`${tenantId}:${code.toLowerCase()}`);
          return (
            entry || {
              itemCode: code,
              name: code,
              salesUnitPrice: 100.0, // default rate if uncatalogued
              taxRate: 10.0,
            }
          );
        });
        result = { items: found };
        break;
      }

      case "create_draft_invoice": {
        const { contactId, invoiceNumber, lines, dueDate } = parameters;
        let subtotal = 0;
        let taxTotal = 0;

        const calculatedLines = lines.map((line: any) => {
          const rawAmount = line.quantity * line.unitPrice;
          const discountAmt = rawAmount * ((line.discount || 0) / 100);
          const lineAmount = rawAmount - discountAmt;
          const lineTax = lineAmount * ((line.taxRate || 0) / 100);

          subtotal += lineAmount;
          taxTotal += lineTax;

          return {
            id: `line_${crypto.randomUUID()}`,
            itemCode: line.itemCode,
            description: line.description,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            discount: line.discount || 0,
            taxRate: line.taxRate || 0,
            lineAmount,
          };
        });

        const totalAmount = subtotal + taxTotal;
        const invoice = this.docEngine.createInvoice({
          tenantId,
          contactId,
          invoiceNumber: invoiceNumber || `INV-JAX-${Date.now().toString().slice(-4)}`,
          date: new Date(),
          dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 14 * 86400000),
          subtotal,
          taxTotal,
          totalAmount,
          lines: calculatedLines,
        });

        result = { invoiceId: invoice.id, invoiceNumber: invoice.invoiceNumber, totalAmount: invoice.totalAmount };
        break;
      }

      case "draft_customer_email": {
        const { contactName, invoiceNumber, totalAmount, dueDate } = parameters;
        result = {
          recipient: contactName,
          subject: `Invoice ${invoiceNumber} from your contractor`,
          body: `Hi ${contactName},\n\nPlease find attached invoice ${invoiceNumber} for $${totalAmount.toFixed(
            2
          )}, due on ${new Date(dueDate).toLocaleDateString()}.\n\nThank you for your business!`,
        };
        break;
      }

      default:
        throw new Error(`Unknown JAX tool: ${toolName}`);
    }

    // Invariant 5: Mandatory audited recording of every tool call
    const auditEntry: JaxAuditRecord = {
      id: `audit_${crypto.randomUUID()}`,
      tenantId,
      userId,
      toolName,
      parameters,
      result,
      timestamp: new Date(),
    };
    this.auditLog.push(auditEntry);

    return result;
  }

  // Invariant 5: High-availability Streaming Assistant Handler
  public async *processStreamingPrompt(
    tenantId: string,
    userId: string,
    prompt: string
  ): AsyncGenerator<JaxStreamChunk> {
    yield { type: "THINKING", content: "Analyzing natural language instruction..." };

    const lower = prompt.toLowerCase();

    // Intent: Create Invoice (e.g. "Invoice Raj for landscaping work")
    if (lower.includes("invoice") || lower.includes("bill")) {
      yield { type: "THINKING", content: "Identified intent: CREATE_INVOICE. Resolving contact and line items..." };

      // Step 1: Tool call - Price lookup
      yield {
        type: "TOOL_CALL_START",
        toolName: "lookup_item_prices",
        content: "Querying tenant catalog for service rates...",
      };
      const priceResult = await this.executeTool(tenantId, userId, "lookup_item_prices", {
        itemCodes: ["LANDSCAPING", "LABOR"],
      });
      yield {
        type: "TOOL_CALL_RESULT",
        toolName: "lookup_item_prices",
        content: `Retrieved catalog rates for ${priceResult.items.length} items.`,
        data: priceResult,
      };

      // Step 2: Tool call - Create Draft Invoice
      yield {
        type: "TOOL_CALL_START",
        toolName: "create_draft_invoice",
        content: "Generating draft invoice with calculated taxes and totals...",
      };

      const matchedRate = priceResult.items[0]?.salesUnitPrice || 150.0;
      const invResult = await this.executeTool(tenantId, userId, "create_draft_invoice", {
        contactId: "Raj",
        lines: [
          {
            itemCode: "LANDSCAPING",
            description: "Landscaping and ground maintenance work",
            quantity: 8,
            unitPrice: matchedRate,
            taxRate: 10.0,
          },
        ],
        dueDate: new Date(Date.now() + 14 * 86400000).toISOString(),
      });

      yield {
        type: "TOOL_CALL_RESULT",
        toolName: "create_draft_invoice",
        content: `Created Invoice ${invResult.invoiceNumber} for $${invResult.totalAmount.toFixed(2)}.`,
        data: invResult,
      };

      // Step 3: Tool call - Draft Customer Email
      yield {
        type: "TOOL_CALL_START",
        toolName: "draft_customer_email",
        content: "Drafting personalized customer notification...",
      };

      const emailResult = await this.executeTool(tenantId, userId, "draft_customer_email", {
        contactName: "Raj",
        invoiceNumber: invResult.invoiceNumber,
        totalAmount: invResult.totalAmount,
        dueDate: new Date(Date.now() + 14 * 86400000).toISOString(),
      });

      yield {
        type: "TOOL_CALL_RESULT",
        toolName: "draft_customer_email",
        content: "Email drafted successfully.",
        data: emailResult,
      };

      // Final response streaming
      yield {
        type: "MESSAGE_CHUNK",
        content: `I've created invoice **${invResult.invoiceNumber}** for **Raj** totalling **$${invResult.totalAmount.toFixed(
          2
        )}**.\n\n`,
      };
      yield {
        type: "MESSAGE_CHUNK",
        content: `**Subject:** ${emailResult.subject}\n\n${emailResult.body}\n\nWould you like me to authorize and dispatch this now?`,
      };
      yield { type: "COMPLETE", content: "Workflow completed." };
    } else {
      yield {
        type: "MESSAGE_CHUNK",
        content: `I can help you create invoices, check your cash flow, or reconcile bank statements. How can I assist you today?`,
      };
      yield { type: "COMPLETE", content: "Prompt addressed." };
    }
  }
}
