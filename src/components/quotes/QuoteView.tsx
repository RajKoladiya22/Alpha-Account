"use client";

import React, { useState } from "react";
import type { QuoteEntity } from "../../types/index";

export interface QuoteViewProps {
  quote: any;
  organizationName?: string;
  onPrintPdf?: () => void;
  onEdit?: () => void;
  onMarkAccepted?: () => void;
  onSend?: () => void;
  onMarkDeclined?: () => void;
  onRevise?: () => void;
  onCopyToInvoice?: () => void;
  onCopyToPurchaseOrder?: () => void;
  onGetPortalLink?: () => void;
  onAddNote?: (note: string) => void;
  onDelete?: () => void;
  onBackToList?: () => void;
}

export const QuoteView: React.FC<QuoteViewProps> = ({
  quote,
  organizationName = "Alpha Steel Frames",
  onPrintPdf,
  onEdit,
  onMarkAccepted,
  onSend,
  onMarkDeclined,
  onRevise,
  onCopyToInvoice,
  onCopyToPurchaseOrder,
  onGetPortalLink,
  onAddNote,
  onDelete,
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
    return date.toLocaleDateString("en-AU", {
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

  const isDraft = quote.status === "DRAFT";
  const isAccepted = quote.status === "ACCEPTED";
  const isInvoiced = quote.status === "CONVERTED_TO_INVOICE";

  return (
    <div className="w-full max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 py-5 font-sans">
      {/* Top Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
        <div>
          <div className="text-xs sm:text-sm text-[#006fe6] hover:underline cursor-pointer flex items-center mb-1">
            <span onClick={onBackToList}>Sales overview</span>
            <span className="mx-1 text-gray-400">&gt;</span>
            <span onClick={onBackToList}>Quotes</span>
          </div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
              Quote {quote.quoteNumber}
            </h1>
            <span className={`px-2.5 py-1 rounded text-xs sm:text-sm font-semibold border ${
              isAccepted
                ? "bg-green-50 text-green-700 border-green-200"
                : isDraft
                ? "bg-gray-100 text-gray-700 border-gray-300"
                : isInvoiced
                ? "bg-purple-50 text-purple-700 border-purple-200"
                : "bg-blue-50 text-blue-700 border-blue-200"
            }`}>
              {quote.status}
            </span>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center space-x-2 mt-3 sm:mt-0 relative">
          {/* Print PDF Button */}
          <button
            onClick={onPrintPdf || (() => window.open(`/quotes/${quote.id}/print`, "_blank"))}
            className="px-4 py-2 border border-[#006fe6] text-[#006fe6] bg-white hover:bg-blue-50 text-sm sm:text-base font-semibold rounded-md transition flex items-center space-x-1.5 shadow-xs"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Print PDF</span>
          </button>

          {/* Edit Button for Draft Quotes */}
          {isDraft && onEdit && (
            <button
              onClick={onEdit}
              className="px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 text-sm sm:text-base font-semibold rounded-md transition"
            >
              Edit
            </button>
          )}

          {/* Accept / Invoice Buttons */}
          {!isAccepted && !isInvoiced && (
            <button
              onClick={onMarkAccepted}
              className="px-5 py-2 bg-[#006fe6] hover:bg-[#005bb5] text-white text-sm sm:text-base font-semibold rounded-md transition shadow-xs"
            >
              Mark as accepted
            </button>
          )}

          {isAccepted && (
            <button
              onClick={onCopyToInvoice}
              className="px-5 py-2 bg-[#13893a] hover:bg-[#0f6f2e] text-white text-sm sm:text-base font-semibold rounded-md transition shadow-xs"
            >
              Convert to invoice
            </button>
          )}

          {/* Kebab Menu ⋮ */}
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100 border border-gray-300 transition"
              title="More actions"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </button>

            {showMoreMenu && (
              <div className="absolute right-0 top-11 w-52 bg-white border border-gray-200 rounded-md shadow-xl py-1 z-30 text-sm sm:text-base">
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    onSend && onSend();
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-gray-800"
                >
                  Send
                </button>
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    onMarkDeclined && onMarkDeclined();
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-gray-800"
                >
                  Mark as declined
                </button>
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    onRevise && onRevise();
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-gray-800 font-medium"
                >
                  Revise
                </button>
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    onCopyToInvoice && onCopyToInvoice();
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-gray-800"
                >
                  Convert to invoice
                </button>
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    handleCopyLink();
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-gray-800"
                >
                  Get portal link
                </button>
                {onDelete && (
                  <>
                    <div className="border-t border-gray-100 my-1"></div>
                    <button
                      onClick={() => {
                        setShowMoreMenu(false);
                        if (confirm(`Are you sure you want to delete quote ${quote.quoteNumber}?`)) {
                          onDelete();
                        }
                      }}
                      className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-red-600 font-medium"
                    >
                      Delete quote
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Document Details Card */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-xs p-5 sm:p-6 mb-5">
        {/* Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4 pb-6 text-xs sm:text-sm text-gray-600">
          <div>
            <div className="font-semibold text-gray-900 mb-1">Customer</div>
            <div className="text-[#006fe6] font-semibold hover:underline cursor-pointer">
              {quote.contact?.name || quote.contactName || "Customer"}
            </div>
            {quote.contact?.address && (
              <div className="text-gray-400 text-xs mt-0.5">{quote.contact.address}</div>
            )}
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
            <div className="font-mono font-semibold text-gray-900">{quote.quoteNumber}</div>
            {quote.revisionNumber && quote.revisionNumber > 1 && (
              <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-medium">
                Rev {quote.revisionNumber}
              </span>
            )}
          </div>
          <div>
            <div className="font-semibold text-gray-900 mb-1">Reference</div>
            <div>{quote.reference || "—"}</div>
          </div>
          <div>
            <div className="font-semibold text-gray-900 mb-1">Currency</div>
            <div>{quote.currency || "AUD"}</div>
          </div>
          <div>
            <div className="font-semibold text-gray-900 mb-1">Branding</div>
            <div>{organizationName}</div>
          </div>
        </div>

        {/* Right subtext */}
        <div className="text-right text-xs sm:text-sm text-gray-500 mb-3 font-medium">
          Amounts are {quote.taxTreatment === "INCLUSIVE" ? "tax inclusive" : quote.taxTreatment === "NO_TAX" ? "tax exempt" : "tax exclusive"}
        </div>

        {/* Line Items Table */}
        <div className="overflow-x-auto border-t border-b border-gray-200">
          <table className="w-full text-left text-sm sm:text-base border-collapse">
            <thead>
              <tr className="border-b border-gray-200 text-gray-700 bg-[#f8fafc] text-xs sm:text-sm uppercase tracking-wider font-semibold">
                <th className="py-3 px-3 w-32">Item</th>
                <th className="py-3 px-3">Description</th>
                <th className="py-3 px-3 w-20 text-right">Qty</th>
                <th className="py-3 px-3 w-28 text-right">Price</th>
                <th className="py-3 px-3 w-20 text-right">Disc %</th>
                <th className="py-3 px-3 w-40">Account</th>
                <th className="py-3 px-3 w-36">Tax rate</th>
                <th className="py-3 px-3 w-36 text-right">Amount {quote.currency || "AUD"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {quote.lines?.map((line: any, index: number) => (
                <tr key={line.id || index} className="text-gray-800 hover:bg-gray-50/50 transition">
                  <td className="py-3.5 px-3 font-mono text-gray-700 font-medium">{line.itemCode || "—"}</td>
                  <td className="py-3.5 px-3 font-normal whitespace-pre-line leading-relaxed">{line.description}</td>
                  <td className="py-3.5 px-3 text-right font-mono">{line.quantity}</td>
                  <td className="py-3.5 px-3 text-right font-mono">
                    {Number(line.unitPrice).toFixed(2)}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono">{line.discount ? `${line.discount}%` : "—"}</td>
                  <td className="py-3.5 px-3 text-gray-600">{line.accountId || "200 - Sales"}</td>
                  <td className="py-3.5 px-3 text-gray-600">
                    {line.taxRate !== undefined ? `${line.taxRate}% GST` : "10% GST"}
                  </td>
                  <td className="py-3.5 px-3 text-right font-semibold font-mono text-gray-900">
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
          <div className="mb-4 sm:mb-0 max-w-md">
            {quote.terms && (
              <div className="text-xs sm:text-sm text-gray-600">
                <span className="font-semibold text-gray-700">Terms &amp; Conditions: </span>
                <span>{quote.terms}</span>
              </div>
            )}
          </div>

          <div className="w-full sm:w-72 space-y-2.5 text-sm sm:text-base">
            <div className="flex justify-between text-gray-600">
              <span className="font-medium">Subtotal</span>
              <span className="font-mono font-semibold text-gray-900">
                {Number(quote.subtotal).toLocaleString("en-AU", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between text-gray-600 pb-2">
              <span className="font-medium">Total GST 10.00%</span>
              <span className="font-mono font-semibold text-gray-900">
                {Number(quote.taxTotal).toLocaleString("en-AU", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between text-xl sm:text-2xl font-bold text-gray-900 pt-3 border-t border-gray-200">
              <span>Total</span>
              <span className="font-mono text-[#006fe6]">
                {quote.currency || "AUD"} {Number(quote.totalAmount).toLocaleString("en-AU", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* History and notes Collapsible Panel */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-xs overflow-hidden">
        <div
          onClick={() => setShowHistory(!showHistory)}
          className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 border-l-4 border-[#006fe6] transition"
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
            <span className="font-bold text-sm sm:text-base text-gray-900">History and notes</span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowNoteModal(true);
            }}
            className="px-3.5 py-1.5 border border-gray-300 rounded-md text-xs sm:text-sm font-semibold text-[#006fe6] hover:bg-blue-50 transition"
          >
            Add note
          </button>
        </div>

        {showHistory && (
          <div className="overflow-x-auto border-t border-gray-200">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 text-gray-600 bg-[#f8fafc] font-semibold">
                  <th className="px-4 py-3 font-semibold">Date (AEST) ↓</th>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                  <th className="px-4 py-3 font-semibold">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {quote.history?.map((h: any) => (
                  <tr key={h.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {new Date(h.timestamp).toLocaleString("en-AU", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-800 whitespace-nowrap">
                      {h.user}
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap font-medium">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="font-bold text-gray-900 text-lg mb-3">Add Note</h3>
            <textarea
              rows={4}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Enter internal team note or communication log..."
              className="w-full border border-gray-300 rounded-md p-3 text-sm sm:text-base focus:outline-none focus:border-[#006fe6] mb-4"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowNoteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm sm:text-base text-gray-700 hover:bg-gray-50 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                className="px-5 py-2 bg-[#006fe6] text-white rounded-md text-sm sm:text-base font-semibold hover:bg-[#005bb5]"
              >
                Save note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Portal Link Modal */}
      {portalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <h3 className="font-bold text-gray-900 text-lg mb-2">Client Portal Link</h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-3">
              This tamper-proof signed link allows your client to view and accept or decline this quote online:
            </p>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-md text-xs sm:text-sm break-all mb-4 text-[#006fe6] font-mono">
              {portalUrl}
            </div>
            <div className="flex justify-between items-center">
              <a
                href={portalUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs sm:text-sm text-[#006fe6] hover:underline font-semibold"
              >
                Open in new tab ↗
              </a>
              <div className="space-x-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(portalUrl);
                    alert("Link copied to clipboard!");
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm sm:text-base text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Copy Link
                </button>
                <button
                  onClick={() => setPortalUrl(null)}
                  className="px-5 py-2 bg-[#006fe6] text-white rounded-md text-sm sm:text-base font-semibold hover:bg-[#005bb5]"
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
