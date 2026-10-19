export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out successfully" });
  response.cookies.delete("asf_session");
  response.cookies.delete("xero_session");
  response.cookies.set("asf_session", "", { path: "/", maxAge: 0 });
  response.cookies.set("xero_session", "", { path: "/", maxAge: 0 });
  return response;
}
