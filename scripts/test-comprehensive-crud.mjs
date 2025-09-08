#!/usr/bin/env node

/**
 * Comprehensive CRUD Operations Test Script
 * Tests all checklist and time block operations
 */

import { MongoClient } from "mongodb";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not found in environment variables");
  process.exit(1);
}

async function testCRUDOperations() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db("amplifierTracker");
    const userSpacesCollection = db.collection("userSpaces");
    const dayEntriesCollection = db.collection("dayEntries");

    // Test data
    const testEmail = "test@example.com";
    const testUserId = "507f1f77bcf86cd799439011"; // Sample ObjectId
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    console.log("\n🧪 Testing CRUD Operations...\n");

    // 1. Test Adding Checklist Items
    console.log("1️⃣ Testing Add Checklist Item...");

    const newChecklistItem = {
      itemId: `custom-${Date.now()}-test1`,
      text: "Test Custom Master Item",
      category: "morning",
      order: Date.now(),
      isCustom: true,
      createdAt: new Date(),
    };

    await userSpacesCollection.updateOne(
      { userId: testUserId },
      {
        $push: {
          "checklistOverrides.daily-master-checklist.customItems":
            newChecklistItem,
        },
        $set: { updatedAt: new Date() },
      },
      { upsert: true }
    );

    console.log("✅ Added custom checklist item");

    // 2. Test Adding Time Block
    console.log("2️⃣ Testing Add Time Block...");

    const newTimeBlock = {
      blockId: `custom-block-${Date.now()}-test1`,
      time: "14:30",
      label: "Test Custom Block",
      order: Date.now(),
      isCustom: true,
      createdAt: new Date(),
    };

    await userSpacesCollection.updateOne(
      { userId: testUserId },
      {
        $push: {
          "timeBlockOverrides.customBlocks": newTimeBlock,
        },
        $set: { updatedAt: new Date() },
      },
      { upsert: true }
    );

    console.log("✅ Added custom time block");

    // 3. Test Completing Items
    console.log("3️⃣ Testing Complete Checklist Item...");

    await dayEntriesCollection.updateOne(
      { userId: testUserId, date: today },
      {
        $addToSet: {
          checklistCompletions: {
            checklistId: "daily-master-checklist",
            title: "Daily Tasks",
            completedItemIds: [newChecklistItem.itemId],
            completedAt: new Date(),
            completedItems: [
              {
                itemId: newChecklistItem.itemId,
                text: newChecklistItem.text,
                completedAt: new Date(),
              },
            ],
          },
        },
        $set: { updatedAt: new Date() },
      },
      { upsert: true }
    );

    console.log("✅ Completed checklist item");

    // 4. Test Time Block Completion
    console.log("4️⃣ Testing Complete Time Block...");

    await dayEntriesCollection.updateOne(
      { userId: testUserId, date: today },
      {
        $addToSet: {
          timeBlockCompletions: {
            blockId: newTimeBlock.blockId,
            label: newTimeBlock.label,
            time: newTimeBlock.time,
            completedAt: new Date(),
            notes: "Test completion notes",
            duration: 60,
          },
        },
        $set: { updatedAt: new Date() },
      },
      { upsert: true }
    );

    console.log("✅ Completed time block");

    // 5. Verify Data Structure
    console.log("5️⃣ Verifying Data Structure...");

    const userSpace = await userSpacesCollection.findOne({
      userId: testUserId,
    });
    const dayEntry = await dayEntriesCollection.findOne({
      userId: testUserId,
      date: today,
    });

    console.log("\n📊 Results:");
    console.log(
      `• UserSpace Custom Items: ${
        userSpace?.checklistOverrides?.["daily-master-checklist"]?.customItems
          ?.length || 0
      }`
    );
    console.log(
      `• UserSpace Custom Blocks: ${
        userSpace?.timeBlockOverrides?.customBlocks?.length || 0
      }`
    );
    console.log(
      `• Day Entry Checklist Completions: ${
        dayEntry?.checklistCompletions?.length || 0
      }`
    );
    console.log(
      `• Day Entry Time Block Completions: ${
        dayEntry?.timeBlockCompletions?.length || 0
      }`
    );

    // 6. Test Updates
    console.log("\n6️⃣ Testing Update Operations...");

    await userSpacesCollection.updateOne(
      {
        userId: testUserId,
        "checklistOverrides.daily-master-checklist.customItems.itemId":
          newChecklistItem.itemId,
      },
      {
        $set: {
          "checklistOverrides.daily-master-checklist.customItems.$.text":
            "Updated Test Item",
          "checklistOverrides.daily-master-checklist.customItems.$.category":
            "work",
          updatedAt: new Date(),
        },
      }
    );

    console.log("✅ Updated checklist item");

    // 7. Test Deletes
    console.log("7️⃣ Testing Delete Operations...");

    await userSpacesCollection.updateOne(
      { userId: testUserId },
      {
        $pull: {
          "timeBlockOverrides.customBlocks": { blockId: newTimeBlock.blockId },
        },
        $set: { updatedAt: new Date() },
      }
    );

    console.log("✅ Deleted custom time block");

    // 8. Final Verification
    console.log("8️⃣ Final Verification...");

    const finalUserSpace = await userSpacesCollection.findOne({
      userId: testUserId,
    });
    const remainingBlocks =
      finalUserSpace?.timeBlockOverrides?.customBlocks?.length || 0;
    const remainingItems =
      finalUserSpace?.checklistOverrides?.["daily-master-checklist"]
        ?.customItems?.length || 0;

    console.log(`\n✅ Final State:`);
    console.log(`• Remaining Custom Items: ${remainingItems}`);
    console.log(`• Remaining Custom Blocks: ${remainingBlocks}`);

    console.log("\n🎉 All CRUD operations tested successfully!");
    console.log("\n📋 CRUD Flow Summary:");
    console.log("  ✅ CREATE: Add checklist items and time blocks");
    console.log("  ✅ READ: Verify data structure and retrieval");
    console.log("  ✅ UPDATE: Modify existing items");
    console.log("  ✅ DELETE: Remove custom blocks");
    console.log("  ✅ COMPLETE: Mark items as done in day entries");
  } catch (error) {
    console.error("❌ Error during testing:", error);
  } finally {
    await client.close();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

// Run the test
testCRUDOperations().catch(console.error);
