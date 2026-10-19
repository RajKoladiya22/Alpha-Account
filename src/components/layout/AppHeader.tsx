import React from "react";

export interface AppHeaderProps {
  organizationName?: string;
  activeNav?: string;
  userInitials?: string;
  onSelectNav?: (nav: string) => void;
  onOpenOrgMenu?: () => void;
  onQuickAdd?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  organizationName = "PB Style Homes Pty Ltd",
  activeNav = "Sales",
  userInitials = "SB",
  onSelectNav,
  onOpenOrgMenu,
  onQuickAdd,
}) => {
  const navItems = [
    "Home",
    "Sales",
    "Purchases",
    "Reporting",
    "Payroll",
    "Accounting",
    "Tax",
    "Contacts",
    "Projects",
  ];

  return (
    <header className="bg-[#001e4d] text-white flex items-center justify-between px-4 h-14 select-none relative shadow-sm">
      {/* Left side: Logo, Org Switcher & Primary Nav */}
      <div className="flex items-center space-x-6 h-full">
        {/* Xero Brand Logo */}
        <div className="flex items-center space-x-2 font-bold text-xl tracking-tight cursor-pointer">
          <svg
            className="w-7 h-7 text-white fill-current"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <span className="text-white text-lg font-semibold">xero</span>
        </div>

        {/* Organization Switcher Dropdown */}
        <button
          onClick={onOpenOrgMenu}
          className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-[#002b66] transition text-sm font-medium border border-transparent hover:border-[#003d8f]"
          title="Switch Organization"
        >
          <span className="truncate max-w-[180px]">{organizationName}</span>
          <svg className="w-4 h-4 ml-1 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Desktop Primary Nav Bar */}
        <nav className="hidden lg:flex items-center space-x-1 h-full">
          {navItems.map((nav) => {
            const isActive = activeNav.toLowerCase() === nav.toLowerCase();
            return (
              <button
                key={nav}
                onClick={() => onSelectNav && onSelectNav(nav)}
                className={`h-full px-3 text-sm font-medium transition flex items-center border-b-4 ${
                  isActive
                    ? "border-white text-white font-semibold"
                    : "border-transparent text-gray-200 hover:text-white hover:bg-[#002b66]"
                }`}
              >
                {nav}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Right side utilities: Quick Add (+), Search, JAX AI, Help, Notifications, Apps, Avatar */}
      <div className="flex items-center space-x-3">
        {/* Quick Add Button (+) */}
        <button
          onClick={onQuickAdd}
          className="p-1.5 rounded-full hover:bg-[#002b66] text-gray-200 hover:text-white transition"
          title="Create New"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {/* Search Icon */}
        <button
          className="p-1.5 rounded-full hover:bg-[#002b66] text-gray-200 hover:text-white transition"
          title="Search"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>

        {/* JAX AI Assistant Sparkle Icon */}
        <button
          className="p-1.5 rounded-full hover:bg-[#002b66] text-blue-300 hover:text-white transition"
          title="JAX AI Companion"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
          </svg>
        </button>

        {/* Help Question Mark */}
        <button
          className="p-1.5 rounded-full hover:bg-[#002b66] text-gray-200 hover:text-white transition"
          title="Help & Support"
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

        {/* Apps Grid (3x3) */}
        <button
          className="p-1.5 rounded-full hover:bg-[#002b66] text-gray-200 hover:text-white transition"
          title="Connected Apps"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4 8h4V4H4v4zm6 12h4v-4h-4v4zm-6 0h4v-4H4v4zm0-6h4v-4H4v4zm6 0h4v-4h-4v4zm6-10v4h4V4h-4zm-6 4h4V4h-4v4zm6 6h4v-4h-4v4zm0 6h4v-4h-4v4z" />
          </svg>
        </button>

        {/* User Initials Avatar Circle */}
        <div
          className="w-8 h-8 rounded-full bg-[#f48b76] text-white flex items-center justify-center font-bold text-xs cursor-pointer shadow-inner border border-white/20"
          title="User Profile"
        >
          {userInitials}
        </div>
      </div>
    </header>
  );
};
