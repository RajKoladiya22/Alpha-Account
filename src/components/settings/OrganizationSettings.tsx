"use client";

import React, { useState } from "react";
import type { TenantSettings, OrganizationEntity } from "../../types/index.ts";

export interface OrganizationSettingsProps {
  organization: OrganizationEntity;
  settings: TenantSettings;
  onUpdateSettings?: (updates: Partial<TenantSettings>) => void;
}

export const OrganizationSettings: React.FC<OrganizationSettingsProps> = ({
  organization,
  settings,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<"general" | "sales" | "purchases" | "accounting">(
    "sales"
  );
  const [quoteExpiryDays, setQuoteExpiryDays] = useState(settings.defaultQuoteExpiryDays || 30);
  const [quotePrefix, setQuotePrefix] = useState(settings.quoteNumberPrefix || "QU-");
  const [taxBasis, setTaxBasis] = useState<"ACCRUAL" | "CASH">(settings.taxBasis || "ACCRUAL");

  const handleSave = () => {
    onUpdateSettings &&
      onUpdateSettings({
        defaultQuoteExpiryDays: Number(quoteExpiryDays),
        quoteNumberPrefix: quotePrefix,
        taxBasis,
      });
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 font-sans text-gray-800">
      <div className="pb-3 mb-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Organization Settings</h1>
        <p className="text-xs text-gray-500 mt-0.5">{organization.name} • {organization.registrationNumber}</p>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-gray-200 space-x-6 mb-6 text-sm font-semibold">
        {(["general", "sales", "purchases", "accounting"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 capitalize transition border-b-2 ${
              activeTab === tab
                ? "border-[#006fe6] text-[#006fe6]"
                : "border-transparent text-gray-500 hover:text-gray-800"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Contents matching image copy 14-16.png */}
      {activeTab === "general" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs hover:border-[#006fe6] transition cursor-pointer">
            <h3 className="font-bold text-base text-gray-900 mb-1">Organization details</h3>
            <p className="text-xs text-gray-500">Update logo, contact info, and legal business address.</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs hover:border-[#006fe6] transition cursor-pointer">
            <h3 className="font-bold text-base text-gray-900 mb-1">Users &amp; Roles (RBAC)</h3>
            <p className="text-xs text-gray-500">Invite staff, accountants, and manage user permissions.</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs hover:border-[#006fe6] transition cursor-pointer">
            <h3 className="font-bold text-base text-gray-900 mb-1">Connected apps</h3>
            <p className="text-xs text-gray-500">Manage third-party software connections and integrations.</p>
          </div>
        </div>
      )}

      {activeTab === "sales" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="font-bold text-base text-gray-900 mb-3">Quote Defaults</h3>

              <div className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Quote Number Prefix
                  </label>
                  <input
                    type="text"
                    value={quotePrefix}
                    onChange={(e) => setQuotePrefix(e.target.value)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Default Quote Validity (Days)
                  </label>
                  <input
                    type="number"
                    value={quoteExpiryDays}
                    onChange={(e) => setQuoteExpiryDays(parseInt(e.target.value) || 30)}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm"
                  />
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSave}
                    className="px-4 py-1.5 bg-[#006fe6] text-white text-xs font-bold rounded hover:bg-[#005bb5]"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h3 className="font-bold text-base text-gray-900 mb-2">Online Payments</h3>
              <p className="text-xs text-gray-500 mb-4">
                Connect payment gateways (Stripe, GoCardless) to accept credit cards and direct debits directly on quotes and invoices.
              </p>
              <button className="px-3 py-1.5 border border-[#006fe6] text-[#006fe6] font-semibold text-xs rounded hover:bg-blue-50">
                Setup Online Payments
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "accounting" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs">
            <h3 className="font-bold text-base text-gray-900 mb-1">Financial settings</h3>
            <p className="text-xs text-gray-500 mb-3">Financial year end, tax defaults, lock dates.</p>
            <div className="space-y-2 text-xs">
              <div>
                <span className="text-gray-500">Tax Basis: </span>
                <select
                  value={taxBasis}
                  onChange={(e) => setTaxBasis(e.target.value as any)}
                  className="p-1 border border-gray-300 rounded ml-1 text-xs"
                >
                  <option value="ACCRUAL">Accrual Basis</option>
                  <option value="CASH">Cash Basis</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs">
            <h3 className="font-bold text-base text-gray-900 mb-1">Chart of accounts</h3>
            <p className="text-xs text-gray-500">View and customize nominal ledger accounts and codes.</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5 shadow-xs">
            <h3 className="font-bold text-base text-gray-900 mb-1">Currencies</h3>
            <p className="text-xs text-gray-500">Add foreign currencies and manage automated exchange rates.</p>
          </div>
        </div>
      )}
    </div>
  );
};
