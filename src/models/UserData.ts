import "server-only";
import mongoose, { Schema, Document } from "mongoose";
import { Block, ChecklistItem } from "../types";

export interface IUserData extends Document {
  date: string;
  displayDate: string;
  wakeTime: string;
  weight?: string; // Weight in lbs
  blocks: Block[];
  timeBlocksOrder?: string[]; // Array of blockIds in order (optional for backward compatibility)
  masterChecklist: ChecklistItem[];
  habitBreakChecklist: ChecklistItem[];
  todoList: ChecklistItem[];
  workoutChecklist: ChecklistItem[]; // New workout checklist field
  checklistSectionOrder?: string[]; // Array of section names in order (optional for backward compatibility)
  masterChecklistOrder?: string[]; // Array of itemIds in order (optional for backward compatibility)
  habitBreakChecklistOrder?: string[]; // Array of itemIds in order (optional for backward compatibility)
  workoutChecklistOrder?: string[]; // Array of itemIds in order (optional for backward compatibility)
  todoListOrder?: string[]; // Array of itemIds in order (optional for backward compatibility)
  score: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  // New fields for daily wake settings and timezone
  dailyWakeTime?: string; // Format: "03:30"
  userTimezone?: string; // IANA timezone
}

const ChecklistItemSchema = new Schema(
  {
    id: { type: String, required: true },
    itemId: { type: String }, // Stable unique identifier (optional for backward compatibility)
    text: { type: String, required: true },
    completed: { type: Boolean, default: false },
    category: { type: String },
    completedAt: { type: Date },
    targetBlock: { type: Number }, // Legacy field for backward compatibility
    targetBlockId: { type: String }, // New ID-based field
    dueDate: { type: String },
    // New fields for enhanced time tracking
    completionTimezone: { type: String },
    timezoneOffset: { type: Number },
  },
  { _id: false }
);

const BlockSchema = new Schema(
  {
    id: { type: String, required: true }, // For backward compatibility
    blockId: { type: String }, // Stable unique identifier (optional for backward compatibility)
    time: { type: String, required: true },
    label: { type: String, required: true },
    notes: { type: [String], default: [] },
    complete: { type: Boolean, default: false },
    checklist: { type: [ChecklistItemSchema], default: undefined },
    duration: { type: Number },
    index: { type: Number },
  },
  { _id: false }
);

const UserDataSchema = new Schema<IUserData>(
  {
    date: { type: String, required: true },
    displayDate: { type: String, required: true },
    wakeTime: { type: String, default: "" },
    weight: { type: String, default: "" }, // Weight in lbs
    blocks: { type: [BlockSchema], default: [] },
    timeBlocksOrder: { type: [String], default: [] },
    masterChecklist: { type: [ChecklistItemSchema], default: [] },
    habitBreakChecklist: { type: [ChecklistItemSchema], default: [] },
    todoList: { type: [ChecklistItemSchema], default: [] },
    workoutChecklist: { type: [ChecklistItemSchema], default: [] }, // New workout checklist field
    checklistSectionOrder: { type: [String], default: [] },
    masterChecklistOrder: { type: [String], default: [] },
    habitBreakChecklistOrder: { type: [String], default: [] },
    workoutChecklistOrder: { type: [String], default: [] },
    todoListOrder: { type: [String], default: [] },
    score: { type: Number, default: 0 },
    userId: { type: String, required: true, index: true },
    // New fields for daily wake settings and timezone
    dailyWakeTime: { type: String }, // Format: "03:30"
    userTimezone: { type: String }, // IANA timezone
  },
  { timestamps: true, collection: "user_data" }
);

UserDataSchema.index({ userId: 1, date: 1 }, { unique: true });

export const UserData =
  mongoose.models.UserData ||
  mongoose.model<IUserData>("UserData", UserDataSchema);
