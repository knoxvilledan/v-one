import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";
import { ContentService } from "../../../../lib/content-service";
import dbConnect from "../../../../lib/dbConnect";
import { UserData, type IUserData } from "../../../../models/UserData";
import type {
  TimeBlockTemplate,
  ChecklistTemplate,
} from "../../../../types/content";

// PATCH /api/timeblocks/bulk - Bulk update multiple time block labels for a user
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { updates, date } = await request.json();

    // Validate input
    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json(
        { error: "Updates array is required" },
        { status: 400 }
      );
    }

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    // Validate each update
    for (const update of updates) {
      if (
        update.blockIndex === undefined ||
        update.blockIndex < 1 ||
        update.blockIndex > 18
      ) {
        return NextResponse.json(
          { error: "All block indices must be between 1 and 18" },
          { status: 400 }
        );
      }

      if (!update.label || update.label.trim().length === 0) {
        return NextResponse.json(
          { error: "All labels are required" },
          { status: 400 }
        );
      }
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

    await dbConnect();

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

    // Apply all updates
    const updatedBlocks = [...(existingData?.blocks || [])];
    const appliedUpdates = [];

    for (const update of updates) {
      if (updatedBlocks[update.blockIndex]) {
        updatedBlocks[update.blockIndex].label = update.label.trim();
        appliedUpdates.push({
          blockIndex: update.blockIndex,
          newLabel: update.label.trim(),
        });
      }
    }

    // Save the updated data
    await UserData.updateOne(
      { userId: user._id!.toString(), date },
      {
        $set: {
          blocks: updatedBlocks,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      message: `${appliedUpdates.length} time block labels updated successfully`,
      updates: appliedUpdates,
    });
  } catch (error) {
    console.error("Error bulk updating time block labels:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/timeblocks/bulk - Bulk create user data from template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { date, useTemplate } = await request.json();

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

    await dbConnect();

    // Check if data already exists for this date
    const existingData = await UserData.findOne({
      userId: user._id!.toString(),
      date,
    }).lean<IUserData>();

    if (existingData) {
      return NextResponse.json(
        { error: "Data already exists for this date" },
        { status: 400 }
      );
    }

    // Get template data based on user role (or specified template)
    const templateRole = useTemplate || user.role;
    const contentTemplate = await ContentService.getContentTemplateByRole(
      templateRole
    );

    if (!contentTemplate) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Create blocks from template
    const blocks =
      contentTemplate.content.timeBlocks?.map(
        (tb: TimeBlockTemplate, index: number) => ({
          time: tb.time,
          label: tb.label,
          notes: [],
          complete: false,
          duration: tb.duration || 60,
          index: index,
        })
      ) || [];

    // Create checklists from template
    const masterChecklist =
      contentTemplate.content.masterChecklist?.map((mc: ChecklistTemplate) => ({
        id: mc.id,
        text: mc.text,
        completed: false,
        category: mc.category,
      })) || [];

    const habitBreakChecklist =
      contentTemplate.content.habitBreakChecklist?.map(
        (hb: ChecklistTemplate) => ({
          id: hb.id,
          text: hb.text,
          completed: false,
          category: hb.category,
        })
      ) || [];

    // Create the day data
    const dayData = {
      date,
      wakeTime: "",
      blocks,
      masterChecklist,
      habitBreakChecklist,
      todoList: [],
      score: 0,
      userId: user._id!.toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert the new data
    await UserData.create(dayData);

    return NextResponse.json({
      message: "Day data created from template successfully",
      date,
      blocksCreated: blocks.length,
      template: templateRole,
    });
  } catch (error) {
    console.error("Error creating day data from template:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
