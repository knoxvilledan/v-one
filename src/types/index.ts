export interface ChecklistItem {
  id: string;
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
  dueDate?: string; // Format: YYYY-MM-DD - for todo items with specific dates
  completionTimezone?: string; // IANA timezone used at completion
  timezoneOffset?: number; // Offset used at completion for DST audit
  targetBlock?: number; // Time block index for assignment (0-23 for 24-hour system)
}

export interface ChecklistSection {
  id: string;
  name: string;
  items: ChecklistItem[];
}

export interface Block {
  id: string;
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
  weight?: string; // Weight in lbs
  wakeTimeSettings?: WakeTimeSettings; // Enhanced wake time configuration
  blocks: Block[];
  masterChecklist: ChecklistItem[];
  habitBreakChecklist: ChecklistItem[];
  todoList: ChecklistItem[];
  workoutChecklist: ChecklistItem[];
  score?: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string; // Reference to user
  dailyWakeTime?: string; // Format: "03:30" - specific wake time for this day
  userTimezone?: string; // IANA timezone for this user
}

// Re-export content types
export * from "./content";
