// Server Actions for daily page mutations
"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { connectDB } from "../../lib/database";
import { ChecklistItem, Block } from "../../types";

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
  const session = await getServerSession();
  if (!session?.user?.email) {
    redirect("/auth/signin");
  }

  try {
    await connectDB();
    const { UserData } = await import("../../lib/database");

    // Find the user's day entry
    const dayEntry = await UserData.findOne({
      userId: session.user.email,
      date: date,
    });

    if (!dayEntry) {
      // Create new day entry if it doesn't exist
      const newEntry = new UserData({
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

    // Update in database
    await UserData.updateOne(
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
  const session = await getServerSession();
  if (!session?.user?.email) {
    redirect("/auth/signin");
  }

  try {
    await connectDB();
    const { UserData } = await import("../../lib/database");

    // Find the user's day entry
    const dayEntry = await UserData.findOne({
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

      const newEntry = new UserData({
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
    await UserData.updateOne(
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

  if (!wakeTime || !date) {
    return; // Don't update if no wake time or date provided
  }

  try {
    await connectDB();
    const { UserData } = await import("../../lib/database");

    // Upsert the wake time for this date
    await UserData.updateOne(
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

  if (!note.trim()) {
    return; // Don't add empty notes
  }

  try {
    await connectDB();
    const { UserData } = await import("../../lib/database");

    // Find the user's day entry
    const dayEntry = await UserData.findOne({
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
    await UserData.updateOne(
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
  const session = await getServerSession();
  if (!session?.user?.email) {
    redirect("/auth/signin");
  }

  if (!text.trim()) {
    return; // Don't add empty todos
  }

  try {
    await connectDB();
    const { UserData } = await import("../../lib/database");

    const newTodo: ChecklistItem = {
      id: `todo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: text.trim(),
      completed: false,
      category: "todo",
      dueDate: date,
    };

    // Upsert the todo for this date
    await UserData.updateOne(
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
