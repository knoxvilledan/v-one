import { NextRequest, NextResponse } from "next/server";
import { UserRoleService } from "../../../lib/user-roles";

// GET /api/user-role - Get user role
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    const role = await UserRoleService.getUserRole(email);

    return NextResponse.json({
      role,
      email,
    });
  } catch (error) {
    console.error("Error getting user role:", error);
    return NextResponse.json(
      { error: "Failed to get user role" },
      { status: 500 }
    );
  }
}

// POST /api/user-role - Create or update user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, role = "public" } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await UserRoleService.createOrUpdateUser(email, name, role);

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error creating/updating user:", error);
    return NextResponse.json(
      { error: "Failed to create/update user" },
      { status: 500 }
    );
  }
}
