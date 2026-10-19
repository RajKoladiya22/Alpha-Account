"use client";

import React, { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);

    setTimeout(() => {
      setStatus(
        "If an account exists with this email, a password recovery link has been dispatched to your primary and dual-rail backup addresses."
      );
      setLoading(false);
    }, 700);
  };

  return (
    <div className="min-h-screen bg-[#f4f5f7] flex flex-col justify-center items-center px-4 font-sans text-gray-800">
      <div className="mb-6 flex items-center space-x-2">
        <div className="w-9 h-9 bg-[#0084c7] rounded-full flex items-center justify-center font-bold text-white text-base shadow-sm">
          x
        </div>
        <span className="text-[#001e4d] text-2xl font-bold tracking-tight">xero</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-md max-w-sm w-full p-8">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Reset Password</h1>
        <p className="text-xs text-gray-500 mb-6">
          Enter your registered email to receive a secure recovery link
        </p>

        {status ? (
          <div className="p-3 bg-blue-50 border border-blue-200 text-[#006fe6] text-xs rounded mb-4">
            {status}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Email address
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-[#006fe6] hover:bg-[#005bb5] text-white rounded font-semibold text-sm transition shadow-sm"
            >
              {loading ? "Sending link..." : "Send reset link"}
            </button>
          </form>
        )}

        <div className="mt-6 pt-5 border-t border-gray-100 text-center text-xs text-gray-600">
          Remembered your password?{" "}
          <Link href="/login" className="text-[#006fe6] font-semibold hover:underline">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
