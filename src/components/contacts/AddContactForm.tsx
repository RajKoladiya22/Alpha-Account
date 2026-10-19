"use client";

import React, { useState } from "react";
import type { CreateContactInput } from "../../core/contacts/contact-service.ts";

export interface AddContactFormProps {
  onSave?: (contact: CreateContactInput) => void;
  onCancel?: () => void;
}

export const AddContactForm: React.FC<AddContactFormProps> = ({
  onSave,
  onCancel,
}) => {
  const [activeSection, setActiveSection] = useState<string>("Contact details");

  // Form Fields
  const [name, setName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave &&
      onSave({
        tenantId: "tenant-default",
        name: name.trim(),
        accountNumber: accountNumber.trim() || undefined,
        primaryPerson:
          firstName || lastName || email
            ? { firstName, lastName, email }
            : undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        taxNumber: taxNumber.trim() || undefined,
        address:
          street || city || state || postalCode
            ? { street, city, state, postalCode, country: "Australia" }
            : undefined,
      });
  };

  return (
    <div className="w-full max-w-[1720px] mx-auto px-3 sm:px-6 lg:px-8 py-6 font-sans text-gray-800">
      {/* Header and Breadcrumb */}
      <div className="pb-3 mb-6 border-b border-gray-200">
        <nav className="text-xs text-gray-500 mb-1">
          <span className="hover:underline cursor-pointer" onClick={onCancel}>
            Contacts
          </span>{" "}
          &gt; <span className="text-gray-800 font-medium">Add contact</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">Add contact</h1>
      </div>

      {/* Main 2-Column Layout matching screenshot image copy 18.png */}
      <div className="bg-white border border-gray-200 rounded shadow-sm overflow-hidden flex flex-col md:flex-row">
        {/* Left Vertical Navigation Menu */}
        <div className="w-full md:w-64 border-r border-gray-200 bg-gray-50/50 p-4 space-y-6">
          <div className="space-y-1">
            {["Contact details", "Addresses", "Financial details"].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setActiveSection(item)}
                className={`w-full text-left px-3 py-2 text-sm font-medium rounded transition ${
                  activeSection === item
                    ? "bg-white text-[#006fe6] font-semibold border-l-4 border-[#006fe6] shadow-xs"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="space-y-1 pt-4 border-t border-gray-200">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 px-3">
              Default settings
            </span>
            {["Sales defaults", "Purchase defaults"].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setActiveSection(item)}
                className={`w-full text-left px-3 py-2 text-sm font-medium rounded transition ${
                  activeSection === item
                    ? "bg-white text-[#006fe6] font-semibold border-l-4 border-[#006fe6] shadow-xs"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Right Form Fields Area */}
        <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-6 max-w-2xl">
          {activeSection === "Contact details" && (
            <>
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-4">Contact details</h3>

                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Contact name (required)
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="A business or person's name"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-[#006fe6] focus:ring-1 focus:ring-[#006fe6]"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Account number
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:border-[#006fe6] focus:ring-1 focus:ring-[#006fe6]"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Add a unique account number to identify, reference and search for the contact.
                  </p>
                </div>
              </div>

              {/* Primary person section */}
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-bold text-gray-900 mb-3">Primary person</h4>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">First name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Last name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@email.com"
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 0412 345 678"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                  />
                </div>

                <button
                  type="button"
                  className="text-xs font-semibold text-[#006fe6] hover:underline"
                >
                  + Add another person
                </button>
              </div>

              {/* Business Information Section */}
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-bold text-gray-900 mb-3">Business information</h4>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Tax Number (ABN/VAT)
                  </label>
                  <input
                    type="text"
                    value={taxNumber}
                    onChange={(e) => setTaxNumber(e.target.value)}
                    placeholder="e.g. 51 824 753 556"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                  />
                </div>
              </div>
            </>
          )}

          {activeSection === "Addresses" && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-gray-900 mb-2">Addresses</h3>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Street address</label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Street address or PO Box"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">City / Suburb</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="e.g. QLD"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Postcode</label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Bottom Action Buttons */}
          <div className="pt-6 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#006fe6] hover:bg-[#005bb5] text-white text-sm font-semibold rounded shadow-sm"
            >
              Save &amp; close
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
