import "server-only";
import mongoose, { Schema, Document } from "mongoose";
import { Block, ChecklistItem, IconTrackingData } from "../types";

export interface IUserData extends Document {
  date: string;
  displayDate: string;
  wakeTime: string;
  weight?: string; // Weight in lbs
  blocks: Block[];
  masterChecklist: ChecklistItem[];
  habitBreakChecklist: ChecklistItem[];
  todoList: ChecklistItem[];
  workoutChecklist: ChecklistItem[];
  iconTracking: IconTrackingData; // Daily icon tracking data
  score: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  dailyWakeTime?: string; // Format: "03:30"
  userTimezone?: string; // IANA timezone
}

const ChecklistItemSchema = new Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    completed: { type: Boolean, default: false },
    category: { type: String },
    completedAt: { type: Date },
    dueDate: { type: String },
    completionTimezone: { type: String },
    timezoneOffset: { type: Number },
  },
  { _id: false }
);

const BlockSchema = new Schema(
  {
    id: { type: String, required: true },
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

const IconTrackingSchema = new Schema(
  {
    water: { type: Number, default: 10 },
    cigarettes: { type: Number, default: 15 },
    trees: { type: Number, default: 10 },
  },
  { _id: false }
);

const UserDataSchema = new Schema<IUserData>(
  {
    date: { type: String, required: true },
    displayDate: { type: String, required: true },
    wakeTime: { type: String, default: "" },
    weight: { type: String, default: "" },
    blocks: { type: [BlockSchema], default: [] },
    masterChecklist: { type: [ChecklistItemSchema], default: [] },
    habitBreakChecklist: { type: [ChecklistItemSchema], default: [] },
    todoList: { type: [ChecklistItemSchema], default: [] },
    workoutChecklist: { type: [ChecklistItemSchema], default: [] },
    iconTracking: {
      type: IconTrackingSchema,
      default: () => ({ water: 10, cigarettes: 15, trees: 10 }),
    },
    score: { type: Number, default: 0 },
    userId: { type: String, required: true, index: true },
    dailyWakeTime: { type: String },
    userTimezone: { type: String },
  },
  { timestamps: true, collection: "user_data" }
);

UserDataSchema.index({ userId: 1, date: 1 }, { unique: true });

export const UserData =
  mongoose.models.UserData ||
  mongoose.model<IUserData>("UserData", UserDataSchema);
