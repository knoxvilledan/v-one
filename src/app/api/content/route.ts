import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { ContentService } from "../../../lib/content-service";
import dbConnect from "../../../lib/dbConnect";
import {
  ContentTemplate,
  type IContentTemplate,
} from "../../../models/ContentTemplate";
import User from "../../../models/User";

// GET /api/content - Get content template for current user's role
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user to determine role
    let user = await ContentService.getUserByEmail(session.user.email);

    // If user doesn't exist, create them as public user
    if (!user) {
      user = await ContentService.createUser(
        session.user.email,
        session.user.name || undefined,
        "public"
      );
    }

    // Determine which content template to use
    let effectiveRole = user.role;

    // If user is admin, check their view mode preference
    if (user.role === "admin") {
      // Connect to database to get latest user data including adminViewMode
      await dbConnect();
      const userFromDb = await User.findOne({ email: session.user.email });
      const adminViewMode = userFromDb?.adminViewMode || "admin";

      // Use the admin's preferred view mode to determine content
      effectiveRole = adminViewMode;
    }

    // Get content template for the effective role
    await dbConnect();
    const contentTemplate = await ContentTemplate.findOne({
      userRole: effectiveRole,
    }).lean<IContentTemplate>();

    if (!contentTemplate) {
      return NextResponse.json(
        { error: "No content template found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      content: contentTemplate.content,
      userRole: user.role, // Always return actual user role
      effectiveRole: effectiveRole, // Include effective role for admin toggle UI
    });
  } catch (error) {
    console.error("Error getting content:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/content - Update content template (admin only for now)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await ContentService.getUserByEmail(session.user.email);

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { content, targetRole } = await request.json();

    const success = await ContentService.updateContentTemplate(
      targetRole || user.role,
      content
    );

    if (success) {
      return NextResponse.json({ message: "Content updated successfully" });
    } else {
      return NextResponse.json(
        { error: "Failed to update content" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error updating content:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
