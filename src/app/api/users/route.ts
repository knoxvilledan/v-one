import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
import { ContentService } from "../../../lib/content-service";
import { UserRole } from "../../../types/content";

// GET /api/users - Get current user info
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    let user = await ContentService.getUserByEmail(session.user.email);

    // If user doesn't exist, create them as public user
    if (!user) {
      user = await ContentService.createUser(
        session.user.email,
        session.user.name || undefined,
        "public"
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error getting user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/users - Create or update user
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { role } = await request.json();

    // Only allow role updates for now, could expand later
    if (role && ["admin", "public"].includes(role)) {
      const success = await ContentService.updateUserRole(
        session.user.email,
        role as UserRole
      );

      if (success) {
        const user = await ContentService.getUserByEmail(session.user.email);
        return NextResponse.json({ user });
      } else {
        return NextResponse.json(
          { error: "Failed to update user" },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
