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
  time: string;
  label: string;
  notes: string[];
  complete: boolean;
  checklist?: ChecklistItem[];
}

export interface DayData {
  date: string; // Format: YYYY-MM-DD
  displayDate: string; // Format: Wed 7-16-25
  wakeTime: string;
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
