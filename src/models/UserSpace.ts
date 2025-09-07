import mongoose, { Schema, Document } from "mongoose";

export interface IUserSpace extends Document {
  userId: string; // reference to User._id
  email: string; // user's email for easy lookup

  // Override settings for this user
  templateSetVersion?: string; // if set, use specific template version instead of active

  // User-specific customizations that override template defaults
  timeBlockOverrides: Array<{
    blockId: string; // reference to template block
    label?: string; // custom label override
    time?: string; // custom time override
    isHidden?: boolean; // hide this block for this user
  }>;

  checklistOverrides: Array<{
    checklistId: string; // reference to template checklist
    title?: string; // custom title override
    isHidden?: boolean; // hide this checklist for this user
    itemOverrides: Array<{
      itemId: string; // reference to template item
      text?: string; // custom text override
      isHidden?: boolean; // hide this item for this user
    }>;
  }>;

  // User preferences
  preferences: {
    theme?: "light" | "dark" | "auto";
    timezone?: string;
    defaultView?: "timeblocks" | "checklists" | "both";
    notifications?: {
      timeBlockReminders?: boolean;
      dailyDigest?: boolean;
    };
  };

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt?: Date;
}

const UserSpaceSchema = new Schema<IUserSpace>({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },

  templateSetVersion: {
    type: String,
    validate: {
      validator: function (v: string) {
        if (!v) return true; // optional field
        return /^\d+\.\d+\.\d+$/.test(v);
      },
      message:
        "Template set version must be in semantic version format (x.y.z)",
    },
  },

  timeBlockOverrides: [
    {
      blockId: { type: String, required: true },
      label: { type: String, trim: true },
      time: { type: String, trim: true },
      isHidden: { type: Boolean, default: false },
    },
  ],

  checklistOverrides: [
    {
      checklistId: { type: String, required: true },
      title: { type: String, trim: true },
      isHidden: { type: Boolean, default: false },
      itemOverrides: [
        {
          itemId: { type: String, required: true },
          text: { type: String, trim: true },
          isHidden: { type: Boolean, default: false },
        },
      ],
    },
  ],

  preferences: {
    theme: {
      type: String,
      enum: ["light", "dark", "auto"],
      default: "auto",
    },
    timezone: {
      type: String,
      default: "UTC",
    },
    defaultView: {
      type: String,
      enum: ["timeblocks", "checklists", "both"],
      default: "both",
    },
    notifications: {
      timeBlockReminders: { type: Boolean, default: true },
      dailyDigest: { type: Boolean, default: false },
    },
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  lastActiveAt: {
    type: Date,
  },
});

// Indexes for efficient queries
UserSpaceSchema.index({ email: 1 });
UserSpaceSchema.index({ userId: 1 }, { unique: true });
UserSpaceSchema.index({ lastActiveAt: 1 });
// New indexes for overrides
UserSpaceSchema.index({ userId: 1, "checklistOverrides.checklistId": 1 });
UserSpaceSchema.index({ userId: 1, "timeBlockOverrides.blockId": 1 });

// Update timestamps
UserSpaceSchema.pre("save", function (this: IUserSpace) {
  this.updatedAt = new Date();
});

export const UserSpace =
  mongoose.models.UserSpace ||
  mongoose.model<IUserSpace>("UserSpace", UserSpaceSchema, "userSpaces");
