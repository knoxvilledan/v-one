#!/usr/bin/env node

/**
 * Quick check to see current ID format in database
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "..", ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

async function checkIds() {
  try {
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;

    console.log("🔍 Checking current ID formats...");

    // Check content template IDs
    const template = await db.collection("content_templates").findOne();
    if (template?.content?.timeBlocks?.[0]) {
      console.log("Template timeBlock ID:", template.content.timeBlocks[0].id);
      console.log(
        "Template timeBlock blockId:",
        template.content.timeBlocks[0].blockId
      );
    }
    if (template?.content?.masterChecklist?.[0]) {
      console.log(
        "Template checklist ID:",
        template.content.masterChecklist[0].id
      );
      console.log(
        "Template checklist itemId:",
        template.content.masterChecklist[0].itemId
      );
    }

    // Check user data IDs
    const userData = await db.collection("user_data").findOne();
    if (userData?.blocks?.[0]) {
      console.log("UserData block ID:", userData.blocks[0].id);
      console.log("UserData block blockId:", userData.blocks[0].blockId);
    }
    if (userData?.masterChecklist?.[0]) {
      console.log("UserData checklist ID:", userData.masterChecklist[0].id);
      console.log(
        "UserData checklist itemId:",
        userData.masterChecklist[0].itemId
      );
    }

    console.log("\n✅ ID check complete");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

checkIds();
