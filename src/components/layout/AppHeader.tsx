"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export interface AppHeaderProps {
  organizationName?: string;
  activeNav?: string;
  userInitials?: string;
  onSelectNav?: (nav: string) => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  organizationName = "Alpha Steel Frames",
  activeNav = "Quotes",
  userInitials = "AA",
}) => {
  const router = useRouter();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Authenticated user state
  const [currentUser, setCurrentUser] = useState<{
    id?: string;
    name: string;
    email: string;
    role: string;
    initials: string;
    organizationName: string;
  }>({
    name: "Alpha Admin",
    email: "admin@alphasteelframes.com.au",
    role: "ADMIN",
    initials: userInitials,
    organizationName,
  });

  useEffect(() => {
    // Fetch authenticated user profile
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.user) {
          setCurrentUser({
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role,
            initials: data.user.initials || "AA",
            organizationName: data.user.organizationName || "Alpha Steel Frames",
          });
        }
      })
      .catch(() => {});
  }, []);

  const navItems = [
    { label: "Quotes", href: "/quotes" },
    { label: "Contacts", href: "/contacts/customers" },
    { label: "Settings", href: "/settings" },
  ];

  const handleNavClick = (item: { label: string; href: string }) => {
    router.push(item.href);
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {}
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      <header className="bg-[#001e4d] text-white flex items-center justify-between px-3 md:px-6 h-14 select-none relative z-40 shadow-sm">
        {/* Left: Brand Logo & Primary Nav */}
        <div className="flex items-center space-x-3 md:space-x-8 h-full">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 text-gray-200 hover:text-white"
            aria-label="Toggle navigation menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Alpha Steel Frames Logo (Clean brand mark without redundant duplicate text or org switcher) */}
          <div
            onClick={() => router.push("/quotes")}
            className="flex items-center cursor-pointer py-1.5"
            title="Alpha Steel Frames"
          >
            <Image
              src="/logo.png"
              alt="Alpha Steel Frames"
              width={160}
              height={40}
              className="h-9 w-auto object-contain brightness-0 invert"
              priority
            />
          </div>

          {/* Desktop Primary Navigation */}
          <nav className="hidden lg:flex items-center space-x-1 h-full">
            {navItems.map((item) => {
              const isActive =
                activeNav.toLowerCase() === item.label.toLowerCase() ||
                (item.label === "Quotes" && (activeNav === "Sales" || activeNav === "Home"));
              return (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item)}
                  className={`h-full px-4 text-sm font-semibold transition flex items-center border-b-4 ${
                    isActive
                      ? "border-white text-white"
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
        <div className="flex items-center space-x-2 md:space-x-3">
          {/* Quick Add Button (+) */}
          <div className="relative">
            <button
              onClick={() => {
                setShowQuickAdd(!showQuickAdd);
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
              <div className="absolute right-0 mt-2 w-48 bg-white text-gray-900 rounded-md shadow-xl border border-gray-200 py-1.5 z-50 text-sm">
                <button
                  onClick={() => {
                    setShowQuickAdd(false);
                    router.push("/quotes/new");
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center text-gray-700 font-medium"
                >
                  <span className="w-5 text-gray-400">📄</span> New quote
                </button>
                <button
                  onClick={() => {
                    setShowQuickAdd(false);
                    router.push("/contacts/add");
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center text-gray-700 font-medium"
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
            title="Search quotations"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          {/* Help modal button */}
          <button
            onClick={() => setShowHelpModal(true)}
            className="p-1.5 rounded-full hover:bg-[#002b66] text-gray-200 hover:text-white transition"
            title="Application Help"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {/* User Initials Avatar Circle & Menu */}
          <div className="relative">
            <div
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowQuickAdd(false);
              }}
              className="w-8 h-8 rounded-full bg-[#006fe6] text-white flex items-center justify-center font-bold text-xs cursor-pointer shadow-inner border border-white/20 select-none hover:ring-2 hover:ring-white/40 transition"
              title={`${currentUser.name} (${currentUser.role})`}
            >
              {currentUser.initials}
            </div>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white text-gray-900 rounded-md shadow-2xl border border-gray-200 py-2 z-50 text-sm">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="font-semibold text-gray-900 truncate">{currentUser.name}</p>
                  <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
                  <span className="inline-block mt-1 px-1.5 py-0.5 text-[10px] font-bold uppercase rounded bg-blue-100 text-[#001e4d]">
                    {currentUser.role}
                  </span>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      router.push("/settings");
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 flex items-center justify-between"
                  >
                    <span>Settings</span>
                    <span className="text-xs text-gray-400">⚙</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      setShowHelpModal(true);
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700 flex items-center justify-between"
                  >
                    <span>Help &amp; Support</span>
                    <span className="text-xs text-gray-400">?</span>
                  </button>
                </div>

                <div className="border-t border-gray-100 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 font-medium"
                  >
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile navigation drawer */}
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

      {/* In-App Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 text-gray-800 shadow-xl">
            <div className="flex justify-between items-center mb-4 border-b pb-2">
              <h3 className="font-bold text-gray-900 text-base">
                Alpha Steel Frames Software Help
              </h3>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="text-xs space-y-3 leading-relaxed text-gray-600">
              <p>
                <strong className="text-gray-800">Quotation Management:</strong> Create drafts, apply line discounts, configure GST treatments (Exclusive, Inclusive, No Tax), and print professional client-ready PDFs.
              </p>
              <p>
                <strong className="text-gray-800">Quotation Revisions:</strong> When scope changes on sent or accepted quotes, click &quot;Revise&quot; in the quote actions menu to produce a new version while preserving historical records.
              </p>
              <p>
                <strong className="text-gray-800">Financial Calculations:</strong> All calculations are verified centrally with decimal-safe cents rounding to ensure 100% mathematical reconciliation.
              </p>
              <p>
                <strong className="text-gray-800">Support Contact:</strong> For administrative assistance, contact <span className="text-[#006fe6]">admin@alphasteelframes.com.au</span>.
              </p>
            </div>
            <div className="mt-6 pt-3 border-t flex justify-end">
              <button
                onClick={() => setShowHelpModal(false)}
                className="px-4 py-2 bg-[#001e4d] text-white text-xs font-semibold rounded hover:bg-[#002b66]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
