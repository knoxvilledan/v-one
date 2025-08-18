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
    | "todo";
  completedAt?: Date;
  targetBlock?: number;
  dueDate?: string; // Format: YYYY-MM-DD - for todo items with specific dates
}

export interface Block {
  id: string; // Stable unique identifier for the block
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
  masterChecklist: ChecklistItem[];
  habitBreakChecklist: ChecklistItem[];
  todoList: ChecklistItem[];
  score?: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string; // Reference to user
}

// Re-export content types
export * from "./content";
