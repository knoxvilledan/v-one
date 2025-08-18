#!/usr/bin/env node

/**
 * Clean up empty placeholder items that may exist in user data
 * This script removes checklist items and timeblock todos with empty text
 * to fix remaining count calculations across all users.
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, "..", ".env.local") });

// MongoDB connection string
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
        title: String,
        notes: [String],
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

async function cleanupEmptyItems() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    console.log("📊 Fetching all user data...");
    const users = await UserData.find({});
    console.log(`📁 Found ${users.length} user data records`);

    let totalUpdatedUsers = 0;
    let totalRemovedItems = 0;

    for (const userData of users) {
      let userUpdated = false;
      let userRemovedItems = 0;

      console.log(
        `\n👤 Processing user data: ${userData.userId} (${userData.date})`
      );

      // Clean up timeBlock todos (called "blocks" in this schema)
      if (userData.blocks) {
        for (const timeBlock of userData.blocks) {
          if (timeBlock.todos) {
            const originalCount = timeBlock.todos.length;
            timeBlock.todos = timeBlock.todos.filter(
              (todo) => todo.text && todo.text.trim() !== ""
            );
            const removedCount = originalCount - timeBlock.todos.length;
            if (removedCount > 0) {
              console.log(
                `  📝 TimeBlock "${timeBlock.title}": Removed ${removedCount} empty todos`
              );
              userRemovedItems += removedCount;
              userUpdated = true;
            }
          }
        }
      }

      // Clean up master checklist
      if (userData.masterChecklist) {
        const originalCount = userData.masterChecklist.length;
        userData.masterChecklist = userData.masterChecklist.filter(
          (item) => item.text && item.text.trim() !== ""
        );
        const removedCount = originalCount - userData.masterChecklist.length;
        if (removedCount > 0) {
          console.log(
            `  ✅ Master Checklist: Removed ${removedCount} empty items`
          );
          userRemovedItems += removedCount;
          userUpdated = true;
        }
      }

      // Clean up habit break checklist
      if (userData.habitBreakChecklist) {
        const originalCount = userData.habitBreakChecklist.length;
        userData.habitBreakChecklist = userData.habitBreakChecklist.filter(
          (item) => item.text && item.text.trim() !== ""
        );
        const removedCount =
          originalCount - userData.habitBreakChecklist.length;
        if (removedCount > 0) {
          console.log(
            `  🚫 Habit Break Checklist: Removed ${removedCount} empty items`
          );
          userRemovedItems += removedCount;
          userUpdated = true;
        }
      }

      // Clean up todo list
      if (userData.todoList) {
        const originalCount = userData.todoList.length;
        userData.todoList = userData.todoList.filter(
          (item) => item.text && item.text.trim() !== ""
        );
        const removedCount = originalCount - userData.todoList.length;
        if (removedCount > 0) {
          console.log(`  📋 Todo List: Removed ${removedCount} empty items`);
          userRemovedItems += removedCount;
          userUpdated = true;
        }
      }

      // Save if updated
      if (userUpdated) {
        await userData.save();
        console.log(
          `  💾 Saved updates for ${userData.userId} (${userRemovedItems} items removed)`
        );
        totalUpdatedUsers++;
        totalRemovedItems += userRemovedItems;
      } else {
        console.log(`  ✨ No empty items found for ${userData.userId}`);
      }
    }

    console.log("\n🎉 Cleanup Complete!");
    console.log(`📊 Summary:`);
    console.log(`   - User data records processed: ${users.length}`);
    console.log(`   - Records updated: ${totalUpdatedUsers}`);
    console.log(`   - Empty items removed: ${totalRemovedItems}`);

    if (totalUpdatedUsers > 0) {
      console.log(
        "\n✅ All users now have clean data with accurate remaining counts!"
      );
    } else {
      console.log("\n✨ All user data was already clean!");
    }
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Run the cleanup
cleanupEmptyItems();
