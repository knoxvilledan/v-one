#!/usr/bin/env node

/**
 * Migration Script: Current System → Plan System
 *
 * Migrates from content_templates/user_data to templateSets/userSpaces/dayEntries/todoItems
 * to enable rich user customizations while preserving all existing data.
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, "..", ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI environment variable is required");
  process.exit(1);
}

// Define current system schemas
const currentContentTemplateSchema = new mongoose.Schema({
  userRole: String,
  type: String,
  content: {
    masterChecklist: Array,
    habitBreakChecklist: Array,
    workoutChecklist: Array,
    timeBlocks: Array,
    placeholderText: Object,
    timeBlocksOrder: Array,
    checklistSectionOrder: Array,
    masterChecklistOrder: Array,
    habitBreakChecklistOrder: Array,
    workoutChecklistOrder: Array,
  },
  createdAt: Date,
  updatedAt: Date,
});

const currentUserDataSchema = new mongoose.Schema({
  date: String,
  userId: String,
  displayDate: String,
  blocks: Array,
  masterChecklist: Array,
  habitBreakChecklist: Array,
  workoutChecklist: Array,
  todoList: Array,
  timeBlocksOrder: Array,
  checklistSectionOrder: Array,
  masterChecklistOrder: Array,
  habitBreakChecklistOrder: Array,
  workoutChecklistOrder: Array,
  todoListOrder: Array,
  score: Number,
  wakeTime: String,
  dailyWakeTime: String,
  userTimezone: String,
  createdAt: Date,
  updatedAt: Date,
});

// Define plan system schemas
const templateSetSchema = new mongoose.Schema({
  version: String,
  role: { type: String, enum: ["public", "admin"] },
  name: String,
  description: String,
  timeBlocks: [
    {
      blockId: String,
      time: String,
      label: String,
      order: Number,
    },
  ],
  timeBlocksOrder: [String],
  checklists: [
    {
      checklistId: String,
      title: String,
      items: [
        {
          itemId: String,
          text: String,
          order: Number,
        },
      ],
      itemsOrder: [String],
      order: Number,
    },
  ],
  checklistsOrder: [String],
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date,
  createdBy: String,
});

const userSpaceSchema = new mongoose.Schema({
  userId: String,
  email: String,
  customizations: {
    timeBlocks: Object,
    checklists: Object,
    preferences: Object,
  },
  lastActiveAt: Date,
  version: String,
  createdAt: Date,
  updatedAt: Date,
});

const dayEntrySchema = new mongoose.Schema({
  userId: String,
  email: String,
  date: String,
  displayDate: String,
  templateVersion: String,
  data: {
    timeBlocks: Array,
    checklists: Array,
    todos: Array,
    score: Number,
    wakeTime: String,
    notes: Object,
  },
  metadata: {
    timezone: String,
    completedAt: Date,
    lastModified: Date,
  },
  createdAt: Date,
  updatedAt: Date,
});

const todoItemSchema = new mongoose.Schema({
  todoId: String,
  userId: String,
  email: String,
  title: String,
  description: String,
  status: {
    type: String,
    enum: ["pending", "in_progress", "completed", "cancelled"],
  },
  priority: { type: String, enum: ["low", "medium", "high", "urgent"] },
  category: String,
  tags: [String],
  dueDate: Date,
  scheduledDate: Date,
  completedAt: Date,
  archivedAt: Date,
  parentTodoId: String,
  order: Number,
  estimatedMinutes: Number,
  actualMinutes: Number,
  createdAt: Date,
  updatedAt: Date,
});

// Create models
const ContentTemplate = mongoose.model(
  "content_templates",
  currentContentTemplateSchema,
  "content_templates"
);
const UserData = mongoose.model(
  "user_data",
  currentUserDataSchema,
  "user_data"
);

const TemplateSet = mongoose.model(
  "TemplateSet",
  templateSetSchema,
  "templateSets"
);
const UserSpace = mongoose.model("UserSpace", userSpaceSchema, "userSpaces");
const DayEntry = mongoose.model("DayEntry", dayEntrySchema, "dayEntries");
const TodoItem = mongoose.model("TodoItem", todoItemSchema, "todoItems");

/**
 * Generate stable IDs for plan system
 */
function generateId(type, category = "", sequence = "") {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);

  if (type === "template") {
    return `tmpl_${timestamp}_${random}`;
  } else if (type === "checklist") {
    return `cl_${category}_${sequence || timestamp}`;
  } else if (type === "block") {
    return `tb_${timestamp}_${random}`;
  } else if (type === "item") {
    return `item_${timestamp}_${random}`;
  } else if (type === "todo") {
    return `todo_${timestamp}_${random}`;
  }

  return `${type}_${timestamp}_${random}`;
}

/**
 * Convert content template to template set
 */
function convertToTemplateSet(contentTemplate) {
  const timeBlocks =
    contentTemplate.content.timeBlocks?.map((block, index) => ({
      blockId: block.blockId || block.id || generateId("block"),
      time: block.time,
      label: block.label,
      order: block.order || index + 1,
    })) || [];

  const checklists = [];

  // Convert master checklist
  if (contentTemplate.content.masterChecklist?.length) {
    checklists.push({
      checklistId: "master_checklist",
      title: "Daily Master Checklist",
      items: contentTemplate.content.masterChecklist.map((item, index) => ({
        itemId: item.itemId || item.id || generateId("item"),
        text: item.text,
        order: item.order || index + 1,
      })),
      itemsOrder:
        contentTemplate.content.masterChecklistOrder ||
        contentTemplate.content.masterChecklist.map(
          (item) => item.itemId || item.id || generateId("item")
        ),
      order: 1,
    });
  }

  // Convert habit break checklist
  if (contentTemplate.content.habitBreakChecklist?.length) {
    checklists.push({
      checklistId: "habit_break_checklist",
      title: "Habit Break Tracker",
      items: contentTemplate.content.habitBreakChecklist.map((item, index) => ({
        itemId: item.itemId || item.id || generateId("item"),
        text: item.text,
        order: item.order || index + 1,
      })),
      itemsOrder:
        contentTemplate.content.habitBreakChecklistOrder ||
        contentTemplate.content.habitBreakChecklist.map(
          (item) => item.itemId || item.id || generateId("item")
        ),
      order: 2,
    });
  }

  // Convert workout checklist
  if (contentTemplate.content.workoutChecklist?.length) {
    checklists.push({
      checklistId: "workout_checklist",
      title: "Workout Tracker",
      items: contentTemplate.content.workoutChecklist.map((item, index) => ({
        itemId: item.itemId || item.id || generateId("item"),
        text: item.text,
        order: item.order || index + 1,
      })),
      itemsOrder:
        contentTemplate.content.workoutChecklistOrder ||
        contentTemplate.content.workoutChecklist.map(
          (item) => item.itemId || item.id || generateId("item")
        ),
      order: 3,
    });
  }

  return {
    version: "1.0.0",
    role: contentTemplate.userRole,
    name: `${
      contentTemplate.userRole.charAt(0).toUpperCase() +
      contentTemplate.userRole.slice(1)
    } Template Set`,
    description: `${contentTemplate.userRole} user template converted from content_templates`,
    timeBlocks,
    timeBlocksOrder:
      contentTemplate.content.timeBlocksOrder ||
      timeBlocks.map((tb) => tb.blockId),
    checklists,
    checklistsOrder: checklists.map((cl) => cl.checklistId),
    isActive: true,
    createdAt: contentTemplate.createdAt || new Date(),
    updatedAt: new Date(),
    createdBy: contentTemplate.userRole === "admin" ? "system" : null,
  };
}

/**
 * Convert user data to day entry with user space customizations
 */
function convertToDayEntry(userData, userId, email, templateVersion = "1.0.0") {
  return {
    userId,
    email,
    date: userData.date,
    displayDate: userData.displayDate || userData.date,
    templateVersion,
    data: {
      timeBlocks:
        userData.blocks?.map((block) => ({
          blockId: block.blockId || block.id,
          time: block.time,
          label: block.label,
          notes: block.notes || [],
          complete: block.complete || false,
          duration: block.duration,
          index: block.index,
        })) || [],
      checklists: {
        master:
          userData.masterChecklist?.map((item) => ({
            itemId: item.itemId || item.id,
            text: item.text,
            completed: item.completed || false,
            category: item.category,
            completedAt: item.completedAt,
            targetBlockId: item.targetBlockId,
          })) || [],
        habitBreak:
          userData.habitBreakChecklist?.map((item) => ({
            itemId: item.itemId || item.id,
            text: item.text,
            completed: item.completed || false,
            category: item.category,
            completedAt: item.completedAt,
          })) || [],
        workout:
          userData.workoutChecklist?.map((item) => ({
            itemId: item.itemId || item.id,
            text: item.text,
            completed: item.completed || false,
            category: item.category,
            completedAt: item.completedAt,
          })) || [],
      },
      todos:
        userData.todoList?.map((item) => ({
          itemId: item.itemId || item.id,
          text: item.text,
          completed: item.completed || false,
          category: item.category,
          dueDate: item.dueDate,
          completedAt: item.completedAt,
        })) || [],
      score: userData.score || 0,
      wakeTime: userData.dailyWakeTime || userData.wakeTime || "",
      notes: {},
    },
    metadata: {
      timezone: userData.userTimezone || null,
      completedAt: null,
      lastModified: userData.updatedAt || new Date(),
    },
    createdAt: userData.createdAt || new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Extract user customizations from user data
 */
function extractUserCustomizations(userData) {
  return {
    timeBlocks: {}, // No customizations detected in current system
    checklists: {}, // No customizations detected in current system
    preferences: {
      wakeTime: userData.dailyWakeTime || userData.wakeTime,
      timezone: userData.userTimezone,
      checklistSectionOrder: userData.checklistSectionOrder,
      timeBlocksOrder: userData.timeBlocksOrder,
    },
  };
}

/**
 * Main migration function
 */
async function migrateToTemplateSystem() {
  try {
    console.log(
      "🚀 Starting migration to Plan System (TemplateSet architecture)..."
    );
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Step 1: Migrate Content Templates to Template Sets
    console.log("\n📋 Step 1: Migrating content templates to template sets...");
    const contentTemplates = await ContentTemplate.find({});
    console.log(`Found ${contentTemplates.length} content templates`);

    for (const contentTemplate of contentTemplates) {
      const templateSet = convertToTemplateSet(contentTemplate);

      await TemplateSet.findOneAndUpdate(
        { role: templateSet.role, version: templateSet.version },
        { $set: templateSet },
        { upsert: true, new: true }
      );

      console.log(
        `✅ Migrated ${contentTemplate.userRole} template to TemplateSet`
      );
    }

    // Step 2: Get users for mapping
    console.log("\n👤 Step 2: Getting user mappings...");
    const db = mongoose.connection.db;
    const users = await db.collection("users").find({}).toArray();
    const userEmailMap = {};
    users.forEach((user) => {
      userEmailMap[user._id.toString()] = user.email;
    });
    console.log(`Found ${users.length} users`);

    // Step 3: Migrate User Data to Day Entries and User Spaces
    console.log(
      "\n📅 Step 3: Migrating user data to day entries and user spaces..."
    );
    const userData = await UserData.find({});
    console.log(`Found ${userData.length} user data records`);

    const userSpaces = new Map();
    let migratedDayEntries = 0;

    for (const userRecord of userData) {
      const email = userEmailMap[userRecord.userId];
      if (!email) {
        console.warn(`⚠️  No email found for userId: ${userRecord.userId}`);
        continue;
      }

      // Create/update user space
      if (!userSpaces.has(userRecord.userId)) {
        const customizations = extractUserCustomizations(userRecord);

        const userSpace = {
          userId: userRecord.userId,
          email,
          customizations,
          lastActiveAt: userRecord.updatedAt || new Date(),
          version: "1.0.0",
          createdAt: userRecord.createdAt || new Date(),
          updatedAt: new Date(),
        };

        userSpaces.set(userRecord.userId, userSpace);
      }

      // Create day entry
      const dayEntry = convertToDayEntry(userRecord, userRecord.userId, email);

      await DayEntry.findOneAndUpdate(
        { userId: userRecord.userId, date: userRecord.date },
        { $set: dayEntry },
        { upsert: true, new: true }
      );

      migratedDayEntries++;
    }

    // Save user spaces
    console.log("\n🏠 Step 4: Creating user spaces...");
    let createdUserSpaces = 0;
    for (const [userId, userSpace] of userSpaces) {
      await UserSpace.findOneAndUpdate(
        { userId },
        { $set: userSpace },
        { upsert: true, new: true }
      );
      createdUserSpaces++;
    }

    // Step 5: Extract todo items from user data
    console.log("\n✅ Step 5: Extracting todo items...");
    let createdTodos = 0;

    for (const userRecord of userData) {
      const email = userEmailMap[userRecord.userId];
      if (!email || !userRecord.todoList?.length) continue;

      for (const todoItem of userRecord.todoList) {
        const todo = {
          todoId: todoItem.itemId || todoItem.id || generateId("todo"),
          userId: userRecord.userId,
          email,
          title: todoItem.text,
          description: "",
          status: todoItem.completed ? "completed" : "pending",
          priority: "medium",
          category: todoItem.category || "general",
          tags: [],
          dueDate: todoItem.dueDate ? new Date(todoItem.dueDate) : null,
          scheduledDate: new Date(userRecord.date),
          completedAt: todoItem.completedAt
            ? new Date(todoItem.completedAt)
            : null,
          archivedAt: null,
          parentTodoId: null,
          order: todoItem.order || 0,
          estimatedMinutes: null,
          actualMinutes: null,
          createdAt: userRecord.createdAt || new Date(),
          updatedAt: new Date(),
        };

        await TodoItem.findOneAndUpdate(
          { todoId: todo.todoId, userId: userRecord.userId },
          { $set: todo },
          { upsert: true, new: true }
        );

        createdTodos++;
      }
    }

    // Migration summary
    console.log("\n🎉 Migration completed successfully!");
    console.log("📊 Migration Summary:");
    console.log(`  TemplateSet: ${contentTemplates.length} created`);
    console.log(`  UserSpace: ${createdUserSpaces} created`);
    console.log(`  DayEntry: ${migratedDayEntries} created`);
    console.log(`  TodoItem: ${createdTodos} created`);

    // Verify new collections
    console.log("\n🔍 Verifying new collections...");
    const templateSetsCount = await TemplateSet.countDocuments();
    const userSpacesCount = await UserSpace.countDocuments();
    const dayEntriesCount = await DayEntry.countDocuments();
    const todoItemsCount = await TodoItem.countDocuments();

    console.log(`✅ templateSets: ${templateSetsCount} documents`);
    console.log(`✅ userSpaces: ${userSpacesCount} documents`);
    console.log(`✅ dayEntries: ${dayEntriesCount} documents`);
    console.log(`✅ todoItems: ${todoItemsCount} documents`);

    console.log(
      "\n🔄 Plan System migration complete! User customizations are now supported."
    );
    console.log("Next steps:");
    console.log("1. Test the hydration API: GET /api/hydrate");
    console.log("2. Verify user customization features");
    console.log("3. Implement admin template hierarchical sync");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Run migration
migrateToTemplateSystem();
