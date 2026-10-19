"use client";

import React, { useState } from "react";
import type { ContactEntity } from "../../types/index.ts";

export interface CustomerListProps {
  customers: ContactEntity[];
  onAddNewContact?: () => void;
  onSelectCustomer?: (customer: ContactEntity) => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  onAddNewContact,
  onSelectCustomer,
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const avatarColors = [
    "bg-[#a7e8bd] text-[#006020]",
    "bg-[#ffd599] text-[#7a4100]",
    "bg-[#f9c2d1] text-[#801435]",
    "bg-[#ffe58f] text-[#614700]",
    "bg-[#b5f5ec] text-[#00474f]",
  ];

  const getInitials = (name: string) => {
    const parts = name.split(/[\s&]+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase())) ||
      (c.phone && c.phone.includes(search))
  );

  const toggleSelectAll = () => {
    if (selectedIds.size === filtered.length) {
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

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 font-sans text-gray-800">
      {/* Sub Navigation Bar matching screenshot image copy 17.png */}
      <div className="flex border-b border-gray-200 space-x-6 mb-4 text-sm font-medium">
        <span className="font-bold text-gray-900 pb-3">Contacts</span>
        <button className="text-gray-500 hover:text-gray-800 pb-3">All</button>
        <button className="text-[#006fe6] font-semibold border-b-2 border-[#006fe6] pb-3">
          Customers
        </button>
        <button className="text-gray-500 hover:text-gray-800 pb-3">Suppliers</button>
        <button className="text-gray-500 hover:text-gray-800 pb-3">Archived</button>
        <button className="text-gray-500 hover:text-gray-800 pb-3 flex items-center">
          Groups
          <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <button className="text-gray-500 hover:text-gray-800 pb-3 flex items-center">
          Smart lists
          <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div className="flex-1 flex justify-end space-x-2 pb-2">
          <button
            onClick={onAddNewContact}
            className="px-4 py-1.5 bg-[#137333] hover:bg-[#0e5927] text-white text-sm font-semibold rounded shadow-sm"
          >
            New contact
          </button>
          <button className="p-1.5 text-gray-500 hover:text-gray-700">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Customers</h2>

          {/* Search bar & sort */}
          <div className="flex items-center space-x-3 mb-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search for a contact"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded bg-gray-50 focus:bg-white focus:outline-none focus:border-[#006fe6]"
              />
              <svg
                className="w-4 h-4 text-gray-400 absolute left-3 top-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <button className="flex items-center text-sm font-semibold text-[#006fe6] px-2 py-1">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
              </svg>
              Name
            </button>
          </div>

          {/* Batch Actions Toolbar */}
          <div className="flex items-center space-x-4 text-xs text-gray-600 pt-1">
            <span className="font-medium">{selectedIds.size} contacts selected</span>
            <button className="hover:text-gray-900 font-medium flex items-center">
              Add to group
              <svg className="w-3 h-3 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button className="hover:text-gray-900 font-medium">Merge</button>
            <button className="hover:text-gray-900 font-medium">Archive</button>
          </div>
        </div>

        {/* Contacts Table */}
        <table className="min-w-full divide-y divide-gray-200 text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={selectedIds.size > 0 && selectedIds.size === filtered.length}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-[#006fe6]"
                />
              </th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3 text-right">You owe</th>
              <th className="px-4 py-3 text-right">They owe</th>
              <th className="w-10 px-2 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filtered.map((c, i) => {
              const isSelected = selectedIds.has(c.id);
              const initials = getInitials(c.name);
              const colorClass = avatarColors[i % avatarColors.length];

              return (
                <tr
                  key={c.id}
                  onClick={() => onSelectCustomer && onSelectCustomer(c)}
                  className={`hover:bg-gray-50 cursor-pointer transition ${
                    isSelected ? "bg-blue-50/40" : ""
                  }`}
                >
                  <td className="px-4 py-4" onClick={(e) => toggleRow(c.id, e)}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="rounded border-gray-300 text-[#006fe6]"
                    />
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-9 h-9 rounded-md flex items-center justify-center font-bold text-xs uppercase ${colorClass}`}
                      >
                        {initials}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{c.name}</div>
                        {c.address?.street && (
                          <div className="text-xs text-gray-500">
                            {c.address.street}, {c.address.city}, {c.address.state},{" "}
                            {c.address.postalCode}
                          </div>
                        )}
                        <div className="text-xs text-gray-400">
                          {c.email} {c.phone ? `• ${c.phone}` : ""}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4 text-right font-medium text-gray-900">
                    {c.youOwe > 0
                      ? c.youOwe.toLocaleString("en-AU", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })
                      : ""}
                  </td>

                  <td className="px-4 py-4 text-right font-medium text-gray-900">
                    {c.theyOwe > 0 && (
                      <div className="inline-flex items-center justify-end space-x-1.5">
                        {c.isOverdue && (
                          <span className="text-red-600 inline-flex" title="Payment Overdue">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                          </span>
                        )}
                        <span>
                          {c.theyOwe.toLocaleString("en-AU", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    )}
                  </td>

                  <td className="px-2 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                    <button className="text-gray-400 hover:text-gray-700">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
