"use server";

import { UserData } from "../models/UserData";
import { connectMongoose } from "./db";
import { revalidatePath } from "next/cache";
import { Block, ChecklistItem } from "../types";

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
    await connectMongoose();

    // Find user data for the specific date
    let userData = await UserData.findOne({ userId: email, date });

    if (!userData) {
      // Create default user data for this date
      userData = new UserData({
        userId: email,
        date,
        displayDate: new Date(date).toLocaleDateString(),
        wakeTime: "04:00",
        userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        blocks: [],
        masterChecklist: [],
        habitBreakChecklist: [],
        workoutChecklist: [],
        todoList: [],
        score: 0,
        dailyWakeTime: "04:00",
      });
      await userData.save();
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
