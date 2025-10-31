"use server";

import { UserData } from "../models/UserData";
import { connectMongoose } from "./db";
import { revalidatePath } from "next/cache";
import { Block, ChecklistItem, IconTrackingData } from "../types";
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
 * Copy checklist items for a new day, resetting completion state
 */
function copyChecklistForNewDay(
  list: ChecklistItem[] | undefined
): ChecklistItem[] {
  if (!list || list.length === 0) return [];

  return list.map((item) => ({
    ...item,
    completed: false,
    completedAt: undefined,
    timezoneOffset: undefined,
    targetBlock: undefined, // Clear target block for fresh auto-assignment
    // Preserve: id, text, category
  }));
}

/**
 * Copy todo list items for a new day, resetting completion state
 */
function copyTodoListForNewDay(
  list: ChecklistItem[] | undefined
): ChecklistItem[] {
  if (!list || list.length === 0) return [];

  return list.map((item) => ({
    ...item,
    completed: false,
    completedAt: undefined,
    timezoneOffset: undefined,
    targetBlock: undefined, // Clear target block for fresh auto-assignment
    // Preserve: id, text, category, order
  }));
}

/**
 * Copy time blocks for a new day, keeping only labels and order
 */
function copyBlocksForNewDay(blocks: Block[] | undefined): Block[] {
  if (!blocks || blocks.length === 0) return [];

  return blocks.map((block) => ({
    id: block.id,
    time: block.time,
    label: block.label, // Keep custom names
    notes: [], // Reset notes
    complete: false, // Reset completion
    duration: block.duration,
    index: block.index,
    // Drop any timestamps or transient fields
  }));
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
    weight: string;
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
      // Data exists - check if we need to re-inherit from TODAY as the source of truth
      console.log(`🔍 Checking if re-inheritance needed for ${date}...`);

      const today = getCurrentDate();

      // If this is a future date, always use TODAY as the source of truth
      if (date > today) {
        console.log(
          `� Future date detected (${date} > ${today}). Using TODAY as source of truth.`
        );

        // Find TODAY's data as the source of truth
        const todayData = await UserData.findOne({
          userId: email,
          date: today,
        });

        if (todayData && shouldReInheritFromToday(userData, todayData)) {
          console.log(`🔄 Re-inheritance from TODAY needed! Source: ${today}`);
          console.log(
            `   Current data has: Master=${
              userData.masterChecklist?.length || 0
            }, Habit=${userData.habitBreakChecklist?.length || 0}, Workout=${
              userData.workoutChecklist?.length || 0
            }`
          );
          console.log(
            `   TODAY's data has: Master=${
              todayData.masterChecklist?.length || 0
            }, Habit=${todayData.habitBreakChecklist?.length || 0}, Workout=${
              todayData.workoutChecklist?.length || 0
            }`
          );

          // Re-inherit while preserving completion status and time blocks
          await updateInheritance(userData, todayData);
          await userData.save();
          console.log(`✨ Re-inheritance from TODAY completed for ${date}`);
        } else {
          console.log(`✅ No re-inheritance needed from TODAY for ${date}`);
        }
      } else {
        // For today or past dates, use the original logic (most recent previous)
        console.log(
          `📅 Current/past date (${date} <= ${today}). Using previous date logic.`
        );

        // Special case: If this IS today, be more conservative about re-inheritance
        // TODAY should generally be the source of truth, not inherit from past
        if (date === today) {
          console.log(
            `📅 This IS today (${date}). Using conservative inheritance.`
          );

          // Only inherit if TODAY has completely empty data (first time setup)
          const isCompletelyEmpty =
            (!userData.masterChecklist ||
              userData.masterChecklist.length === 0) &&
            (!userData.habitBreakChecklist ||
              userData.habitBreakChecklist.length === 0) &&
            (!userData.workoutChecklist ||
              userData.workoutChecklist.length === 0) &&
            (!userData.todoList || userData.todoList.length === 0) &&
            (!userData.blocks || userData.blocks.length === 0);

          if (isCompletelyEmpty) {
            console.log(
              `📝 TODAY is completely empty - allowing inheritance from previous day`
            );

            const latestPreviousData = await UserData.findOne(
              { userId: email, date: { $lt: date } },
              {},
              { sort: { date: -1 } }
            );

            if (
              latestPreviousData &&
              shouldReInherit(userData, latestPreviousData)
            ) {
              console.log(
                `🔄 Re-inheritance needed for empty TODAY! Latest source: ${latestPreviousData.date}`
              );
              await updateInheritance(userData, latestPreviousData);
              await userData.save();
              console.log(`✨ Re-inheritance completed for TODAY`);
            } else {
              console.log(`✅ No re-inheritance needed for TODAY`);
            }
          } else {
            console.log(
              `🔒 TODAY has content - treating as source of truth, no inheritance from past`
            );
          }
        } else {
          // For past dates, use normal previous-date inheritance logic
          const latestPreviousData = await UserData.findOne(
            { userId: email, date: { $lt: date } },
            {},
            { sort: { date: -1 } }
          );

          if (
            latestPreviousData &&
            shouldReInherit(userData, latestPreviousData)
          ) {
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
      }
    }

    // Convert to plain objects to avoid serialization issues
    const result = {
      wakeTime: userData.wakeTime || "04:00",
      weight: userData.weight || "",
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
    weight?: string;
    blocks?: Block[];
    masterChecklist?: ChecklistItem[];
    habitBreakChecklist?: ChecklistItem[];
    workoutChecklist?: ChecklistItem[];
    todoList?: ChecklistItem[];
    iconTracking?: IconTrackingData;
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
        weight: dayData.weight || "",
        dailyWakeTime: dayData.dailyWakeTime || dayData.wakeTime || "04:00",
      });
    } else {
      // Update existing data with provided fields
      if (dayData.wakeTime !== undefined) userData.wakeTime = dayData.wakeTime;
      if (dayData.weight !== undefined) userData.weight = dayData.weight;
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
    // Use copy helpers for proper inheritance
    blocks: previousUserData
      ? copyBlocksForNewDay(previousUserData.blocks)
      : [],
    masterChecklist: copyChecklistForNewDay(previousUserData?.masterChecklist),
    habitBreakChecklist: copyChecklistForNewDay(
      previousUserData?.habitBreakChecklist
    ),
    workoutChecklist: copyChecklistForNewDay(
      previousUserData?.workoutChecklist
    ),
    todoList: copyTodoListForNewDay(previousUserData?.todoList),
    score: 0,
    dailyWakeTime: "04:00",
  });

  console.log(`✨ Created new userData for ${date} with inherited items:`, {
    masterChecklist: userData.masterChecklist.length,
    habitBreakChecklist: userData.habitBreakChecklist.length,
    workoutChecklist: userData.workoutChecklist.length,
    todoList: userData.todoList.length,
    blocks: userData.blocks.length,
  });

  await userData.save();
  console.log(`💾 Saved new userData to database for ${date}`);

  return userData;
}

/**
 * Determine if re-inheritance is needed
 * Use structural diff across all lists + block labels (ignore notes & completion)
 */
function shouldReInherit(
  currentData: IUserData,
  sourceData: IUserData
): boolean {
  console.log("🔍 Checking if re-inheritance is needed...");

  // Always re-inherit if current data has no content
  if (
    (!currentData.masterChecklist ||
      currentData.masterChecklist.length === 0) &&
    (!currentData.habitBreakChecklist ||
      currentData.habitBreakChecklist.length === 0) &&
    (!currentData.workoutChecklist ||
      currentData.workoutChecklist.length === 0) &&
    (!currentData.todoList || currentData.todoList.length === 0) &&
    (!currentData.blocks || currentData.blocks.length === 0)
  ) {
    console.log("📝 Current data is empty - re-inheritance needed");
    return true;
  }

  // Use structural diff - if anything differs, re-inherit
  const sourceHasChanges = hasContentChanged(currentData, sourceData);
  if (sourceHasChanges) {
    console.log("🆕 Source has different content - re-inheritance needed");
    return true;
  }

  console.log("✅ Current data is up-to-date - no re-inheritance needed");
  return false;
}

/**
 * Determine if re-inheritance from TODAY is needed for future dates
 * Uses "Today is source of truth" logic with structural diff
 */
function shouldReInheritFromToday(
  currentData: IUserData,
  todayData: IUserData
): boolean {
  console.log("🔍 Checking if re-inheritance from TODAY is needed...");

  // Always re-inherit if current data has no content
  if (
    (!currentData.masterChecklist ||
      currentData.masterChecklist.length === 0) &&
    (!currentData.habitBreakChecklist ||
      currentData.habitBreakChecklist.length === 0) &&
    (!currentData.workoutChecklist ||
      currentData.workoutChecklist.length === 0) &&
    (!currentData.todoList || currentData.todoList.length === 0) &&
    (!currentData.blocks || currentData.blocks.length === 0)
  ) {
    console.log("📝 Current data is empty - re-inheritance from TODAY needed");
    return true;
  }

  // Use structural diff - if anything differs from TODAY, re-inherit
  const todayHasChanges = hasContentChanged(currentData, todayData);
  if (todayHasChanges) {
    console.log("🆕 TODAY has different content - re-inheritance needed");
    return true;
  }

  console.log("✅ Current data matches TODAY - no re-inheritance needed");
  return false;
}

/**
 * Compare content between current and source data to detect edits/changes
 */
function hasContentChanged(
  currentData: IUserData,
  sourceData: IUserData
): boolean {
  // Helper function to compare checklist items (ignoring completion status)
  const compareItems = (
    current: ChecklistItem[],
    source: ChecklistItem[]
  ): boolean => {
    if (current.length !== source.length) {
      return true; // Different lengths = changed
    }

    // Create sets of item texts for comparison
    const currentTexts = new Set(
      current.map((item) => item.text.trim().toLowerCase())
    );
    const sourceTexts = new Set(
      source.map((item) => item.text.trim().toLowerCase())
    );

    // Check if all items match
    if (currentTexts.size !== sourceTexts.size) {
      return true;
    }

    for (const text of currentTexts) {
      if (!sourceTexts.has(text)) {
        return true; // Found an item that doesn't match
      }
    }

    return false; // All items match
  };

  // Compare master checklist
  const masterChanged = compareItems(
    currentData.masterChecklist || [],
    sourceData.masterChecklist || []
  );

  // Compare habit checklist
  const habitChanged = compareItems(
    currentData.habitBreakChecklist || [],
    sourceData.habitBreakChecklist || []
  );

  // Compare workout checklist
  const workoutChanged = compareItems(
    currentData.workoutChecklist || [],
    sourceData.workoutChecklist || []
  );

  // Compare todo list
  const todoChanged = compareItems(
    currentData.todoList || [],
    sourceData.todoList || []
  );

  // Compare time blocks (labels only, not completion status)
  const timeBlocksChanged = compareItems(
    (currentData.blocks || []).map((block) => ({
      id: block.id || "temp",
      text: block.label,
      completed: false,
      category: "time",
    })),
    (sourceData.blocks || []).map((block) => ({
      id: block.id || "temp",
      text: block.label,
      completed: false,
      category: "time",
    }))
  );

  const hasChanges =
    masterChanged ||
    habitChanged ||
    workoutChanged ||
    todoChanged ||
    timeBlocksChanged;

  if (hasChanges) {
    console.log(`📝 Content changes detected:`);
    console.log(`   Master checklist changed: ${masterChanged}`);
    console.log(`   Habit checklist changed: ${habitChanged}`);
    console.log(`   Workout checklist changed: ${workoutChanged}`);
    console.log(`   Todo list changed: ${todoChanged}`);
    console.log(`   Time blocks changed: ${timeBlocksChanged}`);
  }

  return hasChanges;
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
        targetBlock: savedCompletion?.targetBlock || undefined, // Only preserve targetBlock for completed items
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
        targetBlock: savedCompletion?.targetBlock || undefined, // Only preserve targetBlock for completed items
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
        targetBlock: savedCompletion?.targetBlock || undefined, // Only preserve targetBlock for completed items
        completionTimezone: savedCompletion?.completionTimezone || undefined,
        timezoneOffset: savedCompletion?.timezoneOffset || undefined,
      };
    }) || [];

  // Todo items should mirror other checklists - copy items and reset completion
  targetData.todoList = copyTodoListForNewDay(sourceData.todoList);
  console.log(
    `📝 Inherited ${targetData.todoList.length} todo items from source`
  );

  // Time blocks should inherit labels + order only, always clear notes and reset completion
  targetData.blocks = copyBlocksForNewDay(sourceData.blocks);
  console.log(
    `⏰ Inherited ${targetData.blocks.length} time blocks from source with reset completion`
  );

  console.log(
    `🔄 Updated inheritance completed. New counts: Master=${
      targetData.masterChecklist.length
    }, Habit=${targetData.habitBreakChecklist.length}, Workout=${
      targetData.workoutChecklist.length
    }, Todos=${targetData.todoList?.length || 0}, TimeBlocks=${
      targetData.blocks?.length || 0
    }`
  );
}
