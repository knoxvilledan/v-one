export const dynamic = "force-dynamic";
// This endpoint has been deprecated and replaced by /api/users.
// Returning 410 Gone for any method.
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Deprecated endpoint" }, { status: 410 });
}
export async function POST() {
  return NextResponse.json({ error: "Deprecated endpoint" }, { status: 410 });
}
