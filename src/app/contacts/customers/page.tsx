"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "../../../components/layout/AppHeader";
import { CustomerList } from "../../../components/contacts/CustomerList";

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/contacts/customers")
      .then((res) => res.json())
      .then((data) => {
        if (data.customers) {
          setCustomers(data.customers);
        }
      })
      .catch((err) => console.error("Error fetching customers:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <AppHeader
        organizationName="PB Style Homes Pty Ltd"
        activeNav="Contacts"
        userInitials="SB"
      />
      <main>
        {loading && customers.length === 0 ? (
          <div className="max-w-7xl mx-auto p-12 text-center text-gray-500">
            Loading customers...
          </div>
        ) : (
          <CustomerList
            customers={customers}
            onAddNewContact={() => router.push("/contacts/add")}
            onSelectCustomer={(c) => router.push(`/contacts/${c.id}`)}
          />
        )}
      </main>
    </div>
  );
}
