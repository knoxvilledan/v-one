import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { ContentService } from "../../../lib/content-service";
import dbConnect from "../../../lib/dbConnect";
import { ContentTemplate, type IContentTemplate } from "../../../models/ContentTemplate";

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

    // Get content template for user's role
  await dbConnect();
  const contentTemplate = await ContentTemplate.findOne({ userRole: user.role }).lean<IContentTemplate>();

    if (!contentTemplate) {
      return NextResponse.json(
        { error: "No content template found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      content: contentTemplate.content,
      userRole: user.role,
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
