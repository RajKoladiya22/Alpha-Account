"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-[#f4f5f7] flex flex-col justify-center items-center px-4 font-sans text-gray-800">
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

      <div className="bg-white border border-gray-200 rounded-lg shadow-md max-w-md w-full p-8 text-center">
        <div className="w-12 h-12 bg-blue-50 text-[#006fe6] rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-2">Private Business System</h1>
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          Public user registration is disabled for Alpha Steel Frames. User accounts are created and managed exclusively by organization administrators.
        </p>

        <div className="p-4 bg-gray-50 rounded border border-gray-200 text-xs text-gray-600 mb-6 text-left space-y-1">
          <p className="font-semibold text-gray-800">Need access?</p>
          <p>Please contact your Alpha Steel Frames administrator at:</p>
          <p className="text-[#006fe6] font-medium">admin@alphasteelframes.com.au</p>
        </div>

        <Link
          href="/login"
          className="inline-block w-full py-2.5 bg-[#001e4d] hover:bg-[#002b66] text-white rounded font-semibold text-sm transition shadow-sm text-center"
        >
          Return to Login
        </Link>
      </div>
    </div>
  );
}
