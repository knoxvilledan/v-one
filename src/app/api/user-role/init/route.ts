import { NextResponse } from "next/server";

// POST /api/user-role/init - Initialize user roles
export async function POST() {
  return NextResponse.json({ error: "Deprecated endpoint" }, { status: 410 });
}
