import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/database";
import { UserData } from "@/models/UserData";

interface QueryFilter {
  email?: string;
  userId?: string;
  date?: string;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const date = searchParams.get("date");
    const userId = searchParams.get("userId");

    if (!email && !userId) {
      return NextResponse.json(
        { error: "Email or userId is required" },
        { status: 400 }
      );
    }

    const query: QueryFilter = {};
    if (email) query.email = email;
    if (userId) query.userId = userId;
    if (date) query.date = date;

    const userData = await UserData.find(query).sort({ date: -1 });

    return NextResponse.json({ success: true, data: userData });
  } catch (error) {
    console.error("Error fetching user data:", error);
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, userId, date, ...userData } = body;

    if (!email && !userId) {
      return NextResponse.json(
        { error: "Email or userId is required" },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    // Update or create user data for the specific date
    const query: QueryFilter = { date };
    if (email) query.email = email;
    if (userId) query.userId = userId;

    const updatedData = await UserData.findOneAndUpdate(
      query,
      { ...userData, email, userId, date, updatedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ success: true, data: updatedData });
  } catch (error) {
    console.error("Error saving user data:", error);
    return NextResponse.json(
      { error: "Failed to save user data" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  return POST(request); // Alias PUT to POST for convenience
}

export async function DELETE(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const date = searchParams.get("date");
    const userId = searchParams.get("userId");

    if (!email && !userId) {
      return NextResponse.json(
        { error: "Email or userId is required" },
        { status: 400 }
      );
    }

    const query: QueryFilter = {};
    if (email) query.email = email;
    if (userId) query.userId = userId;
    if (date) query.date = date;

    const result = await UserData.deleteMany(query);

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("Error deleting user data:", error);
    return NextResponse.json(
      { error: "Failed to delete user data" },
      { status: 500 }
    );
  }
}
