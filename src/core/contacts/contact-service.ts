import crypto from "node:crypto";
import type { ContactEntity, ContactAddress, PrimaryPerson } from "../../types/index.ts";

export interface CreateContactInput {
  tenantId: string;
  name: string;
  accountNumber?: string;
  primaryPerson?: PrimaryPerson;
  email?: string;
  phone?: string;
  address?: ContactAddress;
  postalAddress?: ContactAddress;
  isCustomer?: boolean;
  isSupplier?: boolean;
  taxNumber?: string;
  youOwe?: number;
  theyOwe?: number;
  isOverdue?: boolean;
}

export class ContactService {
  private contacts: Map<string, ContactEntity> = new Map();

  constructor() {
    // Pre-populate with realistic mock customers matching screenshot image copy 17.png & image copy 13.png
    this.seedDefaults("tenant-default");
  }

  public seedDefaults(tenantId: string) {
    const seedList: CreateContactInput[] = [
      {
        tenantId,
        name: "A&L Windows",
        email: "arvic@alwindows.com.au",
        phone: "0412345678",
        isCustomer: true,
        isSupplier: true,
        youOwe: 29890.67,
        theyOwe: 1124.5,
        isOverdue: true,
        address: { city: "Brisbane", state: "Queensland", country: "Australia" },
      },
      {
        tenantId,
        name: "Abhishake Sahota",
        email: "abhisheksahota6@gmail.com",
        phone: "0484865243",
        isCustomer: true,
        isSupplier: false,
        youOwe: 0,
        theyOwe: 61125.0,
        isOverdue: true,
        address: {
          street: "U38/99 Second ave",
          city: "Marsden",
          state: "Queensland",
          postalCode: "4132",
          country: "Australia",
        },
      },
      {
        tenantId,
        name: "AJMER SINGH & KAMALJEET KAUR",
        email: "singhajmerpb60@gmail.com",
        phone: "0421473853",
        isCustomer: true,
        isSupplier: false,
        youOwe: 0,
        theyOwe: 0,
        isOverdue: false,
        address: {
          street: "WATER TOWER STREET",
          city: "PARK RIDGE",
          state: "Queensland",
          postalCode: "4125",
          country: "Australia",
        },
      },
      {
        tenantId,
        name: "AKASH KUMAR VASWANI",
        email: "akashvaswani1@gmail.com",
        phone: "0405901041",
        isCustomer: true,
        isSupplier: false,
        youOwe: 0,
        theyOwe: 0,
        isOverdue: false,
        address: {
          street: "42 Rushton st",
          city: "Runcorn",
          state: "Queensland",
          postalCode: "4113",
          country: "Australia",
        },
      },
      {
        tenantId,
        name: "All State Painting",
        email: "allstatepainting@bigpond.com",
        isCustomer: true,
        isSupplier: true,
        youOwe: 0,
        theyOwe: 2740.32,
        isOverdue: true,
      },
      {
        tenantId,
        name: "Amandeep Kaur & Amandeep Singh",
        email: "amandeep12594@gmail.com",
        phone: "0478511781",
        isCustomer: true,
        isSupplier: false,
        youOwe: 0,
        theyOwe: 800.0,
        isOverdue: true,
        address: {
          street: "U2/32 Rural st",
          city: "Park Ridge",
          state: "Queensland",
          postalCode: "4125",
        },
      },
      {
        tenantId,
        name: "Kuljit Singh Birk",
        email: "kuljit@example.com",
        phone: "0499887766",
        isCustomer: true,
        isSupplier: false,
        youOwe: 0,
        theyOwe: 14500.0,
        isOverdue: false,
      },
    ];

    for (const c of seedList) {
      this.createContact(c);
    }
  }

  public createContact(input: CreateContactInput): ContactEntity {
    if (!input.name || input.name.trim() === "") {
      throw new Error("Contact name is required");
    }

    const id = crypto.randomUUID();
    const now = new Date();

    const contact: ContactEntity = {
      id,
      tenantId: input.tenantId,
      name: input.name.trim(),
      accountNumber: input.accountNumber,
      primaryPerson: input.primaryPerson,
      email: input.email || input.primaryPerson?.email,
      phone: input.phone,
      address: input.address,
      postalAddress: input.postalAddress,
      isCustomer: input.isCustomer !== undefined ? input.isCustomer : true,
      isSupplier: input.isSupplier !== undefined ? input.isSupplier : false,
      taxNumber: input.taxNumber,
      youOwe: input.youOwe || 0,
      theyOwe: input.theyOwe || 0,
      isOverdue: input.isOverdue || false,
      createdAt: now,
      updatedAt: now,
    };

    this.contacts.set(id, contact);
    return contact;
  }

  public getContactById(tenantId: string, contactId: string): ContactEntity | null {
    const contact = this.contacts.get(contactId);
    if (!contact || contact.tenantId !== tenantId) {
      return null;
    }
    return contact;
  }

  public listContacts(
    tenantId: string,
    filter?: { isCustomer?: boolean; isSupplier?: boolean; search?: string }
  ): ContactEntity[] {
    let list = Array.from(this.contacts.values()).filter((c) => c.tenantId === tenantId);

    if (filter?.isCustomer !== undefined) {
      list = list.filter((c) => c.isCustomer === filter.isCustomer);
    }

    if (filter?.isSupplier !== undefined) {
      list = list.filter((c) => c.isSupplier === filter.isSupplier);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.phone && c.phone.includes(q))
      );
    }

    return list.sort((a, b) => a.name.localeCompare(b.name));
  }
}
