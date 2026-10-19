"use client";

import React, { useState } from "react";
import type { QuoteEntity, QuoteStatus } from "../../types/index";

export interface QuoteListProps {
  quotes: QuoteEntity[];
  counts: Record<string, number>;
  activeStatusTab: string;
  searchQuery: string;
  onSelectStatusTab: (status: string) => void;
  onSearchChange: (query: string) => void;
  onClickNewQuote: () => void;
  onClickQuoteRow: (quoteId: string) => void;
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
}) => {
  const tabs = [
    { key: "ALL", label: "All" },
    { key: "DRAFT", label: "Draft" },
    { key: "SENT", label: "Sent" },
    { key: "DECLINED", label: "Declined" },
    { key: "ACCEPTED", label: "Accepted" },
    { key: "CONVERTED_TO_INVOICE", label: "Invoiced" },
  ];

  const getStatusBadge = (status: QuoteStatus | string) => {
    switch (status) {
      case "DRAFT":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs sm:text-sm font-medium bg-gray-100 text-gray-700 border border-gray-300">
            Draft
          </span>
        );
      case "SENT":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs sm:text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200">
            Sent
          </span>
        );
      case "ACCEPTED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs sm:text-sm font-medium bg-green-50 text-green-700 border border-green-200">
            Accepted
          </span>
        );
      case "DECLINED":
      case "DELETED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs sm:text-sm font-medium bg-[#fde8e8] text-[#9b1c1c] border border-red-200">
            Declined
          </span>
        );
      case "CONVERTED_TO_INVOICE":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs sm:text-sm font-medium bg-purple-50 text-purple-700 border border-purple-200">
            Invoiced
          </span>
        );
      default:
        return <span className="text-xs sm:text-sm text-gray-600">{status}</span>;
    }
  };

  const formatDate = (d: Date | string | undefined) => {
    if (!d) return "";
    const date = new Date(d);
    return date.toLocaleDateString("en-AU", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="w-full max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 py-5 font-sans">
      {/* Top Breadcrumb & Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <div className="text-xs sm:text-sm text-[#006fe6] hover:underline cursor-pointer flex items-center mb-1">
            <span>Sales overview</span>
            <svg className="w-3.5 h-3.5 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Quotes</h1>
        </div>

        <div className="mt-3 sm:mt-0 flex items-center space-x-2">
          <button
            onClick={onClickNewQuote}
            className="inline-flex items-center px-4 py-2 bg-[#13893a] hover:bg-[#0f6f2e] text-white text-sm sm:text-base font-semibold rounded-md shadow-xs transition"
          >
            + New quote
          </button>
        </div>
      </div>

      {/* Status Tabs Bar */}
      <div className="flex border-b border-gray-200 space-x-8 mb-4 overflow-x-auto text-sm sm:text-base">
        {tabs.map((tab) => {
          const isActive = activeStatusTab === tab.key;
          const count = counts[tab.key] !== undefined ? counts[tab.key] : 0;
          return (
            <button
              key={tab.key}
              onClick={() => onSelectStatusTab(tab.key)}
              className={`pb-3 whitespace-nowrap text-sm sm:text-base font-medium transition flex items-center space-x-2 border-b-2 ${
                isActive
                  ? "border-[#006fe6] text-[#006fe6] font-semibold"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <span>{tab.label}</span>
              {tab.key !== "ALL" && (
                <span className={`text-xs sm:text-sm px-1.5 py-0.2 rounded-full ${
                  isActive ? "bg-blue-100 text-[#006fe6]" : "bg-gray-100 text-gray-600"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search & Filter Toolbar Card */}
      <div className="bg-[#f0f3f6] rounded-lg px-3.5 py-2.5 mb-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-2.5 flex-1">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by contact, reference, amount or quote number..."
            className="w-full bg-transparent text-sm sm:text-base text-gray-800 placeholder-gray-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Item count text */}
      <div className="text-xs sm:text-sm text-gray-500 mb-2 font-medium">
        {quotes.length} {quotes.length === 1 ? "quote" : "quotes"} found
      </div>

      {/* Quotes Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-xs overflow-x-auto">
        <table className="w-full text-left text-sm sm:text-base border-collapse">
          <thead>
            <tr className="border-b border-gray-200 text-xs sm:text-sm text-gray-700 bg-[#f8fafc] uppercase tracking-wider font-semibold">
              <th className="px-4 py-3">Number</th>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Issue date ↓</th>
              <th className="px-4 py-3">Expiration date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Amount AUD</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {quotes.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-500 text-sm sm:text-base">
                  No quotes found in this view.
                </td>
              </tr>
            ) : (
              quotes.map((quote) => {
                const isOverdue =
                  quote.status === "SENT" &&
                  new Date(quote.expiryDate).getTime() < Date.now();

                return (
                  <tr
                    key={quote.id}
                    onClick={() => onClickQuoteRow(quote.id)}
                    className="hover:bg-gray-50 cursor-pointer transition"
                  >
                    <td className="px-4 py-3.5 font-semibold text-[#006fe6] hover:underline whitespace-nowrap font-mono">
                      {quote.quoteNumber}
                    </td>

                    <td className="px-4 py-3.5 text-gray-700 text-sm sm:text-base">
                      {quote.reference || "—"}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-gray-900 text-sm sm:text-base">
                        {quote.contactName}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-gray-600 text-sm sm:text-base whitespace-nowrap">
                      {formatDate(quote.date)}
                    </td>

                    <td className="px-4 py-3.5 text-sm sm:text-base whitespace-nowrap">
                      {quote.expiryDate ? (
                        <div
                          className={`flex items-center space-x-1 ${
                            isOverdue ? "text-[#d32f2f] font-semibold" : "text-gray-600"
                          }`}
                        >
                          {isOverdue && (
                            <svg className="w-4 h-4 text-[#d32f2f] mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )}
                          <span>{formatDate(quote.expiryDate)}</span>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {getStatusBadge(quote.status)}
                    </td>

                    <td className="px-4 py-3.5 text-right font-semibold text-gray-900 font-mono text-sm sm:text-base whitespace-nowrap">
                      {Number(quote.totalAmount).toLocaleString("en-AU", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {/* Footer info */}
        <div className="p-3.5 text-xs sm:text-sm text-gray-500 border-t border-gray-100 bg-[#fbfbfb]">
          Showing {quotes.length} {quotes.length === 1 ? "quote" : "quotes"}
        </div>
      </div>
    </div>
  );
};
