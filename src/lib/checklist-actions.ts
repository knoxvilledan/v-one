import { revalidatePath } from "next/cache";
import { DayEntry } from "../models/DayEntry";
import { connectMongoose } from "./db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";

export interface ChecklistItem {
  itemId: string;
  text: string;
  order: number;
  isCustom?: boolean;
}

export interface ChecklistData {
  checklistId: string;
  title: string;
  items: ChecklistItem[];
  itemsOrder: string[];
  order: number;
  isCustom?: boolean;
}

/**
 * Server action to complete a checklist item for today
 */
export async function completeChecklistItem(
  checklistId: string,
  itemId: string,
  itemText: string,
  targetDate?: string
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new Error("Not authenticated");
    }

    await connectMongoose();

    const date = targetDate || new Date().toISOString().split("T")[0];
    const completedAt = new Date();

    // Find existing day entry or create new one
    let dayEntry = await DayEntry.findOne({
      email: session.user.email,
      date,
    });

    if (!dayEntry) {
      // Create new day entry
      dayEntry = new DayEntry({
        userId: session.user.id || "temp-id", // Will be updated when we have proper user ID
        email: session.user.email,
        date,
        timeBlockCompletions: [],
        checklistCompletions: [],
      });
    }

    // Find existing checklist completion or create new one
    let checklistCompletion = dayEntry.checklistCompletions.find(
      (c: { checklistId: string }) => c.checklistId === checklistId
    );

    if (!checklistCompletion) {
      // Create new checklist completion
      checklistCompletion = {
        checklistId,
        title: "", // Will be updated by the component
        completedItemIds: [],
        completedAt,
        completedItems: [],
      };
      dayEntry.checklistCompletions.push(checklistCompletion);
    }

    // Add the item if not already completed
    if (!checklistCompletion.completedItemIds.includes(itemId)) {
      checklistCompletion.completedItemIds.push(itemId);
      checklistCompletion.completedItems.push({
        itemId,
        text: itemText,
        completedAt,
      });
      checklistCompletion.completedAt = completedAt;
    }

    await dayEntry.save();

    // Revalidate the current page to show updated state
    revalidatePath("/");
    revalidatePath("/admin");

    return { success: true };
  } catch (error) {
    console.error("Error completing checklist item:", error);
    throw error;
  }
}

/**
 * Server action to uncomplete a checklist item for today
 */
export async function uncompleteChecklistItem(
  checklistId: string,
  itemId: string,
  targetDate?: string
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new Error("Not authenticated");
    }

    await connectMongoose();

    const date = targetDate || new Date().toISOString().split("T")[0];

    // Find existing day entry
    const dayEntry = await DayEntry.findOne({
      email: session.user.email,
      date,
    });

    if (!dayEntry) {
      return { success: true }; // Nothing to uncomplete
    }

    // Find checklist completion
    const checklistCompletion = dayEntry.checklistCompletions.find(
      (c: { checklistId: string }) => c.checklistId === checklistId
    );

    if (checklistCompletion) {
      // Remove the item from completed lists
      checklistCompletion.completedItemIds =
        checklistCompletion.completedItemIds.filter(
          (id: string) => id !== itemId
        );
      checklistCompletion.completedItems =
        checklistCompletion.completedItems.filter(
          (item: { itemId: string }) => item.itemId !== itemId
        );

      // Update completion timestamp
      if (checklistCompletion.completedItemIds.length > 0) {
        checklistCompletion.completedAt = new Date();
      }

      await dayEntry.save();
    }

    // Revalidate the current page to show updated state
    revalidatePath("/");
    revalidatePath("/admin");

    return { success: true };
  } catch (error) {
    console.error("Error uncompleting checklist item:", error);
    throw error;
  }
}

/**
 * Server action to add notes to a checklist completion
 */
export async function addChecklistNotes(
  checklistId: string,
  notes: string,
  targetDate?: string
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      throw new Error("Not authenticated");
    }

    await connectMongoose();

    const date = targetDate || new Date().toISOString().split("T")[0];

    // Find existing day entry
    const dayEntry = await DayEntry.findOne({
      email: session.user.email,
      date,
    });

    if (!dayEntry) {
      throw new Error("No day entry found for this date");
    }

    // Find checklist completion
    const checklistCompletion = dayEntry.checklistCompletions.find(
      (c: { checklistId: string }) => c.checklistId === checklistId
    );

    if (!checklistCompletion) {
      throw new Error("No checklist completion found");
    }

    // Update notes
    checklistCompletion.notes = notes.trim();
    await dayEntry.save();

    // Revalidate the current page to show updated state
    revalidatePath("/");
    revalidatePath("/admin");

    return { success: true };
  } catch (error) {
    console.error("Error adding checklist notes:", error);
    throw error;
  }
}
