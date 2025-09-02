import mongoose, { Schema, Document } from "mongoose";

export interface ITodoItem extends Document {
  userId: string; // reference to User._id
  email: string; // user's email for easy lookup

  // Todo content
  text: string;
  description?: string; // optional longer description
  priority: "low" | "medium" | "high" | "urgent";

  // Status and completion
  status: "pending" | "in-progress" | "completed" | "cancelled";
  completedAt?: Date;

  // Organization
  category?: string; // user-defined category like "work", "personal", etc.
  tags?: string[]; // user-defined tags for filtering

  // Scheduling
  dueDate?: Date;
  scheduledDate?: string; // YYYY-MM-DD format for when to work on it
  estimatedDuration?: number; // estimated minutes to complete
  actualDuration?: number; // actual minutes spent (when completed)

  // Context and relationships
  relatedTimeBlockId?: string; // if this todo relates to a time block
  relatedChecklistId?: string; // if this todo relates to a checklist
  parentTodoId?: string; // for subtasks

  // Progress tracking
  notes?: string; // user notes and progress updates
  progressHistory?: Array<{
    status: "pending" | "in-progress" | "completed" | "cancelled";
    notes?: string;
    updatedAt: Date;
  }>;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  archivedAt?: Date; // when completed todos are archived
}

const TodoItemSchema = new Schema<ITodoItem>({
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

  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000,
  },
  priority: {
    type: String,
    required: true,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium",
  },

  status: {
    type: String,
    required: true,
    enum: ["pending", "in-progress", "completed", "cancelled"],
    default: "pending",
    index: true,
  },
  completedAt: {
    type: Date,
  },

  category: {
    type: String,
    trim: true,
    maxlength: 50,
  },
  tags: [
    {
      type: String,
      trim: true,
      maxlength: 30,
    },
  ],

  dueDate: {
    type: Date,
  },
  scheduledDate: {
    type: String,
    validate: {
      validator: function (v: string) {
        if (!v) return true; // optional field
        return /^\d{4}-\d{2}-\d{2}$/.test(v);
      },
      message: "Scheduled date must be in YYYY-MM-DD format",
    },
  },
  estimatedDuration: {
    type: Number,
    min: 1,
    max: 1440, // max 24 hours in minutes
  },
  actualDuration: {
    type: Number,
    min: 1,
    max: 1440,
  },

  relatedTimeBlockId: {
    type: String,
    trim: true,
  },
  relatedChecklistId: {
    type: String,
    trim: true,
  },
  parentTodoId: {
    type: String,
    trim: true,
  },

  notes: {
    type: String,
    trim: true,
    maxlength: 2000,
  },
  progressHistory: [
    {
      status: {
        type: String,
        required: true,
        enum: ["pending", "in-progress", "completed", "cancelled"],
      },
      notes: {
        type: String,
        trim: true,
        maxlength: 500,
      },
      updatedAt: {
        type: Date,
        required: true,
        default: Date.now,
      },
    },
  ],

  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  archivedAt: {
    type: Date,
  },
});

// Indexes for efficient queries
TodoItemSchema.index({ userId: 1, status: 1 });
TodoItemSchema.index({ email: 1, status: 1 });
TodoItemSchema.index({ userId: 1, dueDate: 1 });
TodoItemSchema.index({ userId: 1, scheduledDate: 1 });
TodoItemSchema.index({ userId: 1, priority: 1, status: 1 });
TodoItemSchema.index({ userId: 1, category: 1 });
TodoItemSchema.index({ tags: 1 });
TodoItemSchema.index({ parentTodoId: 1 });
TodoItemSchema.index({ archivedAt: 1 });

// Update completion timestamp and add to progress history
TodoItemSchema.pre("save", function (this: ITodoItem) {
  this.updatedAt = new Date();

  // Set completedAt when status changes to completed
  if (this.isModified("status")) {
    if (this.status === "completed" && !this.completedAt) {
      this.completedAt = new Date();
    } else if (this.status !== "completed" && this.completedAt) {
      this.completedAt = undefined;
    }

    // Add to progress history
    if (!this.progressHistory) {
      this.progressHistory = [];
    }
    this.progressHistory.push({
      status: this.status,
      updatedAt: new Date(),
    });
  }
});

export const TodoItem =
  mongoose.models.TodoItem ||
  mongoose.model<ITodoItem>("TodoItem", TodoItemSchema);
