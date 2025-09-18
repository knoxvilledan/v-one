"use server";

import { UserData } from "../models/UserData";
import { connectMongoose } from "./db";
import { revalidatePath } from "next/cache";
import { Block, ChecklistItem } from "../types";
import { IUserData } from "../models/UserData";

// Types for server action responses
type ActionResult<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Helper function to get current date in YYYY-MM-DD format
function getCurrentDate(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Get user data for a specific date
 * This replaces ApiService.getUserData to unify data loading
 * Enhanced to inherit checklist items from previous days
 */
export async function getUserDataByDate(
  email: string,
  date: string
): Promise<
  ActionResult<{
    wakeTime: string;
    blocks: Block[];
    masterChecklist: ChecklistItem[];
    habitBreakChecklist: ChecklistItem[];
    workoutChecklist: ChecklistItem[];
    todoList: ChecklistItem[];
    dailyWakeTime: string;
    userTimezone: string;
  }>
> {
  try {
    console.log(`\n🔍 getUserDataByDate called for ${email} on ${date}`);
    await connectMongoose();

    // Find user data for the specific date
    let userData = await UserData.findOne({ userId: email, date });
    console.log(`📊 Found existing data for ${date}:`, userData ? "YES" : "NO");

    if (!userData) {
      console.log(
        `🔄 No data for ${date}, looking for previous data to inherit...`
      );
      // No data for this date - look for the most recent previous data to inherit checklist items
      const previousUserData = await UserData.findOne(
        { userId: email, date: { $lt: date } },
        {},
        { sort: { date: -1 } }
      );
      console.log(
        `📅 Previous data found:`,
        previousUserData
          ? `${previousUserData.date} with ${
              previousUserData.masterChecklist?.length || 0
            } master items, ${
              previousUserData.habitBreakChecklist?.length || 0
            } habit items, ${
              previousUserData.workoutChecklist?.length || 0
            } workout items`
          : "NONE"
      );

      // Create default user data for this date with inheritance
      userData = await createInheritedUserData(email, date, previousUserData);
    } else {
      // Data exists - check if we need to re-inherit from more recent source data
      console.log(`🔍 Checking if re-inheritance needed for ${date}...`);

      // Find the most recent previous data for comparison
      const latestPreviousData = await UserData.findOne(
        { userId: email, date: { $lt: date } },
        {},
        { sort: { date: -1 } }
      );

      if (latestPreviousData && shouldReInherit(userData, latestPreviousData)) {
        console.log(
          `🔄 Re-inheritance needed! Latest source: ${latestPreviousData.date}`
        );
        console.log(
          `   Current data has: Master=${
            userData.masterChecklist?.length || 0
          }, Habit=${userData.habitBreakChecklist?.length || 0}, Workout=${
            userData.workoutChecklist?.length || 0
          }`
        );
        console.log(
          `   Source data has: Master=${
            latestPreviousData.masterChecklist?.length || 0
          }, Habit=${
            latestPreviousData.habitBreakChecklist?.length || 0
          }, Workout=${latestPreviousData.workoutChecklist?.length || 0}`
        );

        // Re-inherit while preserving completion status and time blocks
        await updateInheritance(userData, latestPreviousData);
        await userData.save();
        console.log(`✨ Re-inheritance completed for ${date}`);
      } else {
        console.log(`✅ No re-inheritance needed for ${date}`);
      }
    }

    // Convert to plain objects to avoid serialization issues
    const result = {
      wakeTime: userData.wakeTime || "04:00",
      blocks:
        userData.blocks?.map((block: Block) => ({
          id: block.id || `block-${block.index || 0}`,
          time: block.time || "",
          label: block.label || "",
          notes: block.notes || [],
          complete: block.complete || false,
          duration: block.duration || 60,
          index: block.index || 0,
        })) || [],
      masterChecklist:
        userData.masterChecklist?.map((item: ChecklistItem) => ({
          id: item.id,
          text: item.text,
          completed: item.completed || false,
          completedAt: item.completedAt,
          category: item.category as ChecklistItem["category"],
          targetBlock: item.targetBlock,
          completionTimezone: item.completionTimezone,
          timezoneOffset: item.timezoneOffset,
        })) || [],
      habitBreakChecklist:
        userData.habitBreakChecklist?.map((item: ChecklistItem) => ({
          id: item.id,
          text: item.text,
          completed: item.completed || false,
          completedAt: item.completedAt,
          category: item.category as ChecklistItem["category"],
          targetBlock: item.targetBlock,
          completionTimezone: item.completionTimezone,
          timezoneOffset: item.timezoneOffset,
        })) || [],
      workoutChecklist:
        userData.workoutChecklist?.map((item: ChecklistItem) => ({
          id: item.id,
          text: item.text,
          completed: item.completed || false,
          completedAt: item.completedAt,
          category: item.category as ChecklistItem["category"],
          targetBlock: item.targetBlock,
          completionTimezone: item.completionTimezone,
          timezoneOffset: item.timezoneOffset,
        })) || [],
      todoList:
        userData.todoList?.map((item: ChecklistItem) => ({
          id: item.id,
          text: item.text,
          completed: item.completed || false,
          completedAt: item.completedAt,
          category: item.category as ChecklistItem["category"],
          dueDate: item.dueDate,
          targetBlock: item.targetBlock,
          completionTimezone: item.completionTimezone,
          timezoneOffset: item.timezoneOffset,
        })) || [],
      dailyWakeTime: userData.dailyWakeTime || userData.wakeTime || "04:00",
      userTimezone:
        userData.userTimezone ||
        Intl.DateTimeFormat().resolvedOptions().timeZone,
    };

    console.log(`🎯 Returning data for ${date}:`, {
      masterChecklist: result.masterChecklist.length,
      habitBreakChecklist: result.habitBreakChecklist.length,
      workoutChecklist: result.workoutChecklist.length,
      todoList: result.todoList.length,
      masterItems: result.masterChecklist.map(
        (item: ChecklistItem) => item.text
      ),
      habitItems: result.habitBreakChecklist.map(
        (item: ChecklistItem) => item.text
      ),
      workoutItems: result.workoutChecklist.map(
        (item: ChecklistItem) => item.text
      ),
    });

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("getUserDataByDate error:", error);
    return {
      success: false,
      error: `Failed to get user data: ${error}`,
    };
  }
}

/**
 * Create a new master checklist item
 * This preserves your existing server action functionality
 */
export async function createMasterChecklistItem(
  email: string,
  text: string,
  category: ChecklistItem["category"],
  date?: string
): Promise<ActionResult<ChecklistItem>> {
  try {
    await connectMongoose();
    const targetDate = date || getCurrentDate();

    let userData = await UserData.findOne({ userId: email, date: targetDate });

    if (!userData) {
      // Create new user data if it doesn't exist
      userData = new UserData({
        userId: email,
        date: targetDate,
        displayDate: new Date(targetDate).toLocaleDateString(),
        wakeTime: "04:00",
        userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        blocks: [],
        masterChecklist: [],
        habitBreakChecklist: [],
        workoutChecklist: [],
        todoList: [],
        score: 0,
      });
    }

    // Create new checklist item
    const newItem: ChecklistItem = {
      id: `master-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text,
      category,
      completed: false,
    };

    userData.masterChecklist.push(newItem);
    await userData.save();

    // Revalidate the specific date page
    revalidatePath(`/${targetDate}`, "page");

    return {
      success: true,
      data: newItem,
    };
  } catch (error) {
    console.error("createMasterChecklistItem error:", error);
    return {
      success: false,
      error: `Failed to create master checklist item: ${error}`,
    };
  }
}

/**
 * Create a new habit break checklist item
 */
export async function createHabitChecklistItem(
  email: string,
  text: string,
  category: ChecklistItem["category"],
  date?: string
): Promise<ActionResult<ChecklistItem>> {
  try {
    await connectMongoose();
    const targetDate = date || getCurrentDate();

    let userData = await UserData.findOne({ userId: email, date: targetDate });

    if (!userData) {
      userData = new UserData({
        userId: email,
        date: targetDate,
        displayDate: new Date(targetDate).toLocaleDateString(),
        wakeTime: "04:00",
        userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        blocks: [],
        masterChecklist: [],
        habitBreakChecklist: [],
        workoutChecklist: [],
        todoList: [],
        score: 0,
      });
    }

    const newItem: ChecklistItem = {
      id: `habit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text,
      category,
      completed: false,
    };

    userData.habitBreakChecklist.push(newItem);
    await userData.save();

    revalidatePath(`/${targetDate}`, "page");

    return {
      success: true,
      data: newItem,
    };
  } catch (error) {
    console.error("createHabitChecklistItem error:", error);
    return {
      success: false,
      error: `Failed to create habit checklist item: ${error}`,
    };
  }
}

/**
 * Create a new workout checklist item
 */
export async function createWorkoutChecklistItem(
  email: string,
  text: string,
  category: ChecklistItem["category"],
  date?: string
): Promise<ActionResult<ChecklistItem>> {
  try {
    await connectMongoose();
    const targetDate = date || getCurrentDate();

    let userData = await UserData.findOne({ userId: email, date: targetDate });

    if (!userData) {
      userData = new UserData({
        userId: email,
        date: targetDate,
        displayDate: new Date(targetDate).toLocaleDateString(),
        wakeTime: "04:00",
        userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        blocks: [],
        masterChecklist: [],
        habitBreakChecklist: [],
        workoutChecklist: [],
        todoList: [],
        score: 0,
      });
    }

    const newItem: ChecklistItem = {
      id: `workout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text,
      category,
      completed: false,
    };

    userData.workoutChecklist.push(newItem);
    await userData.save();

    revalidatePath(`/${targetDate}`, "page");

    return {
      success: true,
      data: newItem,
    };
  } catch (error) {
    console.error("createWorkoutChecklistItem error:", error);
    return {
      success: false,
      error: `Failed to create workout checklist item: ${error}`,
    };
  }
}

/**
 * Create a new todo item
 */
export async function createTodoItem(
  email: string,
  text: string,
  category: ChecklistItem["category"],
  dueDate?: string,
  date?: string
): Promise<ActionResult<ChecklistItem>> {
  try {
    await connectMongoose();
    const targetDate = date || getCurrentDate();

    let userData = await UserData.findOne({ userId: email, date: targetDate });

    if (!userData) {
      userData = new UserData({
        userId: email,
        date: targetDate,
        displayDate: new Date(targetDate).toLocaleDateString(),
        wakeTime: "04:00",
        userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        blocks: [],
        masterChecklist: [],
        habitBreakChecklist: [],
        workoutChecklist: [],
        todoList: [],
        score: 0,
      });
    }

    const newItem: ChecklistItem = {
      id: `todo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text,
      category,
      completed: false,
      dueDate: dueDate || targetDate,
    };

    userData.todoList.push(newItem);
    await userData.save();

    revalidatePath(`/${targetDate}`, "page");

    return {
      success: true,
      data: newItem,
    };
  } catch (error) {
    console.error("createTodoItem error:", error);
    return {
      success: false,
      error: `Failed to create todo item: ${error}`,
    };
  }
}

/**
 * Save complete day data - replaces old ApiService.saveDayData
 * This saves all the user's data for a specific date including state changes
 */
export async function saveDayData(
  email: string,
  date: string,
  dayData: {
    wakeTime?: string;
    blocks?: Block[];
    masterChecklist?: ChecklistItem[];
    habitBreakChecklist?: ChecklistItem[];
    workoutChecklist?: ChecklistItem[];
    todoList?: ChecklistItem[];
    dailyWakeTime?: string;
    userTimezone?: string;
  }
): Promise<ActionResult<void>> {
  try {
    console.log(`\n💾 saveDayData called for ${email} on ${date}`);
    console.log(`📝 Data to save:`, {
      masterChecklist: dayData.masterChecklist?.length || 0,
      habitBreakChecklist: dayData.habitBreakChecklist?.length || 0,
      workoutChecklist: dayData.workoutChecklist?.length || 0,
      todoList: dayData.todoList?.length || 0,
      masterItems:
        dayData.masterChecklist?.map((item: ChecklistItem) => item.text) || [],
      habitItems:
        dayData.habitBreakChecklist?.map((item: ChecklistItem) => item.text) ||
        [],
      workoutItems:
        dayData.workoutChecklist?.map((item: ChecklistItem) => item.text) || [],
    });
    await connectMongoose();

    let userData = await UserData.findOne({ userId: email, date });

    if (!userData) {
      // Create new user data if it doesn't exist
      userData = new UserData({
        userId: email,
        date,
        displayDate: new Date(date).toLocaleDateString(),
        wakeTime: dayData.wakeTime || "04:00",
        userTimezone:
          dayData.userTimezone ||
          Intl.DateTimeFormat().resolvedOptions().timeZone,
        blocks: dayData.blocks || [],
        masterChecklist: dayData.masterChecklist || [],
        habitBreakChecklist: dayData.habitBreakChecklist || [],
        workoutChecklist: dayData.workoutChecklist || [],
        todoList: dayData.todoList || [],
        score: 0,
        dailyWakeTime: dayData.dailyWakeTime || dayData.wakeTime || "04:00",
      });
    } else {
      // Update existing data with provided fields
      if (dayData.wakeTime !== undefined) userData.wakeTime = dayData.wakeTime;
      if (dayData.blocks !== undefined) userData.blocks = dayData.blocks;
      if (dayData.masterChecklist !== undefined)
        userData.masterChecklist = dayData.masterChecklist;
      if (dayData.habitBreakChecklist !== undefined)
        userData.habitBreakChecklist = dayData.habitBreakChecklist;
      if (dayData.workoutChecklist !== undefined)
        userData.workoutChecklist = dayData.workoutChecklist;
      if (dayData.todoList !== undefined) userData.todoList = dayData.todoList;
      if (dayData.dailyWakeTime !== undefined)
        userData.dailyWakeTime = dayData.dailyWakeTime;
      if (dayData.userTimezone !== undefined)
        userData.userTimezone = dayData.userTimezone;
    }

    await userData.save();
    console.log(`✅ Successfully saved data for ${date}`);

    // Revalidate the specific date page
    revalidatePath(`/${date}`, "page");

    return {
      success: true,
    };
  } catch (error) {
    console.error("saveDayData error:", error);
    return {
      success: false,
      error: `Failed to save day data: ${error}`,
    };
  }
}

/**
 * Helper function to create inherited user data
 */
async function createInheritedUserData(
  email: string,
  date: string,
  previousUserData: IUserData | null
) {
  const userData = new UserData({
    userId: email,
    date,
    displayDate: new Date(date).toLocaleDateString(),
    wakeTime: "04:00",
    userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    blocks: [],
    // Inherit checklist items from previous day but reset completion status
    masterChecklist:
      previousUserData?.masterChecklist?.map((item: ChecklistItem) => ({
        ...item,
        completed: false,
        completedAt: undefined,
        targetBlock: undefined,
        completionTimezone: undefined,
        timezoneOffset: undefined,
      })) || [],
    habitBreakChecklist:
      previousUserData?.habitBreakChecklist?.map((item: ChecklistItem) => ({
        ...item,
        completed: false,
        completedAt: undefined,
        targetBlock: undefined,
        completionTimezone: undefined,
        timezoneOffset: undefined,
      })) || [],
    workoutChecklist:
      previousUserData?.workoutChecklist?.map((item: ChecklistItem) => ({
        ...item,
        completed: false,
        completedAt: undefined,
        targetBlock: undefined,
        completionTimezone: undefined,
        timezoneOffset: undefined,
      })) || [],
    // Todo items should NOT inherit - they're date-specific
    todoList: [],
    score: 0,
    dailyWakeTime: "04:00",
  });

  console.log(`✨ Created new userData for ${date} with inherited items:`, {
    masterChecklist: userData.masterChecklist.length,
    habitBreakChecklist: userData.habitBreakChecklist.length,
    workoutChecklist: userData.workoutChecklist.length,
    todoList: userData.todoList.length,
  });

  await userData.save();
  console.log(`💾 Saved new userData to database for ${date}`);

  return userData;
}

/**
 * Determine if re-inheritance is needed
 * Re-inherit if the source data has significantly more items or different content
 */
function shouldReInherit(
  currentData: IUserData,
  sourceData: IUserData
): boolean {
  const currentMaster = currentData.masterChecklist?.length || 0;
  const sourceMaster = sourceData.masterChecklist?.length || 0;

  const currentHabit = currentData.habitBreakChecklist?.length || 0;
  const sourceHabit = sourceData.habitBreakChecklist?.length || 0;

  const currentWorkout = currentData.workoutChecklist?.length || 0;
  const sourceWorkout = sourceData.workoutChecklist?.length || 0;

  // Re-inherit if source has significantly more items (threshold: 2+ more items in any category)
  const masterNeedsUpdate = sourceMaster > currentMaster + 1;
  const habitNeedsUpdate = sourceHabit > currentHabit + 1;
  const workoutNeedsUpdate = sourceWorkout > currentWorkout + 1;

  // Also re-inherit if source date is more recent than the last source used
  // (This handles the case where user added items to a recent day)

  // Check if current data looks like it came from an older source
  // by comparing basic template items vs custom items
  const hasBasicTemplateOnly =
    currentMaster <= 4 && // Basic template usually has ~4 items
    currentHabit <= 3 && // Basic template usually has ~3 items
    currentWorkout <= 3; // Basic template usually has ~3 items

  const sourceHasCustomItems =
    sourceMaster > 4 || sourceHabit > 3 || sourceWorkout > 3;

  const shouldUpdate =
    masterNeedsUpdate ||
    habitNeedsUpdate ||
    workoutNeedsUpdate ||
    (hasBasicTemplateOnly && sourceHasCustomItems);

  if (shouldUpdate) {
    console.log(`🔍 Re-inheritance criteria met:`);
    console.log(
      `   Master: ${currentMaster} → ${sourceMaster} (needs update: ${masterNeedsUpdate})`
    );
    console.log(
      `   Habit: ${currentHabit} → ${sourceHabit} (needs update: ${habitNeedsUpdate})`
    );
    console.log(
      `   Workout: ${currentWorkout} → ${sourceWorkout} (needs update: ${workoutNeedsUpdate})`
    );
    console.log(
      `   Template-only target with custom source: ${
        hasBasicTemplateOnly && sourceHasCustomItems
      }`
    );
  }

  return shouldUpdate;
}

/**
 * Update existing user data with inheritance from source while preserving completion status
 */
async function updateInheritance(targetData: IUserData, sourceData: IUserData) {
  // Store current completion states to preserve them
  const currentCompletions = new Map();

  // Store completions for master checklist
  targetData.masterChecklist?.forEach((item: ChecklistItem) => {
    if (item.completed) {
      currentCompletions.set(`master_${item.text}`, {
        completed: item.completed,
        completedAt: item.completedAt,
        targetBlock: item.targetBlock,
        completionTimezone: item.completionTimezone,
        timezoneOffset: item.timezoneOffset,
      });
    }
  });

  // Store completions for habit checklist
  targetData.habitBreakChecklist?.forEach((item: ChecklistItem) => {
    if (item.completed) {
      currentCompletions.set(`habit_${item.text}`, {
        completed: item.completed,
        completedAt: item.completedAt,
        targetBlock: item.targetBlock,
        completionTimezone: item.completionTimezone,
        timezoneOffset: item.timezoneOffset,
      });
    }
  });

  // Store completions for workout checklist
  targetData.workoutChecklist?.forEach((item: ChecklistItem) => {
    if (item.completed) {
      currentCompletions.set(`workout_${item.text}`, {
        completed: item.completed,
        completedAt: item.completedAt,
        targetBlock: item.targetBlock,
        completionTimezone: item.completionTimezone,
        timezoneOffset: item.timezoneOffset,
      });
    }
  });

  // Update with new inheritance, restoring completion states where items match
  targetData.masterChecklist =
    sourceData.masterChecklist?.map((item: ChecklistItem) => {
      const completionKey = `master_${item.text}`;
      const savedCompletion = currentCompletions.get(completionKey);

      return {
        ...item,
        completed: savedCompletion?.completed || false,
        completedAt: savedCompletion?.completedAt || undefined,
        targetBlock: savedCompletion?.targetBlock || undefined,
        completionTimezone: savedCompletion?.completionTimezone || undefined,
        timezoneOffset: savedCompletion?.timezoneOffset || undefined,
      };
    }) || [];

  targetData.habitBreakChecklist =
    sourceData.habitBreakChecklist?.map((item: ChecklistItem) => {
      const completionKey = `habit_${item.text}`;
      const savedCompletion = currentCompletions.get(completionKey);

      return {
        ...item,
        completed: savedCompletion?.completed || false,
        completedAt: savedCompletion?.completedAt || undefined,
        targetBlock: savedCompletion?.targetBlock || undefined,
        completionTimezone: savedCompletion?.completionTimezone || undefined,
        timezoneOffset: savedCompletion?.timezoneOffset || undefined,
      };
    }) || [];

  targetData.workoutChecklist =
    sourceData.workoutChecklist?.map((item: ChecklistItem) => {
      const completionKey = `workout_${item.text}`;
      const savedCompletion = currentCompletions.get(completionKey);

      return {
        ...item,
        completed: savedCompletion?.completed || false,
        completedAt: savedCompletion?.completedAt || undefined,
        targetBlock: savedCompletion?.targetBlock || undefined,
        completionTimezone: savedCompletion?.completionTimezone || undefined,
        timezoneOffset: savedCompletion?.timezoneOffset || undefined,
      };
    }) || [];

  // Todo items are date-specific and should not be re-inherited
  // Keep existing todo items unchanged

  console.log(
    `🔄 Updated inheritance completed. New counts: Master=${targetData.masterChecklist.length}, Habit=${targetData.habitBreakChecklist.length}, Workout=${targetData.workoutChecklist.length}`
  );
}
