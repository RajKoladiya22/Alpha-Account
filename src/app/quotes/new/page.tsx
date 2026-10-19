"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "../../../components/layout/AppHeader";
import { QuoteEditor } from "../../../components/quotes/QuoteEditor";

export default function NewQuotePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [nextQuoteNumber, setNextQuoteNumber] = useState("QU-0007");

  useEffect(() => {
    fetch("/api/quotes")
      .then((res) => res.json())
      .then((data) => {
        if (data.quotes && data.quotes.length > 0) {
          const maxNum = data.quotes.reduce((max: number, q: any) => {
            const num = parseInt(q.quoteNumber.replace(/\D/g, ""), 10);
            return !isNaN(num) && num > max ? num : max;
          }, 0);
          setNextQuoteNumber(`QU-${String(maxNum + 1).padStart(4, "0")}`);
        }
      })
      .catch(() => {});
  }, []);

  const handleSave = async (formData: any, status = "DRAFT", redirectToList = true) => {
    if (submitting) return;
    try {
      setSubmitting(true);
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          status,
          quoteNumber: formData.quoteNumber || nextQuoteNumber,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (redirectToList) {
          router.push("/quotes");
        } else {
          // Reset or stay on page
          window.location.reload();
        }
      } else {
        alert(data.error || "Failed to save quote");
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
        <QuoteEditor
          initialQuoteNumber={nextQuoteNumber}
          onSaveAndClose={(data) => handleSave(data, "DRAFT", true)}
          onSaveAndAddAnother={(data) => handleSave(data, "DRAFT", false)}
          onSend={(data) => handleSave(data, "SENT", true)}
          onMarkAsSent={(data) => handleSave(data, "SENT", true)}
          onCancel={() => router.push("/quotes")}
        />
      </main>
    </div>
  );
}
