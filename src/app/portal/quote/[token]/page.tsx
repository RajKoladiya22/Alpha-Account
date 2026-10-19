"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ClientPortalView } from "../../../../components/portal/ClientPortalView";

export default function PortalQuotePage() {
  const params = useParams();
  const token = params?.token as string;

  const [quote, setQuote] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPortalQuote = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/portal/quote/${token}`);
      const data = await res.json();
      if (data.success && data.quote) {
        setQuote(data.quote);
      } else {
        setError(data.error || "Quote link is invalid or expired.");
      }
    } catch (e: any) {
      setError(e.message || "Failed to load quote");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchPortalQuote();
  }, [token]);

  const handleAccept = async (comment?: string) => {
    const res = await fetch(`/api/portal/quote/${token}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment }),
    });
    const data = await res.json();
    if (data.success) {
      fetchPortalQuote();
    } else {
      alert(data.error || "Failed to accept quote");
    }
  };

  const handleDecline = async (reason: string) => {
    const res = await fetch(`/api/portal/quote/${token}/decline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    if (data.success) {
      fetchPortalQuote();
    } else {
      alert(data.error || "Failed to decline quote");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f5f7] flex items-center justify-center text-gray-500">
        Loading quotation document...
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-[#f4f5f7] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <div className="text-red-500 text-3xl mb-3">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Quote Unavailable</h2>
          <p className="text-sm text-gray-600 mb-6">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <ClientPortalView
      quote={quote}
      organizationName={quote.organizationName}
      onAccept={handleAccept}
      onDecline={handleDecline}
      onPrintPdf={() => window.print()}
    />
  );
}
