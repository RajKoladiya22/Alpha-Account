"use client";

import React, { useState, useEffect, useRef } from "react";
import type { TaxTreatment } from "../../types/index";
import {
  calculateQuoteFinancials,
  roundToCents,
  evaluateQtyExpression,
  sanitizeQtyInput,
  sanitizePriceInput,
  sanitizeDiscountInput,
} from "../../core/quotes/quote-calculator";
import { AccountSearchSelect, type AccountOption } from "./AccountSearchSelect";

const defaultFallbackAccounts: AccountOption[] = [
  { id: "acc-101", code: "101", name: "Steel Coil & Raw Material Suppliers", type: "EXPENSE", label: "101 - Steel Coil & Raw Material Suppliers" },
  { id: "acc-200", code: "200", name: "Steel Framing Sales & Manufacturing", type: "REVENUE", label: "200 - Steel Framing Sales & Manufacturing" },
  { id: "acc-260", code: "260", name: "Other Revenue", type: "REVENUE", label: "260 - Other Revenue" },
  { id: "acc-300", code: "300", name: "Cost of Goods Sold", type: "EXPENSE", label: "300 - Cost of Goods" },
  { id: "acc-400", code: "400", name: "Advertising", type: "EXPENSE", label: "400 - Advertising" },
  { id: "acc-420", code: "420", name: "Consulting & Accounting", type: "EXPENSE", label: "420 - Consulting & Accounting" },
  { id: "acc-611", code: "611", name: "Operating Account (CBA)", type: "ASSET", label: "611 - Operating Account (CBA)" },
];

export interface LineItemState {
  id: string;
  itemCode: string;
  description: string;
  quantity: number;
  rawQuantity?: string;
  unitPrice: number;
  rawUnitPrice?: string;
  discount: number;
  rawDiscount?: string;
  account: string;
  taxRate: number;
  amount: number;
}

export interface QuoteEditorProps {
  initialQuoteNumber?: string;
  initialQuote?: any;
  isEditing?: boolean;
  onSaveAndClose?: (quoteData: any) => void;
  onSaveAndAddAnother?: (quoteData: any) => void;
  onSend?: (quoteData: any) => void;
  onMarkAsSent?: (quoteData: any) => void;
  onCancel?: () => void;
}

export const QuoteEditor: React.FC<QuoteEditorProps> = ({
  initialQuoteNumber = "QU-0007",
  initialQuote,
  isEditing = false,
  onSaveAndClose,
  onSaveAndAddAnother,
  onSend,
  onMarkAsSent,
  onCancel,
}) => {
  // Available catalog data from API
  const [availableItems, setAvailableItems] = useState<any[]>([]);
  const [availableAccounts, setAvailableAccounts] = useState<any[]>([]);
  const [availableCustomers, setAvailableCustomers] = useState<any[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Form State - Clean blank defaults for new quotes!
  const [contactName, setContactName] = useState(
    initialQuote?.contact?.name || initialQuote?.contactName || ""
  );
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(
    initialQuote?.contactId || null
  );
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [newCustomerSuccess, setNewCustomerSuccess] = useState<string | null>(null);
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  const exactCustomerMatch = availableCustomers.find(
    (c) => c.name?.toLowerCase().trim() === contactName.toLowerCase().trim()
  );

  const [showTitleSummary, setShowTitleSummary] = useState(
    Boolean(initialQuote?.title || initialQuote?.summary)
  );
  const [title, setTitle] = useState(initialQuote?.title || "");
  const [summary, setSummary] = useState(initialQuote?.summary || "");
  const [issueDate, setIssueDate] = useState(
    initialQuote?.date
      ? new Date(initialQuote.date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [expiryDate, setExpiryDate] = useState(
    initialQuote?.expiryDate
      ? new Date(initialQuote.expiryDate).toISOString().split("T")[0]
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [quoteNumber, setQuoteNumber] = useState(
    initialQuote?.quoteNumber || initialQuoteNumber
  );
  const [reference, setReference] = useState(initialQuote?.reference || "");
  const [currency, setCurrency] = useState(initialQuote?.currency || "AUD");
  const [project, setProject] = useState(initialQuote?.project || "");
  const [taxTreatment, setTaxTreatment] = useState<TaxTreatment>(
    initialQuote?.taxTreatment || "EXCLUSIVE"
  );
  const [terms, setTerms] = useState(initialQuote?.terms || "");

  // Dropdown UI states
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [showSendMenu, setShowSendMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<Array<{ name: string; size: number }>>([]);

  // Line items state - Empty by default when creating new quote
  const [lines, setLines] = useState<LineItemState[]>(() => {
    if (initialQuote?.lines && initialQuote.lines.length > 0) {
      return initialQuote.lines.map((l: any, i: number) => ({
        id: l.id || `line-${i}`,
        itemCode: l.itemCode || "",
        description: l.description || "",
        quantity: Number(l.quantity) || 1,
        rawQuantity: String(l.quantity ?? 1),
        unitPrice: Number(l.unitPrice) || 0,
        rawUnitPrice: String(l.unitPrice ?? 0),
        discount: Number(l.discount) || 0,
        rawDiscount: String(l.discount ?? 0),
        account: l.accountId || "200 - Sales",
        taxRate: Number(l.taxRate !== undefined ? l.taxRate : 10),
        amount: Number(l.lineAmount) || 0,
      }));
    }
    // Clean blank initial row without default demo data
    return [
      {
        id: "line-1",
        itemCode: "",
        description: "",
        quantity: 1,
        rawQuantity: "1",
        unitPrice: 0,
        rawUnitPrice: "0",
        discount: 0,
        rawDiscount: "0",
        account: "",
        taxRate: 10,
        amount: 0,
      },
    ];
  });

  // Fetch items, accounts, and customers on mount
  useEffect(() => {
    fetch("/api/items")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.items)) {
          setAvailableItems(d.items);
        }
      })
      .catch(() => {});

    fetch("/api/accounts")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.accounts)) {
          setAvailableAccounts(d.accounts);
        }
      })
      .catch(() => {});

    fetch("/api/contacts/customers")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.customers)) {
          setAvailableCustomers(d.customers);
        }
      })
      .catch(() => {});
  }, []);

  // Update quoteNumber if prop changes and not editing
  useEffect(() => {
    if (!initialQuote && initialQuoteNumber) {
      setQuoteNumber(initialQuoteNumber);
    }
  }, [initialQuoteNumber, initialQuote]);

  // Recalculate totals whenever lines or tax treatment change
  const financialSummary = calculateQuoteFinancials(
    lines.map((l) => ({
      id: l.id,
      itemCode: l.itemCode,
      description: l.description,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      discount: l.discount,
      taxRate: l.taxRate,
      accountId: l.account,
    })),
    taxTreatment
  );

  const subtotal = financialSummary.subtotal;
  const taxTotal = financialSummary.taxTotal;
  const total = financialSummary.totalAmount;

  // Close customer dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        customerDropdownRef.current &&
        !customerDropdownRef.current.contains(e.target as Node)
      ) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter customers for autocomplete
  const handleCustomerChange = (val: string) => {
    setContactName(val);
    setSelectedCustomerId(null);
    setNewCustomerSuccess(null);
    setValidationError(null);

    if (!val.trim()) {
      setFilteredCustomers([]);
      setShowCustomerDropdown(false);
    } else {
      const q = val.toLowerCase().trim();
      const filtered = availableCustomers.filter(
        (c) =>
          c.name?.toLowerCase().includes(q) ||
          (c.email && c.email.toLowerCase().includes(q))
      );
      setFilteredCustomers(filtered);
      setShowCustomerDropdown(true);
    }
  };

  const handleSelectCustomer = (c: any) => {
    setContactName(c.name);
    setSelectedCustomerId(c.id);
    setShowCustomerDropdown(false);
    setNewCustomerSuccess(null);
  };

  const handleCreateNewCustomer = async (nameToCreate: string) => {
    const trimmed = nameToCreate.trim();
    if (!trimmed || isCreatingCustomer) return;
    setIsCreatingCustomer(true);
    try {
      const res = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmed,
          isCustomer: true,
        }),
      });
      const data = await res.json();
      if (data.success && data.contact) {
        const newContact = data.contact;
        setAvailableCustomers((prev) => [newContact, ...prev]);
        setContactName(newContact.name);
        setSelectedCustomerId(newContact.id);
        setShowCustomerDropdown(false);
        setNewCustomerSuccess(`"${newContact.name}" added`);
        setTimeout(() => setNewCustomerSuccess(null), 4000);
      } else {
        setShowCustomerDropdown(false);
      }
    } catch {
      setShowCustomerDropdown(false);
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  // Synchronized row height state so all inputs in a row expand and contract identically with Description
  const [rowHeights, setRowHeights] = useState<Record<string, number>>({});
  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  const calculateDefaultRowHeight = (text: string) => {
    if (!text) return 42;
    const linesCount = text.split("\n").length;
    if (linesCount <= 1) {
      const approxLines = Math.max(1, Math.ceil(text.length / 45));
      return Math.min(240, Math.max(42, 42 + (approxLines - 1) * 22));
    }
    return Math.min(240, Math.max(42, 42 + (linesCount - 1) * 22));
  };

  const adjustRowHeight = (id: string, el: HTMLTextAreaElement | null) => {
    if (!el) return;
    el.style.height = "auto";
    const measuredHeight = Math.max(42, Math.min(240, el.scrollHeight));
    el.style.height = `${measuredHeight}px`;
    setRowHeights((prev) => {
      if (prev[id] === measuredHeight) return prev;
      return { ...prev, [id]: measuredHeight };
    });
  };

  // Synchronize row heights on mount & text updates
  const descriptionsKey = lines.map((l) => `${l.id}:${l.description}`).join("|");
  useEffect(() => {
    lines.forEach((l) => {
      const el = textareaRefs.current[l.id];
      if (el) {
        adjustRowHeight(l.id, el);
      }
    });
  }, [descriptionsKey]);

  const handleUpdateLine = (index: number, field: keyof LineItemState, value: any) => {
    setValidationError(null);
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
        rawQuantity: "1",
        unitPrice: 0,
        rawUnitPrice: "0",
        discount: 0,
        rawDiscount: "0",
        account: "",
        taxRate: 10,
        amount: 0,
      },
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (lines.length === 1) return;
    setLines(lines.filter((_, i) => i !== index));
  };

  // Validation function enforcing: Customer required, Account required, Tax rate required
  const validateForm = (): boolean => {
    if (!contactName.trim()) {
      setValidationError("Please enter or select a Customer.");
      return false;
    }

    if (lines.length === 0) {
      setValidationError("Quotation must have at least one line item.");
      return false;
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      if (!line.description.trim()) {
        setValidationError(`Line ${lineNum}: Description is required.`);
        return false;
      }

      if (!line.account || line.account.trim() === "") {
        setValidationError(`Line ${lineNum}: Account is required. Please select an Account.`);
        return false;
      }

      if (line.taxRate === undefined || line.taxRate === null || isNaN(Number(line.taxRate))) {
        setValidationError(`Line ${lineNum}: Tax rate is required. Please select a Tax rate.`);
        return false;
      }
    }

    setValidationError(null);
    return true;
  };

  const getFormData = () => ({
    contactId: selectedCustomerId || undefined,
    contactName: contactName.trim(),
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
    lines: lines.map((l, i) => {
      const calculatedQty = evaluateQtyExpression(
        l.rawQuantity !== undefined ? l.rawQuantity : String(l.quantity),
        l.quantity || 1
      );
      const calculatedUnitPrice =
        parseFloat(l.rawUnitPrice !== undefined ? l.rawUnitPrice : String(l.unitPrice)) || 0;
      const calculatedDiscount = Math.min(
        100,
        Math.max(
          0,
          parseFloat(l.rawDiscount !== undefined ? l.rawDiscount : String(l.discount)) || 0
        )
      );
      const calculatedLine = financialSummary.lines[i];
      return {
        itemCode: l.itemCode || undefined, // Item is optional
        description: l.description,
        quantity: calculatedQty,
        unitPrice: calculatedUnitPrice,
        discount: calculatedDiscount,
        account: l.account, // Account is required
        taxRate: l.taxRate, // Tax rate is required
        lineAmount: calculatedLine ? calculatedLine.lineAmount : l.amount,
      };
    }),
    attachedFiles,
    subtotal,
    taxTotal,
    totalAmount: total,
  });

  const handleTriggerAction = (actionCallback?: (data: any) => void) => {
    if (!validateForm()) return;
    if (actionCallback) {
      actionCallback(getFormData());
    }
  };

  return (
    <div className="w-full max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 py-5 font-sans text-gray-800">
      {/* Header and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 mb-4 border-b border-gray-200">
        <div>
          <nav className="text-xs sm:text-sm text-gray-500 mb-1">
            <span className="hover:underline cursor-pointer" onClick={onCancel}>
              Quotes
            </span>{" "}
            &gt;{" "}
            <span className="text-gray-800 font-semibold">
              {isEditing ? `Edit ${quoteNumber}` : "New quote"}
            </span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            {isEditing ? `Edit quote ${quoteNumber}` : "New quote"}
          </h1>
        </div>

        {/* Top-Right Action Buttons */}
        <div className="flex items-center space-x-2 mt-3 sm:mt-0 relative">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm sm:text-base font-medium hover:bg-gray-50 text-gray-700 transition"
          >
            Cancel
          </button>

          {/* Split Save Button */}
          <div className="inline-flex rounded-md shadow-sm relative">
            <button
              onClick={() => handleTriggerAction(onSaveAndClose)}
              className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-sm sm:text-base font-semibold text-gray-700 rounded-l-md transition"
            >
              Save
            </button>
            <button
              onClick={() => setShowSaveMenu(!showSaveMenu)}
              className="px-2.5 py-2 border-t border-b border-r border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded-r-md transition"
              title="More save options"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showSaveMenu && (
              <div className="absolute right-0 top-11 w-48 bg-white border border-gray-200 rounded-md shadow-xl py-1 z-30">
                <button
                  onClick={() => {
                    setShowSaveMenu(false);
                    handleTriggerAction(onSaveAndClose);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm sm:text-base text-gray-700 hover:bg-gray-100 font-medium"
                >
                  Save &amp; close
                </button>
                <button
                  onClick={() => {
                    setShowSaveMenu(false);
                    handleTriggerAction(onSaveAndAddAnother);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm sm:text-base text-gray-700 hover:bg-gray-100 font-medium"
                >
                  Save &amp; add another
                </button>
              </div>
            )}
          </div>

          {/* Split Send Button */}
          <div className="inline-flex rounded-md shadow-sm relative">
            <button
              onClick={() => handleTriggerAction(onSend)}
              className="px-5 py-2 bg-[#006fe6] hover:bg-[#005bb5] text-white text-sm sm:text-base font-semibold rounded-l-md transition shadow-xs"
            >
              Send
            </button>
            <button
              onClick={() => setShowSendMenu(!showSendMenu)}
              className="px-2.5 py-2 bg-[#006fe6] hover:bg-[#005bb5] text-white rounded-r-md border-l border-blue-400 transition"
              title="More send options"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showSendMenu && (
              <div className="absolute right-0 top-11 w-48 bg-white border border-gray-200 rounded-md shadow-xl py-1 z-30">
                <button
                  onClick={() => {
                    setShowSendMenu(false);
                    handleTriggerAction(onSend);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm sm:text-base text-gray-700 hover:bg-gray-100 font-medium"
                >
                  Send
                </button>
                <button
                  onClick={() => {
                    setShowSendMenu(false);
                    handleTriggerAction(onMarkAsSent);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm sm:text-base text-gray-700 hover:bg-gray-100 font-medium"
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
              className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-600 transition"
              title="More options"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            </button>
            {showMoreMenu && (
              <div className="absolute right-0 top-11 w-44 bg-white border border-gray-200 rounded-md shadow-xl py-1 z-30">
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    if (initialQuote?.id) {
                      window.open(`/quotes/${initialQuote.id}/print`, "_blank");
                    } else {
                      window.print();
                    }
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm sm:text-base text-gray-700 hover:bg-gray-100"
                >
                  Print PDF
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Validation Error Alert */}
      {validationError && (
        <div className="mb-5 p-3.5 bg-red-50 border-l-4 border-red-500 rounded-r-md text-red-700 text-sm sm:text-base flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-red-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">{validationError}</span>
          </div>
          <button onClick={() => setValidationError(null)} className="text-red-500 hover:text-red-700 font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {/* Main Quote Meta Information Grid */}
      <div className="bg-white p-5 sm:p-6 border border-gray-200 rounded-lg shadow-xs mb-6 space-y-5">
        {/* Customer Field & Title/Summary toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="w-full max-w-lg relative" ref={customerDropdownRef}>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
              <span>
                Customer <span className="text-red-500 font-bold">*</span>
              </span>
              {newCustomerSuccess && (
                <span className="text-xs font-semibold text-emerald-600 flex items-center bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <svg className="w-3.5 h-3.5 mr-1 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {newCustomerSuccess}
                </span>
              )}
            </label>

            <div className="relative flex items-center">
              <input
                type="text"
                value={contactName}
                onChange={(e) => handleCustomerChange(e.target.value)}
                onFocus={() => {
                  if (contactName.trim()) {
                    setShowCustomerDropdown(true);
                  } else if (availableCustomers.length > 0) {
                    setFilteredCustomers(availableCustomers.slice(0, 10));
                    setShowCustomerDropdown(true);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (!exactCustomerMatch && contactName.trim()) {
                      handleCreateNewCustomer(contactName.trim());
                    } else if (filteredCustomers.length > 0) {
                      handleSelectCustomer(filteredCustomers[0]);
                    }
                  }
                }}
                placeholder="Search or enter customer name..."
                className={`w-full px-3.5 py-2 text-sm sm:text-base border rounded-md focus:border-[#006fe6] focus:ring-1 focus:ring-[#006fe6] transition ${
                  contactName.trim() && !exactCustomerMatch ? "pr-24" : ""
                } ${
                  validationError && !contactName.trim()
                    ? "border-red-500 bg-red-50/20"
                    : "border-gray-300"
                }`}
              />

              {/* Show "+ Add" button inside/beside input when customer does not exist */}
              {contactName.trim() && !exactCustomerMatch && (
                <button
                  type="button"
                  disabled={isCreatingCustomer}
                  onClick={() => handleCreateNewCustomer(contactName.trim())}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2.5 py-1 bg-[#006fe6] hover:bg-[#005bb5] text-white text-xs sm:text-sm font-semibold rounded transition flex items-center space-x-1 shadow-xs disabled:opacity-50"
                  title="Create this customer in database"
                >
                  {isCreatingCustomer ? (
                    <span>Adding...</span>
                  ) : (
                    <>
                      <span className="font-bold">+</span>
                      <span>Add</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Customer Dropdown */}
            {showCustomerDropdown && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-2xl z-30 max-h-64 overflow-y-auto divide-y divide-gray-100">
                {/* If new customer, show prominent Add option at top of dropdown */}
                {contactName.trim() && !exactCustomerMatch && (
                  <div
                    onClick={() => handleCreateNewCustomer(contactName.trim())}
                    className="p-3 bg-blue-50/80 hover:bg-blue-100/90 text-[#006fe6] cursor-pointer flex items-center justify-between transition group"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                      <span className="w-5 h-5 rounded-full bg-[#006fe6] text-white flex items-center justify-center text-xs font-bold shrink-0">
                        +
                      </span>
                      <span className="font-semibold text-sm sm:text-base truncate">
                        Add &ldquo;<span className="font-bold text-gray-900">{contactName.trim()}</span>&rdquo; as new customer
                      </span>
                    </div>
                    <span className="text-xs bg-white text-[#006fe6] font-semibold px-2 py-0.5 rounded border border-blue-200 shrink-0 group-hover:border-[#006fe6]">
                      + Add
                    </span>
                  </div>
                )}

                {/* Matching existing customers */}
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleSelectCustomer(c)}
                      className="px-3.5 py-2.5 text-sm sm:text-base hover:bg-gray-50 cursor-pointer transition flex items-center justify-between"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900">{c.name}</div>
                        {c.email && <div className="text-xs text-gray-500">{c.email}</div>}
                      </div>
                      <span className="text-xs font-medium text-gray-400">Customer</span>
                    </div>
                  ))
                ) : !contactName.trim() ? (
                  <div className="p-3 text-xs text-gray-400 text-center">
                    Type a customer name to search or add
                  </div>
                ) : null}
              </div>
            )}
          </div>

          <div className="mt-3 sm:mt-0">
            {!showTitleSummary ? (
              <button
                type="button"
                onClick={() => setShowTitleSummary(true)}
                className="text-sm font-semibold text-[#006fe6] hover:underline"
              >
                + Add title &amp; summary
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowTitleSummary(false)}
                className="text-sm font-semibold text-gray-500 hover:text-red-600"
              >
                ✕ Remove title &amp; summary
              </button>
            )}
          </div>
        </div>

        {/* Expanded Title & Summary Fields */}
        {showTitleSummary && (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-md space-y-3">
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Structural Steel Framing - 34 Riverview Dr"
                className="w-full px-3.5 py-2 text-sm sm:text-base border border-gray-300 rounded-md bg-white"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Summary</label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={2}
                placeholder="Give your customer a brief summary of the proposed steel framing package..."
                className="w-full px-3.5 py-2 text-sm sm:text-base border border-gray-300 rounded-md bg-white"
              />
            </div>
          </div>
        )}

        {/* Date, Number, Reference, Currency, Project Row */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Issue date</label>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Expiry date</label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Quote number</label>
            <input
              type="text"
              value={quoteNumber}
              onChange={(e) => setQuoteNumber(e.target.value)}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md font-mono font-medium"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Reference</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. Lot 402 Bridgeman Down"
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md bg-white"
            >
              <option value="AUD">AUD Australian Dollar</option>
              <option value="USD">USD US Dollar</option>
              <option value="NZD">NZD New Zealand Dollar</option>
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1">Project</label>
            <input
              type="text"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              placeholder="Assign to project"
              className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md"
            />
          </div>
        </div>

        {/* Tax Treatment and Columns Config */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center space-x-3 text-sm sm:text-base">
            <span className="text-xs sm:text-sm font-semibold text-gray-700">Amounts are</span>
            <select
              value={taxTreatment}
              onChange={(e) => setTaxTreatment(e.target.value as TaxTreatment)}
              className="px-3 py-1.5 text-sm sm:text-base border border-gray-300 rounded-md bg-white font-medium"
            >
              <option value="EXCLUSIVE">Tax exclusive</option>
              <option value="INCLUSIVE">Tax inclusive</option>
              <option value="NO_TAX">No tax</option>
            </select>
          </div>

          <div className="text-xs sm:text-sm text-gray-500 font-medium">
            Australian GST (10%) calculated automatically
          </div>
        </div>
      </div>

      {/* Line Items Table - Generous width and comfortable desktop typography */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-xs overflow-x-auto mb-6">
        <table className="min-w-full text-left divide-y divide-gray-200">
          <thead className="bg-[#f8fafc] text-gray-700 text-xs sm:text-sm font-semibold uppercase tracking-wider">
            <tr>
              <th className="w-8 px-2 py-3"></th>
              <th className="px-3 py-3 w-48">Item (optional)</th>
              <th className="px-3 py-3 min-w-[280px]">Description <span className="text-red-500">*</span></th>
              <th className="px-3 py-3 w-24 text-right">Qty</th>
              <th className="px-3 py-3 w-32 text-right">Unit price</th>
              <th className="px-3 py-3 w-24 text-right">Disc %</th>
              <th className="px-3 py-3 w-56">Account <span className="text-red-500">*</span></th>
              <th className="px-3 py-3 w-40">Tax rate <span className="text-red-500">*</span></th>
              <th className="px-3 py-3 w-36 text-right">Amount {currency}</th>
              <th className="w-10 px-2 py-3 text-center"></th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 bg-white">
            {lines.map((line, idx) => {
              const lineCalc = financialSummary.lines[idx];
              const lineDisplayAmount = lineCalc ? lineCalc.lineAmount : line.amount;
              const hasAccountError = validationError && (!line.account || line.account.trim() === "");
              const hasTaxError = validationError && (line.taxRate === undefined || line.taxRate === null);
              const rowHeight = rowHeights[line.id] || calculateDefaultRowHeight(line.description);

              return (
                <tr key={line.id} className="hover:bg-gray-50/60 transition">
                  {/* Drag Handle */}
                  <td className="px-2 py-2 text-gray-400 cursor-move text-center align-top">
                    <div
                      style={{ height: `${rowHeight}px` }}
                      className="flex items-center justify-center"
                    >
                      <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M7 2a2 2 0 100 4 2 2 0 000-4zm6 0a2 2 0 100 4 2 2 0 000-4zm-6 6a2 2 0 100 4 2 2 0 000-4zm6 0a2 2 0 100 4 2 2 0 000-4zm-6 6a2 2 0 100 4 2 2 0 000-4zm6 0a2 2 0 100 4 2 2 0 000-4z" />
                      </svg>
                    </div>
                  </td>

                  {/* Item Code (Optional: user enters item manually, no select option) */}
                  <td className="px-2 py-2 align-top">
                    <input
                      type="text"
                      value={line.itemCode || ""}
                      onChange={(e) => handleUpdateLine(idx, "itemCode", e.target.value)}
                      placeholder="Item code (optional)"
                      style={{ height: `${rowHeight}px` }}
                      className="w-full px-2.5 py-2 border border-gray-300 rounded-md text-sm sm:text-base bg-white focus:outline-none focus:border-[#006fe6]"
                    />
                  </td>

                  {/* Description (Multiline with auto-adjusting height) */}
                  <td className="px-2 py-2 align-top">
                    <textarea
                      ref={(el) => {
                        textareaRefs.current[line.id] = el;
                      }}
                      rows={1}
                      value={line.description}
                      onChange={(e) => {
                        handleUpdateLine(idx, "description", e.target.value);
                        adjustRowHeight(line.id, e.target);
                      }}
                      placeholder="Line item description..."
                      style={{ height: `${rowHeight}px` }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm sm:text-base focus:outline-none focus:border-[#006fe6] resize-none leading-normal overflow-y-auto"
                    />
                  </td>

                  {/* Quantity (type="text", strict numbers with + and - calculator) */}
                  <td className="px-2 py-2 align-top">
                    <input
                      type="text"
                      inputMode="text"
                      value={line.rawQuantity !== undefined ? line.rawQuantity : String(line.quantity)}
                      onChange={(e) => {
                        const sanitized = sanitizeQtyInput(e.target.value);
                        const updated = [...lines];
                        updated[idx] = {
                          ...updated[idx],
                          rawQuantity: sanitized,
                        };
                        // If fully numeric without operators, immediately reflect in quantity for live totals
                        if (/^\d+(\.\d+)?$/.test(sanitized)) {
                          updated[idx].quantity = parseFloat(sanitized) || 0;
                        }
                        setLines(updated);
                      }}
                      onBlur={() => {
                        const raw = line.rawQuantity !== undefined ? line.rawQuantity : String(line.quantity);
                        const calculated = evaluateQtyExpression(raw, 1);
                        const updated = [...lines];
                        updated[idx] = {
                          ...updated[idx],
                          quantity: calculated,
                          rawQuantity: String(calculated),
                        };
                        setLines(updated);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.currentTarget.blur();
                        }
                      }}
                      placeholder="1"
                      style={{ height: `${rowHeight}px` }}
                      className="w-full px-2.5 py-2 border border-gray-300 rounded-md text-sm sm:text-base text-right font-mono focus:outline-none focus:border-[#006fe6]"
                      title="Enter quantity or expression (e.g. 9+2, 10-3)"
                    />
                  </td>

                  {/* Unit Price (type="text", strictly numbers only) */}
                  <td className="px-2 py-2 align-top">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={line.rawUnitPrice !== undefined ? line.rawUnitPrice : String(line.unitPrice)}
                      onChange={(e) => {
                        const sanitized = sanitizePriceInput(e.target.value);
                        const num = parseFloat(sanitized) || 0;
                        const updated = [...lines];
                        updated[idx] = {
                          ...updated[idx],
                          rawUnitPrice: sanitized,
                          unitPrice: num,
                        };
                        setLines(updated);
                      }}
                      onBlur={() => {
                        const raw = line.rawUnitPrice !== undefined ? line.rawUnitPrice : String(line.unitPrice);
                        const num = parseFloat(raw) || 0;
                        const updated = [...lines];
                        updated[idx] = {
                          ...updated[idx],
                          unitPrice: num,
                          rawUnitPrice: String(num),
                        };
                        setLines(updated);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.currentTarget.blur();
                        }
                      }}
                      placeholder="0.00"
                      style={{ height: `${rowHeight}px` }}
                      className="w-full px-2.5 py-2 border border-gray-300 rounded-md text-sm sm:text-base text-right font-mono focus:outline-none focus:border-[#006fe6]"
                    />
                  </td>

                  {/* Discount % (type="text", strictly numbers only 0-100) */}
                  <td className="px-2 py-2 align-top">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={line.rawDiscount !== undefined ? line.rawDiscount : String(line.discount)}
                      onChange={(e) => {
                        const sanitized = sanitizeDiscountInput(e.target.value);
                        const num = Math.min(100, Math.max(0, parseFloat(sanitized) || 0));
                        const updated = [...lines];
                        updated[idx] = {
                          ...updated[idx],
                          rawDiscount: sanitized,
                          discount: num,
                        };
                        setLines(updated);
                      }}
                      onBlur={() => {
                        const raw = line.rawDiscount !== undefined ? line.rawDiscount : String(line.discount);
                        const num = Math.min(100, Math.max(0, parseFloat(raw) || 0));
                        const updated = [...lines];
                        updated[idx] = {
                          ...updated[idx],
                          discount: num,
                          rawDiscount: String(num),
                        };
                        setLines(updated);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.currentTarget.blur();
                        }
                      }}
                      placeholder="0"
                      style={{ height: `${rowHeight}px` }}
                      className="w-full px-2.5 py-2 border border-gray-300 rounded-md text-sm sm:text-base text-right font-mono focus:outline-none focus:border-[#006fe6]"
                    />
                  </td>

                  {/* Account (Required: search to select) */}
                  <td className="px-2 py-2 align-top relative">
                    <AccountSearchSelect
                      value={line.account}
                      onChange={(val) => handleUpdateLine(idx, "account", val)}
                      accounts={availableAccounts.length > 0 ? availableAccounts : defaultFallbackAccounts}
                      hasError={Boolean(hasAccountError)}
                      placeholder="-- Select account * --"
                      height={rowHeight}
                    />
                  </td>

                  {/* Tax Rate (Required select) */}
                  <td className="px-2 py-2 align-top">
                    <select
                      value={line.taxRate}
                      onChange={(e) => handleUpdateLine(idx, "taxRate", parseFloat(e.target.value))}
                      style={{ height: `${rowHeight}px` }}
                      className={`w-full px-2.5 py-2 border rounded-md text-sm sm:text-base bg-white focus:outline-none focus:border-[#006fe6] ${
                        hasTaxError ? "border-red-500 bg-red-50/30" : "border-gray-300"
                      }`}
                      required
                    >
                      <option value="">-- Select tax rate * --</option>
                      <option value={10}>GST on Income (10%)</option>
                      <option value={0}>GST Free (0%)</option>
                      <option value={15}>15% Tax</option>
                    </select>
                  </td>

                  {/* Line Amount */}
                  <td className="px-3 py-2 text-right align-top">
                    <div
                      style={{ height: `${rowHeight}px` }}
                      className="flex items-center justify-end font-semibold text-gray-900 font-mono text-sm sm:text-base"
                    >
                      {lineDisplayAmount.toFixed(2)}
                    </div>
                  </td>

                  {/* Delete button */}
                  <td className="px-2 py-2 text-center align-top">
                    <div
                      style={{ height: `${rowHeight}px` }}
                      className="flex items-center justify-center"
                    >
                      <button
                        onClick={() => handleRemoveLine(idx)}
                        className="text-gray-400 hover:text-red-600 font-bold p-1.5 transition text-base"
                        title="Delete row"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Add line button */}
        <div className="px-4 py-3 bg-white border-t border-gray-200">
          <button
            type="button"
            onClick={handleAddLine}
            className="text-sm sm:text-base font-semibold text-[#006fe6] hover:text-[#005bb5] hover:underline flex items-center space-x-1.5 transition"
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
            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1.5">Terms &amp; Notes</label>
            <textarea
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              placeholder="Standard payment terms are 14 days from invoice. Quotation is valid for 30 days from date of issue."
              rows={4}
              className="w-full p-3 text-sm sm:text-base border border-gray-300 rounded-md bg-white focus:outline-none focus:border-[#006fe6]"
            />
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => setShowAttachModal(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm sm:text-base text-gray-700 hover:bg-gray-50 bg-white transition shadow-xs"
            >
              <svg className="w-4 h-4 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              Attach files ({attachedFiles.length})
            </button>
          </div>
        </div>

        {/* Right: Subtotal, Tax Breakdown, Total Summary */}
        <div className="bg-white p-6 border border-gray-200 rounded-lg shadow-xs space-y-3 text-sm sm:text-base">
          <div className="flex justify-between py-1 text-gray-600">
            <span className="font-medium">Subtotal</span>
            <span className="font-mono text-gray-900 font-semibold">{subtotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between py-1 text-gray-600 border-b border-gray-100 pb-3">
            <span className="font-medium">
              Total tax ({taxTreatment === "NO_TAX" ? "Tax Exempt" : "GST 10%"})
            </span>
            <span className="font-mono text-gray-900 font-semibold">{taxTotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between pt-2 text-xl sm:text-2xl font-bold text-gray-900">
            <span>Total</span>
            <span className="font-mono text-[#006fe6]">
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
              <p className="text-sm sm:text-base text-gray-600 font-medium">Drag &amp; drop files here, or browse</p>
              <p className="text-xs text-gray-400 mt-1">Maximum file size: 10MB</p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowAttachModal(false)}
                className="px-5 py-2 bg-[#006fe6] text-white text-sm sm:text-base font-semibold rounded-md hover:bg-[#005bb5]"
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
