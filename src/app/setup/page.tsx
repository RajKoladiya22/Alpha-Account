"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function SetupWizardPage() {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [alreadyInitialized, setAlreadyInitialized] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);

  // Form State - Step 1: Administrator
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Form State - Step 2: Organization
  const [organizationName, setOrganizationName] = useState("Alpha Steel Frames Pty Ltd");
  const [tradingName, setTradingName] = useState("Alpha Steel Frames");
  const [businessEmail, setBusinessEmail] = useState("info@alphasteelframes.com.au");
  const [businessPhone, setBusinessPhone] = useState("+61 7 3000 1234");
  const [businessAddress, setBusinessAddress] = useState("12 Titanium Circuit, Yatala, QLD 4207");
  const [country, setCountry] = useState("Australia");
  const [state, setState] = useState("QLD");
  const [postalCode, setPostalCode] = useState("4207");
  const [abn, setAbn] = useState("51 824 753 556");
  const [currency, setCurrency] = useState("AUD");
  const [timeZone, setTimeZone] = useState("Australia/Brisbane");
  const [quotePrefix, setQuotePrefix] = useState("QU-");

  // UI State
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initSuccess, setInitSuccess] = useState(false);

  // Password validation rules
  const hasMinLength = adminPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(adminPassword);
  const hasLowercase = /[a-z]/.test(adminPassword);
  const hasNumber = /[0-9]/.test(adminPassword);
  const passwordsMatch = adminPassword && adminPassword === confirmPassword;
  const isPasswordValid = hasMinLength && hasUppercase && hasLowercase && hasNumber && passwordsMatch;

  // Check setup status on mount
  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch("/api/setup/status");
        const data = await res.json();
        if (data.initialized) {
          setAlreadyInitialized(true);
          setTimeout(() => {
            router.push("/login");
          }, 1500);
        } else if (data.dbReady === false) {
          setDbError(data.error || "Database connection unavailable. Please check your MySQL configuration.");
        }
      } catch (err: any) {
        console.error("Error checking setup status:", err);
      } finally {
        setCheckingStatus(false);
      }
    }
    checkStatus();
  }, [router]);

  // Validation handlers
  const handleNextFromStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!adminName.trim()) {
      setError("Please enter the administrator's full name.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!adminEmail.trim() || !emailRegex.test(adminEmail.trim())) {
      setError("Please enter a valid administrator email address.");
      return;
    }

    if (!isPasswordValid) {
      setError("Please satisfy all password complexity requirements and ensure passwords match.");
      return;
    }

    setStep(2);
  };

  const handleNextFromStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!organizationName.trim()) {
      setError("Organization legal name is required.");
      return;
    }

    setStep(3);
  };

  const handleFinalInitialize = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminName,
          adminEmail,
          adminPassword,
          confirmPassword,
          organizationName,
          tradingName,
          email: businessEmail,
          phone: businessPhone,
          address: businessAddress,
          country,
          state,
          postalCode,
          abn,
          currency,
          timeZone,
          quotePrefix,
          logoUrl: "/logo.png",
        }),
      });

      const data = await res.json();

      if (data.success) {
        setInitSuccess(true);
        setTimeout(() => {
          router.push("/quotes");
          router.refresh();
        }, 1200);
      } else {
        setError(data.error || "Initialization failed. Please verify your settings and try again.");
      }
    } catch (err: any) {
      setError(err.message || "A network error occurred during initialization.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-[#f4f5f7] flex items-center justify-center font-sans text-gray-700">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#006fe6] border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-medium">Checking application setup status...</p>
        </div>
      </div>
    );
  }

  if (alreadyInitialized) {
    return (
      <div className="min-h-screen bg-[#f4f5f7] flex items-center justify-center font-sans p-4">
        <div className="bg-white border border-gray-200 rounded-lg shadow-md max-w-md w-full p-8 text-center space-y-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
            ✓
          </div>
          <h2 className="text-xl font-bold text-gray-900">Application Already Initialized</h2>
          <p className="text-xs text-gray-600">
            Setup has already been completed for Alpha Steel Frames. Redirecting you to the sign-in page...
          </p>
          <button
            onClick={() => router.push("/login")}
            className="w-full py-2 bg-[#006fe6] text-white rounded text-sm font-semibold hover:bg-[#005bb5]"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f5f7] flex flex-col justify-center items-center py-10 px-4 font-sans text-gray-800">
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
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 mt-1">
          Initial Production Setup Wizard
        </span>
      </div>

      {/* Main Container Card */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-lg max-w-xl w-full p-6 sm:p-8">
        {/* Visual Stepper */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
          <div className="flex items-center space-x-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step >= 1 ? "bg-[#006fe6] text-white" : "bg-gray-200 text-gray-600"
              }`}
            >
              1
            </div>
            <span className={`text-xs font-medium ${step >= 1 ? "text-gray-900 font-semibold" : "text-gray-400"}`}>
              Administrator
            </span>
          </div>

          <div className={`h-0.5 w-12 sm:w-16 ${step >= 2 ? "bg-[#006fe6]" : "bg-gray-200"}`} />

          <div className="flex items-center space-x-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step >= 2 ? "bg-[#006fe6] text-white" : "bg-gray-200 text-gray-600"
              }`}
            >
              2
            </div>
            <span className={`text-xs font-medium ${step >= 2 ? "text-gray-900 font-semibold" : "text-gray-400"}`}>
              Organization
            </span>
          </div>

          <div className={`h-0.5 w-12 sm:w-16 ${step >= 3 ? "bg-[#006fe6]" : "bg-gray-200"}`} />

          <div className="flex items-center space-x-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step >= 3 ? "bg-[#006fe6] text-white" : "bg-gray-200 text-gray-600"
              }`}
            >
              3
            </div>
            <span className={`text-xs font-medium ${step >= 3 ? "text-gray-900 font-semibold" : "text-gray-400"}`}>
              Initialize
            </span>
          </div>
        </div>

        {/* Database Warning Banner if DB error */}
        {dbError && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 space-y-1">
            <div className="font-bold flex items-center space-x-1.5">
              <span>⚠️</span>
              <span>Database Connection Warning</span>
            </div>
            <p>{dbError}</p>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start space-x-2">
            <span className="font-bold">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Success Banner */}
        {initSuccess && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 space-y-1">
            <div className="font-bold text-sm flex items-center space-x-2">
              <span>✓</span>
              <span>Application Initialized Successfully!</span>
            </div>
            <p>Your administrator account has been created. Redirecting to workspace...</p>
          </div>
        )}

        {/* STEP 1: Administrator Form */}
        {step === 1 && (
          <form onSubmit={handleNextFromStep1} className="space-y-4 text-sm">
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-1">Create Initial Administrator</h2>
              <p className="text-xs text-gray-500 mb-4">
                This account will receive full owner privileges to manage quotations, customers, and system settings.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Administrator Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="e.g. John Doe"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#006fe6]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Administrator Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="e.g. admin@alphasteelframes.com.au"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#006fe6]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#006fe6]"
              />

              {/* Password Requirements Checklist */}
              <div className="mt-2.5 p-3 bg-gray-50 border border-gray-200 rounded text-[11px] space-y-1">
                <div className="font-semibold text-gray-700 mb-1">Password requirements:</div>
                <div className={`flex items-center space-x-1.5 ${hasMinLength ? "text-emerald-600 font-medium" : "text-gray-500"}`}>
                  <span>{hasMinLength ? "✓" : "○"}</span>
                  <span>At least 8 characters</span>
                </div>
                <div className={`flex items-center space-x-1.5 ${hasUppercase ? "text-emerald-600 font-medium" : "text-gray-500"}`}>
                  <span>{hasUppercase ? "✓" : "○"}</span>
                  <span>At least one uppercase letter (A-Z)</span>
                </div>
                <div className={`flex items-center space-x-1.5 ${hasLowercase ? "text-emerald-600 font-medium" : "text-gray-500"}`}>
                  <span>{hasLowercase ? "✓" : "○"}</span>
                  <span>At least one lowercase letter (a-z)</span>
                </div>
                <div className={`flex items-center space-x-1.5 ${hasNumber ? "text-emerald-600 font-medium" : "text-gray-500"}`}>
                  <span>{hasNumber ? "✓" : "○"}</span>
                  <span>At least one numeric digit (0-9)</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#006fe6]"
              />
              {confirmPassword && (
                <p className={`text-[11px] mt-1 ${passwordsMatch ? "text-emerald-600" : "text-red-500"}`}>
                  {passwordsMatch ? "✓ Passwords match" : "✕ Passwords do not match"}
                </p>
              )}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={!isPasswordValid || !adminName.trim() || !adminEmail.trim()}
                className="px-6 py-2.5 bg-[#006fe6] text-white rounded font-semibold text-sm hover:bg-[#005bb5] transition disabled:opacity-50"
              >
                Continue to Organization Details →
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Organization Form */}
        {step === 2 && (
          <form onSubmit={handleNextFromStep2} className="space-y-4 text-sm">
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-1">Organization Business Details</h2>
              <p className="text-xs text-gray-500 mb-4">
                Configure your commercial steel framing business profile. These details will appear on quotation documents.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Legal Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  placeholder="Alpha Steel Frames Pty Ltd"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#006fe6]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Trading Name
                </label>
                <input
                  type="text"
                  value={tradingName}
                  onChange={(e) => setTradingName(e.target.value)}
                  placeholder="Alpha Steel Frames"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#006fe6]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Australian Business Number (ABN)
                </label>
                <input
                  type="text"
                  value={abn}
                  onChange={(e) => setAbn(e.target.value)}
                  placeholder="51 824 753 556"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#006fe6]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Business Phone
                </label>
                <input
                  type="text"
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                  placeholder="+61 7 3000 1234"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#006fe6]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Business Email
              </label>
              <input
                type="email"
                value={businessEmail}
                onChange={(e) => setBusinessEmail(e.target.value)}
                placeholder="info@alphasteelframes.com.au"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#006fe6]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Business Address
              </label>
              <input
                type="text"
                value={businessAddress}
                onChange={(e) => setBusinessAddress(e.target.value)}
                placeholder="12 Titanium Circuit, Yatala, QLD 4207"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#006fe6]"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Country</label>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#006fe6]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#006fe6]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Postal Code</label>
                <input
                  type="text"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#006fe6]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Currency</label>
                <input
                  type="text"
                  value={currency}
                  disabled
                  className="w-full px-3 py-2 border border-gray-200 bg-gray-50 text-gray-600 rounded text-sm cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Time Zone</label>
                <input
                  type="text"
                  value={timeZone}
                  onChange={(e) => setTimeZone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#006fe6]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Quote Prefix</label>
                <input
                  type="text"
                  value={quotePrefix}
                  onChange={(e) => setQuotePrefix(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-[#006fe6]"
                />
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 font-medium text-xs sm:text-sm hover:bg-gray-50"
              >
                ← Back
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#006fe6] text-white rounded font-semibold text-sm hover:bg-[#005bb5] transition"
              >
                Review & Confirm →
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Review and Initialize */}
        {step === 3 && (
          <div className="space-y-5 text-sm">
            <div>
              <h2 className="text-base font-bold text-gray-900 mb-1">Review Setup Summary</h2>
              <p className="text-xs text-gray-500 mb-3">
                Please verify the configuration below. Clicking &quot;Initialize Alpha Steel Frames&quot; will create your database records and seal initial setup.
              </p>
            </div>

            {/* Summary Grid */}
            <div className="space-y-3">
              <div className="bg-[#f8f9fa] border border-gray-200 rounded-lg p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  1. Administrator Details
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Full Name:</span>
                    <div className="font-semibold text-gray-900">{adminName}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <div className="font-semibold text-gray-900">{adminEmail}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Role:</span>
                    <div className="font-semibold text-emerald-700">OWNER (Full Admin)</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Password:</span>
                    <div className="font-mono text-gray-900">••••••••••••</div>
                  </div>
                </div>
              </div>

              <div className="bg-[#f8f9fa] border border-gray-200 rounded-lg p-4">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  2. Organization Profile
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Legal Name:</span>
                    <div className="font-semibold text-gray-900">{organizationName}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Trading Name:</span>
                    <div className="font-semibold text-gray-900">{tradingName}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">ABN:</span>
                    <div className="font-semibold text-gray-900">{abn || "Not specified"}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Currency & Zone:</span>
                    <div className="font-semibold text-gray-900">{currency} / {timeZone}</div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500">Business Address:</span>
                    <div className="font-semibold text-gray-900">{businessAddress}</div>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
                🔒 <strong>Security Notice:</strong> Once submitted, the application will be initialized. All subsequent visits will direct to the secure sign-in page. The setup endpoint is permanently disabled after initialization.
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-gray-100">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={isSubmitting || initSuccess}
                className="px-4 py-2 border border-gray-300 rounded text-gray-700 font-medium text-xs sm:text-sm hover:bg-gray-50 disabled:opacity-50"
              >
                ← Back
              </button>

              <button
                type="button"
                onClick={handleFinalInitialize}
                disabled={isSubmitting || initSuccess}
                className="px-6 py-2.5 bg-[#006fe6] hover:bg-[#005bb5] text-white rounded font-bold text-sm shadow transition flex items-center space-x-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Initializing System...</span>
                  </>
                ) : (
                  <span>Initialize Alpha Steel Frames ✓</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 text-center text-xs text-gray-500">
        Alpha Steel Frames &bull; Private Accounting & Quotation System
      </div>
    </div>
  );
}
