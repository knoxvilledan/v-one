#!/usr/bin/env node

/**
 * Check for legacy timeblock configuration data that might be overriding calculations
 */

import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function checkLegacyTimeblockData() {
  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    console.log("🔗 Connected to MongoDB");

    const db = client.db();

    // Check multiple collections for timeblock-related data
    const collections = [
      "user_data",
      "userSpaces",
      "users",
      "content_templates",
    ];

    for (const collectionName of collections) {
      console.log(`\n📋 Checking ${collectionName} collection:`);
      const collection = db.collection(collectionName);

      // Look for dannelsonjfn@gmail.com data
      const docs = await collection
        .find({
          $or: [
            { userId: "dannelsonjfn@gmail.com" },
            { email: "dannelsonjfn@gmail.com" },
            { authUserId: "dannelsonjfn@gmail.com" },
          ],
        })
        .toArray();

      if (docs.length === 0) {
        console.log("  ✅ No data found");
        continue;
      }

      docs.forEach((doc, index) => {
        console.log(`\n  📄 Document ${index + 1}:`);

        // Check for timeblock-related fields
        const timeblockFields = [
          "blocks",
          "timeBlocks",
          "timeBlockConfig",
          "timeBlockSettings",
          "wakeTime",
          "wakeTimeSettings",
          "dailyWakeTime",
          "blockDuration",
          "timeBlockTemplates",
          "timeBlockOverrides",
          "blockCount",
        ];

        timeblockFields.forEach((field) => {
          if (doc[field] !== undefined) {
            console.log(
              `    🎯 ${field}:`,
              typeof doc[field] === "object"
                ? JSON.stringify(doc[field], null, 2).substring(0, 200) + "..."
                : doc[field]
            );
          }
        });

        // Check for date-specific data
        if (doc.date) {
          console.log(`    📅 Date: ${doc.date}`);
        }

        // Look for any field containing 'time' or 'block'
        Object.keys(doc).forEach((key) => {
          if (
            (key.toLowerCase().includes("time") ||
              key.toLowerCase().includes("block")) &&
            !timeblockFields.includes(key) &&
            key !== "_id" &&
            key !== "date"
          ) {
            console.log(
              `    🔍 Other time/block field - ${key}:`,
              typeof doc[key] === "object" ? "[Object]" : doc[key]
            );
          }
        });
      });
    }

    // Check for any legacy calculation settings
    console.log(`\n🔧 Checking for legacy calculation overrides...`);

    const userSpaceDoc = await db.collection("userSpaces").findOne({
      userId: "dannelsonjfn@gmail.com",
    });

    if (userSpaceDoc) {
      console.log("📋 UserSpace document found with these override fields:");
      Object.keys(userSpaceDoc).forEach((key) => {
        if (
          key.includes("Override") ||
          key.includes("Config") ||
          key.includes("Setting")
        ) {
          console.log(`  🎛️  ${key}:`, userSpaceDoc[key]);
        }
      });
    }
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

checkLegacyTimeblockData();
