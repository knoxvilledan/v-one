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
