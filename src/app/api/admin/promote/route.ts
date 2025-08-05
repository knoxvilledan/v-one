// TEMPORARY ADMIN PROMOTION ROUTE - REMOVE BEFORE PRODUCTION
import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

export async function POST() {
  try {
    await dbConnect();

    // Replace with your actual email address
    const adminEmail = "your-email@gmail.com"; // TODO: Update this with your actual email

    const result = await User.updateOne(
      { email: adminEmail },
      { $set: { role: "admin" } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "User not found with that email" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      modified: result.modifiedCount,
      message: `Admin role granted to ${adminEmail}`,
    });
  } catch (error) {
    console.error("Admin promotion error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
