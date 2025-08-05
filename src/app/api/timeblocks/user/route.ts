import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";
import { ContentService } from "../../../../lib/content-service";
import clientPromise from "../../../../lib/mongodb";

// PATCH /api/timeblocks/user - Update user's personal time block labels
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { blockIndex, label, date } = await request.json();

    // Validate input
    if (blockIndex === undefined || blockIndex < 0 || blockIndex > 15) {
      return NextResponse.json(
        { error: "Block index must be between 0 and 15" },
        { status: 400 }
      );
    }

    if (!label || label.trim().length === 0) {
      return NextResponse.json({ error: "Label is required" }, { status: 400 });
    }

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    // Get or create user
    let user = await ContentService.getUserByEmail(session.user.email);
    if (!user) {
      user = await ContentService.createUser(
        session.user.email,
        session.user.name || undefined,
        "public"
      );
    }

    const client = await clientPromise;
    const userData = client.db().collection("user_data");

    // Get existing user data for the date
    const existingData = await userData.findOne({
      userId: user._id!.toString(),
      date,
    });

    if (!existingData) {
      return NextResponse.json(
        { error: "No data found for this date" },
        { status: 404 }
      );
    }

    // Update the specific block label
    const updatedBlocks = [...existingData.blocks];
    if (updatedBlocks[blockIndex]) {
      updatedBlocks[blockIndex].label = label.trim();
    } else {
      return NextResponse.json({ error: "Block not found" }, { status: 404 });
    }

    // Save the updated data
    await userData.updateOne(
      { userId: user._id!.toString(), date },
      {
        $set: {
          blocks: updatedBlocks,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      message: "Time block label updated successfully",
      blockIndex,
      newLabel: label.trim(),
    });
  } catch (error) {
    console.error("Error updating time block label:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/timeblocks/user - Get user's time blocks for a specific date
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const url = new URL(request.url);
    const date = url.searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { error: "Date parameter is required" },
        { status: 400 }
      );
    }

    // Get or create user
    let user = await ContentService.getUserByEmail(session.user.email);
    if (!user) {
      user = await ContentService.createUser(
        session.user.email,
        session.user.name || undefined,
        "public"
      );
    }

    const client = await clientPromise;
    const userData = client.db().collection("user_data");

    // Get user data for the specific date
    const data = await userData.findOne({
      userId: user._id!.toString(),
      date,
    });

    if (!data) {
      return NextResponse.json(
        { error: "No data found for this date" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      blocks: data.blocks,
      date,
    });
  } catch (error) {
    console.error("Error getting time blocks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
