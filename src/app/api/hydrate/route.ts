import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { HydrationService } from "../../../lib/hydration";

// GET /api/hydrate - Get all user data for the application
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const url = new URL(request.url);
    const targetDate = url.searchParams.get("date"); // Optional YYYY-MM-DD format

    // Hydrate all user data
    const userData = await HydrationService.hydrateUserData(
      session.user.email,
      targetDate || undefined
    );

    if (!userData) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(userData);
  } catch (error) {
    console.error("Error hydrating user data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
