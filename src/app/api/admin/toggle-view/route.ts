import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";
import { connectDB, User } from "@/lib/database";

// POST /api/admin/toggle-view - Toggle admin view mode between admin and public content
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await connectDB();

    // Find the user
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only allow admins to toggle view mode
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Only admin users can toggle view mode" },
        { status: 403 }
      );
    }

    const { viewMode } = await request.json();

    // Validate view mode
    if (!viewMode || !["admin", "public"].includes(viewMode)) {
      return NextResponse.json(
        { error: "Valid view mode required (admin or public)" },
        { status: 400 }
      );
    }

    // Update the admin view mode
    user.adminViewMode = viewMode;
    await user.save();

    return NextResponse.json({
      success: true,
      viewMode: user.adminViewMode,
      message: `View mode switched to ${viewMode}`,
    });
  } catch (error) {
    console.error("Admin view toggle error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/admin/toggle-view - Get current admin view mode
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    await connectDB();

    // Find the user
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only allow admins to check view mode
    if (user.role !== "admin") {
      return NextResponse.json(
        { error: "Only admin users have view mode" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      viewMode: user.adminViewMode || "admin",
      isAdmin: true,
    });
  } catch (error) {
    console.error("Get admin view mode error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
