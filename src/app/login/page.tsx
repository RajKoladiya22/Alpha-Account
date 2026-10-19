"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Check setup status on load and show initialization notice if redirected from setup
  useEffect(() => {
    if (searchParams?.get("initialized") === "true") {
      setSuccessNotice("Application setup completed successfully! Please sign in with your administrator credentials.");
    }

    async function verifySetup() {
      try {
        const res = await fetch("/api/setup/status");
        const data = await res.json();
        if (data.initialized === false) {
          router.push("/setup");
        }
      } catch (err) {
        console.warn("Unable to check setup status:", err);
      }
    }
    verifySetup();
  }, [router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json();
      if (data.success) {
        const redirectPath = searchParams?.get("redirect") || "/quotes";
        router.push(redirectPath);
        router.refresh();
      } else {
        setError(data.error || "Invalid email or password.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected network error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-md max-w-sm w-full p-8">
      <h1 className="text-xl font-bold text-gray-900 mb-1">Sign In</h1>
      <p className="text-xs text-gray-500 mb-6">
        Access your quotation and accounting workspace
      </p>

      {successNotice && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded flex items-start space-x-2">
          <span className="font-bold">✓</span>
          <span>{successNotice}</span>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded flex items-start space-x-2">
          <span className="font-bold">⚠️</span>
          <span>{error}</span>
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
            placeholder="admin@alphasteelframes.com.au"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#006fe6]"
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-xs font-semibold text-gray-700">
              Password
            </label>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#006fe6]"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-[#001e4d] hover:bg-[#002b66] text-white rounded font-semibold text-sm transition shadow-sm disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Log in"}
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-gray-100 text-center text-xs text-gray-400">
        Private System &bull; Authorized Personnel Only
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#f4f5f7] flex flex-col justify-center items-center px-4 font-sans text-gray-800">
      {/* Brand Header */}
      <div className="mb-6 flex flex-col items-center">
        <Image
          src="/logo.png"
          alt="Alpha Steel Frames"
          width={180}
          height={60}
          className="h-12 w-auto object-contain mb-2"
          priority
        />
        <span className="text-[#001e4d] text-lg font-bold tracking-tight">
          Alpha Steel Frames
        </span>
      </div>

      <Suspense fallback={
        <div className="bg-white border border-gray-200 rounded-lg shadow-md max-w-sm w-full p-8 text-center text-gray-400 text-xs">
          Loading sign in form...
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  );
}
