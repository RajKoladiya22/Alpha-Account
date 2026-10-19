"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppHeader } from "../../../components/layout/AppHeader";

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [contact, setContact] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chartMode, setChartMode] = useState<"Graph" | "Table">("Graph");
  const [activityTab, setActivityTab] = useState<"All" | "Invoices" | "Quotes">("All");
  const [search, setSearch] = useState("");

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    taxNumber: "",
    isCustomer: true,
    isSupplier: false,
  });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Hard delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Actions menu state
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const fetchContact = () => {
    if (id) {
      fetch(`/api/contacts/${id}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.contact) setContact(data.contact);
        })
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    fetchContact();
  }, [id]);

  const handleOpenEdit = () => {
    setShowActionsMenu(false);
    if (!contact) return;
    setEditForm({
      name: contact.name || "",
      email: contact.email || "",
      phone: contact.phone || "",
      address: contact.address || "",
      taxNumber: contact.taxNumber || "",
      isCustomer: contact.isCustomer !== undefined ? contact.isCustomer : true,
      isSupplier: contact.isSupplier !== undefined ? contact.isSupplier : false,
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name.trim() || isSavingEdit) return;
    setIsSavingEdit(true);
    try {
      const res = await fetch(`/api/contacts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success && data.contact) {
        setContact((prev: any) => ({ ...prev, ...data.contact }));
        setShowEditModal(false);
        setNotification({ type: "success", message: "Customer details updated successfully." });
        setTimeout(() => setNotification(null), 4000);
      } else {
        alert(data.error || "Failed to update contact");
      }
    } catch (err: any) {
      alert(err.message || "Failed to update contact");
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleHardDelete = async () => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/contacts/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        router.push("/contacts/customers");
      } else {
        alert(data.error || "Failed to delete contact");
        setIsDeleting(false);
      }
    } catch (err: any) {
      alert(err.message || "Failed to delete contact");
      setIsDeleting(false);
    }
  };

  if (loading || !contact) {
    return (
      <div className="min-h-screen bg-[#f8f9fa]">
        <AppHeader activeNav="Contacts" userInitials="SB" />
        <div className="max-w-7xl mx-auto p-12 text-center text-gray-500">
          Loading contact...
        </div>
      </div>
    );
  }

  const filteredActivities = (contact.activities || []).filter((item: any) => {
    if (activityTab === "Invoices" && item.type !== "Invoice") return false;
    if (activityTab === "Quotes" && item.type !== "Quote") return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        item.number.toLowerCase().includes(q) ||
        (item.reference && item.reference.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-800 font-sans">
      <AppHeader
        organizationName="Alpha Steel Frames"
        activeNav="Contacts"
        userInitials="AA"
      />

      {/* Global Notification Banner */}
      {notification && (
        <div className="max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 pt-4">
          <div
            className={`p-3.5 rounded-md flex items-center justify-between text-sm sm:text-base font-medium shadow-xs animate-in fade-in duration-150 ${
              notification.type === "success"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}
          >
            <div className="flex items-center space-x-2">
              <span>{notification.type === "success" ? "✓" : "⚠️"}</span>
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-gray-400 hover:text-gray-600 font-bold ml-4"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <main className="max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 py-5">
        {/* Breadcrumb */}
        <div className="text-xs text-[#006fe6] hover:underline cursor-pointer mb-2">
          <span onClick={() => router.push("/contacts/customers")}>Contacts</span>
        </div>

        {/* Contact Header matching image copy 13.png */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-200">
          <div className="flex items-start space-x-3">
            <div className="w-12 h-12 rounded bg-[#0084c7] text-white font-bold flex items-center justify-center text-sm shadow-sm">
              KSB
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{contact.name}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600 mt-1">
                <span>👤 {contact.name}</span>
                <span className="text-[#006fe6] hover:underline">✉ {contact.email}</span>
                <span>📞 {contact.phone}</span>
                <span className="flex items-center text-gray-600">
                  🔔 Invoice reminders: On
                </span>
                <span>📍 {contact.address}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 mt-4 md:mt-0 relative">
            <button
              onClick={handleOpenEdit}
              className="px-3.5 py-1.5 border border-gray-300 bg-white hover:bg-gray-50 rounded text-sm font-medium text-gray-700 transition"
            >
              Edit
            </button>
            <div className="inline-flex rounded shadow-sm">
              <button
                onClick={() => router.push("/quotes/new")}
                className="px-4 py-1.5 bg-[#13893a] hover:bg-[#0f6f2e] text-white text-sm font-semibold rounded-l"
              >
                New
              </button>
              <button
                onClick={() => router.push("/quotes/new")}
                className="px-2 py-1.5 bg-[#13893a] hover:bg-[#0f6f2e] text-white rounded-r border-l border-green-700"
              >
                ▼
              </button>
            </div>

            {/* Actions button & dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowActionsMenu(!showActionsMenu)}
                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition"
              >
                ⋮
              </button>
              {showActionsMenu && (
                <div className="absolute right-0 top-9 w-48 bg-white border border-gray-200 rounded-md shadow-xl z-30 py-1 text-xs sm:text-sm text-left">
                  <button
                    onClick={handleOpenEdit}
                    className="w-full text-left px-3.5 py-2 hover:bg-gray-100 text-gray-700 flex items-center space-x-2"
                  >
                    <span>✏️</span>
                    <span>Edit contact</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowActionsMenu(false);
                      router.push("/quotes/new");
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-gray-100 text-gray-700 flex items-center space-x-2"
                  >
                    <span>📄</span>
                    <span>New quote</span>
                  </button>
                  <div className="border-t border-gray-100 my-1"></div>
                  <button
                    onClick={() => {
                      setShowActionsMenu(false);
                      setShowDeleteModal(true);
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-red-50 text-red-600 font-semibold flex items-center space-x-2"
                  >
                    <span>🗑</span>
                    <span>Hard delete contact</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sub-Tabs: Activity, Contact details, Financial details, Documents */}
        <div className="flex border-b border-gray-200 space-x-6 text-sm mb-6 font-medium">
          <button className="py-2.5 text-[#006fe6] font-semibold border-b-2 border-[#006fe6]">
            Activity
          </button>
          <button className="py-2.5 text-gray-500 hover:text-gray-800">
            Contact details
          </button>
          <button className="py-2.5 text-gray-500 hover:text-gray-800">
            Financial details
          </button>
          <button className="py-2.5 text-gray-500 hover:text-gray-800">
            Documents
          </button>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Summary Column */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white border border-gray-200 rounded p-5 shadow-sm space-y-5">
              <div>
                <div className="text-xs font-semibold text-gray-500 hover:text-[#006fe6] cursor-pointer flex items-center justify-between">
                  <span>Invoices owed to you</span>
                  <span>&gt;</span>
                </div>
                <div className="text-2xl font-bold text-[#006fe6] mt-1">
                  {Number(contact.owedAmount).toLocaleString("en-AU", {
                    minimumFractionDigits: 2,
                  })}
                </div>
                <div className="text-xs text-red-600 font-medium mt-0.5">
                  {Number(contact.overdueAmount).toLocaleString("en-AU", {
                    minimumFractionDigits: 2,
                  })}{" "}
                  overdue
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="text-xs font-semibold text-gray-500 hover:text-[#006fe6] cursor-pointer flex items-center justify-between">
                  <span>Quotes awaiting reply</span>
                  <span>&gt;</span>
                </div>
                <div className="text-2xl font-bold text-[#006fe6] mt-1">
                  {contact.quotesAwaitingReply}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="text-xs font-semibold text-gray-500 flex items-center space-x-1">
                  <span>They pay in</span>
                  <span className="text-gray-400">ℹ</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {contact.averageDaysToPay} days
                </div>
              </div>
            </div>
          </div>

          {/* Right Main Column */}
          <div className="lg:col-span-3 space-y-6">
            {/* Cash In Over 12 Months Chart Card matching image copy 13.png */}
            <div className="bg-white border border-gray-200 rounded p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-sm text-gray-900">
                  Cash in over 12 months
                </h3>
                <div className="inline-flex rounded border border-gray-300 text-xs overflow-hidden">
                  <button
                    onClick={() => setChartMode("Graph")}
                    className={`px-3 py-1 font-medium ${
                      chartMode === "Graph"
                        ? "bg-[#006fe6] text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    ● Graph
                  </button>
                  <button
                    onClick={() => setChartMode("Table")}
                    className={`px-3 py-1 font-medium border-l border-gray-300 ${
                      chartMode === "Table"
                        ? "bg-[#006fe6] text-white"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    ○ Table
                  </button>
                </div>
              </div>

              {chartMode === "Graph" ? (
                <div className="h-44 pt-4 flex flex-col justify-end">
                  {/* Chart bars */}
                  <div className="flex items-end justify-between h-32 px-4 border-b border-gray-400">
                    {(contact.cashInMonths || []).map((m: any) => {
                      const heightPercent = m.amount > 0 ? 80 : 0;
                      return (
                        <div key={m.month} className="flex flex-col items-center flex-1">
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className="w-7 bg-[#1c5598] rounded-t transition-all duration-300"
                            title={`${m.month}: $${m.amount}`}
                          />
                        </div>
                      );
                    })}
                  </div>
                  {/* Months labels */}
                  <div className="flex justify-between px-4 pt-2 text-[11px] text-gray-500">
                    {(contact.cashInMonths || []).map((m: any) => (
                      <span key={m.month} className="flex-1 text-center">
                        {m.month}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto text-xs">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b text-gray-500">
                        <th className="py-2">Month</th>
                        <th className="py-2 text-right">Cash In</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(contact.cashInMonths || []).map((m: any) => (
                        <tr key={m.month} className="border-b">
                          <td className="py-1.5">{m.month}</td>
                          <td className="py-1.5 text-right font-medium">
                            ${m.amount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Activity Table Card matching image copy 13.png */}
            <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex space-x-4 text-xs font-semibold">
                    <button
                      onClick={() => setActivityTab("All")}
                      className={`pb-1 border-b-2 ${
                        activityTab === "All"
                          ? "border-[#006fe6] text-[#006fe6]"
                          : "border-transparent text-gray-500"
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setActivityTab("Invoices")}
                      className={`pb-1 border-b-2 ${
                        activityTab === "Invoices"
                          ? "border-[#006fe6] text-[#006fe6]"
                          : "border-transparent text-gray-500"
                      }`}
                    >
                      Invoices
                    </button>
                    <button
                      onClick={() => setActivityTab("Quotes")}
                      className={`pb-1 border-b-2 ${
                        activityTab === "Quotes"
                          ? "border-[#006fe6] text-[#006fe6]"
                          : "border-transparent text-gray-500"
                      }`}
                    >
                      Quotes
                    </button>
                  </div>

                  <button className="text-xs text-[#006fe6] font-medium flex items-center">
                    Reports ▼
                  </button>
                </div>

                {/* Search bar inside activity */}
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Enter an amount, reference, or number"
                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded bg-[#f0f3f6] focus:bg-white focus:outline-none"
                    />
                    <span className="absolute left-2.5 top-2 text-gray-400 text-xs">
                      🔍
                    </span>
                  </div>
                  <button className="text-xs text-[#006fe6] font-medium px-2 py-1">
                    Filter
                  </button>
                  <button className="text-xs text-[#006fe6] font-medium px-2 py-1">
                    Columns
                  </button>
                </div>
              </div>

              {/* Items Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 bg-[#fbfbfb]">
                      <th className="px-4 py-2.5 font-normal">Type</th>
                      <th className="px-4 py-2.5 font-normal">Number</th>
                      <th className="px-4 py-2.5 font-normal">Reference</th>
                      <th className="px-4 py-2.5 font-normal">Issue date ↓</th>
                      <th className="px-4 py-2.5 font-normal">Paid date</th>
                      <th className="px-4 py-2.5 font-normal text-right">Due</th>
                      <th className="px-4 py-2.5 font-normal text-right">Total</th>
                      <th className="px-4 py-2.5 font-normal">Status</th>
                      <th className="px-2 py-2.5 w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredActivities.map((act: any) => (
                      <tr key={act.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-bold text-gray-900 underline cursor-pointer">
                          {act.type}
                        </td>
                        <td
                          onClick={() => {
                            if (act.type === "Quote") router.push(`/quotes/${act.id}`);
                          }}
                          className="px-4 py-3 text-gray-800 font-medium hover:text-[#006fe6] cursor-pointer"
                        >
                          {act.number}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{act.reference}</td>
                        <td className="px-4 py-3 text-gray-600">{act.issueDate}</td>
                        <td className="px-4 py-3 text-gray-600">{act.paidDate || ""}</td>
                        <td className="px-4 py-3 text-right text-gray-800">
                          {act.due > 0 ? act.due.toLocaleString("en-AU", { minimumFractionDigits: 2 }) : "0.00"}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          {act.total.toLocaleString("en-AU", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3">
                          {act.status === "Awaiting payment" ? (
                            <span className="px-2 py-0.5 bg-[#e6f4ea] text-[#137333] rounded text-[11px] font-medium">
                              Awaiting payment
                            </span>
                          ) : act.status === "Paid" ? (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[11px] font-medium border border-gray-300">
                              Paid
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[11px] font-medium border border-gray-300">
                              {act.status}
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-3 text-center text-gray-400">📋</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Customer Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h3 className="font-bold text-gray-900 text-base">Edit Contact: {contact.name}</h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4 text-sm">
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
                  onClick={() => setShowEditModal(false)}
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
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center font-bold text-lg shrink-0">
                ⚠️
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Permanently Delete Contact?</h3>
                <p className="text-xs text-gray-500">This action is irreversible (Hard Delete).</p>
              </div>
            </div>

            <p className="text-sm text-gray-700">
              Are you sure you want to permanently delete <strong className="text-gray-900">{contact.name}</strong>?
              This will remove all associated quotations, invoices, and accounting records from the database.
            </p>

            <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-xs sm:text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleHardDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-xs sm:text-sm font-semibold transition disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Yes, permanently delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
