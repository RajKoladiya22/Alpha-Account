"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppHeader } from "../../../components/layout/AppHeader";
import { QuoteView } from "../../../components/quotes/QuoteView";

export default function QuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchQuote = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/quotes/${id}`);
      const data = await res.json();
      if (data.success && data.quote) {
        setQuote(data.quote);
      }
    } catch (err) {
      console.error("Failed to fetch quote:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchQuote();
  }, [id]);

  const handleMarkAccepted = async () => {
    await fetch(`/api/quotes/${id}/accept`, { method: "POST" });
    fetchQuote();
  };

  const handleSend = async () => {
    await fetch(`/api/quotes/${id}/send`, { method: "POST" });
    fetchQuote();
  };

  const handleMarkDeclined = async () => {
    await fetch(`/api/quotes/${id}/decline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: "Declined by request" }),
    });
    fetchQuote();
  };

  const handleConvertToInvoice = async () => {
    const res = await fetch(`/api/quotes/${id}/convert-to-invoice`, { method: "POST" });
    const data = await res.json();
    if (data.success) {
      alert("Quote successfully converted to Invoice!");
      fetchQuote();
    } else {
      alert(data.error || "Failed to convert quote");
    }
  };

  const handleAddNote = async (note: string) => {
    await fetch(`/api/quotes/${id}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });
    fetchQuote();
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <AppHeader
        organizationName="PB Style Homes Pty Ltd"
        activeNav="Sales"
        userInitials="SB"
      />
      <main>
        {loading || !quote ? (
          <div className="max-w-7xl mx-auto p-12 text-center text-gray-500">
            Loading quote details...
          </div>
        ) : (
          <QuoteView
            quote={quote}
            organizationName="PB Style Homes Pty Ltd"
            onBackToList={() => router.push("/quotes")}
            onMarkAccepted={handleMarkAccepted}
            onSend={handleSend}
            onMarkDeclined={handleMarkDeclined}
            onRevise={() => router.push(`/quotes/new?revise=${id}`)}
            onCopyToInvoice={handleConvertToInvoice}
            onAddNote={handleAddNote}
          />
        )}
      </main>
    </div>
  );
}
