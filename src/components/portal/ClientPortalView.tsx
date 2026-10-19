"use client";

import React, { useState } from "react";
import type { QuoteEntity } from "../../types/index.ts";

export interface ClientPortalViewProps {
  quote: QuoteEntity;
  organizationName?: string;
  onAccept?: (comment?: string) => Promise<void>;
  onDecline?: (reason: string) => Promise<void>;
  onPrintPdf?: () => void;
}

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({
  quote,
  organizationName = "PB Style Homes Pty Ltd",
  onAccept,
  onDecline,
  onPrintPdf,
}) => {
  const [comment, setComment] = useState("");
  const [declineReason, setDeclineReason] = useState("");
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedStatus, setSubmittedStatus] = useState<string | null>(null);

  const formatDate = (d: Date | string) => {
    return new Date(d).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleAccept = async () => {
    setIsSubmitting(true);
    try {
      if (onAccept) {
        await onAccept(comment);
      }
      setSubmittedStatus("ACCEPTED");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDecline = async () => {
    if (!declineReason.trim()) return;
    setIsSubmitting(true);
    try {
      if (onDecline) {
        await onDecline(declineReason);
      }
      setShowDeclineModal(false);
      setSubmittedStatus("DECLINED");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f5f7] py-8 px-4 font-sans text-gray-800">
      <div className="max-w-4xl mx-auto">
        {/* Top Floating Action Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-col sm:flex-row items-center justify-between border border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{organizationName}</h2>
            <p className="text-xs text-gray-500">
              Quotation <span className="font-semibold text-gray-700">{quote.quoteNumber}</span>
            </p>
          </div>

          <div className="mt-4 sm:mt-0 flex items-center space-x-3">
            <button
              onClick={onPrintPdf}
              className="px-3.5 py-2 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 text-gray-700 bg-white"
            >
              Download PDF
            </button>

            {submittedStatus === "ACCEPTED" || quote.status === "ACCEPTED" ? (
              <span className="px-4 py-2 bg-green-100 text-green-800 rounded font-semibold text-sm">
                ✓ Quote Accepted
              </span>
            ) : submittedStatus === "DECLINED" || quote.status === "DECLINED" ? (
              <span className="px-4 py-2 bg-red-100 text-red-800 rounded font-semibold text-sm">
                ✕ Quote Declined
              </span>
            ) : (
              <>
                <button
                  onClick={() => setShowDeclineModal(true)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-red-300 text-red-600 rounded text-sm font-semibold hover:bg-red-50"
                >
                  Decline
                </button>
                <button
                  onClick={handleAccept}
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#137333] hover:bg-[#0e5927] text-white rounded text-sm font-bold shadow-sm"
                >
                  {isSubmitting ? "Processing..." : "Accept Quote"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Success / Status Banner */}
        {submittedStatus === "ACCEPTED" && (
          <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg mb-6 flex items-center space-x-2">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">
              Thank you! You have accepted this quote. The team has been notified.
            </span>
          </div>
        )}

        {/* Document Body */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-8">
          <div className="flex justify-between items-start border-b border-gray-200 pb-6 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{organizationName}</h1>
              <p className="text-xs text-gray-500 mt-1">ABN 51 824 753 556</p>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Quote</span>
              <p className="text-lg font-bold text-gray-900">{quote.quoteNumber}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6 text-sm">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Customer</span>
              <p className="text-base font-bold text-gray-900 mt-1">{quote.contactId}</p>
            </div>
            <div className="text-right space-y-1">
              <div>
                <span className="text-gray-500">Issue Date: </span>
                <span className="font-medium text-gray-800">{formatDate(quote.date)}</span>
              </div>
              <div>
                <span className="text-gray-500">Expiry Date: </span>
                <span className="font-medium text-gray-800">{formatDate(quote.expiryDate)}</span>
              </div>
            </div>
          </div>

          {/* Line items table */}
          <table className="w-full text-left text-sm mb-6 border-b border-gray-200">
            <thead>
              <tr className="border-b border-gray-300 text-xs font-bold uppercase text-gray-500">
                <th className="py-2">Description</th>
                <th className="py-2 text-right w-16">Qty</th>
                <th className="py-2 text-right w-24">Unit Price</th>
                <th className="py-2 text-right w-28">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {quote.lines.map((l) => (
                <tr key={l.id}>
                  <td className="py-3 text-gray-800 font-medium">{l.description}</td>
                  <td className="py-3 text-right text-gray-600">{l.quantity}</td>
                  <td className="py-3 text-right text-gray-600">{l.unitPrice.toFixed(2)}</td>
                  <td className="py-3 text-right font-medium text-gray-900">{l.lineAmount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="flex justify-end mb-8">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{quote.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>GST (10%)</span>
                <span>{quote.taxTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-300 pt-2 text-base font-bold text-gray-900">
                <span>Total Amount</span>
                <span>
                  {quote.currency || "AUD"} {quote.totalAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Terms */}
          {quote.terms && (
            <div className="border-t border-gray-200 pt-4 mb-6">
              <h4 className="text-xs font-bold uppercase text-gray-500 mb-1">Terms of Acceptance</h4>
              <p className="text-xs text-gray-600 whitespace-pre-line">{quote.terms}</p>
            </div>
          )}

          {/* Customer Acceptance Comment Box */}
          {quote.status !== "ACCEPTED" && quote.status !== "DECLINED" && (
            <div className="border-t border-gray-200 pt-4">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Optional note or purchase order number
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
                placeholder="Add any instructions, purchase order number, or comments..."
                className="w-full p-2.5 text-sm border border-gray-300 rounded bg-gray-50 focus:bg-white"
              />
            </div>
          )}
        </div>

        {/* Decline Modal */}
        {showDeclineModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Decline Quote</h3>
              <p className="text-xs text-gray-500 mb-4">
                Please let us know why you are declining this quote so we can assist you better.
              </p>

              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                rows={3}
                required
                placeholder="Reason for declining..."
                className="w-full p-2 text-sm border border-gray-300 rounded mb-4"
              />

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowDeclineModal(false)}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDecline}
                  disabled={!declineReason.trim()}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded disabled:opacity-50"
                >
                  Confirm Decline
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
