#!/usr/bin/env node

/**
 * Backfill existing completion data with proper time block assignments
 * Uses the new 18-hour block system with wake time rules
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
    score: Number,
    wakeTime: String,
    dailyWakeTime: String,
    userTimezone: String,
  },
  { timestamps: true }
);

const UserData = mongoose.model("user_data", userDataSchema, "user_data");

/**
 * Calculate the appropriate time block for a completion using the new 18-hour system
 */
function calculateCompletionBlock(
  completionTime,
  wakeSettings,
  userTimezone = "America/New_York"
) {
  // Convert to local time
  const localTime = new Date(completionTime);
  const localHour = localTime.getHours();
  const localDate = localTime.toISOString().split("T")[0];

  let blockIndex;

  // Check if we have wake settings for the same local day
  const hasWakeTimeForDay =
    wakeSettings && wakeSettings.date === localDate && wakeSettings.wakeTime;

  if (hasWakeTimeForDay) {
    // Parse wake time
    const [wakeHour, wakeMinute] = wakeSettings.wakeTime.split(":").map(Number);
    const wakeTimeMinutes = wakeHour * 60 + wakeMinute;
    const completionMinutes = localHour * 60 + localTime.getMinutes();

    // Early-morning special rule: If completion is from wake-up through 4:59 a.m.
    if (completionMinutes >= wakeTimeMinutes && localHour < 5) {
      blockIndex = 0; // Goes to 4:00 a.m. block
    } else {
      // Use general rule
      blockIndex = getGeneralRuleBlock(localHour);
    }
  } else {
    // No wake time set, use general rule
    blockIndex = getGeneralRuleBlock(localHour);
  }

  return {
    blockIndex,
    timezoneOffset: localTime.getTimezoneOffset(),
    localTimeUsed: localTime.toLocaleTimeString("en-US", { hour12: false }),
  };
}

/**
 * General rule for time block assignment
 */
function getGeneralRuleBlock(localHour) {
  // Before 4:00 a.m. when no wake time is set: put in the 4:00 a.m. block
  if (localHour < 4) {
    return 0; // 4:00 a.m. block
  }

  // 4–4:59 → 4 a.m. block (index 0)
  // 5–5:59 → 5 a.m. block (index 1)
  // ...
  // 20–20:59 → 8 p.m. block (index 16)
  if (localHour >= 4 && localHour <= 20) {
    return localHour - 4;
  }

  // 21–23:59 and anything later → 9 p.m. block (index 17)
  return 17; // 9:00 p.m. block
}

async function backfillCompletionBlocks() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    console.log("📊 Analyzing existing completion data...");
    const users = await UserData.find({});
    console.log(`📁 Found ${users.length} user data records`);

    let totalUpdatedRecords = 0;
    let totalBackfilledItems = 0;

    for (const userData of users) {
      console.log(`\n👤 Processing: ${userData.userId} (${userData.date})`);

      let recordUpdated = false;
      let itemsBackfilled = 0;

      // Set up wake settings for this day
      const wakeSettings = userData.dailyWakeTime
        ? { wakeTime: userData.dailyWakeTime, date: userData.date }
        : undefined;

      // Process master checklist
      if (userData.masterChecklist) {
        for (const item of userData.masterChecklist) {
          if (
            item.completed &&
            item.completedAt &&
            item.targetBlock === undefined
          ) {
            const completion = calculateCompletionBlock(
              item.completedAt,
              wakeSettings,
              userData.userTimezone
            );

            item.targetBlock = completion.blockIndex;
            item.timezoneOffset = completion.timezoneOffset;

            recordUpdated = true;
            itemsBackfilled++;

            console.log(
              `  ✅ Backfilled master item: "${item.text}" → Block ${completion.blockIndex}`
            );
          }
        }
      }

      // Process habit break checklist
      if (userData.habitBreakChecklist) {
        for (const item of userData.habitBreakChecklist) {
          if (
            item.completed &&
            item.completedAt &&
            item.targetBlock === undefined
          ) {
            const completion = calculateCompletionBlock(
              item.completedAt,
              wakeSettings,
              userData.userTimezone
            );

            item.targetBlock = completion.blockIndex;
            item.timezoneOffset = completion.timezoneOffset;

            recordUpdated = true;
            itemsBackfilled++;

            console.log(
              `  ✅ Backfilled habit item: "${item.text}" → Block ${completion.blockIndex}`
            );
          }
        }
      }

      // Process todo list
      if (userData.todoList) {
        for (const item of userData.todoList) {
          if (
            item.completed &&
            item.completedAt &&
            item.targetBlock === undefined
          ) {
            const completion = calculateCompletionBlock(
              item.completedAt,
              wakeSettings,
              userData.userTimezone
            );

            item.targetBlock = completion.blockIndex;
            item.timezoneOffset = completion.timezoneOffset;

            recordUpdated = true;
            itemsBackfilled++;

            console.log(
              `  ✅ Backfilled todo item: "${item.text}" → Block ${completion.blockIndex}`
            );
          }
        }
      }

      // Save changes if any were made
      if (recordUpdated) {
        await userData.save();
        totalUpdatedRecords++;
        totalBackfilledItems += itemsBackfilled;
        console.log(
          `  💾 Saved ${itemsBackfilled} backfilled items for this record`
        );
      } else {
        console.log(`  ⏭️  No items needed backfilling`);
      }
    }

    console.log(`\n📊 Backfill Summary:`);
    console.log(`   Records updated: ${totalUpdatedRecords}`);
    console.log(`   Items backfilled: ${totalBackfilledItems}`);
    console.log(`✅ Backfill completed successfully!`);
  } catch (error) {
    console.error("❌ Error during backfill:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Run the backfill
console.log("🕰️  Starting Time Block Assignment Backfill...");
console.log("⚡ Applying 18-hour block system (4:00 a.m. → 9:00 p.m.)");
backfillCompletionBlocks();
