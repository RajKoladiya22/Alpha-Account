"use client";

import React, { useState } from "react";
import type { QuoteEntity } from "../../types/index.ts";

export interface QuoteViewProps {
  quote: QuoteEntity;
  organizationName?: string;
  onPrintPdf?: () => void;
  onMarkAccepted?: () => void;
  onSend?: () => void;
  onMarkDeclined?: () => void;
  onRevise?: () => void;
  onCopyToInvoice?: () => void;
  onCopyToPurchaseOrder?: () => void;
  onGetPortalLink?: () => void;
  onAddNote?: (note: string) => void;
  onBackToList?: () => void;
}

export const QuoteView: React.FC<QuoteViewProps> = ({
  quote,
  organizationName = "PB Style Homes Pty Ltd",
  onPrintPdf,
  onMarkAccepted,
  onSend,
  onMarkDeclined,
  onRevise,
  onCopyToInvoice,
  onCopyToPurchaseOrder,
  onGetPortalLink,
  onAddNote,
  onBackToList,
}) => {
  const [showHistory, setShowHistory] = useState(true);
  const [showCopyMenu, setShowCopyMenu] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const formatDate = (d: Date | string) => {
    const date = new Date(d);
    return date.toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (d: Date | string) => {
    const date = new Date(d);
    return date.toLocaleString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleSaveNote = () => {
    if (!noteText.trim()) return;
    onAddNote && onAddNote(noteText.trim());
    setNoteText("");
    setShowNoteInput(false);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 font-sans text-gray-800">
      {/* Top Breadcrumb & Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 mb-4 border-b border-gray-200">
        <div>
          <nav className="text-xs text-gray-500 mb-1">
            <span className="hover:underline cursor-pointer" onClick={onBackToList}>
              Quotes
            </span>{" "}
            &gt; <span className="text-gray-800 font-medium">{quote.quoteNumber}</span>
          </nav>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900">{quote.quoteNumber}</h1>
            <span className="px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-blue-100 text-[#006fe6] border border-blue-200">
              {quote.status}
            </span>
          </div>
        </div>

        {/* Action Toolbar matching image copy 10.png */}
        <div className="flex flex-wrap items-center gap-2 mt-3 sm:mt-0 relative">
          <button
            onClick={onPrintPdf}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 text-gray-700 bg-white"
          >
            Print PDF
          </button>

          {quote.status === "SENT" && (
            <button
              onClick={onMarkAccepted}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 text-gray-700 bg-white"
            >
              Mark as accepted
            </button>
          )}

          <button
            onClick={onSend}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 text-gray-700 bg-white"
          >
            Send
          </button>

          {quote.status === "SENT" && (
            <button
              onClick={onMarkDeclined}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 text-gray-700 bg-white"
            >
              Mark as declined
            </button>
          )}

          <button
            onClick={onRevise}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 text-gray-700 bg-white"
          >
            Revise
          </button>

          {/* Copy to Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowCopyMenu(!showCopyMenu)}
              className="px-3 py-1.5 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 text-gray-700 bg-white inline-flex items-center"
            >
              <span>Copy to</span>
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showCopyMenu && (
              <div className="absolute right-0 top-9 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-20">
                <button
                  onClick={() => {
                    setShowCopyMenu(false);
                    onCopyToInvoice && onCopyToInvoice();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Copy to Invoice
                </button>
                <button
                  onClick={() => {
                    setShowCopyMenu(false);
                    onCopyToPurchaseOrder && onCopyToPurchaseOrder();
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Copy to Purchase Order
                </button>
              </div>
            )}
          </div>

          {/* Get Link (Client Portal Link) */}
          <button
            onClick={() => {
              onGetPortalLink && onGetPortalLink();
              setCopiedLink(true);
              setTimeout(() => setCopiedLink(false), 2000);
            }}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 text-[#006fe6] bg-white"
          >
            {copiedLink ? "Link copied!" : "Get link"}
          </button>
        </div>
      </div>

      {/* Rendered Quote Preview Document (Paper Style Card) */}
      <div className="bg-white border border-gray-200 rounded shadow p-8 mb-8">
        {/* Document Header */}
        <div className="flex justify-between items-start border-b border-gray-200 pb-6 mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{organizationName}</h2>
            <p className="text-xs text-gray-500 mt-1">ABN: 51 824 753 556</p>
            <p className="text-xs text-gray-500">Queensland, Australia</p>
          </div>

          <div className="text-right">
            <h3 className="text-2xl font-bold uppercase tracking-wider text-gray-400">Quote</h3>
            <p className="text-sm font-semibold text-gray-800 mt-1">{quote.quoteNumber}</p>
          </div>
        </div>

        {/* Bill To & Metadata */}
        <div className="grid grid-cols-2 gap-8 mb-6">
          <div>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Prepared For</span>
            <p className="text-base font-bold text-gray-900 mt-1">{quote.contactId}</p>
            {quote.reference && (
              <p className="text-xs text-gray-500 mt-1">Reference: {quote.reference}</p>
            )}
          </div>

          <div className="space-y-1 text-sm text-right">
            <div className="flex justify-end space-x-4">
              <span className="text-gray-500">Issue Date:</span>
              <span className="font-medium text-gray-900">{formatDate(quote.date)}</span>
            </div>
            <div className="flex justify-end space-x-4">
              <span className="text-gray-500">Expiry Date:</span>
              <span className="font-medium text-gray-900">{formatDate(quote.expiryDate)}</span>
            </div>
            <div className="flex justify-end space-x-4">
              <span className="text-gray-500">Currency:</span>
              <span className="font-medium text-gray-900">{quote.currency || "AUD"}</span>
            </div>
          </div>
        </div>

        {/* Title and Summary Block (if present) */}
        {(quote.title || quote.summary) && (
          <div className="bg-gray-50 p-4 rounded border border-gray-200 mb-6">
            {quote.title && <h4 className="font-bold text-gray-900 text-sm mb-1">{quote.title}</h4>}
            {quote.summary && <p className="text-sm text-gray-600">{quote.summary}</p>}
          </div>
        )}

        {/* Itemized Table */}
        <table className="w-full text-left text-sm mb-6 border-b border-gray-200">
          <thead>
            <tr className="border-b border-gray-300 text-xs font-bold uppercase text-gray-500">
              <th className="py-2.5">Description</th>
              <th className="py-2.5 text-right w-20">Qty</th>
              <th className="py-2.5 text-right w-24">Unit Price</th>
              <th className="py-2.5 text-right w-20">Disc %</th>
              <th className="py-2.5 text-right w-24">Tax Rate</th>
              <th className="py-2.5 text-right w-28">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {quote.lines.map((l) => (
              <tr key={l.id}>
                <td className="py-3 text-gray-800">
                  <div className="font-medium">{l.description}</div>
                  {l.itemCode && <div className="text-xs text-gray-400">SKU: {l.itemCode}</div>}
                </td>
                <td className="py-3 text-right text-gray-700">{l.quantity}</td>
                <td className="py-3 text-right text-gray-700">{l.unitPrice.toFixed(2)}</td>
                <td className="py-3 text-right text-gray-700">{l.discount > 0 ? `${l.discount}%` : "—"}</td>
                <td className="py-3 text-right text-gray-700">{l.taxRate}%</td>
                <td className="py-3 text-right font-medium text-gray-900">{l.lineAmount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Section */}
        <div className="flex justify-end mb-8">
          <div className="w-72 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{quote.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax Total (GST 10%)</span>
              <span>{quote.taxTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t border-gray-300 pt-2 text-base font-bold text-gray-900">
              <span>Total</span>
              <span>
                {quote.currency || "AUD"} {quote.totalAmount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Terms */}
        {quote.terms && (
          <div className="border-t border-gray-200 pt-4">
            <h5 className="text-xs font-bold uppercase text-gray-500 mb-1">Terms of Acceptance</h5>
            <p className="text-xs text-gray-600 whitespace-pre-line">{quote.terms}</p>
          </div>
        )}
      </div>

      {/* Collapsible History and Notes Accordion */}
      <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
        <div
          onClick={() => setShowHistory(!showHistory)}
          className="flex justify-between items-center px-5 py-3.5 bg-gray-50 cursor-pointer select-none border-b border-gray-200"
        >
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold text-gray-900">History and notes</span>
            <span className="text-xs text-gray-500">({quote.history?.length || 0})</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowNoteInput(true);
              }}
              className="text-xs font-semibold text-[#006fe6] hover:underline"
            >
              Add note
            </button>
            <svg
              className={`w-4 h-4 text-gray-500 transform transition-transform ${
                showHistory ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {showHistory && (
          <div className="p-5">
            {/* Inline Note Composer */}
            {showNoteInput && (
              <div className="mb-4 p-3 bg-blue-50/40 border border-blue-200 rounded">
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Enter internal note for the team..."
                  rows={2}
                  className="w-full p-2 text-sm border border-gray-300 rounded bg-white"
                />
                <div className="flex justify-end space-x-2 mt-2">
                  <button
                    onClick={() => setShowNoteInput(false)}
                    className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveNote}
                    className="px-3 py-1 text-xs bg-[#006fe6] text-white rounded font-semibold hover:bg-[#005bb5]"
                  >
                    Save note
                  </button>
                </div>
              </div>
            )}

            {/* Timeline Table matching image copy 11.png */}
            <table className="min-w-full text-left text-xs divide-y divide-gray-200">
              <thead className="text-gray-500 uppercase font-semibold">
                <tr>
                  <th className="py-2 px-3 w-44">Date (AEST)</th>
                  <th className="py-2 px-3 w-32">User</th>
                  <th className="py-2 px-3 w-28">Action</th>
                  <th className="py-2 px-3">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {quote.history?.map((h) => (
                  <tr key={h.id} className="hover:bg-gray-50">
                    <td className="py-2.5 px-3 text-gray-500">{formatDateTime(h.timestamp)}</td>
                    <td className="py-2.5 px-3 font-medium text-gray-800">{h.user}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">
                        {h.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-600">{h.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
