import mongoose, { Schema, Document } from "mongoose";

export interface ITimeBlockTemplate {
  id: string;
  time: string;
  label: string;
  order: number;
  duration?: number;
}

export interface IChecklistTemplate {
  id: string;
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
    timeBlocks?: ITimeBlockTemplate[];
    placeholderText?: Record<string, string>;
  };
  createdAt: Date;
  updatedAt: Date;
}

const ChecklistTemplateSchema = new Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    category: { type: String, required: true },
    order: { type: Number, required: true },
  },
  { _id: false }
);

const TimeBlockTemplateSchema = new Schema(
  {
    id: { type: String, required: true },
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
      unique: true,
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
      timeBlocks: { type: [TimeBlockTemplateSchema], default: [] },
      placeholderText: { type: Schema.Types.Mixed },
    },
  },
  { timestamps: true, collection: "content_templates" }
);

ContentTemplateSchema.index({ userRole: 1 }, { unique: true });

export const ContentTemplate =
  mongoose.models.ContentTemplate ||
  mongoose.model<IContentTemplate>("ContentTemplate", ContentTemplateSchema);
