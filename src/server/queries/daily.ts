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

// Temporary type for Mongoose lean() result - matches DayEntry structure
type LeanDayEntry = {
  wakeTime?: string;
  timeBlockCompletions?: Array<{
    blockId: string;
    completedAt: Date;
    notes?: string;
  }>;
  checklistCompletions?: Record<
    string,
    Array<{
      itemId: string;
      completedAt: Date;
    }>
  >;
  dailyWakeTime?: string;
  userTimezone?: string;
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
 * MODERN: Uses DayEntry collection instead of legacy UserData
 */
export async function getDay(date: string, userId: string): Promise<DayData> {
  try {
    await connectDB();

    // MODERN: Use DayEntry instead of legacy UserData
    const { DayEntry } = await import("../../lib/database");

    // Find user data for this specific date
    const dayEntry = await DayEntry.findOne({
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
      // MODERN: Extract data from DayEntry structure
      const entry = dayEntry as LeanDayEntry;
      wakeTime = entry.wakeTime || "";

      // Process time block completions into blocks format
      if (entry.timeBlockCompletions) {
        finalBlocks = defaultBlocks.map((defaultBlock) => {
          const completion = entry.timeBlockCompletions?.find(
            (comp) => comp.blockId === defaultBlock.id
          );
          return {
            ...defaultBlock,
            complete: !!completion,
            notes: completion?.notes ? [completion.notes] : [],
          };
        });
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

      // Process checklist completions into checklist format
      if (entry.checklistCompletions) {
        // Master checklist
        if (entry.checklistCompletions["master-checklist"]) {
          finalMasterChecklist = defaultMasterChecklist.map((item) => {
            const completion = entry.checklistCompletions?.[
              "master-checklist"
            ]?.find((comp) => comp.itemId === item.itemId);
            return {
              ...item,
              completed: !!completion,
              completedAt: completion?.completedAt,
            };
          });
        }

        // Habit break checklist
        if (entry.checklistCompletions["habit-break-checklist"]) {
          finalHabitBreakChecklist = defaultHabitBreakChecklist.map((item) => {
            const completion = entry.checklistCompletions?.[
              "habit-break-checklist"
            ]?.find((comp) => comp.itemId === item.itemId);
            return {
              ...item,
              completed: !!completion,
              completedAt: completion?.completedAt,
            };
          });
        }

        // Workout checklist (daily reset)
        if (entry.checklistCompletions["workout-checklist"]) {
          finalWorkoutChecklist = defaultWorkoutChecklist.map((item) => {
            const completion = entry.checklistCompletions?.[
              "workout-checklist"
            ]?.find((comp) => comp.itemId === item.itemId);
            return {
              ...item,
              completed: !!completion,
              completedAt: completion?.completedAt,
            };
          });
        }
      }

      // For todo list, use empty array for now (todos are managed separately)
      finalTodoList = ensureDateObjects([]);
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
