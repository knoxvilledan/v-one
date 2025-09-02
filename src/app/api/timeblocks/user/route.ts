import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";
import { ContentService } from "../../../../lib/content-service";
import { connectMongoose } from "../../../../lib/db";
import { UserData, type IUserData } from "../../../../models/UserData";
import { getBlockById, validateIdMembership } from "../../../../lib/id-helpers";

// PATCH /api/timeblocks/user - Update user's personal time block labels
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { targetBlockId, label, date } = await request.json();

    // Validate input
    if (!targetBlockId || typeof targetBlockId !== "string") {
      return NextResponse.json(
        { error: "targetBlockId is required and must be a string" },
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

    await connectMongoose();

    // Get existing user data for the date
    const existingData = await UserData.findOne({
      userId: user._id!.toString(),
      date,
    }).lean<IUserData>();

    if (!existingData) {
      return NextResponse.json(
        { error: "No data found for this date" },
        { status: 404 }
      );
    }

    // Update the specific block label
    const updatedBlocks = [...(existingData?.blocks || [])];

    // Validate that the targetBlockId exists in the user's blocks
    const blockToUpdate = getBlockById(
      existingData?.timeBlocksOrder || [],
      updatedBlocks,
      targetBlockId
    );

    if (!blockToUpdate) {
      return NextResponse.json({ error: "Block not found" }, { status: 404 });
    }

    // Update the block label
    blockToUpdate.label = label.trim();

    // Save the updated data
    await UserData.updateOne(
      { userId: user._id!.toString(), date },
      { $set: { blocks: updatedBlocks, updatedAt: new Date() } }
    );

    return NextResponse.json({
      message: "Time block label updated successfully",
      targetBlockId,
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

    await connectMongoose();

    // Get user data for the specific date
    const data = await UserData.findOne({
      userId: user._id!.toString(),
      date,
    }).lean<IUserData>();

    if (!data) {
      return NextResponse.json(
        { error: "No data found for this date" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      blocks: data?.blocks || [],
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
