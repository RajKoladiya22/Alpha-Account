"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [organizationName, setOrganizationName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [backupEmail, setBackupEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationName || !email) return;

    if (backupEmail && backupEmail.trim() === email.trim()) {
      setError("Invariant 1: Backup email must be distinct from primary email");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationName,
          name,
          email,
          backupEmail,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert("Organization registered! You can now log in.");
        router.push("/login");
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f5f7] flex flex-col justify-center items-center px-4 font-sans text-gray-800">
      <div className="mb-6 flex items-center space-x-2">
        <div className="w-9 h-9 bg-[#0084c7] rounded-full flex items-center justify-center font-bold text-white text-base shadow-sm">
          x
        </div>
        <span className="text-[#001e4d] text-2xl font-bold tracking-tight">xero</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-md max-w-md w-full p-8">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Register Organization</h1>
        <p className="text-xs text-gray-500 mb-6">
          Set up your multi-tenant financial accounting workspace
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Organization Name
            </label>
            <input
              type="text"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="e.g. Apex Builders Pty Ltd"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#006fe6]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#006fe6]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Work Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#006fe6]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Dual-Rail Backup Email (Invariant 1)
            </label>
            <input
              type="email"
              value={backupEmail}
              onChange={(e) => setBackupEmail(e.target.value)}
              placeholder="secondary@backup.com"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#006fe6]"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Used for hardware passkey reset fallback verification
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#13893a] hover:bg-[#0f6f2e] text-white rounded font-semibold text-sm transition shadow-sm"
          >
            {loading ? "Registering..." : "Create Organization"}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-gray-100 text-center text-xs text-gray-600">
          Already have an account?{" "}
          <Link href="/login" className="text-[#006fe6] font-semibold hover:underline">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
