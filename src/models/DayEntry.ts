import mongoose, { Schema, Document } from "mongoose";

export interface IDayEntry extends Document {
  userId: string; // reference to User._id
  email: string; // user's email for easy lookup
  date: string; // YYYY-MM-DD format for the day

  // Time block completions for this day
  timeBlockCompletions: Array<{
    blockId: string; // reference to template or user override block
    label: string; // snapshot of label at time of completion
    time: string; // snapshot of time at time of completion
    completedAt: Date;
    notes?: string; // user notes for this time block
    duration?: number; // actual time spent in minutes
  }>;

  // Checklist completions for this day
  checklistCompletions: Array<{
    checklistId: string; // reference to template checklist
    title: string; // snapshot of title at time of completion
    completedItemIds: string[]; // IDs of items that were completed
    completedAt: Date;
    notes?: string; // user notes for this checklist

    // Snapshot of completed items for historical accuracy
    completedItems: Array<{
      itemId: string;
      text: string; // snapshot of text at time of completion
      completedAt: Date;
    }>;
  }>;

  // Daily summary and reflection
  summary?: {
    overallRating?: number; // 1-5 scale
    reflection?: string; // user's daily reflection
    highlights?: string[]; // key achievements or notes
    challenges?: string[]; // difficulties faced
  };

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

const DayEntrySchema = new Schema<IDayEntry>({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  date: {
    type: String,
    required: true,
    validate: {
      validator: function (v: string) {
        // Validate YYYY-MM-DD format
        return /^\d{4}-\d{2}-\d{2}$/.test(v);
      },
      message: "Date must be in YYYY-MM-DD format",
    },
  },

  timeBlockCompletions: [
    {
      blockId: { type: String, required: true },
      label: { type: String, required: true, trim: true },
      time: { type: String, required: true, trim: true },
      completedAt: { type: Date, required: true },
      notes: { type: String, trim: true, maxlength: 1000 },
      duration: { type: Number, min: 1, max: 1440 }, // max 24 hours in minutes
    },
  ],

  checklistCompletions: [
    {
      checklistId: { type: String, required: true },
      title: { type: String, required: true, trim: true },
      completedItemIds: [{ type: String, required: true }],
      completedAt: { type: Date, required: true },
      notes: { type: String, trim: true, maxlength: 1000 },

      completedItems: [
        {
          itemId: { type: String, required: true },
          text: { type: String, required: true, trim: true },
          completedAt: { type: Date, required: true },
        },
      ],
    },
  ],

  summary: {
    overallRating: {
      type: Number,
      min: 1,
      max: 5,
    },
    reflection: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    highlights: [
      {
        type: String,
        trim: true,
        maxlength: 500,
      },
    ],
    challenges: [
      {
        type: String,
        trim: true,
        maxlength: 500,
      },
    ],
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for efficient queries
DayEntrySchema.index({ userId: 1, date: 1 }, { unique: true });
DayEntrySchema.index({ email: 1, date: 1 });
DayEntrySchema.index({ date: 1 });
DayEntrySchema.index({ userId: 1, date: -1 }); // for recent entries
// New indexes for audit trail
DayEntrySchema.index({
  userId: 1,
  date: 1,
  "checklistCompletions.completedItemIds": 1,
});
DayEntrySchema.index({ userId: 1, date: 1, "timeBlockCompletions.blockId": 1 });

// Update timestamps
DayEntrySchema.pre("save", function (this: IDayEntry) {
  this.updatedAt = new Date();
});

export const DayEntry =
  mongoose.models.DayEntry ||
  mongoose.model<IDayEntry>("DayEntry", DayEntrySchema);
