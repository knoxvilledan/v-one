import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../../lib/auth";
import { ContentService } from "../../../../lib/content-service";
import { connectMongoose } from "../../../../lib/db";
import {
  ContentTemplate,
  type IContentTemplate,
} from "../../../../models/ContentTemplate";
import { getMaxCounts, invalidateConfigCache } from "../../../../lib/config";
import { getTimeBlockTemplateById } from "../../../../lib/id-helpers";

// PATCH /api/timeblocks/templates - Update global time block templates (admin only)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await ContentService.getUserByEmail(session.user.email);

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { targetBlockId, label, targetRole, time } = await request.json();

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

    if (!targetRole || !["public", "admin"].includes(targetRole)) {
      return NextResponse.json(
        { error: "Valid target role is required (public or admin)" },
        { status: 400 }
      );
    }

    // Get the current content template
    await connectMongoose();
    const contentTemplate = await ContentTemplate.findOne({
      userRole: targetRole,
    }).lean<IContentTemplate>();

    if (!contentTemplate) {
      return NextResponse.json(
        { error: "Content template not found" },
        { status: 404 }
      );
    }

    // Update the specific time block in the template
    const timeBlocks = contentTemplate.content.timeBlocks;
    if (!timeBlocks || !Array.isArray(timeBlocks)) {
      return NextResponse.json(
        { error: "No time blocks found in template" },
        { status: 404 }
      );
    }

    const updatedTimeBlocks = [...timeBlocks];

    // Find the block to update by ID
    const blockToUpdate = getTimeBlockTemplateById(
      ((contentTemplate.content as Record<string, unknown>)
        .timeBlocksOrder as string[]) || [],
      updatedTimeBlocks,
      targetBlockId
    );

    if (!blockToUpdate) {
      return NextResponse.json(
        { error: "Block not found in template" },
        { status: 404 }
      );
    }

    // Update the block
    blockToUpdate.label = label.trim();
    if (time) {
      blockToUpdate.time = time;
    }

    // Update the content template
    const updatedContent = {
      ...contentTemplate.content,
      timeBlocks: updatedTimeBlocks,
    };

    const success =
      (
        await ContentTemplate.updateOne(
          { userRole: targetRole },
          { $set: { content: updatedContent, updatedAt: new Date() } }
        )
      ).modifiedCount > 0;

    if (!success) {
      return NextResponse.json(
        { error: "Failed to update template" },
        { status: 500 }
      );
    }

    // Invalidate configuration cache since template was updated
    invalidateConfigCache();

    return NextResponse.json({
      message: "Time block template updated successfully",
      targetBlockId,
      newLabel: label.trim(),
      targetRole,
    });
  } catch (error) {
    console.error("Error updating time block template:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/timeblocks/templates - Get time block templates for a role (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await ContentService.getUserByEmail(session.user.email);

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const targetRole = url.searchParams.get("role") as "public" | "admin";

    if (!targetRole || !["public", "admin"].includes(targetRole)) {
      return NextResponse.json(
        { error: "Valid role parameter is required (public or admin)" },
        { status: 400 }
      );
    }

    // Get the content template for the specified role
    await connectMongoose();
    const contentTemplate = await ContentTemplate.findOne({
      userRole: targetRole,
    }).lean<IContentTemplate>();

    if (!contentTemplate) {
      return NextResponse.json(
        { error: "Content template not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      timeBlocks: contentTemplate.content.timeBlocks,
      role: targetRole,
    });
  } catch (error) {
    console.error("Error getting time block templates:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/timeblocks/templates - Create new time block in template (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await ContentService.getUserByEmail(session.user.email);

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { label, time, targetRole, insertAfterIndex } = await request.json();

    // Validate input
    if (!label || label.trim().length === 0) {
      return NextResponse.json({ error: "Label is required" }, { status: 400 });
    }

    if (!time) {
      return NextResponse.json({ error: "Time is required" }, { status: 400 });
    }

    if (!targetRole || !["public", "admin"].includes(targetRole)) {
      return NextResponse.json(
        { error: "Valid target role is required (public or admin)" },
        { status: 400 }
      );
    }

    // Get the current content template
    await connectMongoose();
    const contentTemplate = await ContentTemplate.findOne({
      userRole: targetRole,
    }).lean<IContentTemplate>();

    if (!contentTemplate) {
      return NextResponse.json(
        { error: "Content template not found" },
        { status: 404 }
      );
    }

    const currentTimeBlocks = contentTemplate.content.timeBlocks;
    if (!currentTimeBlocks || !Array.isArray(currentTimeBlocks)) {
      return NextResponse.json(
        { error: "No time blocks found in template" },
        { status: 404 }
      );
    }

    // Check against dynamic maximum limits
    const maxCounts = getMaxCounts();
    if (currentTimeBlocks.length >= maxCounts.timeBlocks) {
      return NextResponse.json(
        { error: `Maximum of ${maxCounts.timeBlocks} time blocks allowed` },
        { status: 400 }
      );
    }

    // Create new time block
    const newTimeBlock = {
      id: `${targetRole}-t${Date.now()}`,
      time,
      label: label.trim(),
      order: currentTimeBlocks.length + 1,
    };

    // Insert the new block at the specified position
    const updatedTimeBlocks = [...currentTimeBlocks];
    const insertIndex =
      insertAfterIndex !== undefined
        ? insertAfterIndex + 1
        : updatedTimeBlocks.length;
    updatedTimeBlocks.splice(insertIndex, 0, newTimeBlock);

    // Reorder the blocks
    updatedTimeBlocks.forEach((block, index) => {
      block.order = index + 1;
    });

    // Update the content template
    const updatedContent = {
      ...contentTemplate.content,
      timeBlocks: updatedTimeBlocks,
    };

    const success =
      (
        await ContentTemplate.updateOne(
          { userRole: targetRole },
          { $set: { content: updatedContent, updatedAt: new Date() } }
        )
      ).modifiedCount > 0;

    if (!success) {
      return NextResponse.json(
        { error: "Failed to update template" },
        { status: 500 }
      );
    }

    // Invalidate configuration cache since template was updated
    invalidateConfigCache();

    return NextResponse.json({
      message: "Time block added successfully",
      newBlock: newTimeBlock,
      targetRole,
    });
  } catch (error) {
    console.error("Error adding time block to template:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/timeblocks/templates - Remove time block from template (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await ContentService.getUserByEmail(session.user.email);

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { targetBlockId, targetRole } = await request.json();

    // Validate input
    if (!targetBlockId || typeof targetBlockId !== "string") {
      return NextResponse.json(
        { error: "targetBlockId is required and must be a string" },
        { status: 400 }
      );
    }

    if (!targetRole || !["public", "admin"].includes(targetRole)) {
      return NextResponse.json(
        { error: "Valid target role is required (public or admin)" },
        { status: 400 }
      );
    }

    // Get the current content template
    const contentTemplate = await ContentService.getContentTemplateByRole(
      targetRole
    );

    if (!contentTemplate) {
      return NextResponse.json(
        { error: "Content template not found" },
        { status: 404 }
      );
    }

    const currentTimeBlocks = contentTemplate.content.timeBlocks;
    if (!currentTimeBlocks || !Array.isArray(currentTimeBlocks)) {
      return NextResponse.json(
        { error: "No time blocks found in template" },
        { status: 404 }
      );
    }

    // Don't allow deletion if it would leave fewer than 1 block
    if (currentTimeBlocks.length <= 1) {
      return NextResponse.json(
        { error: "Cannot delete the last time block" },
        { status: 400 }
      );
    }

    // Find the block to remove by ID
    const blockToRemove = getTimeBlockTemplateById(
      ((contentTemplate.content as Record<string, unknown>)
        .timeBlocksOrder as string[]) || [],
      currentTimeBlocks,
      targetBlockId
    );

    if (!blockToRemove) {
      return NextResponse.json({ error: "Block not found" }, { status: 404 });
    }

    // Remove the block
    const updatedTimeBlocks = currentTimeBlocks.filter(
      (block) =>
        (((block as unknown as Record<string, unknown>).blockId as string) ||
          ((block as unknown as Record<string, unknown>).id as string)) !==
        targetBlockId
    );

    // Reorder the remaining blocks
    updatedTimeBlocks.forEach((block, index) => {
      block.order = index + 1;
    });

    // Update the order array to remove the deleted block ID
    const updatedOrder = (
      ((contentTemplate.content as unknown as Record<string, unknown>)
        .timeBlocksOrder as string[]) || []
    ).filter((id: string) => id !== targetBlockId);

    // Update the content template
    const updatedContent = {
      ...contentTemplate.content,
      timeBlocks: updatedTimeBlocks,
      timeBlocksOrder: updatedOrder,
    };

    const success = await ContentService.updateContentTemplate(
      targetRole,
      updatedContent
    );

    if (!success) {
      return NextResponse.json(
        { error: "Failed to update template" },
        { status: 500 }
      );
    }

    // Invalidate configuration cache since template was updated
    invalidateConfigCache();

    return NextResponse.json({
      message: "Time block removed successfully",
      targetBlockId,
      targetRole,
    });
  } catch (error) {
    console.error("Error removing time block from template:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
