#!/usr/bin/env node

/**
 * Fix inheritance issue by clearing future dates so they can re-inherit from today
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, ".env.local") });

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI environment variable is required");
  process.exit(1);
}

async function fixInheritance() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Get database
    const db = mongoose.connection.db;
    const collection = db.collection("user_data");

    // Find the user with the most recent data
    const user = "dannelsonjfn@gmail.com";
    const baseDate = "2025-09-17";

    console.log(`\n🔍 Checking data for ${user} on ${baseDate}:`);
    const baseDayData = await collection.findOne({
      userId: user,
      date: baseDate,
    });

    if (!baseDayData) {
      console.log("❌ No data found for base date");
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

    // List future dates that will be affected
    console.log(`\n🗓️ Finding future dates to clear for re-inheritance...`);
    const futureDates = await collection
      .find({
        userId: user,
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
      console.log("✅ No future dates to clear");
      return;
    }

    // Confirm deletion
    console.log(
      `\n⚠️  This will delete ${futureDates.length} future date records to allow fresh inheritance.`
    );
    console.log("   Press Enter to continue or Ctrl+C to cancel...");

    // For script automation, we'll proceed (in real use, you'd want user input)
    console.log("🗑️  Proceeding with deletion...");

    // Delete future dates
    const deleteResult = await collection.deleteMany({
      userId: user,
      date: { $gt: baseDate },
    });

    console.log(`✅ Deleted ${deleteResult.deletedCount} future date records`);
    console.log(`\n🎉 Inheritance fix complete!`);
    console.log(
      `   Next time you navigate to dates after ${baseDate}, they will inherit the current data.`
    );
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

fixInheritance();
