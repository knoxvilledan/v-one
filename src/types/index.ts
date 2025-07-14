export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Block {
  time: string;
  label: string;
  notes: string[];
  complete: boolean;
  checklist?: ChecklistItem[];
}
