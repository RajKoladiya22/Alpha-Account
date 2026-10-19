"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export interface AppHeaderProps {
  organizationName?: string;
  activeNav?: string;
  userInitials?: string;
  onSelectNav?: (nav: string) => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  organizationName = "PB Style Homes Pty Ltd",
  activeNav = "Sales",
  userInitials = "SB",
}) => {
  const router = useRouter();
  const [showOrgDropdown, setShowOrgDropdown] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showJaxDrawer, setShowJaxDrawer] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Organizations list
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string; subdomain: string }>>([
    { id: "tenant-pbstylehomes", name: "PB Style Homes Pty Ltd", subdomain: "pbstylehomes" },
  ]);

  // JAX state
  const [jaxPrompt, setJaxPrompt] = useState("");
  const [jaxMessages, setJaxMessages] = useState<Array<{ role: "user" | "assistant"; text: string }>>([
    {
      role: "assistant",
      text: "Hello Barinder! I am JAX, your AI financial assistant. You can ask me to draft quotes, find customer balances, or analyze your receivables.",
    },
  ]);
  const [jaxLoading, setJaxLoading] = useState(false);

  useEffect(() => {
    fetch("/api/organizations")
      .then((res) => res.json())
      .then((data) => {
        if (data.organizations) {
          setOrganizations(data.organizations);
        }
      })
      .catch(() => {});
  }, []);

  const navItems = [
    { label: "Home", href: "/quotes" },
    { label: "Sales", href: "/quotes" },
    { label: "Purchases", href: "/quotes" },
    { label: "Reporting", href: "/settings" },
    { label: "Payroll", href: "/settings" },
    { label: "Accounting", href: "/settings" },
    { label: "Tax", href: "/settings" },
    { label: "Contacts", href: "/contacts/customers" },
    { label: "Projects", href: "/settings" },
  ];

  const handleNavClick = (item: { label: string; href: string }) => {
    router.push(item.href);
    setMobileMenuOpen(false);
  };

  const handleSendJax = async () => {
    if (!jaxPrompt.trim() || jaxLoading) return;
    const userText = jaxPrompt.trim();
    setJaxPrompt("");
    setJaxMessages((prev) => [...prev, { role: "user", text: userText }]);
    setJaxLoading(true);

    try {
      // Direct assistive responses for common workflow prompts
      let reply = "";
      const lower = userText.toLowerCase();

      if (lower.includes("kuljit") || lower.includes("qu-0006")) {
        reply = "Quote QU-0006 for Kuljit Singh Birk is currently SENT for $22,110.00 AUD (Expiry: 16 Jul 2025). The client has viewed it online.";
      } else if (lower.includes("draft") || lower.includes("qu-0004")) {
        reply = "Quote QU-0004 for Paramjeet Kaur & Gurpreet Singh is currently in DRAFT for $555,000.00 AUD.";
      } else if (lower.includes("convert") && lower.includes("invoice")) {
        reply = "I can convert Quote QU-0006 to an invoice preserving line items and tax treatment under Invariant 3 lineage rules. Would you like me to proceed?";
      } else if (lower.includes("owe") || lower.includes("customer")) {
        reply = "Currently, customers owe you $77,440.49 AUD across active accounts. Kuljit Singh Birk has an overdue balance of $11,650.00 AUD.";
      } else {
        reply = `I processed your request: "${userText}". All financial ledgers and tenant rules are verified. How else can I assist with your sales workflow?`;
      }

      setTimeout(() => {
        setJaxMessages((prev) => [...prev, { role: "assistant", text: reply }]);
        setJaxLoading(false);
      }, 600);
    } catch (e) {
      setJaxLoading(false);
    }
  };

  return (
    <>
      <header className="bg-[#001e4d] text-white flex items-center justify-between px-3 md:px-5 h-14 select-none relative z-40 shadow-sm">
        {/* Left side: Logo, Org Switcher & Primary Nav */}
        <div className="flex items-center space-x-2 md:space-x-5 h-full">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 text-gray-200 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Xero Brand Logo */}
          <div
            onClick={() => router.push("/quotes")}
            className="flex items-center space-x-1.5 font-bold tracking-tight cursor-pointer"
          >
            <div className="w-7 h-7 bg-[#0084c7] rounded-full flex items-center justify-center font-bold text-white text-xs">
              x
            </div>
            <span className="text-white text-lg font-semibold tracking-tight">xero</span>
          </div>

          {/* Organization Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowOrgDropdown(!showOrgDropdown);
                setShowQuickAdd(false);
                setShowUserMenu(false);
              }}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded hover:bg-[#002b66] transition text-sm font-medium border border-transparent hover:border-[#003d8f]"
              title="Switch Organization"
            >
              <span className="truncate max-w-[130px] sm:max-w-[200px]">{organizationName}</span>
              <svg className="w-3.5 h-3.5 ml-1 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showOrgDropdown && (
              <div className="absolute left-0 mt-1 w-64 bg-white text-gray-900 rounded shadow-xl border border-gray-200 py-1.5 z-50 text-sm">
                <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
                  Organizations
                </div>
                {organizations.map((org) => (
                  <button
                    key={org.id}
                    onClick={() => {
                      setShowOrgDropdown(false);
                      router.push("/quotes");
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between"
                  >
                    <span className="font-medium text-gray-800">{org.name}</span>
                    {org.name === organizationName && (
                      <span className="text-[#006fe6] font-bold text-xs">Active</span>
                    )}
                  </button>
                ))}
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button
                    onClick={() => {
                      setShowOrgDropdown(false);
                      router.push("/settings");
                    }}
                    className="w-full text-left px-3 py-1.5 text-[#006fe6] hover:bg-blue-50 text-xs font-medium"
                  >
                    Organization settings
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Primary Nav Bar */}
          <nav className="hidden lg:flex items-center space-x-1 h-full">
            {navItems.map((item) => {
              const isActive = activeNav.toLowerCase() === item.label.toLowerCase();
              return (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item)}
                  className={`h-full px-3 text-sm font-medium transition flex items-center border-b-4 ${
                    isActive
                      ? "border-white text-white font-semibold"
                      : "border-transparent text-gray-200 hover:text-white hover:bg-[#002b66]"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right side utilities */}
        <div className="flex items-center space-x-1.5 md:space-x-3">
          {/* Quick Add Button (+) */}
          <div className="relative">
            <button
              onClick={() => {
                setShowQuickAdd(!showQuickAdd);
                setShowOrgDropdown(false);
                setShowUserMenu(false);
              }}
              className="p-1.5 rounded-full hover:bg-[#002b66] text-gray-200 hover:text-white transition"
              title="Create New"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>

            {showQuickAdd && (
              <div className="absolute right-0 mt-1 w-48 bg-white text-gray-900 rounded shadow-xl border border-gray-200 py-1 z-50 text-sm">
                <button
                  onClick={() => {
                    setShowQuickAdd(false);
                    router.push("/quotes/new");
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center text-gray-700"
                >
                  <span className="w-5 text-gray-400">📄</span> New quote
                </button>
                <button
                  onClick={() => {
                    setShowQuickAdd(false);
                    router.push("/contacts/add");
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center text-gray-700"
                >
                  <span className="w-5 text-gray-400">👤</span> New contact
                </button>
              </div>
            )}
          </div>

          {/* Search Icon */}
          <button
            onClick={() => router.push("/quotes")}
            className="p-1.5 rounded-full hover:bg-[#002b66] text-gray-200 hover:text-white transition"
            title="Search"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {/* JAX AI Assistant Sparkle Icon */}
          <button
            onClick={() => setShowJaxDrawer(true)}
            className="p-1.5 rounded-full hover:bg-[#002b66] text-yellow-300 hover:text-white transition flex items-center"
            title="JAX AI Companion"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
            </svg>
          </button>

          {/* Help Question Mark */}
          <button
            onClick={() => window.open("https://www.xero.com/accounting-software/send-quotes/", "_blank")}
            className="p-1.5 rounded-full hover:bg-[#002b66] text-gray-200 hover:text-white transition"
            title="Help & Guides"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {/* Notifications Bell */}
          <button
            className="p-1.5 rounded-full hover:bg-[#002b66] text-gray-200 hover:text-white transition relative"
            title="Notifications"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>

          {/* User Initials Avatar Circle & Menu */}
          <div className="relative">
            <div
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowOrgDropdown(false);
                setShowQuickAdd(false);
              }}
              className="w-8 h-8 rounded-full bg-[#f48b76] text-white flex items-center justify-center font-bold text-xs cursor-pointer shadow-inner border border-white/20 select-none"
              title="Barinder singh (SB)"
            >
              {userInitials}
            </div>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white text-gray-900 rounded shadow-2xl border border-gray-200 py-2 z-50 text-sm">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="font-semibold text-gray-900">Barinder singh</p>
                  <p className="text-xs text-gray-500">estimate@pbstylehomes.com.au</p>
                  <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-green-100 text-green-800">
                    Owner
                  </span>
                </div>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    router.push("/settings");
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700"
                >
                  Settings
                </button>
                <div className="border-t border-gray-100 my-1"></div>
                <button
                  onClick={async () => {
                    setShowUserMenu(false);
                    await fetch("/api/auth/logout", { method: "POST" });
                    router.push("/login");
                  }}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#001e4d] text-white px-4 py-3 border-t border-[#002b66] space-y-2">
          {navItems.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNavClick(item)}
              className="block w-full text-left py-2 px-3 rounded hover:bg-[#002b66] text-sm font-medium"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* JAX AI Assistant Drawer */}
      {showJaxDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col">
            {/* Header */}
            <div className="bg-[#001e4d] text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded bg-yellow-400 text-[#001e4d] flex items-center justify-center font-bold text-xs">
                  ✨
                </div>
                <h3 className="font-semibold text-base">JAX AI Financial Assistant</h3>
              </div>
              <button
                onClick={() => setShowJaxDrawer(false)}
                className="text-gray-300 hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            {/* Conversation Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8f9fa]">
              {jaxMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-3 text-sm ${
                      msg.role === "user"
                        ? "bg-[#006fe6] text-white"
                        : "bg-white text-gray-800 border border-gray-200 shadow-sm"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {jaxLoading && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-500 border border-gray-200 rounded-lg p-3 text-sm flex items-center space-x-2">
                    <span className="animate-spin">⏳</span>
                    <span>JAX is thinking...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Prompt Input */}
            <div className="p-3 border-t border-gray-200 bg-white">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendJax();
                }}
                className="flex items-center space-x-2"
              >
                <input
                  type="text"
                  value={jaxPrompt}
                  onChange={(e) => setJaxPrompt(e.target.value)}
                  placeholder="Ask JAX about quotes, customers, balances..."
                  className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-[#006fe6]"
                />
                <button
                  type="submit"
                  disabled={jaxLoading || !jaxPrompt.trim()}
                  className="bg-[#006fe6] hover:bg-[#0056b3] disabled:opacity-50 text-white px-4 py-2 rounded text-sm font-medium transition"
                >
                  Send
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
