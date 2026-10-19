"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "../../../components/layout/AppHeader";
import { AddContactForm } from "../../../components/contacts/AddContactForm";

export default function AddContactPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const handleSaveContact = async (contactData: any) => {
    if (submitting) return;
    try {
      setSubmitting(true);
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(contactData),
      });

      const data = await res.json();
      if (data.success) {
        router.push("/contacts/customers");
      } else {
        alert(data.error || "Failed to create contact");
      }
    } catch (err: any) {
      alert(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <AppHeader
        organizationName="Alpha Steel Frames"
        activeNav="Contacts"
        userInitials="AA"
      />
      <main>
        <AddContactForm
          onSave={handleSaveContact}
          onCancel={() => router.push("/contacts/customers")}
        />
      </main>
    </div>
  );
}
