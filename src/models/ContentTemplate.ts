import "server-only";
import mongoose, { Schema, Document } from "mongoose";

export interface ITimeBlockTemplate {
  id: string;
  blockId?: string; // Stable unique identifier across templates/instances (optional for backward compatibility)
  time: string;
  label: string;
  order: number;
  duration?: number;
}

export interface IChecklistTemplate {
  id: string;
  itemId: string; // Stable unique identifier across templates/instances (required)
  text: string;
  category: string;
  order: number;
}

export interface IContentTemplate extends Document {
  userRole: "public" | "admin";
  type: "placeholderText";
  content: {
    masterChecklist?: IChecklistTemplate[];
    habitBreakChecklist?: IChecklistTemplate[];
    workoutChecklist?: IChecklistTemplate[]; // New workout checklist field
    timeBlocks?: ITimeBlockTemplate[];
    placeholderText?: Record<string, string>;
    // Order arrays for stable sorting
    timeBlocksOrder?: string[]; // Array of blockIds in order
    checklistSectionOrder?: string[]; // Array of section names in order
    masterChecklistOrder?: string[]; // Array of itemIds in order
    habitBreakChecklistOrder?: string[]; // Array of itemIds in order
    workoutChecklistOrder?: string[]; // Array of itemIds in order
  };
  createdAt: Date;
  updatedAt: Date;
}

const ChecklistTemplateSchema = new Schema(
  {
    id: { type: String, required: true },
    itemId: { type: String, required: true }, // Stable unique identifier (required)
    text: { type: String, required: true },
    category: { type: String, required: true },
    order: { type: Number, required: true },
  },
  { _id: false }
);

const TimeBlockTemplateSchema = new Schema(
  {
    id: { type: String, required: true },
    blockId: { type: String }, // Stable unique identifier (optional for backward compatibility)
    time: { type: String, required: true },
    label: { type: String, required: true },
    order: { type: Number, required: true },
    duration: { type: Number },
  },
  { _id: false }
);

const ContentTemplateSchema = new Schema<IContentTemplate>(
  {
    userRole: {
      type: String,
      enum: ["public", "admin"],
      required: true,
    },
    type: {
      type: String,
      enum: ["placeholderText"],
      default: "placeholderText",
    },
    content: {
      masterChecklist: { type: [ChecklistTemplateSchema], default: [] },
      habitBreakChecklist: { type: [ChecklistTemplateSchema], default: [] },
      workoutChecklist: { type: [ChecklistTemplateSchema], default: [] }, // New workout checklist field
      timeBlocks: { type: [TimeBlockTemplateSchema], default: [] },
      placeholderText: { type: Schema.Types.Mixed },
      // Order arrays for stable sorting
      timeBlocksOrder: { type: [String], default: [] },
      checklistSectionOrder: { type: [String], default: [] },
      masterChecklistOrder: { type: [String], default: [] },
      habitBreakChecklistOrder: { type: [String], default: [] },
      workoutChecklistOrder: { type: [String], default: [] },
    },
  },
  { timestamps: true, collection: "content_templates" }
);

ContentTemplateSchema.index({ userRole: 1 }, { unique: true });

export const ContentTemplate =
  mongoose.models.ContentTemplate ||
  mongoose.model<IContentTemplate>("ContentTemplate", ContentTemplateSchema);
