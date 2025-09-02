import mongoose, { Schema, Document } from "mongoose";

export interface ITemplateSet extends Document {
  version: string; // semantic version like "1.0.0"
  role: "public" | "admin";
  name: string; // descriptive name like "Default Public Templates v1.0"
  description?: string;

  // Template content structure
  timeBlocks: Array<{
    blockId: string;
    time: string;
    label: string;
    order: number;
  }>;
  timeBlocksOrder: string[];

  checklists: Array<{
    checklistId: string;
    title: string;
    items: Array<{
      itemId: string;
      text: string;
      order: number;
    }>;
    itemsOrder: string[];
    order: number;
  }>;
  checklistsOrder: string[];

  // Metadata
  isActive: boolean; // only one active template set per role
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string; // admin user who created this template set
}

const TemplateSetSchema = new Schema<ITemplateSet>({
  version: {
    type: String,
    required: true,
    validate: {
      validator: function (v: string) {
        // Simple semantic version validation (x.y.z)
        return /^\d+\.\d+\.\d+$/.test(v);
      },
      message: "Version must be in semantic version format (x.y.z)",
    },
  },
  role: {
    type: String,
    required: true,
    enum: ["public", "admin"],
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
  },

  timeBlocks: [
    {
      blockId: { type: String, required: true },
      time: { type: String, required: true },
      label: { type: String, required: true, trim: true },
      order: { type: Number, required: true, min: 1 },
    },
  ],
  timeBlocksOrder: [{ type: String, required: true }],

  checklists: [
    {
      checklistId: { type: String, required: true },
      title: { type: String, required: true, trim: true },
      items: [
        {
          itemId: { type: String, required: true },
          text: { type: String, required: true, trim: true },
          order: { type: Number, required: true, min: 1 },
        },
      ],
      itemsOrder: [{ type: String, required: true }],
      order: { type: Number, required: true, min: 1 },
    },
  ],
  checklistsOrder: [{ type: String, required: true }],

  isActive: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  createdBy: {
    type: String,
    trim: true,
  },
});

// Indexes for efficient queries
TemplateSetSchema.index({ role: 1, isActive: 1 });
TemplateSetSchema.index({ version: 1, role: 1 }, { unique: true });

// Ensure only one active template set per role
TemplateSetSchema.pre("save", async function (this: ITemplateSet) {
  if (this.isActive && this.isModified("isActive")) {
    // Deactivate all other template sets for this role
    await mongoose
      .model("TemplateSet")
      .updateMany(
        { role: this.role, _id: { $ne: this._id } },
        { $set: { isActive: false } }
      );
  }

  this.updatedAt = new Date();
});

export const TemplateSet =
  mongoose.models.TemplateSet ||
  mongoose.model<ITemplateSet>("TemplateSet", TemplateSetSchema);
