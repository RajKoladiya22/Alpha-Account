export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { isSystemInitialized } from "../../../../lib/setup-service.ts";

export async function GET() {
  try {
    const status = await isSystemInitialized();
    return NextResponse.json({
      success: true,
      ...status,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        initialized: false,
        error: "Failed to determine setup status.",
      },
      { status: 500 }
    );
  }
}
