import test from "node:test";
import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import { AppServer } from "../src/server/app-server.ts";
import { UserRole } from "../src/types/index.ts";

class MockRequest extends EventEmitter {
  public method: string;
  public url: string;
  public headers: Record<string, string>;

  constructor(
    method: string,
    url: string,
    headers: Record<string, string> = {},
    body?: any
  ) {
    super();
    this.method = method;
    this.url = url;
    this.headers = headers;

    process.nextTick(() => {
      if (body !== undefined) {
        this.emit("data", typeof body === "string" ? body : JSON.stringify(body));
      }
      this.emit("end");
    });
  }
}

class MockResponse extends EventEmitter {
  public statusCode = 200;
  public headers: Record<string, string> = {};
  public body = "";

  writeHead(statusCode: number, headers: Record<string, string> = {}) {
    this.statusCode = statusCode;
    this.headers = headers;
  }

  end(data?: string) {
    if (data) this.body += data;
    this.emit("finish");
  }
}

async function dispatch(
  server: AppServer,
  method: string,
  url: string,
  headers: Record<string, string> = {},
  body?: any
) {
  const req = new MockRequest(method, url, headers, body);
  const res = new MockResponse();
  const finished = new Promise<void>((resolve) => res.on("finish", resolve));
  await server.handleRequest(req as any, res as any);
  await finished;

  let parsed = null;
  try {
    parsed = JSON.parse(res.body);
  } catch {}

  return {
    status: res.statusCode,
    headers: res.headers,
    data: parsed,
    text: res.body,
  };
}

test("AppServer: End-to-End REST APIs for Quotes, Contacts, Portal, and Settings", async (t) => {
  const server = new AppServer();
  const tenantId = "tenant-e2e";

  let createdQuoteId = "";
  let portalToken = "";

  await t.test("POST /api/quotes: Creates new quote with lines and calculation", async () => {
    const res = await dispatch(
      server,
      "POST",
      "/api/quotes",
      {
        "content-type": "application/json",
        "x-tenant-id": tenantId,
        "x-user-role": UserRole.OWNER,
      },
      {
        contactId: "Kuljit Singh Birk",
        reference: "JOB-402",
        lines: [
          { description: "Site Excavation", quantity: 1, unitPrice: 3500, taxRate: 10 },
          { description: "Concrete Footings", quantity: 2, unitPrice: 1200, taxRate: 10 },
        ],
      }
    );

    assert.equal(res.status, 201);
    assert.equal(res.data.success, true);
    assert.ok(res.data.quote.id);
    assert.equal(res.data.quote.subtotal, 5900);
    assert.equal(res.data.quote.taxTotal, 590);
    assert.equal(res.data.quote.totalAmount, 6490);
    createdQuoteId = res.data.quote.id;
  });

  await t.test("GET /api/quotes: Lists quotes with tab counts", async () => {
    const res = await dispatch(
      server,
      "GET",
      "/api/quotes?status=ALL",
      {
        "x-tenant-id": tenantId,
        "x-user-role": UserRole.OWNER,
      }
    );

    assert.equal(res.status, 200);
    assert.equal(res.data.success, true);
    assert.equal(res.data.quotes.length, 1);
    assert.equal(res.data.counts.ALL, 1);
    assert.equal(res.data.counts.DRAFT, 1);
  });

  await t.test("POST /api/quotes/:id/send: Marks quote as sent", async () => {
    const res = await dispatch(
      server,
      "POST",
      `/api/quotes/${createdQuoteId}/send`,
      {
        "content-type": "application/json",
        "x-tenant-id": tenantId,
        "x-user-role": UserRole.OWNER,
      },
      { markOnly: true, authorName: "Kuljit" }
    );

    assert.equal(res.status, 200);
    assert.equal(res.data.quote.status, "SENT");
  });

  await t.test("POST /api/quotes/:id/notes: Adds internal team note", async () => {
    const res = await dispatch(
      server,
      "POST",
      `/api/quotes/${createdQuoteId}/notes`,
      {
        "content-type": "application/json",
        "x-tenant-id": tenantId,
        "x-user-role": UserRole.OWNER,
      },
      { note: "Client requested start date mid-next month.", authorName: "Kuljit" }
    );

    assert.equal(res.status, 201);
    assert.equal(res.data.note.detail, "Client requested start date mid-next month.");
  });

  await t.test("GET /api/quotes/:id/portal-link: Generates signed client link", async () => {
    const res = await dispatch(
      server,
      "GET",
      `/api/quotes/${createdQuoteId}/portal-link`,
      {
        "x-tenant-id": tenantId,
        "x-user-role": UserRole.OWNER,
      }
    );

    assert.equal(res.status, 200);
    assert.ok(res.data.token);
    assert.ok(res.data.link.includes("/portal/quote/"));
    portalToken = res.data.token;
  });

  await t.test("GET /api/portal/quote/:token: Public customer view", async () => {
    const res = await dispatch(
      server,
      "GET",
      `/api/portal/quote/${portalToken}`
    );

    assert.equal(res.status, 200);
    assert.equal(res.data.quote.id, createdQuoteId);
    assert.equal(res.data.quote.totalAmount, 6490);
  });

  await t.test("POST /api/portal/quote/:token/accept: Customer accepts online", async () => {
    const res = await dispatch(
      server,
      "POST",
      `/api/portal/quote/${portalToken}/accept`,
      { "content-type": "application/json" },
      { comment: "Looks great, please commence excavation." }
    );

    assert.equal(res.status, 200);
    assert.equal(res.data.quote.status, "ACCEPTED");
  });

  await t.test("POST /api/quotes/:id/convert-to-invoice: Invariant 3 Lineage Conversion", async () => {
    const res = await dispatch(
      server,
      "POST",
      `/api/quotes/${createdQuoteId}/convert-to-invoice`,
      {
        "content-type": "application/json",
        "x-tenant-id": tenantId,
        "x-user-role": UserRole.OWNER,
      }
    );

    assert.equal(res.status, 200);
    assert.equal(res.data.quote.status, "CONVERTED_TO_INVOICE");
    assert.ok(res.data.invoice.id);
    assert.equal(res.data.invoice.sourceQuoteId, createdQuoteId);
    assert.equal(res.data.invoice.totalAmount, 6490);
  });

  await t.test("GET /api/contacts/customers: Returns customers with balances", async () => {
    const res = await dispatch(
      server,
      "GET",
      "/api/contacts/customers",
      {
        "x-tenant-id": "tenant-default",
        "x-user-role": UserRole.OWNER,
      }
    );

    assert.equal(res.status, 200);
    assert.ok(res.data.customers.length >= 6);
  });

  await t.test("GET /api/settings and PUT /api/settings", async () => {
    const getRes = await dispatch(
      server,
      "GET",
      "/api/settings",
      { "x-tenant-id": tenantId }
    );
    assert.equal(getRes.status, 200);

    const putRes = await dispatch(
      server,
      "PUT",
      "/api/settings",
      {
        "content-type": "application/json",
        "x-tenant-id": tenantId,
        "x-user-role": UserRole.OWNER,
      },
      { defaultQuoteExpiryDays: 45 }
    );

    assert.equal(putRes.status, 200);
    assert.equal(putRes.data.settings.defaultQuoteExpiryDays, 45);
  });
});
