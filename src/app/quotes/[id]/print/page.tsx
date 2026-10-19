"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { formatAUD } from "../../../../core/quotes/quote-calculator.ts";

export default function QuotePrintPage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params.id as string;

  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!quoteId) return;
    fetch(`/api/quotes/${quoteId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.quote) {
          setQuote(data.quote);
        } else {
          setError(data.error || "Quote not found");
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [quoteId]);

  const formatDate = (d: string | undefined) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-sans text-gray-500">
        Loading quotation document for print...
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center font-sans p-6 text-center">
        <p className="text-red-600 font-semibold mb-4">{error || "Failed to load quote."}</p>
        <button
          onClick={() => router.push("/quotes")}
          className="px-4 py-2 bg-[#001e4d] text-white rounded text-sm font-medium"
        >
          Return to Quotes
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen text-gray-900 font-sans p-6 md:p-12 print:p-0">
      {/* Action buttons (hidden when printing) */}
      <div className="max-w-4xl mx-auto mb-8 flex justify-between items-center print:hidden border-b pb-4">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
        >
          ← Back to Quote
        </button>
        <div className="space-x-3">
          <button
            onClick={() => window.print()}
            className="px-5 py-2 bg-[#001e4d] hover:bg-[#002b66] text-white rounded font-semibold text-sm shadow-sm transition flex items-center"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print / Save as PDF
          </button>
        </div>
      </div>

      {/* Printable Sheet */}
      <div className="max-w-4xl mx-auto bg-white border border-gray-200 rounded-lg p-8 md:p-12 shadow-sm print:border-none print:shadow-none print:p-0">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start border-b border-gray-200 pb-8 mb-8">
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <Image
                src="/logo.png"
                alt="Alpha Steel Frames"
                width={200}
                height={70}
                className="h-14 w-auto object-contain"
                priority
              />
            </div>
            <div className="text-xs text-gray-600 space-y-0.5">
              <p className="font-bold text-sm text-gray-900">Alpha Steel Frames Pty Ltd</p>
              <p>ABN: 45 678 901 234</p>
              <p>12 Titanium Circuit, Yatala, QLD 4207</p>
              <p>Phone: +61 7 3000 1234 | Email: info@alphasteelframes.com.au</p>
              <p>Web: https://alphasteelframes.com.au/</p>
            </div>
          </div>

          <div className="mt-6 sm:mt-0 text-left sm:text-right">
            <h1 className="text-3xl font-extrabold text-[#001e4d] tracking-tight mb-2">
              QUOTATION
            </h1>
            <div className="text-xs text-gray-700 space-y-1">
              <p>
                <span className="font-semibold text-gray-500 uppercase">Quote Number:</span>{" "}
                <span className="font-bold text-gray-900 text-sm">{quote.quoteNumber}</span>
              </p>
              <p>
                <span className="font-semibold text-gray-500 uppercase">Date:</span>{" "}
                {formatDate(quote.date)}
              </p>
              <p>
                <span className="font-semibold text-gray-500 uppercase">Valid Until:</span>{" "}
                {formatDate(quote.expiryDate)}
              </p>
              {quote.reference && (
                <p>
                  <span className="font-semibold text-gray-500 uppercase">Reference:</span>{" "}
                  {quote.reference}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Customer & Project Block */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Quotation Prepared For
            </h3>
            <p className="font-bold text-gray-900 text-base">{quote.contact?.name || "Client"}</p>
            {quote.contact?.address && (
              <p className="text-xs text-gray-600 mt-1 whitespace-pre-line">
                {quote.contact.address}
              </p>
            )}
            {quote.contact?.email && (
              <p className="text-xs text-gray-600 mt-1">Email: {quote.contact.email}</p>
            )}
            {quote.contact?.phone && (
              <p className="text-xs text-gray-600">Phone: {quote.contact.phone}</p>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Project Specification
            </h3>
            <p className="font-semibold text-gray-900 text-sm">
              {quote.title || quote.reference || "Light Gauge Steel Framing Scope"}
            </p>
            {quote.summary && (
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                {quote.summary}
              </p>
            )}
            <div className="mt-3 pt-2 border-t border-gray-200 flex justify-between text-xs text-gray-500">
              <span>Currency: AUD</span>
              <span className="font-medium text-gray-700">
                Pricing Mode: {quote.taxTreatment === "INCLUSIVE" ? "GST Inclusive" : quote.taxTreatment === "NO_TAX" ? "Tax Exempt" : "GST Exclusive"}
              </span>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8 overflow-hidden rounded border border-gray-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#001e4d] text-white">
                <th className="py-2.5 px-3 font-semibold uppercase tracking-wider">Item & Description</th>
                <th className="py-2.5 px-3 text-right font-semibold uppercase tracking-wider w-16">Qty</th>
                <th className="py-2.5 px-3 text-right font-semibold uppercase tracking-wider w-24">Unit Rate</th>
                <th className="py-2.5 px-3 text-right font-semibold uppercase tracking-wider w-16">Disc.</th>
                <th className="py-2.5 px-3 text-right font-semibold uppercase tracking-wider w-20">Tax Rate</th>
                <th className="py-2.5 px-3 text-right font-semibold uppercase tracking-wider w-28">Amount (AUD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {quote.lines?.map((line: any, idx: number) => (
                <tr key={line.id || idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                  <td className="py-3 px-3">
                    {line.itemCode && (
                      <span className="font-mono text-[11px] font-semibold text-[#006fe6] block mb-0.5">
                        {line.itemCode}
                      </span>
                    )}
                    <span className="font-medium text-gray-900 whitespace-pre-line leading-relaxed">
                      {line.description}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right text-gray-700 font-mono">
                    {Number(line.quantity).toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right text-gray-700 font-mono">
                    {formatAUD(Number(line.unitPrice))}
                  </td>
                  <td className="py-3 px-3 text-right text-gray-700 font-mono">
                    {Number(line.discount) > 0 ? `${Number(line.discount)}%` : "—"}
                  </td>
                  <td className="py-3 px-3 text-right text-gray-700">
                    {Number(line.taxRate) > 0 ? `${Number(line.taxRate)}% GST` : "0%"}
                  </td>
                  <td className="py-3 px-3 text-right font-semibold text-gray-900 font-mono">
                    {formatAUD(Number(line.lineAmount))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation Reconciliation Card */}
        <div className="flex justify-end mb-8">
          <div className="w-full sm:w-80 bg-gray-50 p-4 rounded border border-gray-200 space-y-2 text-xs">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span className="font-mono font-medium text-gray-900">{formatAUD(Number(quote.subtotal))}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Total GST (10%):</span>
              <span className="font-mono font-medium text-gray-900">{formatAUD(Number(quote.taxTotal))}</span>
            </div>
            <div className="border-t border-gray-300 pt-2 flex justify-between text-sm font-bold text-[#001e4d]">
              <span>Total Quotation Amount:</span>
              <span className="font-mono text-base">{formatAUD(Number(quote.totalAmount))}</span>
            </div>
          </div>
        </div>

        {/* Payment Terms & Direct Deposit Instructions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-gray-600 border-t border-gray-200 pt-6 mb-8">
          <div>
            <h4 className="font-bold text-gray-800 uppercase tracking-wide mb-1">
              Terms & Conditions
            </h4>
            <p className="leading-relaxed whitespace-pre-line">
              {quote.terms || "Standard payment terms apply. Quotation valid for 30 days from date of issue."}
            </p>
          </div>

          <div className="bg-blue-50/50 p-3 rounded border border-blue-100 text-xs">
            <h4 className="font-bold text-[#001e4d] uppercase tracking-wide mb-1">
              Payment by Direct Deposit (EFT)
            </h4>
            <p><span className="font-semibold text-gray-700">Bank:</span> Commonwealth Bank of Australia</p>
            <p><span className="font-semibold text-gray-700">Account Name:</span> Alpha Steel Frames Pty Ltd</p>
            <p><span className="font-semibold text-gray-700">BSB:</span> 064-000</p>
            <p><span className="font-semibold text-gray-700">Account No:</span> 1234 5678</p>
            <p><span className="font-semibold text-gray-700">Reference:</span> {quote.quoteNumber}</p>
          </div>
        </div>

        {/* Client Acceptance Sign-off */}
        <div className="border-t border-gray-200 pt-6 text-xs">
          <p className="font-semibold text-gray-800 mb-4">
            Customer Acceptance & Authorization:
          </p>
          <div className="grid grid-cols-2 gap-8">
            <div className="border-b border-gray-400 pb-1">
              <span className="text-gray-400">Signature:</span>
            </div>
            <div className="border-b border-gray-400 pb-1">
              <span className="text-gray-400">Date:</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
