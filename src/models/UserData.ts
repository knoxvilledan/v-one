import mongoose, { Schema, Document } from "mongoose";
import { Block, ChecklistItem } from "../types";

export interface IUserData extends Document {
  date: string;
  displayDate: string;
  wakeTime: string;
  blocks: Block[];
  masterChecklist: ChecklistItem[];
  habitBreakChecklist: ChecklistItem[];
  todoList: ChecklistItem[];
  score: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChecklistItemSchema = new Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    completed: { type: Boolean, default: false },
    category: { type: String },
    completedAt: { type: Date },
    targetBlock: { type: Number },
    dueDate: { type: String },
  },
  { _id: false }
);

const BlockSchema = new Schema(
  {
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
    blocks: { type: [BlockSchema], default: [] },
    masterChecklist: { type: [ChecklistItemSchema], default: [] },
    habitBreakChecklist: { type: [ChecklistItemSchema], default: [] },
    todoList: { type: [ChecklistItemSchema], default: [] },
    score: { type: Number, default: 0 },
    userId: { type: String, required: true, index: true },
  },
  { timestamps: true, collection: "user_data" }
);

UserDataSchema.index({ userId: 1, date: 1 }, { unique: true });

export const UserData =
  mongoose.models.UserData ||
  mongoose.model<IUserData>("UserData", UserDataSchema);
