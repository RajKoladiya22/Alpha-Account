"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export interface AccountOption {
  id?: string;
  code: string;
  name: string;
  type?: string;
  label: string;
}

export interface AccountSearchSelectProps {
  value: string;
  onChange: (value: string) => void;
  accounts: AccountOption[];
  hasError?: boolean;
  placeholder?: string;
  disabled?: boolean;
  height?: number;
}

export const AccountSearchSelect: React.FC<AccountSearchSelectProps> = ({
  value,
  onChange,
  accounts,
  hasError = false,
  placeholder = "-- Select account * --",
  disabled = false,
  height,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; width: number }>({
    top: 0,
    left: 0,
    width: 280,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateCoords = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const dropdownHeight = 280;
    const spaceBelow = window.innerHeight - rect.bottom;
    const showUpward = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

    const top = showUpward ? Math.max(8, rect.top - dropdownHeight - 4) : rect.bottom + 4;
    const targetWidth = Math.max(rect.width, 320);
    const left = Math.min(Math.max(8, rect.left), window.innerWidth - targetWidth - 12);

    setCoords({
      top,
      left,
      width: targetWidth,
    });
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false);
        setSearch("");
      }
    };
    if (isOpen) {
      updateCoords();
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", updateCoords, true);
      window.addEventListener("resize", updateCoords);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", updateCoords, true);
      window.removeEventListener("resize", updateCoords);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(0);
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Filter accounts by search query
  const filteredAccounts = accounts.filter((acc) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return (
      acc.code.toLowerCase().includes(q) ||
      acc.name.toLowerCase().includes(q) ||
      acc.label.toLowerCase().includes(q)
    );
  });

  const handleSelect = (acc: AccountOption) => {
    onChange(acc.label);
    setIsOpen(false);
    setSearch("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "Enter" || e.key === "ArrowDown" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredAccounts.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredAccounts[highlightedIndex]) {
        handleSelect(filteredAccounts[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      setSearch("");
    }
  };

  // Find currently selected account
  const selectedAccount = accounts.find(
    (a) =>
      a.label === value ||
      a.code === value ||
      a.name === value ||
      (value && value.startsWith(`${a.code} -`))
  );

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        style={height ? { height: `${height}px` } : undefined}
        className={`w-full flex items-center justify-between px-2.5 py-2 border rounded-md text-sm sm:text-base bg-white text-left transition focus:outline-none focus:ring-1 focus:ring-[#006fe6] focus:border-[#006fe6] ${
          hasError
            ? "border-red-500 bg-red-50/30 text-red-900"
            : isOpen
            ? "border-[#006fe6] ring-1 ring-[#006fe6]"
            : "border-gray-300 hover:border-gray-400"
        }`}
      >
        <span className="truncate pr-1">
          {selectedAccount ? (
            <span className="font-medium text-gray-900">
              <span className="font-semibold text-[#006fe6] mr-1.5">{selectedAccount.code}</span>
              {selectedAccount.name}
            </span>
          ) : value ? (
            <span className="font-medium text-gray-900">{value}</span>
          ) : (
            <span className="text-gray-400 font-normal">{placeholder}</span>
          )}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${
            isOpen ? "rotate-180 text-[#006fe6]" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Popover Dropdown rendered into Portal */}
      {isOpen && mounted && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: "fixed",
            top: `${coords.top}px`,
            left: `${coords.left}px`,
            width: `${coords.width}px`,
            zIndex: 9999,
          }}
          className="bg-white border border-gray-300 rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Search Input Box */}
          <div className="p-2 border-b border-gray-200 bg-gray-50 flex items-center space-x-2">
            <svg
              className="w-4 h-4 text-gray-400 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setHighlightedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Search code or name..."
              className="w-full bg-transparent text-sm border-0 focus:outline-none focus:ring-0 text-gray-800 placeholder-gray-400"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-gray-400 hover:text-gray-600 text-xs px-1"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Account Options List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-gray-100">
            {filteredAccounts.length === 0 ? (
              <div className="p-3 text-center text-xs text-gray-500">
                No accounts match &ldquo;{search}&rdquo;
              </div>
            ) : (
              filteredAccounts.map((acc, index) => {
                const isSelected =
                  selectedAccount?.code === acc.code ||
                  value === acc.label ||
                  (value && value.startsWith(`${acc.code} -`));
                const isHighlighted = highlightedIndex === index;

                return (
                  <div
                    key={acc.id || acc.code}
                    onClick={() => handleSelect(acc)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`px-3 py-2 text-left cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? "bg-blue-50 text-[#006fe6]"
                        : isHighlighted
                        ? "bg-gray-100 text-gray-900"
                        : "hover:bg-gray-50 text-gray-800"
                    }`}
                  >
                    <div className="flex items-center space-x-2 min-w-0 pr-2">
                      <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
                        {acc.code}
                      </span>
                      <span className="text-sm font-medium truncate">{acc.name}</span>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      {acc.type && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 px-1 py-0.5 rounded bg-gray-50 border border-gray-100">
                          {acc.type}
                        </span>
                      )}
                      {isSelected && (
                        <svg
                          className="w-4 h-4 text-[#006fe6]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
