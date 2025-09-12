// Server Actions for daily page mutations
"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { connectDB } from "../../lib/database";
import { generateOptimizedId } from "../../lib/id-generation";
import { ChecklistItem, Block } from "../../types";

// Validation helpers
function isValidDate(date: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return false;

  const parsedDate = new Date(date);
  return parsedDate instanceof Date && !isNaN(parsedDate.getTime());
}

function isValidItemId(id: string): boolean {
  return typeof id === "string" && id.length > 0 && id.length < 100;
}

function sanitizeText(text: string, maxLength: number = 500): string {
  return text.trim().substring(0, maxLength);
}

/**
 * Toggle completion status of a checklist item
 */
export async function toggleChecklistItem(
  date: string,
  itemId: string,
  listType:
    | "masterChecklist"
    | "habitBreakChecklist"
    | "workoutChecklist"
    | "todoList"
) {
  // Validate inputs
  if (!isValidDate(date)) {
    throw new Error("Invalid date format");
  }

  if (!isValidItemId(itemId)) {
    throw new Error("Invalid item ID");
  }

  const session = await getServerSession();
  if (!session?.user?.email) {
    redirect("/auth/signin");
  }

  try {
    await connectDB();
    const { DayEntry } = await import("../../lib/database");

    // Find the user's day entry
    const dayEntry = await DayEntry.findOne({
      userId: session.user.email,
      date: date,
    });

    if (!dayEntry) {
      // Create new day entry if it doesn't exist
      const newEntry = new DayEntry({
        userId: session.user.email,
        date: date,
        [listType]: [],
      });
      await newEntry.save();
      revalidatePath(`/${date}`);
      return;
    }

    // Get the current list
    const currentList = dayEntry[listType] || [];

    // Find and toggle the item
    const itemIndex = currentList.findIndex(
      (item: ChecklistItem) => item.id === itemId
    );

    if (itemIndex !== -1) {
      const item = currentList[itemIndex];
      const now = new Date();

      currentList[itemIndex] = {
        ...item,
        completed: !item.completed,
        completedAt: !item.completed ? now : undefined,
      };
    }

    // Update in database using modern DayEntry
    await DayEntry.updateOne(
      { userId: session.user.email, date: date },
      { [listType]: currentList }
    );

    // Revalidate the page to show updated data
    revalidatePath(`/${date}`);
  } catch (error) {
    console.error("Error toggling checklist item:", error);
    throw new Error("Failed to update item");
  }
}

/**
 * Toggle completion status of a time block
 */
export async function toggleTimeBlock(date: string, blockId: string) {
  // Validate inputs
  if (!isValidDate(date)) {
    throw new Error("Invalid date format");
  }

  if (!isValidItemId(blockId)) {
    throw new Error("Invalid block ID");
  }

  const session = await getServerSession();
  if (!session?.user?.email) {
    redirect("/auth/signin");
  }

  try {
    await connectDB();
    const { DayEntry } = await import("../../lib/database");

    // Find the user's day entry
    const dayEntry = await DayEntry.findOne({
      userId: session.user.email,
      date: date,
    });

    if (!dayEntry) {
      // Create new day entry if it doesn't exist
      const { generateTimeBlocks } = await import(
        "../../lib/time-block-calculator"
      );
      const defaultTimeBlocks = generateTimeBlocks();
      const defaultBlocks = defaultTimeBlocks.map((config) => ({
        id: `block-${config.index}`,
        time: config.timeLabel,
        label: `Block ${config.index + 1}`,
        notes: [],
        complete: false,
        duration: 60,
        index: config.index,
      }));

      const newEntry = new DayEntry({
        userId: session.user.email,
        date: date,
        blocks: defaultBlocks,
      });
      await newEntry.save();
      revalidatePath(`/${date}`);
      return;
    }

    // Get current blocks
    const currentBlocks = dayEntry.blocks || [];

    // Find and toggle the block
    const blockIndex = currentBlocks.findIndex(
      (block: Block) => block.id === blockId
    );

    if (blockIndex !== -1) {
      currentBlocks[blockIndex] = {
        ...currentBlocks[blockIndex],
        complete: !currentBlocks[blockIndex].complete,
      };
    }

    // Update in database
    await DayEntry.updateOne(
      { userId: session.user.email, date: date },
      { blocks: currentBlocks }
    );

    // Revalidate the page to show updated data
    revalidatePath(`/${date}`);
  } catch (error) {
    console.error("Error toggling time block:", error);
    throw new Error("Failed to update time block");
  }
}

/**
 * Update wake time for a specific date
 */
export async function updateWakeTimeAction(formData: FormData) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    redirect("/auth/signin");
  }

  const wakeTime = formData.get("wakeTime") as string;
  const date = formData.get("date") as string;

  // Validate inputs
  if (!date || !isValidDate(date)) {
    throw new Error("Invalid date format");
  }

  if (!wakeTime || typeof wakeTime !== "string") {
    throw new Error("Invalid wake time");
  }

  // Validate time format (HH:MM)
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (!timeRegex.test(wakeTime)) {
    throw new Error("Invalid time format");
  }
  try {
    await connectDB();
    const { DayEntry } = await import("../../lib/database");

    // Upsert the wake time for this date
    await DayEntry.updateOne(
      { userId: session.user.email, date: date },
      {
        wakeTime: wakeTime,
        dailyWakeTime: wakeTime,
      },
      { upsert: true }
    );

    // Revalidate the page to show updated data
    revalidatePath(`/${date}`);
  } catch (error) {
    console.error("Error updating wake time:", error);
    throw new Error("Failed to update wake time");
  }
}
/**
 * Add a note to a time block
 */
export async function addBlockNote(
  date: string,
  blockId: string,
  note: string
) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    redirect("/auth/signin");
  }

  // Validate inputs
  if (!isValidDate(date)) {
    throw new Error("Invalid date format");
  }

  if (!isValidItemId(blockId)) {
    throw new Error("Invalid block ID");
  }

  const sanitizedNote = sanitizeText(note, 200);
  if (!sanitizedNote) {
    return; // Don't add empty notes
  }

  try {
    await connectDB();
    const { DayEntry } = await import("../../lib/database");

    // Find the user's day entry
    const dayEntry = await DayEntry.findOne({
      userId: session.user.email,
      date: date,
    });

    if (!dayEntry) {
      throw new Error("Day entry not found");
    }

    // Get current blocks
    const currentBlocks = dayEntry.blocks || [];

    // Find the block and add note
    const blockIndex = currentBlocks.findIndex(
      (block: Block) => block.id === blockId
    );

    if (blockIndex !== -1) {
      const existingNotes = currentBlocks[blockIndex].notes || [];
      currentBlocks[blockIndex] = {
        ...currentBlocks[blockIndex],
        notes: [...existingNotes, note.trim()],
      };
    }

    // Update in database
    await DayEntry.updateOne(
      { userId: session.user.email, date: date },
      { blocks: currentBlocks }
    );

    // Revalidate the page to show updated data
    revalidatePath(`/${date}`);
  } catch (error) {
    console.error("Error adding block note:", error);
    throw new Error("Failed to add note");
  }
}

/**
 * Add a new todo item
 */
export async function addTodoItem(date: string, text: string) {
  // Validate inputs
  if (!isValidDate(date)) {
    throw new Error("Invalid date format");
  }

  const sanitizedText = sanitizeText(text, 200);
  if (!sanitizedText) {
    return; // Don't add empty todos
  }

  const session = await getServerSession();
  if (!session?.user?.email) {
    redirect("/auth/signin");
  }

  try {
    await connectDB();
    const { DayEntry } = await import("../../lib/database");

    const existingTodos = (await DayEntry.findOne({
      userId: session.user.email,
      date,
    }).select("todoList")) || { todoList: [] };
    const existingIds =
      existingTodos.todoList?.map((t: ChecklistItem) => t.id) || [];

    const newTodo: ChecklistItem = {
      id: generateOptimizedId.todo(existingIds, existingIds.length),
      itemId: `todo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Temporary until proper itemId system
      text: text.trim(),
      completed: false,
      category: "todo",
      dueDate: date,
    };

    // Upsert the todo for this date
    await DayEntry.updateOne(
      { userId: session.user.email, date: date },
      {
        $push: { todoList: newTodo },
      },
      { upsert: true }
    );

    // Revalidate the page to show updated data
    revalidatePath(`/${date}`);
  } catch (error) {
    console.error("Error adding todo item:", error);
    throw new Error("Failed to add todo");
  }
}
