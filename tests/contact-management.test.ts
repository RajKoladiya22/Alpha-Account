import test from "node:test";
import assert from "node:assert/strict";
import { ContactService } from "../src/core/contacts/contact-service.ts";

test("ContactService: Customers & Suppliers Management", async (t) => {
  const contactService = new ContactService();
  const tenantId = "tenant-contact-test";

  await t.test("Seeds default customers matching screenshot image copy 17.png", () => {
    contactService.seedDefaults(tenantId);
    const customers = contactService.listContacts(tenantId, { isCustomer: true });
    assert.ok(customers.length >= 6);

    const alWindows = customers.find((c) => c.name === "A&L Windows");
    assert.ok(alWindows);
    assert.equal(alWindows.youOwe, 29890.67);
    assert.equal(alWindows.theyOwe, 1124.5);
    assert.equal(alWindows.isOverdue, true);

    const sahota = customers.find((c) => c.name === "Abhishake Sahota");
    assert.ok(sahota);
    assert.equal(sahota.theyOwe, 61125.0);
    assert.equal(sahota.isOverdue, true);
  });

  await t.test("Creates new customer with structured addresses and primary person", () => {
    const newCustomer = contactService.createContact({
      tenantId,
      name: "Summit Construction Pty Ltd",
      accountNumber: "ACC-5001",
      primaryPerson: {
        firstName: "Marcus",
        lastName: "Vance",
        email: "marcus@summit.com.au",
      },
      address: {
        street: "12 Queen St",
        city: "Brisbane",
        state: "QLD",
        postalCode: "4000",
      },
      isCustomer: true,
      theyOwe: 18500.0,
      isOverdue: false,
    });

    assert.ok(newCustomer.id);
    assert.equal(newCustomer.name, "Summit Construction Pty Ltd");
    assert.equal(newCustomer.email, "marcus@summit.com.au");

    const retrieved = contactService.getContactById(tenantId, newCustomer.id);
    assert.equal(retrieved?.accountNumber, "ACC-5001");
  });

  await t.test("Search filter matches by name, email, or phone", () => {
    const searchByName = contactService.listContacts(tenantId, { search: "Summit" });
    assert.equal(searchByName.length, 1);
    assert.equal(searchByName[0].name, "Summit Construction Pty Ltd");

    const searchByEmail = contactService.listContacts(tenantId, { search: "marcus@" });
    assert.equal(searchByEmail.length, 1);
  });
});
