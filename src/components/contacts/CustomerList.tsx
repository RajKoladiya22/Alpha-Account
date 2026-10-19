"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export interface CustomerListProps {
  customers: any[];
  onAddNewContact?: () => void;
  onSelectCustomer?: (customer: any) => void;
  onDeleteCustomer?: (id: string, name: string) => Promise<void> | void;
  onBatchDeleteCustomers?: (ids: string[]) => Promise<void> | void;
  onUpdateCustomer?: (customer: any) => Promise<boolean> | boolean;
}

type FilterTab = "customers" | "all" | "owed" | "overdue" | "suppliers";
type SortField = "name" | "theyOwe";
type SortOrder = "asc" | "desc";

export const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  onAddNewContact,
  onSelectCustomer,
  onDeleteCustomer,
  onBatchDeleteCustomers,
  onUpdateCustomer,
}) => {
  const router = useRouter();

  // Search & Filter & Sort state
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("customers");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Row dropdown menu state
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Modal states
  const [deletingCustomer, setDeletingCustomer] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showBatchDeleteModal, setShowBatchDeleteModal] = useState(false);
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);

  // Edit customer modal state
  const [editingCustomer, setEditingCustomer] = useState<any | null>(null);
  const [editForm, setEditForm] = useState({
    id: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    taxNumber: "",
    isCustomer: true,
    isSupplier: false,
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Close row menu on click outside
  useEffect(() => {
    const handleOutsideClick = () => setOpenMenuId(null);
    if (openMenuId) {
      document.addEventListener("click", handleOutsideClick);
    }
    return () => document.removeEventListener("click", handleOutsideClick);
  }, [openMenuId]);

  const avatarColors = [
    "bg-[#a7e8bd] text-[#006020]",
    "bg-[#ffd599] text-[#7a4100]",
    "bg-[#f9c2d1] text-[#801435]",
    "bg-[#ffe58f] text-[#614700]",
    "bg-[#b5f5ec] text-[#00474f]",
  ];

  const getInitials = (name: string) => {
    if (!name) return "CO";
    const parts = name.split(/[\s&]+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Filter calculation
  const customersCount = customers.filter((c) => c.isCustomer !== false).length;
  const owedCount = customers.filter((c) => Number(c.theyOwe) > 0).length;
  const overdueCount = customers.filter((c) => c.overdue || c.isOverdue).length;
  const suppliersCount = customers.filter((c) => c.isSupplier).length;

  const filtered = customers
    .filter((c) => {
      // Tab filter
      if (activeTab === "customers" && c.isCustomer === false) return false;
      if (activeTab === "owed" && !(Number(c.theyOwe) > 0)) return false;
      if (activeTab === "overdue" && !(c.overdue || c.isOverdue)) return false;
      if (activeTab === "suppliers" && !c.isSupplier) return false;

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const addressStr =
          typeof c.address === "string"
            ? c.address.toLowerCase()
            : c.address?.street
            ? `${c.address.street} ${c.address.city || ""}`.toLowerCase()
            : "";

        const matchesName = c.name?.toLowerCase().includes(q);
        const matchesEmail = c.email?.toLowerCase().includes(q);
        const matchesPhone = c.phone?.toLowerCase().includes(q);
        const matchesAddress = addressStr.includes(q);

        return matchesName || matchesEmail || matchesPhone || matchesAddress;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortField === "name") {
        const comp = (a.name || "").localeCompare(b.name || "");
        return sortOrder === "asc" ? comp : -comp;
      }
      if (sortField === "theyOwe") {
        const diff = Number(a.theyOwe || 0) - Number(b.theyOwe || 0);
        return sortOrder === "asc" ? diff : -diff;
      }
      return 0;
    });

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length && filtered.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((c) => c.id)));
    }
  };

  const toggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Open Edit Modal
  const handleOpenEdit = (customer: any) => {
    setOpenMenuId(null);
    setEditingCustomer(customer);
    setEditForm({
      id: customer.id,
      name: customer.name || "",
      email: customer.email || "",
      phone: customer.phone || "",
      address: typeof customer.address === "string" ? customer.address : customer.address?.street || "",
      taxNumber: customer.taxNumber || "",
      isCustomer: customer.isCustomer !== undefined ? customer.isCustomer : true,
      isSupplier: customer.isSupplier !== undefined ? customer.isSupplier : false,
    });
  };

  const handleSaveEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name.trim() || isSavingEdit) return;
    setIsSavingEdit(true);
    try {
      if (onUpdateCustomer) {
        await onUpdateCustomer(editForm);
      }
      setEditingCustomer(null);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Handle single Hard Delete
  const handleConfirmHardDelete = async () => {
    if (!deletingCustomer || isDeleting) return;
    setIsDeleting(true);
    try {
      if (onDeleteCustomer) {
        await onDeleteCustomer(deletingCustomer.id, deletingCustomer.name);
      }
      const next = new Set(selectedIds);
      next.delete(deletingCustomer.id);
      setSelectedIds(next);
      setDeletingCustomer(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handle batch Hard Delete
  const handleConfirmBatchHardDelete = async () => {
    if (selectedIds.size === 0 || isBatchDeleting) return;
    setIsBatchDeleting(true);
    try {
      if (onBatchDeleteCustomers) {
        await onBatchDeleteCustomers(Array.from(selectedIds));
      }
      setSelectedIds(new Set());
      setShowBatchDeleteModal(false);
    } finally {
      setIsBatchDeleting(false);
    }
  };

  return (
    <div className="w-full max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 py-6 font-sans text-gray-800">
      {/* Sub Navigation Bar matching screenshot with real filtering */}
      <div className="flex flex-wrap items-center justify-between border-b border-gray-200 mb-4 text-sm font-medium gap-y-2">
        <div className="flex items-center space-x-2 sm:space-x-6 overflow-x-auto pb-2 sm:pb-0">
          <span className="font-bold text-gray-900 pb-2">Contacts</span>

          <button
            onClick={() => setActiveTab("all")}
            className={`pb-2 transition ${
              activeTab === "all"
                ? "text-[#006fe6] font-semibold border-b-2 border-[#006fe6]"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            All ({customers.length})
          </button>

          <button
            onClick={() => setActiveTab("customers")}
            className={`pb-2 transition ${
              activeTab === "customers"
                ? "text-[#006fe6] font-semibold border-b-2 border-[#006fe6]"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Customers ({customersCount})
          </button>

          <button
            onClick={() => setActiveTab("owed")}
            className={`pb-2 transition ${
              activeTab === "owed"
                ? "text-[#006fe6] font-semibold border-b-2 border-[#006fe6]"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            They owe ({owedCount})
          </button>

          <button
            onClick={() => setActiveTab("overdue")}
            className={`pb-2 transition flex items-center ${
              activeTab === "overdue"
                ? "text-red-600 font-semibold border-b-2 border-red-600"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            <span>Overdue</span>
            {overdueCount > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                {overdueCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("suppliers")}
            className={`pb-2 transition ${
              activeTab === "suppliers"
                ? "text-[#006fe6] font-semibold border-b-2 border-[#006fe6]"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Suppliers ({suppliersCount})
          </button>
        </div>

        {/* Action Button */}
        <div className="flex items-center space-x-2 pb-2">
          <button
            onClick={onAddNewContact}
            className="px-4 py-2 bg-[#137333] hover:bg-[#0e5927] text-white text-sm font-semibold rounded-md shadow-xs transition flex items-center space-x-1.5"
          >
            <span>+ New contact</span>
          </button>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-xs overflow-hidden">
        {/* Header with Search and Sort Controls */}
        <div className="p-4 sm:p-5 border-b border-gray-200 bg-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <h2 className="text-lg font-bold text-gray-900 capitalize">
              {activeTab === "customers"
                ? "Customers"
                : activeTab === "owed"
                ? "Customers who owe money"
                : activeTab === "overdue"
                ? "Overdue accounts"
                : activeTab === "suppliers"
                ? "Suppliers"
                : "All contacts"}
              <span className="text-xs font-normal text-gray-500 ml-2">
                ({filtered.length} {filtered.length === 1 ? "contact" : "contacts"})
              </span>
            </h2>

            {/* Sort controls */}
            <div className="flex items-center space-x-2 text-xs sm:text-sm">
              <span className="text-gray-500 font-medium">Sort by:</span>
              <button
                onClick={() => {
                  if (sortField === "name") {
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  } else {
                    setSortField("name");
                    setSortOrder("asc");
                  }
                }}
                className={`px-2.5 py-1 rounded border text-xs font-semibold flex items-center space-x-1 transition ${
                  sortField === "name"
                    ? "bg-blue-50 border-[#006fe6] text-[#006fe6]"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span>Name</span>
                {sortField === "name" && (
                  <span>{sortOrder === "asc" ? "↑" : "↓"}</span>
                )}
              </button>

              <button
                onClick={() => {
                  if (sortField === "theyOwe") {
                    setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                  } else {
                    setSortField("theyOwe");
                    setSortOrder("desc");
                  }
                }}
                className={`px-2.5 py-1 rounded border text-xs font-semibold flex items-center space-x-1 transition ${
                  sortField === "theyOwe"
                    ? "bg-blue-50 border-[#006fe6] text-[#006fe6]"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span>Balance (They owe)</span>
                {sortField === "theyOwe" && (
                  <span>{sortOrder === "desc" ? "↓" : "↑"}</span>
                )}
              </button>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by contact name, email, phone, or address..."
              className="w-full pl-9 pr-8 py-2 text-sm sm:text-base border border-gray-300 rounded-md bg-gray-50 focus:bg-white focus:outline-none focus:border-[#006fe6] transition"
            />
            <svg
              className="w-4 h-4 text-gray-400 absolute left-3 top-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 font-bold text-sm"
              >
                ✕
              </button>
            )}
          </div>

          {/* Batch Actions Toolbar when rows are selected */}
          {selectedIds.size > 0 && (
            <div className="mt-3 p-2.5 bg-blue-50/70 border border-blue-200 rounded-md flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
              <span className="font-semibold text-blue-900">
                {selectedIds.size} {selectedIds.size === 1 ? "contact" : "contacts"} selected
              </span>

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setShowBatchDeleteModal(true)}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded font-semibold transition shadow-xs flex items-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Hard delete selected ({selectedIds.size})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  className="px-2.5 py-1.5 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 rounded font-medium transition"
                >
                  Deselect all
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Contacts Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
            <thead className="bg-[#f8fafc] text-gray-700 text-xs uppercase font-semibold tracking-wider">
              <tr>
                <th className="w-10 px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.size > 0 && selectedIds.size === filtered.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-[#006fe6] focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 min-w-[280px]">Contact</th>
                <th className="px-4 py-3 w-36 text-right">You owe</th>
                <th className="px-4 py-3 w-40 text-right">They owe</th>
                <th className="w-16 px-3 py-3 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 bg-white">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="max-w-sm mx-auto space-y-2">
                      <p className="font-semibold text-gray-700 text-base">No contacts found</p>
                      <p className="text-xs text-gray-500">
                        {search
                          ? `No contacts match "${search}". Try clearing search.`
                          : "No contacts match the current filter."}
                      </p>
                      {onAddNewContact && (
                        <button
                          onClick={onAddNewContact}
                          className="mt-2 px-3.5 py-1.5 bg-[#006fe6] hover:bg-[#005bb5] text-white rounded text-xs font-semibold"
                        >
                          + Add new contact
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((c, i) => {
                  const isSelected = selectedIds.has(c.id);
                  const initials = getInitials(c.name);
                  const colorClass = avatarColors[i % avatarColors.length];
                  const addressText =
                    typeof c.address === "string"
                      ? c.address
                      : c.address?.street
                      ? [c.address.street, c.address.city, c.address.state, c.address.postalCode].filter(Boolean).join(", ")
                      : "";

                  return (
                    <tr
                      key={c.id}
                      onClick={() => onSelectCustomer && onSelectCustomer(c)}
                      className={`hover:bg-blue-50/30 cursor-pointer transition ${
                        isSelected ? "bg-blue-50/50" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3 text-center" onClick={(e) => toggleRow(c.id, e)}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded border-gray-300 text-[#006fe6] focus:ring-0 cursor-pointer"
                        />
                      </td>

                      {/* Contact Details */}
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-9 h-9 rounded-md flex items-center justify-center font-bold text-xs uppercase shrink-0 ${colorClass}`}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-gray-900 truncate hover:text-[#006fe6]">
                              {c.name}
                            </div>
                            {addressText && (
                              <div className="text-xs text-gray-500 truncate">{addressText}</div>
                            )}
                            <div className="text-xs text-gray-400 truncate">
                              {c.email} {c.phone ? `• ${c.phone}` : ""}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* You owe */}
                      <td className="px-4 py-3 text-right font-medium text-gray-900 font-mono">
                        {Number(c.youOwe) > 0
                          ? Number(c.youOwe).toLocaleString("en-AU", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })
                          : "-"}
                      </td>

                      {/* They owe */}
                      <td className="px-4 py-3 text-right font-medium text-gray-900 font-mono">
                        {Number(c.theyOwe) > 0 ? (
                          <div className="inline-flex items-center justify-end space-x-1.5">
                            {(c.overdue || c.isOverdue) && (
                              <span
                                className="text-red-600 inline-flex"
                                title="Payment is overdue"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                </svg>
                              </span>
                            )}
                            <span className={c.overdue || c.isOverdue ? "text-red-600 font-semibold" : ""}>
                              {Number(c.theyOwe).toLocaleString("en-AU", {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 font-sans text-xs">Nil</span>
                        )}
                      </td>

                      {/* Row Action Menu */}
                      <td
                        className="px-3 py-3 text-center relative"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => setOpenMenuId(openMenuId === c.id ? null : c.id)}
                          className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition"
                          title="Actions"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                          </svg>
                        </button>

                        {/* Dropdown Menu */}
                        {openMenuId === c.id && (
                          <div className="absolute right-3 top-10 w-44 bg-white border border-gray-200 rounded-md shadow-xl z-50 py-1 text-xs sm:text-sm text-left">
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                onSelectCustomer && onSelectCustomer(c);
                              }}
                              className="w-full text-left px-3.5 py-2 hover:bg-gray-100 text-gray-700 flex items-center space-x-2"
                            >
                              <span>👁</span>
                              <span>View details</span>
                            </button>

                            <button
                              onClick={() => handleOpenEdit(c)}
                              className="w-full text-left px-3.5 py-2 hover:bg-gray-100 text-gray-700 flex items-center space-x-2"
                            >
                              <span>✏️</span>
                              <span>Edit customer</span>
                            </button>

                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                router.push(`/quotes/new`);
                              }}
                              className="w-full text-left px-3.5 py-2 hover:bg-gray-100 text-gray-700 flex items-center space-x-2"
                            >
                              <span>📄</span>
                              <span>New quote</span>
                            </button>

                            <div className="border-t border-gray-100 my-1"></div>

                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                setDeletingCustomer(c);
                              }}
                              className="w-full text-left px-3.5 py-2 hover:bg-red-50 text-red-600 font-semibold flex items-center space-x-2"
                            >
                              <span>🗑</span>
                              <span>Hard delete</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h3 className="font-bold text-gray-900 text-base">Edit Customer: {editingCustomer.name}</h3>
              <button
                type="button"
                onClick={() => setEditingCustomer(null)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditSubmit} className="p-5 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Contact Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-[#006fe6] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-[#006fe6] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-[#006fe6] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Postal Address</label>
                <textarea
                  rows={2}
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  placeholder="Street, City, State, Postcode"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-[#006fe6] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Tax / ABN Number</label>
                <input
                  type="text"
                  value={editForm.taxNumber}
                  onChange={(e) => setEditForm({ ...editForm, taxNumber: e.target.value })}
                  placeholder="e.g. 51 824 753 556"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-[#006fe6] focus:outline-none"
                />
              </div>

              <div className="flex items-center space-x-6 pt-1">
                <label className="flex items-center space-x-2 text-xs font-medium text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isCustomer}
                    onChange={(e) => setEditForm({ ...editForm, isCustomer: e.target.checked })}
                    className="rounded border-gray-300 text-[#006fe6] focus:ring-0"
                  />
                  <span>Is Customer</span>
                </label>

                <label className="flex items-center space-x-2 text-xs font-medium text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isSupplier}
                    onChange={(e) => setEditForm({ ...editForm, isSupplier: e.target.checked })}
                    className="rounded border-gray-300 text-[#006fe6] focus:ring-0"
                  />
                  <span>Is Supplier</span>
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingCustomer(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-4 py-2 bg-[#006fe6] hover:bg-[#005bb5] text-white rounded-md font-semibold disabled:opacity-50"
                >
                  {isSavingEdit ? "Saving..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Single Hard Delete Confirmation Modal */}
      {deletingCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center font-bold text-lg shrink-0">
                ⚠️
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Permanently Delete Customer?</h3>
                <p className="text-xs text-gray-500">This action is irreversible (Hard Delete).</p>
              </div>
            </div>

            <p className="text-sm text-gray-700">
              Are you sure you want to hard delete <strong className="text-gray-900">{deletingCustomer.name}</strong>?
              This will permanently purge this customer and all associated quotation and ledger references from the database.
            </p>

            <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setDeletingCustomer(null)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-xs sm:text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmHardDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs sm:text-sm font-semibold transition disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Yes, permanently delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Hard Delete Confirmation Modal */}
      {showBatchDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center font-bold text-lg shrink-0">
                ⚠️
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Permanently Delete {selectedIds.size} Contacts?</h3>
                <p className="text-xs text-gray-500">This action is irreversible (Hard Delete).</p>
              </div>
            </div>

            <p className="text-sm text-gray-700">
              Are you sure you want to permanently delete all <strong>{selectedIds.size}</strong> selected contacts from the database?
            </p>

            <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowBatchDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-xs sm:text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isBatchDeleting}
                onClick={handleConfirmBatchHardDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs sm:text-sm font-semibold transition disabled:opacity-50"
              >
                {isBatchDeleting ? "Deleting..." : `Yes, permanently delete (${selectedIds.size})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
