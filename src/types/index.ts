export interface ChecklistItem {
  id: string;
  itemId: string; // Stable unique identifier for the item across templates/instances (required)
  text: string;
  completed: boolean;
  category:
    | "morning"
    | "work"
    | "tech"
    | "house"
    | "wrapup"
    | "lsd"
    | "financial"
    | "youtube"
    | "time"
    | "entertainment"
    | "todo"
    | "cardio"
    | "strength"
    | "stretching"
    | "sports"
    | "yoga"
    | "walking"
    | "workout";
  completedAt?: Date;
  targetBlock?: number; // Legacy field for backward compatibility
  targetBlockId?: string; // New ID-based field
  dueDate?: string; // Format: YYYY-MM-DD - for todo items with specific dates
  // New fields for enhanced time tracking
  completionTimezone?: string; // IANA timezone used at completion
  timezoneOffset?: number; // Offset used at completion for DST audit
}

export interface ChecklistSection {
  id: string;
  sectionId: string; // Stable unique identifier for the section across templates/instances
  name: string;
  items: ChecklistItem[];
  itemOrder: string[]; // Array of itemIds in order
}

export interface Block {
  id: string; // Stable unique identifier for the block
  blockId?: string; // Stable unique identifier for the block across templates/instances (optional for backward compatibility)
  time: string;
  label: string;
  notes: string[];
  complete: boolean;
  checklist?: ChecklistItem[];
  duration?: number; // Duration in minutes, defaults to 60
  index?: number; // Block index (dynamic based on configuration)
}

export interface WakeTimeSettings {
  wakeTime: string; // Format: "04:00" (24-hour format)
  blockDuration: number; // Default duration for each block in minutes
  customDurations?: number[]; // Optional array of custom durations (length varies)
}

export interface DayData {
  date: string; // Format: YYYY-MM-DD
  displayDate: string; // Format: Wed 7-16-25
  wakeTime: string;
  wakeTimeSettings?: WakeTimeSettings; // Enhanced wake time configuration
  blocks: Block[];
  timeBlocksOrder?: string[]; // Array of blockIds in order (optional for backward compatibility)
  masterChecklist: ChecklistItem[];
  habitBreakChecklist: ChecklistItem[];
  todoList: ChecklistItem[];
  workoutChecklist: ChecklistItem[]; // New workout checklist field
  checklistSectionOrder?: string[]; // Array of sectionIds in order (optional for backward compatibility)
  score?: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string; // Reference to user
  // New fields for daily wake settings
  dailyWakeTime?: string; // Format: "03:30" - specific wake time for this day
  userTimezone?: string; // IANA timezone for this user
}

// Re-export content types
export * from "./content";
