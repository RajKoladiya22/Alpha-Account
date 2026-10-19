import React, { useState } from "react";
import type { QuoteEntity, QuoteStatus } from "../../types/index.ts";

export interface QuoteListProps {
  quotes: QuoteEntity[];
  counts: Record<string, number>;
  activeStatusTab: string;
  searchQuery: string;
  onSelectStatusTab: (status: string) => void;
  onSearchChange: (query: string) => void;
  onClickNewQuote: () => void;
  onClickQuoteRow: (quoteId: string) => void;
  onCopyToInvoice?: (quoteId: string) => void;
  onDeleteQuote?: (quoteId: string) => void;
}

export const QuoteList: React.FC<QuoteListProps> = ({
  quotes,
  counts,
  activeStatusTab,
  searchQuery,
  onSelectStatusTab,
  onSearchChange,
  onClickNewQuote,
  onClickQuoteRow,
  onCopyToInvoice,
  onDeleteQuote,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const tabs = [
    { key: "ALL", label: "All" },
    { key: "DRAFT", label: "Draft" },
    { key: "SENT", label: "Sent" },
    { key: "DECLINED", label: "Declined" },
    { key: "ACCEPTED", label: "Accepted" },
    { key: "CONVERTED_TO_INVOICE", label: "Invoiced" },
  ];

  const handleToggleSelectAll = () => {
    if (selectedIds.size === quotes.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(quotes.map((q) => q.id)));
    }
  };

  const handleToggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const getStatusBadge = (status: QuoteStatus) => {
    switch (status) {
      case "DRAFT":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-300">
            Draft
          </span>
        );
      case "SENT":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
            Sent
          </span>
        );
      case "ACCEPTED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700 border border-green-200">
            Accepted
          </span>
        );
      case "DECLINED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700 border border-red-200">
            Declined
          </span>
        );
      case "CONVERTED_TO_INVOICE":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
            Invoiced
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  const formatDate = (d: Date | string) => {
    const date = new Date(d);
    return date.toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const isExpired = (expiryDate: Date | string, status: QuoteStatus) => {
    const exp = new Date(expiryDate).getTime();
    const now = Date.now();
    return exp < now && status === "SENT";
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 font-sans">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 pb-2 border-b border-gray-200">
        <div>
          <nav className="text-xs text-gray-500 mb-1">
            <span>Business</span> &gt; <span className="text-gray-800 font-medium">Quotes</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">Quotes</h1>
        </div>

        <div className="mt-3 sm:mt-0 flex items-center space-x-3">
          <button
            onClick={onClickNewQuote}
            className="inline-flex items-center px-4 py-2 bg-[#006fe6] hover:bg-[#005bb5] text-white text-sm font-semibold rounded shadow-sm transition"
          >
            New quote
          </button>
        </div>
      </div>

      {/* Status Tabs Bar */}
      <div className="flex border-b border-gray-200 space-x-6 mb-4 overflow-x-auto text-sm">
        {tabs.map((tab) => {
          const isActive = activeStatusTab === tab.key;
          const count = counts[tab.key] || 0;
          return (
            <button
              key={tab.key}
              onClick={() => onSelectStatusTab(tab.key)}
              className={`pb-3 whitespace-nowrap font-medium transition border-b-2 flex items-center space-x-1.5 ${
                isActive
                  ? "border-[#006fe6] text-[#006fe6] font-semibold"
                  : "border-transparent text-gray-500 hover:text-gray-800"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-xs px-1.5 py-0.2 rounded-full ${
                  isActive ? "bg-blue-100 text-[#006fe6]" : "bg-gray-100 text-gray-600"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search quotes by number, customer, or reference..."
            className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-[#006fe6] focus:ring-1 focus:ring-[#006fe6]"
          />
          <svg
            className="w-4 h-4 text-gray-400 absolute left-3 top-2.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 rounded shadow-sm">
          <svg className="w-4 h-4 mr-1.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filter
        </button>
      </div>

      {/* Quotes Table */}
      <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
          <thead className="bg-[#f9fafb] text-gray-600 font-semibold text-xs uppercase tracking-wider">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedIds.size > 0 && selectedIds.size === quotes.length}
                  onChange={handleToggleSelectAll}
                  className="rounded border-gray-300 text-[#006fe6] focus:ring-[#006fe6]"
                />
              </th>
              <th className="px-4 py-3">Number</th>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Issue Date</th>
              <th className="px-4 py-3">Expiration Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Amount ({quotes[0]?.currency || "AUD"})</th>
              <th className="w-12 px-2 py-3 text-center"></th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 bg-white">
            {quotes.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-8 text-center text-gray-500">
                  No quotes found for the selected tab or search query.
                </td>
              </tr>
            ) : (
              quotes.map((quote) => {
                const expired = isExpired(quote.expiryDate, quote.status);
                const isSelected = selectedIds.has(quote.id);

                return (
                  <tr
                    key={quote.id}
                    onClick={() => onClickQuoteRow(quote.id)}
                    className={`hover:bg-[#f3f7fd] cursor-pointer transition ${
                      isSelected ? "bg-blue-50/50" : ""
                    }`}
                  >
                    <td className="px-4 py-3" onClick={(e) => handleToggleRow(quote.id, e)}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="rounded border-gray-300 text-[#006fe6] focus:ring-[#006fe6]"
                      />
                    </td>

                    <td className="px-4 py-3 font-semibold text-[#006fe6] hover:underline">
                      {quote.quoteNumber}
                    </td>

                    <td className="px-4 py-3 text-gray-600 truncate max-w-[150px]">
                      {quote.reference || "—"}
                    </td>

                    <td className="px-4 py-3 font-medium text-gray-900">
                      {quote.contactId}
                    </td>

                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(quote.date)}
                    </td>

                    <td className="px-4 py-3 text-gray-600 flex items-center space-x-1">
                      {expired && (
                        <span
                          className="text-red-600 inline-flex items-center"
                          title="Quote is expired"
                        >
                          <svg className="w-4 h-4 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                      <span className={expired ? "text-red-600 font-medium" : ""}>
                        {formatDate(quote.expiryDate)}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      {getStatusBadge(quote.status)}
                    </td>

                    <td className="px-4 py-3 text-right font-medium text-gray-900">
                      {quote.totalAmount.toLocaleString("en-AU", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>

                    <td className="px-2 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="text-gray-400 hover:text-gray-700 p-1 rounded"
                        title="Actions"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
