"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "../../../components/layout/AppHeader";
import { CustomerList } from "../../../components/contacts/CustomerList";

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const fetchCustomers = async () => {
    try {
      const res = await fetch("/api/contacts/customers");
      const data = await res.json();
      if (data.customers) {
        setCustomers(data.customers);
      }
    } catch (err) {
      console.error("Error fetching customers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleHardDelete = async (id: string, name: string) => {
    try {
      const res = await fetch(`/api/contacts/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setCustomers((prev) => prev.filter((c) => c.id !== id));
        setNotification({
          type: "success",
          message: `Customer "${name}" has been permanently deleted from database.`,
        });
        setTimeout(() => setNotification(null), 4000);
      } else {
        setNotification({
          type: "error",
          message: data.error || "Failed to delete customer",
        });
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Failed to delete customer",
      });
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleBatchHardDelete = async (ids: string[]) => {
    try {
      const res = await fetch("/api/contacts", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (data.success) {
        setCustomers((prev) => prev.filter((c) => !ids.includes(c.id)));
        setNotification({
          type: "success",
          message: `${ids.length} contacts permanently deleted from database.`,
        });
        setTimeout(() => setNotification(null), 4000);
      } else {
        setNotification({
          type: "error",
          message: data.error || "Failed to batch delete contacts",
        });
        setTimeout(() => setNotification(null), 4000);
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Failed to batch delete contacts",
      });
      setTimeout(() => setNotification(null), 4000);
    }
  };

  const handleUpdateCustomer = async (updatedData: any) => {
    try {
      const res = await fetch(`/api/contacts/${updatedData.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedData),
      });
      const data = await res.json();
      if (data.success && data.contact) {
        setCustomers((prev) =>
          prev.map((c) => (c.id === updatedData.id ? { ...c, ...data.contact } : c))
        );
        setNotification({
          type: "success",
          message: `Customer "${data.contact.name}" updated successfully.`,
        });
        setTimeout(() => setNotification(null), 4000);
        return true;
      } else {
        setNotification({
          type: "error",
          message: data.error || "Failed to update customer",
        });
        setTimeout(() => setNotification(null), 4000);
        return false;
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        message: err.message || "Failed to update customer",
      });
      setTimeout(() => setNotification(null), 4000);
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <AppHeader
        organizationName="Alpha Steel Frames"
        activeNav="Contacts"
        userInitials="AA"
      />

      {/* Global Notification Banner */}
      {notification && (
        <div className="max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 pt-4">
          <div
            className={`p-3.5 rounded-md flex items-center justify-between text-sm sm:text-base font-medium shadow-xs animate-in fade-in duration-150 ${
              notification.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            <div className="flex items-center space-x-2">
              <span>{notification.type === "success" ? "✓" : "⚠️"}</span>
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-gray-400 hover:text-gray-600 font-bold ml-4"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <main>
        {loading && customers.length === 0 ? (
          <div className="max-w-[1720px] mx-auto p-12 text-center text-gray-500">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#006fe6] mb-3"></div>
            <p>Loading customers...</p>
          </div>
        ) : (
          <CustomerList
            customers={customers}
            onAddNewContact={() => router.push("/contacts/add")}
            onSelectCustomer={(c) => router.push(`/contacts/${c.id}`)}
            onDeleteCustomer={handleHardDelete}
            onBatchDeleteCustomers={handleBatchHardDelete}
            onUpdateCustomer={handleUpdateCustomer}
          />
        )}
      </main>
    </div>
  );
}
