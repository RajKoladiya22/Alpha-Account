"use client";

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
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-200 text-gray-700">
            Draft
          </span>
        );
      case "SENT":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-700 border border-gray-300">
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
      case "DELETED":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#fde8e8] text-[#9b1c1c]">
            Deleted
          </span>
        );
      case "CONVERTED_TO_INVOICE":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
            Invoiced
          </span>
        );
      default:
        return <span className="text-xs text-gray-600">{status}</span>;
    }
  };

  const formatDate = (d: Date | string | undefined) => {
    if (!d) return "";
    const date = new Date(d);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-5 font-sans">
      {/* Top Breadcrumb & Heading matching image.png */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
        <div>
          <div className="text-xs text-[#006fe6] hover:underline cursor-pointer flex items-center mb-1">
            <span>Sales overview</span>
            <svg className="w-3.5 h-3.5 ml-0.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Quotes</h1>
        </div>

        <div className="mt-3 sm:mt-0 flex items-center space-x-2">
          <button
            onClick={onClickNewQuote}
            className="inline-flex items-center px-3.5 py-1.5 bg-[#13893a] hover:bg-[#0f6f2e] text-white text-sm font-semibold rounded shadow-sm transition"
          >
            New quote
          </button>
          <button className="p-1.5 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Status Tabs Bar */}
      <div className="flex border-b border-gray-200 space-x-8 mb-4 overflow-x-auto text-sm">
        {tabs.map((tab) => {
          const isActive = activeStatusTab === tab.key;
          const count = counts[tab.key] !== undefined ? counts[tab.key] : 0;
          return (
            <button
              key={tab.key}
              onClick={() => onSelectStatusTab(tab.key)}
              className={`pb-2.5 whitespace-nowrap text-sm font-medium transition flex items-center space-x-1.5 border-b-2 ${
                isActive
                  ? "border-[#006fe6] text-[#006fe6] font-semibold"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <span>{tab.label}</span>
              {tab.key !== "ALL" && (
                <span className="text-gray-500 font-normal">{count}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search & Filter Toolbar Card matching image.png */}
      <div className="bg-[#f0f3f6] rounded px-3 py-2 mb-3 flex items-center justify-between">
        <div className="flex items-center space-x-2 flex-1">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Enter a contact, amount, reference or quote number"
            className="w-full bg-transparent text-sm text-gray-800 placeholder-gray-500 focus:outline-none"
          />
        </div>

        <button className="flex items-center text-sm font-medium text-[#006fe6] hover:text-[#005bb5] px-2 py-1">
          <svg className="w-4 h-4 mr-1 text-[#006fe6]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" />
          </svg>
          Filter
        </button>
      </div>

      {/* Item count text */}
      <div className="text-xs text-gray-500 mb-2 font-medium">
        {quotes.length} items
      </div>

      {/* Quotes Table matching image.png */}
      <div className="bg-white border border-gray-200 rounded shadow-sm overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-200 text-xs text-gray-500 bg-white">
              <th className="px-4 py-2.5 font-normal">Number</th>
              <th className="px-4 py-2.5 font-normal">Reference</th>
              <th className="px-4 py-2.5 font-normal">Customer</th>
              <th className="px-4 py-2.5 font-normal flex items-center">
                Issue date <span className="ml-1 text-gray-400">↓</span>
              </th>
              <th className="px-4 py-2.5 font-normal">Expiration date</th>
              <th className="px-4 py-2.5 font-normal">Status</th>
              <th className="px-4 py-2.5 font-normal text-right">Amount</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {quotes.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No quotes found.
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
                    className="hover:bg-[#f9fafb] cursor-pointer transition"
                  >
                    <td className="px-4 py-3 font-medium text-[#006fe6] underline whitespace-nowrap">
                      {quote.quoteNumber}
                    </td>

                    <td className="px-4 py-3 text-gray-700 text-xs">
                      {quote.reference || "—"}
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-900 text-xs">
                        {quote.contactName}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">
                      {formatDate(quote.date)}
                    </td>

                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      {quote.expiryDate ? (
                        <div
                          className={`flex items-center space-x-1 ${
                            isOverdue ? "text-[#d32f2f] font-medium" : "text-gray-600"
                          }`}
                        >
                          {isOverdue && (
                            <svg className="w-3.5 h-3.5 text-[#d32f2f] mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          )}
                          <span>{formatDate(quote.expiryDate)}</span>
                        </div>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="px-4 py-3 whitespace-nowrap">
                      {getStatusBadge(quote.status)}
                    </td>

                    <td className="px-4 py-3 text-right font-medium text-gray-900 text-xs whitespace-nowrap">
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
        <div className="p-3 text-xs text-gray-500 border-t border-gray-100 bg-[#fbfbfb]">
          Showing items 1–{quotes.length} of {quotes.length}
        </div>
      </div>
    </div>
  );
};
