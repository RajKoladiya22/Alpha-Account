"use client";

import React, { useState, useEffect } from "react";
import { AppHeader } from "../../components/layout/AppHeader";

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({
    organizationName: "PB Style Homes Pty Ltd",
    currency: "AUD",
  });
  const [editingModal, setEditingModal] = useState<string | null>(null);
  const [orgName, setOrgName] = useState("PB Style Homes Pty Ltd");

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setSettings(data.settings);
          setOrgName(data.settings.organizationName);
        }
      })
      .catch(() => {});
  }, []);

  const handleSaveOrg = async () => {
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationName: orgName }),
    });
    setSettings((prev: any) => ({ ...prev, organizationName: orgName }));
    setEditingModal(null);
  };

  const sections = [
    {
      title: "General",
      items: [
        {
          name: "Organization details",
          desc: "Update your organization's name, logo, or contact information",
          action: () => setEditingModal("org"),
        },
        {
          name: "Users",
          desc: "Invite new users, manage permissions, or delete current users",
          action: () => setEditingModal("users"),
        },
        {
          name: "Subscription and billing",
          desc: "Update your subscription, billing information, or pricing plan",
        },
        {
          name: "Connected apps",
          desc: "Add and manage the apps connected to your organisation",
        },
        {
          name: "Email settings",
          desc: "Set a reply-to email address and name, or edit email templates",
        },
      ],
    },
    {
      title: "Sales",
      items: [
        {
          name: "Invoice settings",
          desc: "Manage default settings, invoice reminders, and branding themes (templates for invoices, quotes, purchase orders etc.)",
          action: () => setEditingModal("sales"),
        },
        {
          name: "Online payments",
          desc: "Add and manage payment options for customers to pay you online",
        },
      ],
    },
    {
      title: "Purchases",
      items: [
        {
          name: "Online bill payments",
          desc: "Add and manage options for making payments directly from Xero",
        },
        {
          name: "Xero to Xero",
          desc: "Connect with customers and suppliers who use Xero to exchange invoices and bills directly",
        },
        {
          name: "Expense settings",
          desc: "Manage users, accounts for expense and mileage claims, and labels",
        },
      ],
    },
    {
      title: "Reporting",
      items: [
        {
          name: "Reporting preferences",
          desc: "Update reporting method and display preferences for all reports",
        },
      ],
    },
    {
      title: "Payroll",
      items: [
        {
          name: "Payroll settings",
          desc: "Manage payroll account details, pay frequencies, pay items, holidays, and more",
        },
      ],
    },
    {
      title: "Accounting",
      items: [
        {
          name: "Financial settings",
          desc: "Update financial year end, tax settings, lock dates, and time zone",
        },
        {
          name: "Currencies",
          desc: "Manage the currencies your organisation uses",
        },
        {
          name: "Chart of accounts",
          desc: "Manage accounts used to categorise your transactions",
        },
        {
          name: "Fixed asset settings",
          desc: "Manage asset types, accounts, and default depreciation methods",
        },
        {
          name: "Tracking categories",
          desc: "Set up tracking categories to see how different areas of your business are performing",
        },
        {
          name: "Conversion balances",
          desc: "Update the opening balances of your accounts in Xero",
        },
        {
          name: "Export accounting data",
          desc: "Export data from Xero to import into other systems",
        },
      ],
    },
    {
      title: "Tax",
      items: [
        {
          name: "Manual tax rates",
          desc: "Add and manage manual tax rates",
        },
        {
          name: "Activity Statement settings",
          desc: "Update your Activity Statement settings",
        },
      ],
    },
    {
      title: "Contacts",
      items: [
        {
          name: "Custom contact links",
          desc: "Connect your contacts in Xero with external systems such as CRM",
        },
      ],
    },
    {
      title: "Projects",
      items: [
        {
          name: "Staff cost rates",
          desc: "Manage hourly cost rate for staff",
        },
        {
          name: "Staff permissions",
          desc: "Invite staff to Projects and manage their permissions",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-800 font-sans pb-12">
      <AppHeader
        organizationName={settings.organizationName || "PB Style Homes Pty Ltd"}
        activeNav="Accounting"
        userInitials="SB"
      />

      <main className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Settings</h1>

        <div className="space-y-6">
          {sections.map((section) => (
            <div key={section.title} className="space-y-2">
              <h2 className="text-sm font-bold text-gray-900">{section.title}</h2>
              <div className="bg-white border border-gray-200 rounded divide-y divide-gray-200 shadow-xs">
                {section.items.map((item) => (
                  <div
                    key={item.name}
                    onClick={item.action}
                    className={`p-4 hover:bg-gray-50 transition ${item.action ? "cursor-pointer" : ""}`}
                  >
                    <div className="text-sm font-semibold text-[#006fe6] hover:underline">
                      {item.name}
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5">{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Link matching screenshot image copy 16.png */}
        <div className="text-center text-xs text-gray-500 mt-10">
          Looking for user settings?{" "}
          <a
            href="#"
            className="text-[#006fe6] hover:underline"
            onClick={(e) => {
              e.preventDefault();
              setEditingModal("org");
            }}
          >
            Open My Xero ↗
          </a>
        </div>

        {/* Edit Org Modal */}
        {editingModal === "org" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="font-bold text-base text-gray-900 mb-4">
                Organization details
              </h3>
              <div className="space-y-3 mb-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Organization name
                  </label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Currency
                  </label>
                  <input
                    type="text"
                    disabled
                    value="AUD - Australian Dollar"
                    className="w-full border border-gray-200 bg-gray-50 text-gray-500 rounded px-3 py-1.5 text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setEditingModal(null)}
                  className="px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveOrg}
                  className="px-4 py-1.5 bg-[#006fe6] text-white rounded text-sm font-semibold hover:bg-[#005bb5]"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users & RBAC Modal */}
        {editingModal === "users" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
              <h3 className="font-bold text-base text-gray-900 mb-3">
                Users &amp; Roles (RBAC)
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Current active users and assigned RBAC permissions:
              </p>
              <div className="divide-y divide-gray-100 border border-gray-200 rounded mb-4 text-xs">
                <div className="p-3 flex justify-between items-center bg-gray-50 font-semibold text-gray-600">
                  <span>User</span>
                  <span>Role</span>
                </div>
                <div className="p-3 flex justify-between items-center">
                  <div>
                    <p className="font-bold text-gray-800">Barinder singh</p>
                    <p className="text-gray-500">estimate@pbstylehomes.com.au</p>
                  </div>
                  <span className="px-2 py-0.5 rounded font-bold uppercase bg-green-100 text-green-800 text-[10px]">
                    OWNER
                  </span>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => setEditingModal(null)}
                  className="px-4 py-1.5 bg-[#006fe6] text-white rounded text-sm font-semibold hover:bg-[#005bb5]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
