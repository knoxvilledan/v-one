import { NextResponse } from "next/server";

export const badRequest = (msg = "Bad request", details?: unknown) =>
  NextResponse.json({ error: msg, details }, { status: 400 });
export const unauthorized = (msg = "Unauthorized") =>
  NextResponse.json({ error: msg }, { status: 401 });
export const forbidden = (msg = "Forbidden") =>
  NextResponse.json({ error: msg }, { status: 403 });
export const conflict = (msg = "Conflict") =>
  NextResponse.json({ error: msg }, { status: 409 });
export const serverError = (msg = "Internal server error") =>
  NextResponse.json({ error: msg }, { status: 500 });
