// Content management types
export type UserRole = "admin" | "public";

export interface User {
  _id?: string;
  email: string;
  name?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface ChecklistTemplate {
  id: string;
  text: string;
  category: string;
  order: number;
}

export interface TimeBlockTemplate {
  id: string;
  time: string;
  label: string;
  order: number;
  duration?: number; // Duration in minutes, defaults to 60
  index?: number; // Block index (0-15)
}

export interface ContentTemplate {
  _id?: string;
  userRole: UserRole;
  type:
    | "masterChecklist"
    | "habitBreakChecklist"
    | "timeBlocks"
    | "placeholderText";
  content: {
    masterChecklist?: ChecklistTemplate[];
    habitBreakChecklist?: ChecklistTemplate[];
    timeBlocks?: TimeBlockTemplate[];
    placeholderText?: {
      masterChecklistTitle?: string;
      masterChecklistDescription?: string;
      habitBreakTitle?: string;
      habitBreakDescription?: string;
      todoTitle?: string;
      todoDescription?: string;
      timeBlocksTitle?: string;
      timeBlocksDescription?: string;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}
