import http from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { QuoteService } from "../core/quotes/quote-service.ts";
import { ContactService } from "../core/contacts/contact-service.ts";
import { ClientPortalService } from "../core/portal/client-portal-service.ts";
import { TenantService } from "../core/tenancy/tenant-service.ts";
import { RbacService } from "../core/auth/rbac-service.ts";
import { UserRole } from "../types/index.ts";
import type { UserRole as UserRoleType } from "../types/index.ts";

export interface ServerServices {
  quoteService: QuoteService;
  contactService: ContactService;
  portalService: ClientPortalService;
  tenantService: TenantService;
  rbacService: RbacService;
}

export class AppServer {
  public quoteService: QuoteService;
  public contactService: ContactService;
  public portalService: ClientPortalService;
  public tenantService: TenantService;
  public rbacService: RbacService;
  private server: http.Server | null = null;

  constructor(customServices?: Partial<ServerServices>) {
    this.quoteService = customServices?.quoteService || new QuoteService();
    this.contactService = customServices?.contactService || new ContactService();
    this.portalService =
      customServices?.portalService || new ClientPortalService(this.quoteService);
    this.tenantService = customServices?.tenantService || new TenantService();
    this.rbacService = customServices?.rbacService || new RbacService();
  }

  private sendJson(res: ServerResponse, statusCode: number, data: any) {
    res.writeHead(statusCode, {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, x-tenant-id, x-user-role",
    });
    res.end(JSON.stringify(data));
  }

  private async parseJsonBody(req: IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        if (!body) {
          resolve({});
          return;
        }
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error("Invalid JSON body"));
        }
      });
      req.on("error", reject);
    });
  }

  public async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const pathname = url.pathname;
    const method = req.method || "GET";

    if (method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, x-tenant-id, x-user-role",
      });
      res.end();
      return;
    }

    try {
      // 1. PUBLIC CLIENT PORTAL APIS (No login required; secured via HMAC token)
      if (pathname.startsWith("/api/portal/quote/")) {
        const token = pathname.replace("/api/portal/quote/", "").split("/")[0];

        if (pathname === `/api/portal/quote/${token}` && method === "GET") {
          const quote = this.portalService.getQuoteForClient(token);
          this.sendJson(res, 200, { success: true, quote });
          return;
        }

        if (pathname === `/api/portal/quote/${token}/accept` && method === "POST") {
          const body = await this.parseJsonBody(req);
          const quote = this.portalService.clientAcceptQuote(token, body.comment);
          this.sendJson(res, 200, { success: true, message: "Quote accepted successfully", quote });
          return;
        }

        if (pathname === `/api/portal/quote/${token}/decline` && method === "POST") {
          const body = await this.parseJsonBody(req);
          if (!body.reason) {
            this.sendJson(res, 400, { error: "Decline reason is required" });
            return;
          }
          const quote = this.portalService.clientDeclineQuote(token, body.reason);
          this.sendJson(res, 200, { success: true, message: "Quote declined", quote });
          return;
        }
      }

      // 2. TENANT-AUTHENTICATED CONTEXT EXTRACTION
      const tenantId = (req.headers["x-tenant-id"] as string) || "tenant-default";
      const userRole = ((req.headers["x-user-role"] as string) || UserRole.OWNER) as UserRoleType;

      // ==========================================
      // QUOTES APIS
      // ==========================================
      if (pathname === "/api/quotes" && method === "GET") {
        this.rbacService.assertPermission(userRole, "VIEW_QUOTES");
        const status = (url.searchParams.get("status") || "ALL") as any;
        const search = url.searchParams.get("search") || undefined;
        const result = this.quoteService.listQuotes(tenantId, { status, search });
        this.sendJson(res, 200, { success: true, ...result });
        return;
      }

      if (pathname === "/api/quotes" && method === "POST") {
        this.rbacService.assertPermission(userRole, "CREATE_QUOTE");
        const body = await this.parseJsonBody(req);
        if (!body.contactId || !body.lines || !Array.isArray(body.lines) || body.lines.length === 0) {
          this.sendJson(res, 400, { error: "Customer and at least one line item are required" });
          return;
        }
        const quote = this.quoteService.createQuote({
          ...body,
          tenantId,
        });
        this.sendJson(res, 201, { success: true, quote });
        return;
      }

      // Single Quote Operations: /api/quotes/:id...
      const quoteMatch = pathname.match(/^\/api\/quotes\/([^/]+)(\/.*)?$/);
      if (quoteMatch) {
        const quoteId = quoteMatch[1];
        const subRoute = quoteMatch[2] || "";

        if (subRoute === "" && method === "GET") {
          this.rbacService.assertPermission(userRole, "VIEW_QUOTES");
          const quote = this.quoteService.getQuoteById(tenantId, quoteId);
          if (!quote) {
            this.sendJson(res, 404, { error: "Quote not found" });
            return;
          }
          this.sendJson(res, 200, { success: true, quote });
          return;
        }

        if (subRoute === "" && method === "PUT") {
          this.rbacService.assertPermission(userRole, "EDIT_QUOTE");
          const body = await this.parseJsonBody(req);
          const quote = this.quoteService.updateQuote(tenantId, quoteId, body);
          this.sendJson(res, 200, { success: true, quote });
          return;
        }

        if (subRoute === "/send" && method === "POST") {
          this.rbacService.assertPermission(userRole, "SEND_QUOTE");
          const body = await this.parseJsonBody(req);
          const quote = this.quoteService.sendQuote(tenantId, quoteId, body);
          this.sendJson(res, 200, { success: true, quote });
          return;
        }

        if (subRoute === "/accept" && method === "POST") {
          this.rbacService.assertPermission(userRole, "EDIT_QUOTE");
          const body = await this.parseJsonBody(req);
          const quote = this.quoteService.acceptQuote(tenantId, quoteId, {
            source: "MANUAL",
            note: body.note,
          });
          this.sendJson(res, 200, { success: true, quote });
          return;
        }

        if (subRoute === "/decline" && method === "POST") {
          this.rbacService.assertPermission(userRole, "EDIT_QUOTE");
          const body = await this.parseJsonBody(req);
          const quote = this.quoteService.declineQuote(tenantId, quoteId, body);
          this.sendJson(res, 200, { success: true, quote });
          return;
        }

        if (subRoute === "/convert-to-invoice" && method === "POST") {
          this.rbacService.assertPermission(userRole, "CONVERT_QUOTE");
          const result = this.quoteService.convertToInvoice(tenantId, quoteId);
          this.sendJson(res, 200, {
            success: true,
            message: "Quote converted to invoice successfully",
            ...result,
          });
          return;
        }

        if (subRoute === "/copy-to-po" && method === "POST") {
          this.rbacService.assertPermission(userRole, "CONVERT_QUOTE");
          const body = await this.parseJsonBody(req);
          const po = this.quoteService.copyToPurchaseOrder(
            tenantId,
            quoteId,
            body.supplierContactId || "supplier-default"
          );
          this.sendJson(res, 200, { success: true, purchaseOrder: po });
          return;
        }

        if (subRoute === "/notes" && method === "POST") {
          const body = await this.parseJsonBody(req);
          if (!body.note) {
            this.sendJson(res, 400, { error: "Note text is required" });
            return;
          }
          const note = this.quoteService.addNote(
            tenantId,
            quoteId,
            body.note,
            body.authorName || "User"
          );
          this.sendJson(res, 201, { success: true, note });
          return;
        }

        if (subRoute === "/attachments" && method === "POST") {
          const body = await this.parseJsonBody(req);
          const attachment = this.quoteService.addAttachment(tenantId, quoteId, {
            name: body.name || "attachment.pdf",
            size: body.size || 1024,
            mimeType: body.mimeType || "application/pdf",
            url: body.url || `/uploads/${Date.now()}-${body.name}`,
          });
          this.sendJson(res, 201, { success: true, attachment });
          return;
        }

        if (subRoute === "/portal-link" && method === "GET") {
          const token = this.portalService.generatePortalToken(tenantId, quoteId);
          const link = `/portal/quote/${token}`;
          this.sendJson(res, 200, { success: true, token, link });
          return;
        }
      }

      // ==========================================
      // CONTACTS APIS
      // ==========================================
      if (pathname === "/api/contacts" && method === "GET") {
        const search = url.searchParams.get("search") || undefined;
        const contacts = this.contactService.listContacts(tenantId, { search });
        this.sendJson(res, 200, { success: true, contacts });
        return;
      }

      if (pathname === "/api/contacts/customers" && method === "GET") {
        const search = url.searchParams.get("search") || undefined;
        const customers = this.contactService.listContacts(tenantId, {
          isCustomer: true,
          search,
        });
        this.sendJson(res, 200, { success: true, customers });
        return;
      }

      if (pathname === "/api/contacts" && method === "POST") {
        const body = await this.parseJsonBody(req);
        const contact = this.contactService.createContact({ ...body, tenantId });
        this.sendJson(res, 201, { success: true, contact });
        return;
      }

      // ==========================================
      // TENANCY & SETTINGS APIS
      // ==========================================
      if (pathname === "/api/organizations" && method === "GET") {
        const userId = (req.headers["x-user-id"] as string) || "user-sb";
        const orgs = this.tenantService.listUserOrganizations(userId);
        this.sendJson(res, 200, { success: true, organizations: orgs });
        return;
      }

      if (pathname === "/api/settings" && method === "GET") {
        const settings = this.tenantService.getSettings(tenantId);
        this.sendJson(res, 200, { success: true, settings });
        return;
      }

      if (pathname === "/api/settings" && method === "PUT") {
        this.rbacService.assertPermission(userRole, "MANAGE_SETTINGS");
        const body = await this.parseJsonBody(req);
        const settings = this.tenantService.updateSettings(tenantId, body);
        this.sendJson(res, 200, { success: true, settings });
        return;
      }

      // Default 404
      this.sendJson(res, 404, { error: `Not found: ${method} ${pathname}` });
    } catch (err: any) {
      this.sendJson(res, 400, {
        error: err.message || "An unexpected error occurred",
      });
    }
  }

  public listen(port = 3000): Promise<number> {
    return new Promise((resolve) => {
      this.server = http.createServer((req, res) => this.handleRequest(req, res));
      this.server.listen(port, () => {
        const actualPort = (this.server?.address() as any)?.port || port;
        resolve(actualPort);
      });
    });
  }

  public close(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }
}
