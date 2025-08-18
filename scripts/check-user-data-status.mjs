#!/usr/bin/env node

/**
 * Check if existing user data needs any additional updates
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
        todos: [
          {
            id: String,
            text: String,
            completed: Boolean,
            category: String,
            dueDate: String,
            targetBlock: Number,
            completedAt: Date,
          },
        ],
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
      },
    ],
    score: Number,
    wakeTime: String,
  },
  { timestamps: true }
);

const UserData = mongoose.model("user_data", userDataSchema, "user_data");

async function checkUserDataStatus() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    console.log("📊 Analyzing existing user data...");
    const users = await UserData.find({});
    console.log(`📁 Found ${users.length} user data records`);

    let issuesFound = 0;

    for (const userData of users) {
      console.log(`\n👤 Checking: ${userData.userId} (${userData.date})`);

      // Check for blocks without IDs
      let blocksWithoutIds = 0;
      if (userData.blocks) {
        blocksWithoutIds = userData.blocks.filter((block) => !block.id).length;
        if (blocksWithoutIds > 0) {
          console.log(
            `  ⚠️  Blocks without IDs: ${blocksWithoutIds}/${userData.blocks.length}`
          );
          issuesFound++;
        } else {
          console.log(
            `  ✅ All blocks have IDs (${userData.blocks.length} blocks)`
          );
        }
      }

      // Check for empty items (should be clean after our cleanup)
      const emptyMasterItems =
        userData.masterChecklist?.filter(
          (item) => !item.text || item.text.trim() === ""
        ).length || 0;
      const emptyHabitItems =
        userData.habitBreakChecklist?.filter(
          (item) => !item.text || item.text.trim() === ""
        ).length || 0;
      const emptyTodoItems =
        userData.todoList?.filter(
          (item) => !item.text || item.text.trim() === ""
        ).length || 0;

      if (emptyMasterItems > 0 || emptyHabitItems > 0 || emptyTodoItems > 0) {
        console.log(
          `  ⚠️  Empty items found: Master(${emptyMasterItems}), Habit(${emptyHabitItems}), Todo(${emptyTodoItems})`
        );
        issuesFound++;
      } else {
        console.log(`  ✅ No empty items found`);
      }

      // Check data structure validity
      const masterCount = userData.masterChecklist?.length || 0;
      const habitCount = userData.habitBreakChecklist?.length || 0;
      const todoCount = userData.todoList?.length || 0;

      console.log(
        `  📊 Item counts: Master(${masterCount}), Habit(${habitCount}), Todo(${todoCount})`
      );
    }

    console.log("\n🎉 Analysis Complete!");
    if (issuesFound === 0) {
      console.log("✅ All user data is properly formatted and ready!");
      console.log("✅ No additional migration needed.");
    } else {
      console.log(`⚠️  Found ${issuesFound} records that might need updates`);
      console.log(
        "💡 The API will automatically handle these issues on next save/load"
      );
    }
  } catch (error) {
    console.error("❌ Error during analysis:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

checkUserDataStatus();
