// Server-only database utilities for daily page
import { connectDB } from "../../lib/database";
import { Block, ChecklistItem } from "../../types";
import { generateOptimizedId } from "../../lib/id-generation";
import {
  generateTimeBlocks,
  getUserTimezone,
  getDefaultWakeSettings,
} from "../../lib/time-block-calculator";

// Import template types
import type { IChecklistTemplate } from "../../models/ContentTemplate";

// Temporary type for Mongoose lean() result
type LeanUserData = {
  wakeTime?: string;
  blocks?: Block[];
  dailyWakeTime?: string;
  userTimezone?: string;
  masterChecklist?: ChecklistItem[];
  habitBreakChecklist?: ChecklistItem[];
  workoutChecklist?: ChecklistItem[];
  todoList?: ChecklistItem[];
};

export interface DayData {
  date: string;
  userId: string;
  wakeTime: string;
  dailyWakeTime: string;
  userTimezone: string;
  blocks: Block[];
  masterChecklist: ChecklistItem[];
  habitBreakChecklist: ChecklistItem[];
  workoutChecklist: ChecklistItem[];
  todoList: ChecklistItem[];
  settings: {
    wakeTime: string;
    timezone: string;
  };
}

// Helper function to ensure date fields are proper Date objects
function ensureDateObjects(items: ChecklistItem[]): ChecklistItem[] {
  return items.map((item) => ({
    ...item,
    completedAt: item.completedAt ? new Date(item.completedAt) : undefined,
  }));
}

// Get default content from templates
async function getDefaultContent() {
  await connectDB();

  // Get content from public template
  const { ContentTemplate } = await import("../../lib/database");
  const publicTemplate = (await ContentTemplate.findOne({
    userRole: "public",
  }).lean()) as any; // Type assertion for now to fix immediate issues

  // Generate default time blocks
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

  // Load checklists from template if available
  let defaultMasterChecklist: ChecklistItem[] = [];
  let defaultHabitBreakChecklist: ChecklistItem[] = [];
  let defaultWorkoutChecklist: ChecklistItem[] = [];

  if (publicTemplate?.content) {
    // Convert template items to checklist items
    if (publicTemplate.content.masterChecklist) {
      defaultMasterChecklist = publicTemplate.content.masterChecklist.map(
        (item: IChecklistTemplate, index: number) => ({
          id: item.id || generateOptimizedId.todo([], index),
          itemId:
            item.itemId ||
            `mc-${item.category}-${String(index).padStart(3, "0")}`,
          text: item.text,
          completed: false,
          category: item.category as ChecklistItem["category"],
        })
      );
    }

    if (publicTemplate.content.habitBreakChecklist) {
      defaultHabitBreakChecklist =
        publicTemplate.content.habitBreakChecklist.map(
          (item: IChecklistTemplate, index: number) => ({
            id: item.id || generateOptimizedId.todo([], index + 100),
            itemId:
              item.itemId ||
              `hb-${item.category}-${String(index).padStart(3, "0")}`,
            text: item.text,
            completed: false,
            category: item.category as ChecklistItem["category"],
          })
        );
    }

    if (publicTemplate.content.workoutChecklist) {
      defaultWorkoutChecklist = publicTemplate.content.workoutChecklist.map(
        (item: IChecklistTemplate, index: number) => ({
          id: item.id || generateOptimizedId.workout([], index),
          itemId:
            item.itemId ||
            `wk-${item.category}-${String(index).padStart(3, "0")}`,
          text: item.text,
          completed: false,
          category: item.category as ChecklistItem["category"],
        })
      );
    }
  }

  return {
    defaultBlocks,
    defaultMasterChecklist,
    defaultHabitBreakChecklist,
    defaultWorkoutChecklist,
    defaultWakeTimeSettings: getDefaultWakeSettings(),
  };
}

/**
 * Get complete day data for a user and date
 * This is the main server-side data fetching function
 */
export async function getDay(date: string, userId: string): Promise<DayData> {
  try {
    await connectDB();

    // Import UserData model here to avoid circular dependencies
    const { UserData } = await import("../../lib/database");

    // Find user data for this specific date
    const dayEntry = await UserData.findOne({
      userId: userId,
      date: date,
    }).lean();

    // Get defaults
    const defaults = await getDefaultContent();
    const {
      defaultBlocks,
      defaultMasterChecklist,
      defaultHabitBreakChecklist,
      defaultWorkoutChecklist,
    } = defaults;

    let finalBlocks: Block[] = defaultBlocks.map((b) => ({
      ...b,
      notes: [],
      complete: false,
    }));
    let finalMasterChecklist: ChecklistItem[] = defaultMasterChecklist;
    let finalHabitBreakChecklist: ChecklistItem[] = defaultHabitBreakChecklist;
    let finalWorkoutChecklist: ChecklistItem[] = defaultWorkoutChecklist;
    let finalTodoList: ChecklistItem[] = [];
    let wakeTime = "";
    let dailyWakeTime = "";
    let userTimezone = getUserTimezone();

    if (dayEntry) {
      const entry = dayEntry as LeanUserData;
      wakeTime = entry.wakeTime || "";
      if (entry.blocks) {
        finalBlocks = entry.blocks;
      }

      // Load daily wake time and timezone settings
      if (entry.dailyWakeTime) {
        dailyWakeTime = entry.dailyWakeTime;
      } else if (entry.wakeTime) {
        // Sync dailyWakeTime with wakeTime if only wakeTime is set
        dailyWakeTime = entry.wakeTime;
      }
      if (entry.userTimezone) {
        userTimezone = entry.userTimezone;
      }

      // Ensure dates are proper Date objects
      finalMasterChecklist = ensureDateObjects(
        entry.masterChecklist || defaultMasterChecklist
      );
      finalHabitBreakChecklist = ensureDateObjects(
        entry.habitBreakChecklist || defaultHabitBreakChecklist
      );

      // For workout checklist, reset completion status for daily reset
      let workoutChecklist = entry.workoutChecklist || [];
      if (workoutChecklist.length === 0) {
        // No workout data for today, load from defaults
        workoutChecklist = defaultWorkoutChecklist;
      } else {
        // Reset completion status for existing workout items (daily reset)
        workoutChecklist = workoutChecklist.map((workout: ChecklistItem) => ({
          ...workout,
          completed: false,
          completedAt: undefined,
          targetBlock: undefined,
          completionTimezone: undefined,
          timezoneOffset: undefined,
        }));
      }
      finalWorkoutChecklist = ensureDateObjects(workoutChecklist);

      // For todo list, include items from this day
      const todoList = entry.todoList || [];

      // TODO: Load uncompleted todos from previous days
      // This would require querying multiple UserData documents
      // For now, just use today's todos
      finalTodoList = ensureDateObjects(todoList);
    } else {
      // If no data for this day, use defaults
      finalTodoList = ensureDateObjects([]);
      finalWorkoutChecklist = ensureDateObjects(defaultWorkoutChecklist);
    }

    return {
      date,
      userId,
      wakeTime,
      dailyWakeTime,
      userTimezone,
      blocks: finalBlocks,
      masterChecklist: finalMasterChecklist,
      habitBreakChecklist: finalHabitBreakChecklist,
      workoutChecklist: finalWorkoutChecklist,
      todoList: finalTodoList,
      settings: {
        wakeTime: wakeTime || dailyWakeTime,
        timezone: userTimezone,
      },
    };
  } catch (error) {
    console.error("Error loading day data:", error);

    // Return sensible defaults on error
    const defaults = await getDefaultContent();
    return {
      date,
      userId,
      wakeTime: "",
      dailyWakeTime: "",
      userTimezone: getUserTimezone(),
      blocks: defaults.defaultBlocks.map((b) => ({
        ...b,
        notes: [],
        complete: false,
      })),
      masterChecklist: defaults.defaultMasterChecklist,
      habitBreakChecklist: defaults.defaultHabitBreakChecklist,
      workoutChecklist: defaults.defaultWorkoutChecklist,
      todoList: [],
      settings: {
        wakeTime: "",
        timezone: getUserTimezone(),
      },
    };
  }
}
