#!/usr/bin/env node

/**
 * OPTION A: Clear targetBlock values from existing user data
 * This will preserve all data but clear targetBlock assignments to allow fresh auto-assignment
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, "..", ".env.local") });

async function clearTargetBlocks() {
  try {
    console.log("🔗 Connecting to MongoDB...");

    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI not found in environment variables");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Define the UserData model - checking both collections
    const UserData = mongoose.model(
      "UserData",
      new mongoose.Schema({}, { strict: false }),
      "user_data"
    );

    // Find your specific user data (replace with your email)
    const userEmail = "dannelsonjfn@gmail.com"; // Update this to your email

    console.log(`🔍 Looking for user data for: ${userEmail}`);

    const userDocs = await UserData.find({ userId: userEmail }).lean();

    if (userDocs.length === 0) {
      console.log("❌ No user data found for this email");
      return;
    }

    console.log(`📊 Found ${userDocs.length} documents for user`);

    // Count items with targetBlock values before clearing
    let totalItemsWithTargetBlock = 0;

    userDocs.forEach((doc) => {
      [
        doc.masterChecklist,
        doc.habitBreakChecklist,
        doc.workoutChecklist,
        doc.todoList,
      ].forEach((list) => {
        if (list) {
          totalItemsWithTargetBlock += list.filter(
            (item) => item.targetBlock !== undefined
          ).length;
        }
      });
    });

    console.log(
      `🎯 Found ${totalItemsWithTargetBlock} items with targetBlock values`
    );

    if (totalItemsWithTargetBlock === 0) {
      console.log("✅ No targetBlock values to clear - data is already clean!");
      return;
    }

    // Ask for confirmation
    console.log("\n⚠️  CLEARING targetBlock VALUES ONLY");
    console.log("✅ PRESERVES: All text, completion status, timestamps, notes");
    console.log("❌ CLEARS: Only targetBlock assignment values");
    console.log(
      `\n📝 This will clear targetBlock from ${totalItemsWithTargetBlock} items`
    );

    // In a script, we'll proceed (in real implementation you might want readline for confirmation)
    console.log("\n🚀 Proceeding with targetBlock clearing...");

    // Update all documents to clear targetBlock values
    let updatedDocuments = 0;

    for (const doc of userDocs) {
      const updates = {};
      let hasUpdates = false;

      // Clear targetBlock from masterChecklist
      if (doc.masterChecklist && doc.masterChecklist.length > 0) {
        updates["masterChecklist"] = doc.masterChecklist.map((item) => {
          const { targetBlock, ...itemWithoutTargetBlock } = item;
          return itemWithoutTargetBlock;
        });
        hasUpdates = true;
      }

      // Clear targetBlock from habitBreakChecklist
      if (doc.habitBreakChecklist && doc.habitBreakChecklist.length > 0) {
        updates["habitBreakChecklist"] = doc.habitBreakChecklist.map((item) => {
          const { targetBlock, ...itemWithoutTargetBlock } = item;
          return itemWithoutTargetBlock;
        });
        hasUpdates = true;
      }

      // Clear targetBlock from workoutChecklist
      if (doc.workoutChecklist && doc.workoutChecklist.length > 0) {
        updates["workoutChecklist"] = doc.workoutChecklist.map((item) => {
          const { targetBlock, ...itemWithoutTargetBlock } = item;
          return itemWithoutTargetBlock;
        });
        hasUpdates = true;
      }

      // Clear targetBlock from todoList
      if (doc.todoList && doc.todoList.length > 0) {
        updates["todoList"] = doc.todoList.map((item) => {
          const { targetBlock, ...itemWithoutTargetBlock } = item;
          return itemWithoutTargetBlock;
        });
        hasUpdates = true;
      }

      if (hasUpdates) {
        await UserData.updateOne(
          { _id: doc._id },
          { $set: { ...updates, updatedAt: new Date() } }
        );
        updatedDocuments++;
        console.log(`✅ Cleared targetBlock values from document: ${doc.date}`);
      }
    }

    console.log(`\n🎉 SUCCESS! Updated ${updatedDocuments} documents`);
    console.log(
      "📋 All your data is preserved - only targetBlock assignments cleared"
    );
    console.log("🔄 Fresh auto-assignment will happen on next completion");
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

clearTargetBlocks();
