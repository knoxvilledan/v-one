#!/usr/bin/env node

/**
 * Check database collections and data
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

async function checkDatabase() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Get database
    const db = mongoose.connection.db;

    // List all collections
    console.log("\n📂 Collections in database:");
    const collections = await db.listCollections().toArray();

    for (const collection of collections) {
      console.log(`  - ${collection.name}`);

      // Get document count for each collection
      const count = await db.collection(collection.name).countDocuments();
      console.log(`    Documents: ${count}`);

      if (count > 0) {
        // Show a sample document
        const sample = await db.collection(collection.name).findOne();
        console.log(`    Sample keys: ${Object.keys(sample).join(", ")}`);

        // Special handling for user_data collection
        if (collection.name === "user_data") {
          console.log("\n🔍 Detailed user_data analysis:");

          // Get recent user data documents
          const recentDocs = await db
            .collection(collection.name)
            .find({})
            .sort({ date: -1 })
            .limit(10)
            .toArray();

          console.log(`📊 Found ${recentDocs.length} recent documents:`);
          recentDocs.forEach((doc, index) => {
            console.log(`  ${index + 1}. User: ${doc.userId || "unknown"}`);
            console.log(
              `     Date: "${doc.date}" | DisplayDate: "${doc.displayDate}"`
            );
            console.log(
              `     Master: ${doc.masterChecklist?.length || 0} | Habit: ${
                doc.habitBreakChecklist?.length || 0
              } | Workout: ${doc.workoutChecklist?.length || 0} | Todo: ${
                doc.todoList?.length || 0
              }`
            );

            if (doc.masterChecklist?.length > 0) {
              console.log(
                `     Master items: ${doc.masterChecklist
                  .map((item) => item.text)
                  .join(", ")}`
              );
            }
            if (doc.habitBreakChecklist?.length > 0) {
              console.log(
                `     Habit items: ${doc.habitBreakChecklist
                  .map((item) => item.text)
                  .join(", ")}`
              );
            }
            if (doc.workoutChecklist?.length > 0) {
              console.log(
                `     Workout items: ${doc.workoutChecklist
                  .map((item) => item.text)
                  .join(", ")}`
              );
            }
          });

          // Test inheritance query specifically for dates around today
          console.log("\n🔄 Testing inheritance logic:");
          const testUserId = recentDocs[0]?.userId;
          if (testUserId) {
            console.log(`   Testing inheritance for user: ${testUserId}`);

            // Test for 2025-09-18 (tomorrow from logs)
            const previousData = await db
              .collection(collection.name)
              .findOne(
                { userId: testUserId, date: { $lt: "2025-09-18" } },
                { sort: { date: -1 } }
              );

            if (previousData) {
              console.log(`   ✅ Previous data found: ${previousData.date}`);
              console.log(
                `      Previous had: Master=${
                  previousData.masterChecklist?.length || 0
                }, Habit=${
                  previousData.habitBreakChecklist?.length || 0
                }, Workout=${previousData.workoutChecklist?.length || 0}`
              );
            } else {
              console.log(`   ❌ No previous data found for inheritance`);
            }

            // Check if 2025-09-18 data exists
            const todayData = await db
              .collection(collection.name)
              .findOne({ userId: testUserId, date: "2025-09-18" });

            if (todayData) {
              console.log(`   📅 Data for 2025-09-18 exists:`);
              console.log(
                `      Has: Master=${
                  todayData.masterChecklist?.length || 0
                }, Habit=${
                  todayData.habitBreakChecklist?.length || 0
                }, Workout=${todayData.workoutChecklist?.length || 0}`
              );
            } else {
              console.log(
                `   📅 No data for 2025-09-18 found - inheritance should create it`
              );
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

checkDatabase();
