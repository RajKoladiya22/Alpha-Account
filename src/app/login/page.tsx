"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("estimate@pbstylehomes.com.au");
  const [password, setPassword] = useState("••••••••••••");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/quotes");
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f5f7] flex flex-col justify-center items-center px-4 font-sans text-gray-800">
      {/* Brand Header */}
      <div className="mb-6 flex items-center space-x-2">
        <div className="w-9 h-9 bg-[#0084c7] rounded-full flex items-center justify-center font-bold text-white text-base shadow-sm">
          x
        </div>
        <span className="text-[#001e4d] text-2xl font-bold tracking-tight">xero</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-md max-w-sm w-full p-8">
        <h1 className="text-xl font-bold text-gray-900 mb-1">Log in to Xero</h1>
        <p className="text-xs text-gray-500 mb-6">
          Access PB Style Homes Pty Ltd accounting workspace
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#006fe6]"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-gray-700">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-[#006fe6] hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#006fe6]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#006fe6] hover:bg-[#005bb5] text-white rounded font-semibold text-sm transition shadow-sm"
          >
            {loading ? "Signing in..." : "Log in"}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-gray-100 text-center text-xs text-gray-600">
          Need an account?{" "}
          <Link href="/register" className="text-[#006fe6] font-semibold hover:underline">
            Register your organization
          </Link>
        </div>
      </div>
    </div>
  );
}
