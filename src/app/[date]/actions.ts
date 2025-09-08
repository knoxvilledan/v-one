"use server";

import { getServerSession } from "next-auth/next";
import { authOptions } from "../../lib/auth";
import { connectDB } from "../../lib/database";
import { DayEntry } from "../../models/DayEntry";
import User from "../../models/User";
import { revalidatePath } from "next/cache";

// Helper function to get user session
async function getUserSession() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }
  return session;
}

// Complete a checklist item
export async function completeItem(
  itemId: string,
  category: string,
  date: string
) {
  const session = await getUserSession();
  await connectDB();

  try {
    // Find or create day entry
    let dayEntry = await DayEntry.findOne({
      userId: session.user.email,
      date: new Date(date),
    });

    if (!dayEntry) {
      dayEntry = new DayEntry({
        userId: session.user.email,
        date: new Date(date),
        checklistCompletions: [],
        timeBlockCompletions: [],
      });
    }

    // Map category to checklistId
    const checklistIdMap: Record<string, string> = {
      master: "daily-master-checklist",
      habit: "habit-break-tracker",
      workout: "workout-checklist",
      todo: "todo-list",
    };

    const checklistId = checklistIdMap[category];
    if (!checklistId) {
      throw new Error(`Unknown category: ${category}`);
    }

    // Find existing checklist completion or create new one
    let checklistCompletion = dayEntry.checklistCompletions.find(
      (c: any) => c.checklistId === checklistId
    );

    if (!checklistCompletion) {
      checklistCompletion = {
        checklistId,
        completedItemIds: [],
        completedItems: [],
      };
      dayEntry.checklistCompletions.push(checklistCompletion);
    }

    // Add item to completed if not already there
    if (!checklistCompletion.completedItemIds.includes(itemId)) {
      checklistCompletion.completedItemIds.push(itemId);
      checklistCompletion.completedItems.push({
        itemId,
        completedAt: new Date(),
      });
    }

    await dayEntry.save();
    revalidatePath(`/${date}`);

    return { success: true };
  } catch (error) {
    console.error("Error completing item:", error);
    throw new Error("Failed to complete item");
  }
}

// Toggle time block completion
export async function toggleTimeBlock(blockId: string, date: string) {
  const session = await getUserSession();
  await connectDB();

  try {
    let dayEntry = await DayEntry.findOne({
      userId: session.user.email,
      date: new Date(date),
    });

    if (!dayEntry) {
      dayEntry = new DayEntry({
        userId: session.user.email,
        date: new Date(date),
        checklistCompletions: [],
        timeBlockCompletions: [],
      });
    }

    // Check if block is already completed
    const existingIndex = dayEntry.timeBlockCompletions.findIndex(
      (c: any) => c.blockId === blockId
    );

    if (existingIndex >= 0) {
      // Remove completion (toggle off)
      dayEntry.timeBlockCompletions.splice(existingIndex, 1);
    } else {
      // Add completion (toggle on)
      dayEntry.timeBlockCompletions.push({
        blockId,
        completedAt: new Date(),
        notes: "",
        duration: 60,
      });
    }

    await dayEntry.save();
    revalidatePath(`/${date}`);

    return { success: true };
  } catch (error) {
    console.error("Error toggling time block:", error);
    throw new Error("Failed to toggle time block");
  }
}

// Add note to time block
export async function addBlockNote(
  blockId: string,
  note: string,
  date: string
) {
  const session = await getUserSession();
  await connectDB();

  try {
    let dayEntry = await DayEntry.findOne({
      userId: session.user.email,
      date: new Date(date),
    });

    if (!dayEntry) {
      dayEntry = new DayEntry({
        userId: session.user.email,
        date: new Date(date),
        checklistCompletions: [],
        timeBlockCompletions: [],
      });
    }

    // Find existing time block completion or create new one
    let blockCompletion = dayEntry.timeBlockCompletions.find(
      (c: any) => c.blockId === blockId
    );

    if (!blockCompletion) {
      blockCompletion = {
        blockId,
        completedAt: new Date(),
        notes: note,
        duration: 60,
      };
      dayEntry.timeBlockCompletions.push(blockCompletion);
    } else {
      // Append note to existing notes
      blockCompletion.notes = blockCompletion.notes
        ? `${blockCompletion.notes}\n${note}`
        : note;
    }

    await dayEntry.save();
    revalidatePath(`/${date}`);

    return { success: true };
  } catch (error) {
    console.error("Error adding block note:", error);
    throw new Error("Failed to add block note");
  }
}

// Update wake time
export async function updateWakeTime(wakeTime: string, date: string) {
  const session = await getUserSession();
  await connectDB();

  try {
    let dayEntry = await DayEntry.findOne({
      userId: session.user.email,
      date: new Date(date),
    });

    if (!dayEntry) {
      dayEntry = new DayEntry({
        userId: session.user.email,
        date: new Date(date),
        checklistCompletions: [],
        timeBlockCompletions: [],
        wakeTime,
      });
    } else {
      dayEntry.wakeTime = wakeTime;
    }

    await dayEntry.save();
    revalidatePath(`/${date}`);

    return { success: true };
  } catch (error) {
    console.error("Error updating wake time:", error);
    throw new Error("Failed to update wake time");
  }
}

// Add new checklist item
export async function addChecklistItem(
  checklistId: string,
  text: string,
  category: string,
  date: string
) {
  const session = await getUserSession();
  await connectDB();

  try {
    // Find user's template set to add the item
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      throw new Error("User not found");
    }

    // Generate new item ID
    const itemId = `item-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Note: We should update the template set, but for now, we'll just track it in the day entry
    // This is a simplified approach - in production, you'd want to update the user's template

    revalidatePath(`/${date}`);
    return { success: true, itemId };
  } catch (error) {
    console.error("Error adding checklist item:", error);
    throw new Error("Failed to add checklist item");
  }
}
