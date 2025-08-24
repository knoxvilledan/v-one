#!/usr/bin/env node

/**
 * Backfill script to update existing user data with new component formatting
 * - Updates ID generation patterns for TodoList and WorkoutChecklist items
 * - Ensures consistent formatting across existing data
 * - Applies new component structure to existing users
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

// Define schemas based on actual database structure
const userDataSchema = new mongoose.Schema(
  {
    date: String,
    userId: String,
    displayDate: String,
    blocks: [
      {
        id: String,
        time: String,
        label: String,
        notes: [String],
        complete: Boolean,
        duration: Number,
        index: Number,
      },
    ],
    masterChecklist: [
      {
        id: String,
        text: String,
        completed: Boolean,
        category: String,
        targetBlock: Number,
        completedAt: Date,
        completionTimezone: String,
        timezoneOffset: Number,
      },
    ],
    habitBreakChecklist: [
      {
        id: String,
        text: String,
        completed: Boolean,
        category: String,
        targetBlock: Number,
        completedAt: Date,
        completionTimezone: String,
        timezoneOffset: Number,
      },
    ],
    todoList: [
      {
        id: String,
        text: String,
        completed: Boolean,
        category: String,
        dueDate: String,
        targetBlock: Number,
        completedAt: Date,
        completionTimezone: String,
        timezoneOffset: Number,
      },
    ],
    workoutChecklist: [
      {
        id: String,
        text: String,
        completed: Boolean,
        category: String,
        targetBlock: Number,
        completedAt: Date,
        completionTimezone: String,
        timezoneOffset: Number,
      },
    ],
    score: Number,
    wakeTime: String,
    dailyWakeTime: String,
    userTimezone: String,
  },
  { timestamps: true }
);

const UserData = mongoose.model("user_data", userDataSchema, "user_data");

/**
 * Generate a new-format ID for checklist items
 */
function generateNewFormatId(type, existingIds = [], sequenceBase = 0) {
  let attempts = 0;
  let newId;

  do {
    const timestamp = Date.now() + attempts; // Prevent collisions during rapid generation
    const random = Math.floor(Math.random() * 10000);
    const sequence = sequenceBase + attempts;
    newId = `${type}-${timestamp}-${random}-${sequence}`;
    attempts++;
  } while (existingIds.includes(newId) && attempts < 100);

  return newId;
}

/**
 * Check if an ID follows the old format (likely just Date.now() or simple patterns)
 */
function isOldFormatId(id) {
  // Old format patterns we want to replace:
  // 1. Pure numbers (Date.now())
  // 2. Simple prefixes without the new timestamp-random-sequence pattern
  // 3. IDs that don't match our new pattern: type-timestamp-random-sequence

  const newFormatPattern = /^(todo|workout|mc|hb|wo|tb)-\d{13}-\d{1,4}-\d+$/;

  if (newFormatPattern.test(id)) {
    return false; // Already new format
  }

  return true; // Needs updating
}

/**
 * Update checklist item IDs to new format while preserving all other data
 */
function updateChecklistIds(items, type) {
  if (!items || !Array.isArray(items)) return { items: [], updated: false };

  let updated = false;
  const existingIds = items.map((item) => item.id);
  const updatedItems = [];

  items.forEach((item, index) => {
    const updatedItem = { ...item };

    if (isOldFormatId(item.id)) {
      const newId = generateNewFormatId(type, existingIds, index);
      updatedItem.id = newId;
      existingIds.push(newId); // Prevent duplicates in this batch
      updated = true;

      console.log(`    🔄 Updated ID: ${item.id} → ${newId}`);
    }

    updatedItems.push(updatedItem);
  });

  return { items: updatedItems, updated };
}

/**
 * Ensure workout items have valid P90X categories
 */
function normalizeWorkoutCategories(items) {
  if (!items || !Array.isArray(items)) return { items: [], updated: false };

  const validCategories = [
    "strength",
    "cardio",
    "yoga",
    "stretching",
    "sports",
    "walking",
  ];
  let updated = false;

  const updatedItems = items.map((item) => {
    const updatedItem = { ...item };

    // Set default category if missing or invalid
    if (!item.category || !validCategories.includes(item.category)) {
      updatedItem.category = "cardio"; // Default to cardio for P90X
      updated = true;
      console.log(
        `    📝 Updated category for "${item.text}": ${
          item.category || "undefined"
        } → cardio`
      );
    }

    return updatedItem;
  });

  return { items: updatedItems, updated };
}

/**
 * Ensure todo items have proper structure
 */
function normalizeTodoItems(items, currentDate) {
  if (!items || !Array.isArray(items)) return { items: [], updated: false };

  let updated = false;

  const updatedItems = items.map((item) => {
    const updatedItem = { ...item };

    // Ensure category is set
    if (!item.category) {
      updatedItem.category = "todo";
      updated = true;
      console.log(`    📝 Added category to "${item.text}": undefined → todo`);
    }

    // Ensure dueDate is set (use current date as fallback)
    if (!item.dueDate) {
      updatedItem.dueDate = currentDate;
      updated = true;
      console.log(
        `    📅 Added dueDate to "${item.text}": undefined → ${currentDate}`
      );
    }

    return updatedItem;
  });

  return { items: updatedItems, updated };
}

async function backfillComponentFormatting() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    console.log("📊 Analyzing existing user data for component formatting...");
    const users = await UserData.find({});
    console.log(`📁 Found ${users.length} user data records`);

    let totalUpdatedRecords = 0;
    let totalUpdatedItems = 0;
    let totalIdUpdates = 0;
    let totalCategoryUpdates = 0;

    for (const userData of users) {
      console.log(`\n👤 Processing: ${userData.userId} (${userData.date})`);

      let recordUpdated = false;
      let itemsUpdated = 0;

      // Update TodoList IDs and structure
      if (userData.todoList) {
        console.log(
          `  📋 Processing ${userData.todoList.length} todo items...`
        );

        const todoResult = updateChecklistIds(userData.todoList, "todo");
        const normalizedTodos = normalizeTodoItems(
          todoResult.items,
          userData.date
        );

        if (todoResult.updated || normalizedTodos.updated) {
          userData.todoList = normalizedTodos.items;
          recordUpdated = true;
          itemsUpdated += userData.todoList.length;

          if (todoResult.updated) totalIdUpdates++;
          if (normalizedTodos.updated) totalCategoryUpdates++;
        }
      }

      // Update WorkoutChecklist IDs and structure
      if (userData.workoutChecklist) {
        console.log(
          `  💪 Processing ${userData.workoutChecklist.length} workout items...`
        );

        const workoutResult = updateChecklistIds(
          userData.workoutChecklist,
          "workout"
        );
        const normalizedWorkouts = normalizeWorkoutCategories(
          workoutResult.items
        );

        if (workoutResult.updated || normalizedWorkouts.updated) {
          userData.workoutChecklist = normalizedWorkouts.items;
          recordUpdated = true;
          itemsUpdated += userData.workoutChecklist.length;

          if (workoutResult.updated) totalIdUpdates++;
          if (normalizedWorkouts.updated) totalCategoryUpdates++;
        }
      }

      // Initialize workoutChecklist if it doesn't exist
      if (!userData.workoutChecklist) {
        userData.workoutChecklist = [];
        recordUpdated = true;
        console.log(`  🆕 Initialized empty workoutChecklist`);
      }

      // Save changes if any were made
      if (recordUpdated) {
        await userData.save();
        totalUpdatedRecords++;
        totalUpdatedItems += itemsUpdated;
        console.log(`  💾 Saved ${itemsUpdated} updated items for this record`);
      } else {
        console.log(`  ⏭️  No formatting updates needed`);
      }
    }

    console.log(`\n📊 Component Formatting Backfill Summary:`);
    console.log(`   Records updated: ${totalUpdatedRecords}`);
    console.log(`   Total items processed: ${totalUpdatedItems}`);
    console.log(`   ID format updates: ${totalIdUpdates}`);
    console.log(`   Category normalizations: ${totalCategoryUpdates}`);
    console.log(`✅ Component formatting backfill completed successfully!`);
  } catch (error) {
    console.error("❌ Error during component formatting backfill:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Run the backfill
console.log("🎨 Starting Component Formatting Backfill...");
console.log(
  "🔧 Updating TodoList and WorkoutChecklist formatting for existing users"
);
backfillComponentFormatting();
