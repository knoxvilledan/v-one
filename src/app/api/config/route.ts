import { NextResponse } from "next/server";
import { getAppConfig } from "../../../lib/config";

// GET /api/config - Get current application configuration
export async function GET() {
  try {
    const config = await getAppConfig();

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error("Error fetching app configuration:", error);
    return NextResponse.json(
      { error: "Failed to fetch configuration" },
      { status: 500 }
    );
  }
}
