#!/usr/bin/env node

/**
 * Reset Future Dates Script
 * Manual reset tool for clearing future dates when automatic re-inheritance isn't sufficient
 *
 * NOTE: As of the smart re-inheritance update, this script is mainly needed for:
 * - Bulk resets of many future dates at once
 * - Manual override when automatic logic needs adjustment
 * - Testing and development scenarios
 * - Database maintenance tasks
 *
 * Usage: node scripts/reset-future-dates.mjs [email] [date]
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

// Get today's date in YYYY-MM-DD format
function getTodayDate() {
  return new Date().toISOString().split("T")[0];
}

async function resetFutureDates() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Get database
    const db = mongoose.connection.db;
    const collection = db.collection("user_data");

    // Get parameters from command line or use defaults
    const args = process.argv.slice(2);
    const userEmail = args[0] || "dannelsonjfn@gmail.com"; // Default to your email
    const baseDate = args[1] || getTodayDate(); // Default to today

    console.log(`\n👤 User: ${userEmail}`);
    console.log(`📅 Base date: ${baseDate}`);

    console.log(`\n🔍 Checking data for ${userEmail} on ${baseDate}:`);
    const baseDayData = await collection.findOne({
      userId: userEmail,
      date: baseDate,
    });

    if (!baseDayData) {
      console.log("❌ No data found for base date");
      console.log(
        "   Make sure you have data for today before resetting future dates."
      );
      return;
    }

    console.log(`📊 Base day (${baseDate}) has:`);
    console.log(
      `  - Master: ${baseDayData.masterChecklist?.length || 0} items`
    );
    console.log(
      `  - Habit: ${baseDayData.habitBreakChecklist?.length || 0} items`
    );
    console.log(
      `  - Workout: ${baseDayData.workoutChecklist?.length || 0} items`
    );
    console.log(`  - Todo: ${baseDayData.todoList?.length || 0} items`);

    if (baseDayData.masterChecklist?.length > 0) {
      console.log(
        `  Master items: ${baseDayData.masterChecklist
          .map((item) => item.text)
          .slice(0, 3)
          .join(", ")}${baseDayData.masterChecklist.length > 3 ? "..." : ""}`
      );
    }

    // List future dates that will be affected
    console.log(`\n🗓️ Finding future dates to reset...`);
    const futureDates = await collection
      .find({
        userId: userEmail,
        date: { $gt: baseDate },
      })
      .sort({ date: 1 })
      .toArray();

    console.log(`📅 Found ${futureDates.length} future dates:`);
    futureDates.forEach((doc) => {
      console.log(
        `  - ${doc.date}: Master=${doc.masterChecklist?.length || 0}, Habit=${
          doc.habitBreakChecklist?.length || 0
        }, Workout=${doc.workoutChecklist?.length || 0}`
      );
    });

    if (futureDates.length === 0) {
      console.log("✅ No future dates to reset - you're all set!");
      return;
    }

    // Delete future dates
    console.log(`\n🗑️ Resetting ${futureDates.length} future dates...`);
    const deleteResult = await collection.deleteMany({
      userId: userEmail,
      date: { $gt: baseDate },
    });

    console.log(`✅ Reset ${deleteResult.deletedCount} future date records`);
    console.log(`\n🎉 Future dates reset complete!`);
    console.log(
      `   Next time you navigate to dates after ${baseDate}, they will inherit today's data.`
    );
    console.log(
      `\n� Note: With smart re-inheritance now active, this manual reset is usually not needed.`
    );
    console.log(
      `   The system automatically updates future dates when you visit them.`
    );
    console.log(`\n�📝 Quick command for next time:`);
    console.log(`   node scripts/reset-future-dates.mjs`);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

// Show usage if help is requested
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(`
📖 Reset Future Dates Script

🔧 MANUAL RESET TOOL - With smart re-inheritance now active, this is mainly for:
  • Bulk resets of many future dates at once  
  • Manual override when automatic logic needs adjustment
  • Testing and development scenarios
  • Database maintenance tasks

Usage:
  node scripts/reset-future-dates.mjs                     # Reset all future dates from today
  node scripts/reset-future-dates.mjs [email]            # Reset for specific user
  node scripts/reset-future-dates.mjs [email] [date]     # Reset from specific date

Examples:
  node scripts/reset-future-dates.mjs
  node scripts/reset-future-dates.mjs dannelsonjfn@gmail.com
  node scripts/reset-future-dates.mjs dannelsonjfn@gmail.com 2025-09-17

💡 The system now has smart re-inheritance that automatically updates future dates
   when you visit them, so this manual reset is usually not needed.
`);
  process.exit(0);
}

resetFutureDates();
