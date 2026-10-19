"use client";

import React, { useState } from "react";
import type { QuoteEntity } from "../../types/index.ts";

export interface QuoteViewProps {
  quote: any;
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
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [portalUrl, setPortalUrl] = useState<string | null>(null);

  const formatDate = (d: Date | string | undefined) => {
    if (!d) return "—";
    const date = new Date(d);
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleCopyLink = async () => {
    try {
      const res = await fetch(`/api/quotes/${quote.id}/portal-link`);
      const data = await res.json();
      if (data.link) {
        setPortalUrl(window.location.origin + data.link);
      }
    } catch (e) {}
  };

  const handleSaveNote = () => {
    if (!noteText.trim()) return;
    onAddNote && onAddNote(noteText.trim());
    setNoteText("");
    setShowNoteModal(false);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-5 font-sans">
      {/* Top Breadcrumb matching image copy 10.png */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <div className="text-xs text-[#006fe6] hover:underline cursor-pointer flex items-center mb-1">
            <span onClick={onBackToList}>Sales overview</span>
            <span className="mx-1 text-gray-400">&gt;</span>
            <span onClick={onBackToList}>Quotes</span>
          </div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              Quote {quote.quoteNumber}
            </h1>
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-50 text-gray-700 border border-gray-300">
              {quote.status}
            </span>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center space-x-2 mt-3 sm:mt-0 relative">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 border border-[#006fe6] text-[#006fe6] bg-white hover:bg-blue-50 text-sm font-medium rounded transition"
          >
            Print PDF
          </button>

          {quote.status !== "ACCEPTED" && quote.status !== "CONVERTED_TO_INVOICE" && (
            <button
              onClick={onMarkAccepted}
              className="px-3.5 py-1.5 bg-[#006fe6] hover:bg-[#005bb5] text-white text-sm font-semibold rounded transition"
            >
              Mark as accepted
            </button>
          )}

          {quote.status === "ACCEPTED" && (
            <button
              onClick={onCopyToInvoice}
              className="px-3.5 py-1.5 bg-[#13893a] hover:bg-[#0f6f2e] text-white text-sm font-semibold rounded transition"
            >
              Convert to invoice
            </button>
          )}

          {/* Kebab Menu ⋮ */}
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-1.5 text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </button>

            {showMoreMenu && (
              <div className="absolute right-0 top-8 w-48 bg-white border border-gray-200 rounded shadow-xl py-1 z-30 text-sm">
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    onSend && onSend();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-800"
                >
                  Send
                </button>
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    onMarkDeclined && onMarkDeclined();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-800"
                >
                  Mark as declined
                </button>
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    onRevise && onRevise();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-800"
                >
                  Revise
                </button>
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    onCopyToInvoice && onCopyToInvoice();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-800"
                >
                  Copy to
                </button>
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    handleCopyLink();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-800"
                >
                  Get link
                </button>
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-800"
                >
                  Update project
                </button>
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600"
                >
                  Delete
                </button>
                <div className="border-t border-gray-100 my-1"></div>
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-800 flex items-center justify-between"
                >
                  <span>Invoice settings</span>
                  <span className="text-xs text-gray-400">↗</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Document Details Card matching image copy 10.png */}
      <div className="bg-white border border-gray-200 rounded shadow-sm p-6 mb-4">
        {/* Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4 pb-6 text-xs text-gray-600">
          <div>
            <div className="font-semibold text-gray-900 mb-1">Customer</div>
            <div className="text-[#006fe6] font-medium hover:underline cursor-pointer">
              {quote.contact?.name || quote.contactName || "Customer"}
            </div>
          </div>
          <div>
            <div className="font-semibold text-gray-900 mb-1">Issue date</div>
            <div>{formatDate(quote.date)}</div>
          </div>
          <div>
            <div className="font-semibold text-gray-900 mb-1">Expiration date</div>
            <div>{formatDate(quote.expiryDate)}</div>
          </div>
          <div>
            <div className="font-semibold text-gray-900 mb-1">Quote number</div>
            <div>{quote.quoteNumber}</div>
          </div>
          <div>
            <div className="font-semibold text-gray-900 mb-1">Reference</div>
            <div>{quote.reference || "333 Bridgeman Down rd Bridgeman Down"}</div>
          </div>
          <div>
            <div className="font-semibold text-gray-900 mb-1">Currency</div>
            <div>Australian Dollar</div>
          </div>
          <div>
            <div className="font-semibold text-gray-900 mb-1">Branding theme</div>
            <div>{organizationName}</div>
          </div>
        </div>

        {/* Right subtext */}
        <div className="text-right text-xs text-gray-500 mb-2">
          Amounts are tax exclusive
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto border-t border-b border-gray-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-500">
                <th className="py-2.5 font-normal w-16">Item</th>
                <th className="py-2.5 font-normal">Description</th>
                <th className="py-2.5 font-normal w-16">Quantity</th>
                <th className="py-2.5 font-normal w-20 text-right">Price</th>
                <th className="py-2.5 font-normal w-16">Discount</th>
                <th className="py-2.5 font-normal w-24">Account</th>
                <th className="py-2.5 font-normal w-28">Tax rate</th>
                <th className="py-2.5 font-normal w-24">Purchase order</th>
                <th className="py-2.5 font-normal w-20">Payments</th>
                <th className="py-2.5 font-normal w-24 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {quote.lines?.map((line: any, index: number) => (
                <tr key={line.id || index} className="text-gray-800">
                  <td className="py-3 text-gray-400">—</td>
                  <td className="py-3 font-normal">{line.description}</td>
                  <td className="py-3">{line.quantity}</td>
                  <td className="py-3 text-right">
                    {Number(line.unitPrice).toFixed(2)}
                  </td>
                  <td className="py-3">{line.discount ? `${line.discount}%` : ""}</td>
                  <td className="py-3 text-gray-600">200 - Sales</td>
                  <td className="py-3 text-gray-600">GST on Income</td>
                  <td className="py-3 text-gray-400">—</td>
                  <td className="py-3 text-gray-400">—</td>
                  <td className="py-3 text-right font-medium">
                    {Number(line.lineAmount).toLocaleString("en-AU", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start pt-6">
          <div className="mb-4 sm:mb-0">
            <button className="flex items-center space-x-1.5 px-3 py-1.5 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span>Attach files</span>
              <span className="text-[10px] text-gray-400">▼</span>
            </button>
          </div>

          <div className="w-full sm:w-64 space-y-2 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>
                {Number(quote.subtotal).toLocaleString("en-AU", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between text-gray-600 pb-2">
              <span>Total GST 10.00%</span>
              <span>
                {Number(quote.taxTotal).toLocaleString("en-AU", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
              <span>Total</span>
              <span>
                {Number(quote.totalAmount).toLocaleString("en-AU", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* History and notes Collapsible Panel matching image copy 12.png */}
      <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
        <div
          onClick={() => setShowHistory(!showHistory)}
          className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 border-l-4 border-[#006fe6]"
        >
          <div className="flex items-center space-x-2">
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform ${showHistory ? "" : "-rotate-90"}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
            <span className="font-bold text-sm text-gray-900">History and notes</span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowNoteModal(true);
            }}
            className="px-3 py-1 border border-gray-300 rounded text-xs font-medium text-[#006fe6] hover:bg-blue-50"
          >
            Add note
          </button>
        </div>

        {showHistory && (
          <div className="overflow-x-auto border-t border-gray-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-500 bg-[#fbfbfb]">
                  <th className="px-4 py-2.5 font-normal">Date (Time zone AEST) ↓</th>
                  <th className="px-4 py-2.5 font-normal">User</th>
                  <th className="px-4 py-2.5 font-normal">Action</th>
                  <th className="px-4 py-2.5 font-normal">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {quote.history?.map((h: any) => (
                  <tr key={h.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {new Date(h.timestamp).toLocaleString("en-AU", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                      {h.user}
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {h.action}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{h.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-5">
            <h3 className="font-bold text-gray-900 text-base mb-3">Add Note</h3>
            <textarea
              rows={4}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Enter internal team note..."
              className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:border-[#006fe6] mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowNoteModal(false)}
                className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                className="px-4 py-1.5 bg-[#006fe6] text-white rounded text-sm font-semibold hover:bg-[#005bb5]"
              >
                Save note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Portal Link Modal */}
      {portalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-5">
            <h3 className="font-bold text-gray-900 text-base mb-2">Client Portal Link</h3>
            <p className="text-xs text-gray-600 mb-3">
              This tamper-proof signed link allows your client to view and accept or decline this quote online:
            </p>
            <div className="p-2 bg-gray-50 border border-gray-200 rounded text-xs break-all mb-4 text-[#006fe6]">
              {portalUrl}
            </div>
            <div className="flex justify-between items-center">
              <a
                href={portalUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#006fe6] hover:underline"
              >
                Open in new tab ↗
              </a>
              <div className="space-x-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(portalUrl);
                    alert("Link copied to clipboard!");
                  }}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
                >
                  Copy Link
                </button>
                <button
                  onClick={() => setPortalUrl(null)}
                  className="px-4 py-1.5 bg-[#006fe6] text-white rounded text-sm font-semibold hover:bg-[#005bb5]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
