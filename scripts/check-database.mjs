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
