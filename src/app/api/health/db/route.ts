import { NextResponse } from "next/server";
import { connectDB } from "@/lib/database";

export async function GET() {
  try {
    await connectDB();
    return NextResponse.json({
      ok: true,
      message: "Database connection successful",
    });
  } catch (error) {
    console.error("Database health check failed:", error);
    return NextResponse.json(
      { ok: false, error: "Database connection failed" },
      { status: 500 }
    );
  }
}
