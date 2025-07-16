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
    | "entertainment";
  completedAt?: Date;
  targetBlock?: number;
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
  score?: number;
  createdAt: Date;
  updatedAt: Date;
}
