"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppHeader } from "../../../../components/layout/AppHeader";
import { QuoteEditor } from "../../../../components/quotes/QuoteEditor";

export default function EditQuotePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/quotes/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.quote) {
          setQuote(data.quote);
        }
      })
      .catch((err) => {
        console.error("Failed to load quote:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  const handleUpdate = async (formData: any, newStatus?: string) => {
    if (submitting) return;
    try {
      setSubmitting(true);
      const res = await fetch(`/api/quotes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          status: newStatus || quote.status,
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push(`/quotes/${id}`);
      } else {
        alert(data.error || "Failed to update quotation");
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
        activeNav="Quotes"
        userInitials="AA"
      />
      <main>
        {loading ? (
          <div className="max-w-7xl mx-auto p-12 text-center text-gray-500">
            Loading quote for editing...
          </div>
        ) : !quote ? (
          <div className="max-w-7xl mx-auto p-12 text-center text-red-500">
            Quote not found.
          </div>
        ) : (
          <QuoteEditor
            initialQuote={quote}
            isEditing={true}
            onSaveAndClose={(data) => handleUpdate(data)}
            onSaveAndAddAnother={(data) => {
              handleUpdate(data);
              router.push("/quotes/new");
            }}
            onSend={(data) => handleUpdate(data, "SENT")}
            onMarkAsSent={(data) => handleUpdate(data, "SENT")}
            onCancel={() => router.push(`/quotes/${id}`)}
          />
        )}
      </main>
    </div>
  );
}
