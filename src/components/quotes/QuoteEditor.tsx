import React, { useState } from "react";
import type { TaxTreatment } from "../../types/index.ts";

export interface LineItemState {
  id: string;
  itemCode: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  account: string;
  taxRate: number;
  amount: number;
}

export interface QuoteEditorProps {
  initialQuoteNumber?: string;
  onSaveAndClose?: (quoteData: any) => void;
  onSaveAndAddAnother?: (quoteData: any) => void;
  onSend?: (quoteData: any) => void;
  onMarkAsSent?: (quoteData: any) => void;
  onCancel?: () => void;
}

export const QuoteEditor: React.FC<QuoteEditorProps> = ({
  initialQuoteNumber = "QU-0007",
  onSaveAndClose,
  onSaveAndAddAnother,
  onSend,
  onMarkAsSent,
  onCancel,
}) => {
  // Form State
  const [contactName, setContactName] = useState("");
  const [showTitleSummary, setShowTitleSummary] = useState(false);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [expiryDate, setExpiryDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [quoteNumber, setQuoteNumber] = useState(initialQuoteNumber);
  const [reference, setReference] = useState("");
  const [currency, setCurrency] = useState("AUD");
  const [project, setProject] = useState("");
  const [taxTreatment, setTaxTreatment] = useState<TaxTreatment>("EXCLUSIVE");
  const [terms, setTerms] = useState("Standard payment terms are 14 days from invoice.");

  // Dropdown UI states
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [showSendMenu, setShowSendMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<Array<{ name: string; size: number }>>([]);

  // Line items state
  const [lines, setLines] = useState<LineItemState[]>([
    {
      id: "line-1",
      itemCode: "",
      description: "Supply and install Colorbond fencing including posts and hardware",
      quantity: 1,
      unitPrice: 1250.0,
      discount: 0,
      account: "200 - Sales",
      taxRate: 10,
      amount: 1250.0,
    },
  ]);

  // Recalculate totals whenever lines or tax treatment change
  const calculateTotals = () => {
    let subtotal = 0;
    let taxTotal = 0;

    const computedLines = lines.map((l) => {
      const gross = l.quantity * l.unitPrice * (1 - (l.discount || 0) / 100);
      let lineAmt = 0;
      let taxAmt = 0;

      if (taxTreatment === "EXCLUSIVE") {
        lineAmt = Math.round(gross * 100) / 100;
        taxAmt = Math.round(lineAmt * (l.taxRate / 100) * 100) / 100;
        subtotal += lineAmt;
        taxTotal += taxAmt;
      } else if (taxTreatment === "INCLUSIVE") {
        const full = Math.round(gross * 100) / 100;
        taxAmt = l.taxRate > 0 ? Math.round((full * (l.taxRate / (100 + l.taxRate))) * 100) / 100 : 0;
        lineAmt = Math.round((full - taxAmt) * 100) / 100;
        subtotal += lineAmt;
        taxTotal += taxAmt;
      } else {
        lineAmt = Math.round(gross * 100) / 100;
        taxAmt = 0;
        subtotal += lineAmt;
      }

      return { ...l, amount: lineAmt };
    });

    const total = Math.round((subtotal + taxTotal) * 100) / 100;
    return { subtotal, taxTotal, total, computedLines };
  };

  const { subtotal, taxTotal, total } = calculateTotals();

  const handleUpdateLine = (index: number, field: keyof LineItemState, value: any) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    setLines(updated);
  };

  const handleAddLine = () => {
    setLines([
      ...lines,
      {
        id: `line-${Date.now()}`,
        itemCode: "",
        description: "",
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        account: "200 - Sales",
        taxRate: 10,
        amount: 0,
      },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length === 1) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  const getFormData = () => ({
    contactName,
    title: showTitleSummary ? title : undefined,
    summary: showTitleSummary ? summary : undefined,
    date: new Date(issueDate),
    expiryDate: new Date(expiryDate),
    quoteNumber,
    reference,
    currency,
    project,
    taxTreatment,
    terms,
    lines,
    attachedFiles,
    subtotal,
    taxTotal,
    totalAmount: total,
  });

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 font-sans text-gray-800">
      {/* Header and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 mb-4 border-b border-gray-200">
        <div>
          <nav className="text-xs text-gray-500 mb-1">
            <span className="hover:underline cursor-pointer" onClick={onCancel}>
              Quotes
            </span>{" "}
            &gt; <span className="text-gray-800 font-medium">New quote</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">New quote</h1>
        </div>

        {/* Top-Right Split Buttons & Context Menu */}
        <div className="flex items-center space-x-2 mt-3 sm:mt-0 relative">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 text-gray-700"
          >
            Cancel
          </button>

          {/* Split Save Button */}
          <div className="inline-flex rounded-md shadow-sm relative">
            <button
              onClick={() => onSaveAndClose && onSaveAndClose(getFormData())}
              className="px-3.5 py-1.5 border border-gray-300 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 rounded-l-md"
            >
              Save
            </button>
            <button
              onClick={() => setShowSaveMenu(!showSaveMenu)}
              className="px-2 py-1.5 border-t border-b border-r border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-r-md"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showSaveMenu && (
              <div className="absolute right-0 top-9 w-44 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-20">
                <button
                  onClick={() => {
                    setShowSaveMenu(false);
                    onSaveAndClose && onSaveAndClose(getFormData());
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Save &amp; close
                </button>
                <button
                  onClick={() => {
                    setShowSaveMenu(false);
                    onSaveAndAddAnother && onSaveAndAddAnother(getFormData());
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Save &amp; add another
                </button>
              </div>
            )}
          </div>

          {/* Split Send Button */}
          <div className="inline-flex rounded-md shadow-sm relative">
            <button
              onClick={() => onSend && onSend(getFormData())}
              className="px-4 py-1.5 bg-[#006fe6] hover:bg-[#005bb5] text-white text-sm font-semibold rounded-l-md"
            >
              Send
            </button>
            <button
              onClick={() => setShowSendMenu(!showSendMenu)}
              className="px-2 py-1.5 bg-[#006fe6] hover:bg-[#005bb5] text-white rounded-r-md border-l border-blue-400"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showSendMenu && (
              <div className="absolute right-0 top-9 w-44 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-20">
                <button
                  onClick={() => {
                    setShowSendMenu(false);
                    onSend && onSend(getFormData());
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Send
                </button>
                <button
                  onClick={() => {
                    setShowSendMenu(false);
                    onMarkAsSent && onMarkAsSent(getFormData());
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Mark as sent
                </button>
              </div>
            )}
          </div>

          {/* More actions menu (...) */}
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="p-1.5 border border-gray-300 rounded hover:bg-gray-50 text-gray-600"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </button>
            {showMoreMenu && (
              <div className="absolute right-0 top-9 w-40 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-20">
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Print PDF
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Copy to
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                  Invoice settings
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Quote Meta Information Grid */}
      <div className="bg-white p-5 border border-gray-200 rounded-md shadow-sm mb-6 space-y-4">
        {/* Customer Field & Title/Summary toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full max-w-md">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Customer <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Add a contact..."
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:border-[#006fe6] focus:ring-1 focus:ring-[#006fe6]"
            />
          </div>

          <div className="mt-3 sm:mt-0">
            {!showTitleSummary ? (
              <button
                type="button"
                onClick={() => setShowTitleSummary(true)}
                className="text-xs font-semibold text-[#006fe6] hover:underline"
              >
                + Add title &amp; summary
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowTitleSummary(false)}
                className="text-xs font-semibold text-gray-500 hover:text-red-600"
              >
                ✕ Remove title &amp; summary
              </button>
            )}
          </div>
        </div>

        {/* Expanded Title & Summary Fields */}
        {showTitleSummary && (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Front yard landscaping"
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Summary</label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={2}
                placeholder="Give your customer a brief summary of the proposed work..."
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded bg-white"
              />
            </div>
          </div>
        )}

        {/* Date, Number, Reference, Currency, Project Row */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Issue date</label>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Expiry date</label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Quote number</label>
            <input
              type="text"
              value={quoteNumber}
              onChange={(e) => setQuoteNumber(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Reference</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. PO-89"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded bg-white"
            >
              <option value="AUD">AUD Australian Dollar</option>
              <option value="USD">USD US Dollar</option>
              <option value="NZD">NZD New Zealand Dollar</option>
              <option value="GBP">GBP British Pound</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Project</label>
            <input
              type="text"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              placeholder="Assign to project"
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
            />
          </div>
        </div>

        {/* Tax Treatment and Columns Config */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-2 text-sm">
            <span className="text-xs font-semibold text-gray-700">Amounts are</span>
            <select
              value={taxTreatment}
              onChange={(e) => setTaxTreatment(e.target.value as TaxTreatment)}
              className="px-2 py-1 text-sm border border-gray-300 rounded bg-white font-medium"
            >
              <option value="EXCLUSIVE">Tax exclusive</option>
              <option value="INCLUSIVE">Tax inclusive</option>
              <option value="NO_TAX">No tax</option>
            </select>
          </div>

          <button
            type="button"
            className="text-xs font-medium text-gray-600 hover:text-gray-900 border border-gray-300 px-2 py-1 rounded"
          >
            Columns (0 hidden)
          </button>
        </div>
      </div>

      {/* Line Items Table */}
      <div className="bg-white border border-gray-200 rounded shadow-sm overflow-x-auto mb-6">
        <table className="min-w-full text-left text-sm divide-y divide-gray-200">
          <thead className="bg-[#f9fafb] text-gray-600 text-xs font-semibold">
            <tr>
              <th className="w-8 px-2 py-2"></th>
              <th className="px-3 py-2 w-36">Item</th>
              <th className="px-3 py-2">Description</th>
              <th className="px-3 py-2 w-20 text-right">Qty</th>
              <th className="px-3 py-2 w-24 text-right">Unit price</th>
              <th className="px-3 py-2 w-20 text-right">Disc %</th>
              <th className="px-3 py-2 w-40">Account</th>
              <th className="px-3 py-2 w-32">Tax rate</th>
              <th className="px-3 py-2 w-28 text-right">Amount {currency}</th>
              <th className="w-10 px-2 py-2"></th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 bg-white">
            {lines.map((line, idx) => (
              <tr key={line.id} className="hover:bg-gray-50/50">
                {/* Drag Handle */}
                <td className="px-2 py-2 text-gray-400 cursor-move text-center">
                  <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7 2a2 2 0 100 4 2 2 0 000-4zm6 0a2 2 0 100 4 2 2 0 000-4zm-6 6a2 2 0 100 4 2 2 0 000-4zm6 0a2 2 0 100 4 2 2 0 000-4zm-6 6a2 2 0 100 4 2 2 0 000-4zm6 0a2 2 0 100 4 2 2 0 000-4z" />
                  </svg>
                </td>

                {/* Item Code */}
                <td className="px-2 py-1.5">
                  <input
                    type="text"
                    value={line.itemCode}
                    onChange={(e) => handleUpdateLine(idx, "itemCode", e.target.value)}
                    placeholder="Search item..."
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </td>

                {/* Description */}
                <td className="px-2 py-1.5">
                  <input
                    type="text"
                    value={line.description}
                    onChange={(e) => handleUpdateLine(idx, "description", e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                  />
                </td>

                {/* Quantity */}
                <td className="px-2 py-1.5">
                  <input
                    type="number"
                    value={line.quantity}
                    onChange={(e) => handleUpdateLine(idx, "quantity", parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right"
                  />
                </td>

                {/* Unit Price */}
                <td className="px-2 py-1.5">
                  <input
                    type="number"
                    step="0.01"
                    value={line.unitPrice}
                    onChange={(e) => handleUpdateLine(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right"
                  />
                </td>

                {/* Discount % */}
                <td className="px-2 py-1.5">
                  <input
                    type="number"
                    value={line.discount}
                    onChange={(e) => handleUpdateLine(idx, "discount", parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-right"
                  />
                </td>

                {/* Account */}
                <td className="px-2 py-1.5">
                  <select
                    value={line.account}
                    onChange={(e) => handleUpdateLine(idx, "account", e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white"
                  >
                    <option value="200 - Sales">200 - Sales</option>
                    <option value="260 - Other Revenue">260 - Other Revenue</option>
                    <option value="300 - Cost of Goods">300 - Cost of Goods</option>
                  </select>
                </td>

                {/* Tax Rate */}
                <td className="px-2 py-1.5">
                  <select
                    value={line.taxRate}
                    onChange={(e) => handleUpdateLine(idx, "taxRate", parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white"
                  >
                    <option value={10}>GST on Income (10%)</option>
                    <option value={0}>GST Free (0%)</option>
                    <option value={15}>15% Tax</option>
                  </select>
                </td>

                {/* Line Amount */}
                <td className="px-3 py-2 text-right font-medium text-gray-900">
                  {line.amount.toFixed(2)}
                </td>

                {/* Delete button */}
                <td className="px-2 py-1.5 text-center">
                  <button
                    onClick={() => handleRemoveLine(idx)}
                    className="text-gray-400 hover:text-red-600 font-bold p-1"
                    title="Delete row"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Add line button */}
        <div className="p-3 bg-white border-t border-gray-200">
          <button
            type="button"
            onClick={handleAddLine}
            className="text-sm font-semibold text-[#006fe6] hover:underline flex items-center space-x-1"
          >
            <span>+ Add a new line</span>
          </button>
        </div>
      </div>

      {/* Bottom Area: Terms, Attachments, and Financial Totals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left: Terms & Files */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Terms</label>
            <textarea
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              rows={3}
              className="w-full p-2.5 text-sm border border-gray-300 rounded bg-white"
            />
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setShowAttachModal(true)}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 bg-white"
            >
              <svg className="w-4 h-4 mr-1.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              Attach files ({attachedFiles.length})
            </button>
          </div>
        </div>

        {/* Right: Subtotal, Tax Breakdown, Total Summary */}
        <div className="bg-white p-5 border border-gray-200 rounded shadow-sm space-y-2 text-sm">
          <div className="flex justify-between py-1 text-gray-600">
            <span>Subtotal</span>
            <span>{subtotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between py-1 text-gray-600 border-b border-gray-100 pb-2">
            <span>Total tax (GST 10%)</span>
            <span>{taxTotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between pt-2 text-lg font-bold text-gray-900">
            <span>Total</span>
            <span>
              {currency} {total.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Attach Files Modal */}
      {showAttachModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Attach files</h3>
              <button
                onClick={() => setShowAttachModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#006fe6] transition cursor-pointer mb-4">
              <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm text-gray-600 font-medium">Drag &amp; drop files here, or browse</p>
              <p className="text-xs text-gray-400 mt-1">Maximum file size: 10MB</p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowAttachModal(false)}
                className="px-4 py-2 bg-[#006fe6] text-white text-sm font-semibold rounded hover:bg-[#005bb5]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
