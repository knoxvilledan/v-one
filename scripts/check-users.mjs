#!/usr/bin/env node

/**
 * Check what user emails exist in the database
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__dirname);

// Load environment variables
dotenv.config({ path: join(__dirname, "..", ".env.local") });

async function checkUserEmails() {
  try {
    console.log("🔗 Connecting to MongoDB...");

    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI not found in environment variables");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Define the UserData model
    const UserData = mongoose.model(
      "UserData",
      new mongoose.Schema({}, { strict: false }),
      "userdatas"
    );

    // Find all unique userIds
    const allUsers = await UserData.distinct("userId");

    console.log(`📊 Found ${allUsers.length} unique user emails:`);
    allUsers.forEach((email, index) => {
      console.log(`  ${index + 1}. ${email}`);
    });

    // Show document count per user
    console.log("\n📈 Document counts per user:");
    for (const email of allUsers) {
      const count = await UserData.countDocuments({ userId: email });
      console.log(`  ${email}: ${count} documents`);
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkUserEmails();
