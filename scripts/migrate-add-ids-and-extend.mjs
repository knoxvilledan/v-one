#!/usr/bin/env node

import { MongoClient } from "mongodb";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.join(__dirname, "..", ".env.local");
try {
  const envFile = await fs.readFile(envPath, "utf8");
  const envVars = envFile.split("\n").reduce((acc, line) => {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0) {
      acc[key.trim()] = valueParts.join("=").trim();
    }
    return acc;
  }, {});

  Object.assign(process.env, envVars);
} catch (error) {
  console.error("Error loading .env.local:", error.message);
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not found in environment variables");
  process.exit(1);
}

// Target counts for extension
const TARGET_COUNTS = {
  timeBlocks: 18,
  masterChecklist: 18,
  habitBreakChecklist: 8,
  todoList: 20,
};

function generateId() {
  return randomUUID();
}

function createEmptyTimeBlock(index) {
  return {
    id: generateId(),
    time: `${String(Math.floor((index + 6) / 2) + 6).padStart(2, "0")}:${
      (index + 6) % 2 === 0 ? "00" : "30"
    }`,
    task: "",
    completed: false,
  };
}

function createEmptyChecklistItem(text = "") {
  return {
    id: generateId(),
    text: text,
    completed: false,
  };
}

function createEmptyTodoItem() {
  return {
    id: generateId(),
    text: "",
    completed: false,
  };
}

function addIdsToExistingItems(items) {
  if (!Array.isArray(items)) return [];

  return items.map((item) => {
    if (!item.id) {
      return {
        ...item,
        id: generateId(),
      };
    }
    return item;
  });
}

function extendArrayWithIds(existingItems, targetCount, createEmptyItem) {
  // First, add IDs to existing items
  const itemsWithIds = addIdsToExistingItems(existingItems);

  // Then extend if needed
  if (itemsWithIds.length >= targetCount) {
    return itemsWithIds; // Already at or above target
  }

  const itemsToAdd = targetCount - itemsWithIds.length;
  const newItems = [];

  for (let i = 0; i < itemsToAdd; i++) {
    if (createEmptyItem === createEmptyTimeBlock) {
      newItems.push(createEmptyTimeBlock(itemsWithIds.length + i));
    } else {
      newItems.push(createEmptyItem());
    }
  }

  return [...itemsWithIds, ...newItems];
}

async function migrateContentTemplates(db) {
  console.log("\n📋 Migrating content templates...");
  const templatesCollection = db.collection("content_templates");
  const templates = await templatesCollection.find({}).toArray();

  for (const template of templates) {
    console.log(`\n🔄 Processing template: ${template.userRole}`);

    const updates = {};
    let hasUpdates = false;

    // Migrate time blocks
    if (template.content?.timeBlocks) {
      const originalCount = template.content.timeBlocks.length;
      const updatedTimeBlocks = extendArrayWithIds(
        template.content.timeBlocks,
        TARGET_COUNTS.timeBlocks,
        createEmptyTimeBlock
      );

      if (
        updatedTimeBlocks.length !== originalCount ||
        updatedTimeBlocks.some(
          (block) =>
            !template.content.timeBlocks.find(
              (original) => original.id === block.id
            )
        )
      ) {
        updates["content.timeBlocks"] = updatedTimeBlocks;
        hasUpdates = true;
        console.log(
          `  ⏰ Time blocks: ${originalCount} → ${updatedTimeBlocks.length}`
        );
      }
    }

    // Migrate master checklist
    if (template.content?.masterChecklist) {
      const originalCount = template.content.masterChecklist.length;
      const updatedMasterChecklist = extendArrayWithIds(
        template.content.masterChecklist,
        TARGET_COUNTS.masterChecklist,
        createEmptyChecklistItem
      );

      if (
        updatedMasterChecklist.length !== originalCount ||
        updatedMasterChecklist.some(
          (item) =>
            !template.content.masterChecklist.find(
              (original) => original.id === item.id
            )
        )
      ) {
        updates["content.masterChecklist"] = updatedMasterChecklist;
        hasUpdates = true;
        console.log(
          `  ✅ Master checklist: ${originalCount} → ${updatedMasterChecklist.length}`
        );
      }
    }

    // Migrate habit break checklist
    if (template.content?.habitBreakChecklist) {
      const originalCount = template.content.habitBreakChecklist.length;
      const updatedHabitChecklist = extendArrayWithIds(
        template.content.habitBreakChecklist,
        TARGET_COUNTS.habitBreakChecklist,
        createEmptyChecklistItem
      );

      if (
        updatedHabitChecklist.length !== originalCount ||
        updatedHabitChecklist.some(
          (item) =>
            !template.content.habitBreakChecklist.find(
              (original) => original.id === item.id
            )
        )
      ) {
        updates["content.habitBreakChecklist"] = updatedHabitChecklist;
        hasUpdates = true;
        console.log(
          `  🔄 Habit checklist: ${originalCount} → ${updatedHabitChecklist.length}`
        );
      }
    }

    // Migrate todo list
    if (template.content?.todoList) {
      const originalCount = template.content.todoList.length;
      const updatedTodoList = extendArrayWithIds(
        template.content.todoList,
        TARGET_COUNTS.todoList,
        createEmptyTodoItem
      );

      if (
        updatedTodoList.length !== originalCount ||
        updatedTodoList.some(
          (item) =>
            !template.content.todoList.find(
              (original) => original.id === item.id
            )
        )
      ) {
        updates["content.todoList"] = updatedTodoList;
        hasUpdates = true;
        console.log(
          `  📝 Todo list: ${originalCount} → ${updatedTodoList.length}`
        );
      }
    }

    // Apply updates if any
    if (hasUpdates) {
      await templatesCollection.updateOne(
        { _id: template._id },
        { $set: updates }
      );
      console.log(`  ✅ Template ${template.userRole} updated successfully`);
    } else {
      console.log(`  ℹ️ Template ${template.userRole} already up to date`);
    }
  }
}

async function migrateUserData(db) {
  console.log("\n👥 Migrating user data...");
  const userDataCollection = db.collection("user_data");
  const userData = await userDataCollection.find({}).toArray();

  for (const user of userData) {
    console.log(`\n🔄 Processing user: ${user.email}`);

    const updates = {};
    let hasUpdates = false;

    // Process each date entry
    if (user.data && typeof user.data === "object") {
      const updatedData = { ...user.data };

      for (const [date, dayData] of Object.entries(user.data)) {
        const dayUpdates = { ...dayData };
        let dayHasUpdates = false;

        // Migrate time blocks
        if (dayData.timeBlocks && Array.isArray(dayData.timeBlocks)) {
          const originalCount = dayData.timeBlocks.length;
          const updatedTimeBlocks = extendArrayWithIds(
            dayData.timeBlocks,
            TARGET_COUNTS.timeBlocks,
            createEmptyTimeBlock
          );

          if (
            updatedTimeBlocks.length !== originalCount ||
            updatedTimeBlocks.some(
              (block) =>
                !dayData.timeBlocks.find((original) => original.id === block.id)
            )
          ) {
            dayUpdates.timeBlocks = updatedTimeBlocks;
            dayHasUpdates = true;
            console.log(
              `    📅 ${date} - Time blocks: ${originalCount} → ${updatedTimeBlocks.length}`
            );
          }
        }

        // Migrate master checklist
        if (dayData.masterChecklist && Array.isArray(dayData.masterChecklist)) {
          const originalCount = dayData.masterChecklist.length;
          const updatedMasterChecklist = extendArrayWithIds(
            dayData.masterChecklist,
            TARGET_COUNTS.masterChecklist,
            createEmptyChecklistItem
          );

          if (
            updatedMasterChecklist.length !== originalCount ||
            updatedMasterChecklist.some(
              (item) =>
                !dayData.masterChecklist.find(
                  (original) => original.id === item.id
                )
            )
          ) {
            dayUpdates.masterChecklist = updatedMasterChecklist;
            dayHasUpdates = true;
            console.log(
              `    📅 ${date} - Master checklist: ${originalCount} → ${updatedMasterChecklist.length}`
            );
          }
        }

        // Migrate habit break checklist
        if (
          dayData.habitBreakChecklist &&
          Array.isArray(dayData.habitBreakChecklist)
        ) {
          const originalCount = dayData.habitBreakChecklist.length;
          const updatedHabitChecklist = extendArrayWithIds(
            dayData.habitBreakChecklist,
            TARGET_COUNTS.habitBreakChecklist,
            createEmptyChecklistItem
          );

          if (
            updatedHabitChecklist.length !== originalCount ||
            updatedHabitChecklist.some(
              (item) =>
                !dayData.habitBreakChecklist.find(
                  (original) => original.id === item.id
                )
            )
          ) {
            dayUpdates.habitBreakChecklist = updatedHabitChecklist;
            dayHasUpdates = true;
            console.log(
              `    📅 ${date} - Habit checklist: ${originalCount} → ${updatedHabitChecklist.length}`
            );
          }
        }

        // Migrate todo list
        if (dayData.todoList && Array.isArray(dayData.todoList)) {
          const originalCount = dayData.todoList.length;
          const updatedTodoList = extendArrayWithIds(
            dayData.todoList,
            TARGET_COUNTS.todoList,
            createEmptyTodoItem
          );

          if (
            updatedTodoList.length !== originalCount ||
            updatedTodoList.some(
              (item) =>
                !dayData.todoList.find((original) => original.id === item.id)
            )
          ) {
            dayUpdates.todoList = updatedTodoList;
            dayHasUpdates = true;
            console.log(
              `    📅 ${date} - Todo list: ${originalCount} → ${updatedTodoList.length}`
            );
          }
        }

        if (dayHasUpdates) {
          updatedData[date] = dayUpdates;
          hasUpdates = true;
        }
      }

      if (hasUpdates) {
        updates.data = updatedData;
      }
    }

    // Apply updates if any
    if (hasUpdates) {
      await userDataCollection.updateOne({ _id: user._id }, { $set: updates });
      console.log(`  ✅ User ${user.email} updated successfully`);
    } else {
      console.log(`  ℹ️ User ${user.email} already up to date`);
    }
  }
}

async function runMigration() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log("🔗 Connecting to MongoDB...");
    await client.connect();

    const db = client.db("AmpTrack");

    console.log("🚀 Starting ID and extension migration...");
    console.log(`📊 Target counts:
  - Time blocks: ${TARGET_COUNTS.timeBlocks}
  - Master checklist: ${TARGET_COUNTS.masterChecklist}
  - Habit checklist: ${TARGET_COUNTS.habitBreakChecklist}
  - Todo list: ${TARGET_COUNTS.todoList}`);

    // Migrate content templates
    await migrateContentTemplates(db);

    // Migrate user data
    await migrateUserData(db);

    console.log("\n🎉 Migration completed successfully!");
    console.log("📝 Summary:");
    console.log("  ✅ All existing items now have stable UUIDs");
    console.log("  ✅ Arrays extended to target counts with new empty items");
    console.log("  ✅ No existing data was overwritten");
    console.log("  ✅ Relationships can now use consistent IDs");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await client.close();
  }
}

// Run migration if called directly
if (process.argv[1] === __filename) {
  runMigration()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { runMigration };
