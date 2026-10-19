"use client";

import React, { useState, useEffect } from "react";
import { AppHeader } from "../../components/layout/AppHeader";

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>({
    organizationName: "Alpha Steel Frames",
    currency: "AUD",
  });
  const [editingModal, setEditingModal] = useState<string | null>(null);
  const [orgName, setOrgName] = useState("Alpha Steel Frames");

  // Users state for RBAC management
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("STANDARD");
  const [userError, setUserError] = useState("");

  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.success && Array.isArray(data.users)) {
        setUsers(data.users);
      }
    } catch (e) {
      console.error("Failed to load users:", e);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setSettings(data.settings);
          setOrgName(data.settings.organizationName || "Alpha Steel Frames");
        }
      })
      .catch(() => {});
  }, []);

  const handleOpenUsersModal = () => {
    setEditingModal("users");
    fetchUsers();
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError("");
    if (!newUserName || !newUserEmail || !newUserPassword) {
      setUserError("Please fill in all user fields.");
      return;
    }

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNewUserName("");
        setNewUserEmail("");
        setNewUserPassword("");
        fetchUsers();
      } else {
        setUserError(data.error || "Failed to create user.");
      }
    } catch (err: any) {
      setUserError(err.message || "An error occurred.");
    }
  };

  const handleToggleUserActive = async (userId: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentActive }),
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      } else {
        alert(data.error || "Failed to update user status.");
      }
    } catch (e) {}
  };

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
          desc: "Update your organization's name, logo, ABN, and business address",
          action: () => setEditingModal("org"),
        },
        {
          name: "Users & Permissions (RBAC)",
          desc: "Create and manage application users, assign roles (Admin, Standard), and toggle access",
          action: handleOpenUsersModal,
        },
        {
          name: "Email settings",
          desc: "Set reply-to email address and company templates for quote delivery",
        },
      ],
    },
    {
      title: "Quotation & Sales",
      items: [
        {
          name: "Quotation settings",
          desc: "Configure quotation prefixes, payment terms, standard notes, and Australian GST rules",
          action: () => setEditingModal("sales"),
        },
        {
          name: "B2B e-Invoicing",
          desc: "Configure automated conversion from accepted quotations to customer invoices",
        },
      ],
    },
    {
      title: "Accounting & Tax",
      items: [
        {
          name: "Financial settings",
          desc: "Update financial year end, Australian GST 10% rules, and AEST time zone",
        },
        {
          name: "Currencies",
          desc: "Manage default currency (AUD) and supported foreign exchange display",
        },
        {
          name: "Chart of accounts",
          desc: "Manage general ledger accounts (200 Sales, 260 Revenue, 300 COGS) used in quotations",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-800 font-sans pb-12">
      <AppHeader
        organizationName={settings.organizationName || "Alpha Steel Frames"}
        activeNav="Settings"
        userInitials="AA"
      />

      <main className="max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 py-6">
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

        {/* Edit Org Modal */}
        {editingModal === "org" && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-base text-gray-900">
                  Users &amp; Roles (RBAC)
                </h3>
                <button
                  onClick={() => setEditingModal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-4">
                Manage application users, assign roles (Admin or Standard), and activate or deactivate accounts. Only Admins can create new user accounts.
              </p>

              {/* Add User Form */}
              <form onSubmit={handleCreateUser} className="bg-gray-50 border border-gray-200 rounded p-4 mb-4 text-xs">
                <h4 className="font-bold text-gray-800 mb-2">Create New Application User</h4>
                {userError && (
                  <div className="p-2 bg-red-50 border border-red-200 text-red-700 rounded mb-2">
                    {userError}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="e.g. John Smith"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="e.g. jsmith@alphasteelframes.com.au"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Temporary Password</label>
                    <input
                      type="password"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      className="w-full px-2 py-1.5 border border-gray-300 rounded bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Role</label>
                    <select
                      value={newUserRole}
                      onChange={(e) => setNewUserRole(e.target.value)}
                      className="w-full px-2 py-1.5 border border-gray-300 rounded bg-white"
                    >
                      <option value="STANDARD">Standard User</option>
                      <option value="ADMIN">Administrator</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-[#006fe6] hover:bg-[#005bb5] text-white font-semibold rounded text-xs"
                  >
                    + Create User
                  </button>
                </div>
              </form>

              {/* Users List */}
              <div className="divide-y divide-gray-200 border border-gray-200 rounded text-xs mb-4">
                <div className="p-3 flex justify-between items-center bg-gray-50 font-semibold text-gray-600">
                  <span className="w-1/2">User &amp; Email</span>
                  <span className="w-1/4 text-center">Role</span>
                  <span className="w-1/4 text-right">Status / Action</span>
                </div>
                {loadingUsers ? (
                  <div className="p-4 text-center text-gray-500">Loading users...</div>
                ) : (
                  users.map((u) => (
                    <div key={u.id} className="p-3 flex justify-between items-center hover:bg-gray-50">
                      <div className="w-1/2">
                        <p className="font-bold text-gray-800">{u.name}</p>
                        <p className="text-gray-500">{u.email}</p>
                      </div>
                      <div className="w-1/4 text-center">
                        <span className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                          u.role === "ADMIN"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}>
                          {u.role}
                        </span>
                      </div>
                      <div className="w-1/4 text-right space-x-2">
                        <button
                          onClick={() => handleToggleUserActive(u.id, u.isActive)}
                          className={`px-2 py-1 rounded text-[11px] font-medium border ${
                            u.isActive
                              ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                              : "bg-gray-100 text-gray-500 border-gray-300 hover:bg-gray-200"
                          }`}
                        >
                          {u.isActive ? "Active (Disable)" : "Disabled (Enable)"}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setEditingModal(null)}
                  className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded text-sm font-semibold hover:bg-gray-300"
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
