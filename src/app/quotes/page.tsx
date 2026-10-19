"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "../../components/layout/AppHeader";
import { QuoteList } from "../../components/quotes/QuoteList";

export default function QuotesPage() {
  const router = useRouter();
  const [quotes, setQuotes] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState("ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/quotes?status=${activeTab}&search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.success) {
        setQuotes(data.quotes || []);
        setCounts(data.counts || {});
      }
    } catch (err) {
      console.error("Error fetching quotes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, [activeTab, search]);

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      <AppHeader
        organizationName="Alpha Steel Frames"
        activeNav="Quotes"
        userInitials="AA"
      />
      <main>
        {loading && quotes.length === 0 ? (
          <div className="max-w-7xl mx-auto p-12 text-center text-gray-500">
            Loading quotes...
          </div>
        ) : (
          <QuoteList
            quotes={quotes}
            counts={counts}
            activeStatusTab={activeTab}
            searchQuery={search}
            onSelectStatusTab={(tab) => setActiveTab(tab)}
            onSearchChange={(q) => setSearch(q)}
            onClickNewQuote={() => router.push("/quotes/new")}
            onClickQuoteRow={(id) => router.push(`/quotes/${id}`)}
          />
        )}
      </main>
    </div>
  );
}
