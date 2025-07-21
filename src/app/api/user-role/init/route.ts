import { NextResponse } from "next/server";
import { UserRoleService } from "../../../../lib/user-roles";

// POST /api/user-role/init - Initialize user roles
export async function POST() {
  try {
    const result = await UserRoleService.initializeUserRoles();

    if (result) {
      return NextResponse.json({
        success: true,
        message: "User roles initialized successfully",
      });
    } else {
      return NextResponse.json(
        { error: "Failed to initialize user roles" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error initializing user roles:", error);
    return NextResponse.json(
      { error: "Failed to initialize user roles" },
      { status: 500 }
    );
  }
}
