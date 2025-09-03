#!/usr/bin/env node

/**
 * CAUTIOUS HYBRID MIGRATION
 *
 * This script enhances the current working system with user customization support
 * WITHOUT breaking existing functionality. It creates the Plan system collections
 * alongside the current system, allowing gradual migration.
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

/**
 * Phase 1: Create Plan system collections WITHOUT touching existing collections
 * This allows both systems to coexist during transition
 */
async function createHybridSystem() {
  try {
    console.log(
      "🔄 Creating hybrid system - preserving existing functionality..."
    );
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;

    // Check current system health
    console.log("\n🔍 Checking current system...");
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);

    const requiredCollections = ["content_templates", "user_data", "users"];
    const hasRequiredCollections = requiredCollections.every((name) =>
      collectionNames.includes(name)
    );

    if (!hasRequiredCollections) {
      console.error("❌ Current system missing required collections!");
      console.log("Required:", requiredCollections);
      console.log("Found:", collectionNames);
      return;
    }

    // Get current data counts
    const contentTemplatesCount = await db
      .collection("content_templates")
      .countDocuments();
    const userDataCount = await db.collection("user_data").countDocuments();
    const usersCount = await db.collection("users").countDocuments();

    console.log("✅ Current system health check:");
    console.log(`  - content_templates: ${contentTemplatesCount} documents`);
    console.log(`  - user_data: ${userDataCount} documents`);
    console.log(`  - users: ${usersCount} documents`);

    if (
      contentTemplatesCount === 0 ||
      userDataCount === 0 ||
      usersCount === 0
    ) {
      console.error(
        "❌ Current system has empty collections - aborting migration"
      );
      return;
    }

    // Create Plan system collections (empty initially)
    console.log("\n📋 Creating Plan system collections...");

    // TemplateSet collection - will mirror content_templates
    await db.createCollection("templateSets");
    console.log("✅ Created templateSets collection");

    // UserSpace collection - will store user customizations
    await db.createCollection("userSpaces");
    console.log("✅ Created userSpaces collection");

    // DayEntry collection - will mirror user_data with enhancements
    await db.createCollection("dayEntries");
    console.log("✅ Created dayEntries collection");

    // TodoItem collection - will extract todos from user_data
    await db.createCollection("todoItems");
    console.log("✅ Created todoItems collection");

    // Create indexes for Plan system
    console.log("\n🔍 Creating indexes for Plan system...");

    await db.collection("templateSets").createIndex({ role: 1, isActive: 1 });
    await db
      .collection("templateSets")
      .createIndex({ version: 1, role: 1 }, { unique: true });
    console.log("✅ TemplateSet indexes created");

    await db
      .collection("userSpaces")
      .createIndex({ userId: 1 }, { unique: true });
    await db.collection("userSpaces").createIndex({ email: 1 });
    await db.collection("userSpaces").createIndex({ lastActiveAt: 1 });
    console.log("✅ UserSpace indexes created");

    await db
      .collection("dayEntries")
      .createIndex({ userId: 1, date: 1 }, { unique: true });
    await db.collection("dayEntries").createIndex({ email: 1, date: 1 });
    console.log("✅ DayEntry indexes created");

    await db
      .collection("todoItems")
      .createIndex({ todoId: 1 }, { unique: true });
    await db.collection("todoItems").createIndex({ userId: 1, status: 1 });
    await db.collection("todoItems").createIndex({ userId: 1, dueDate: 1 });
    console.log("✅ TodoItem indexes created");

    // Verify Plan system collections exist
    console.log("\n🔍 Verifying Plan system collections...");
    const newCollections = await db.listCollections().toArray();
    const newCollectionNames = newCollections.map((c) => c.name);

    const planCollections = [
      "templateSets",
      "userSpaces",
      "dayEntries",
      "todoItems",
    ];
    const hasPlanCollections = planCollections.every((name) =>
      newCollectionNames.includes(name)
    );

    if (hasPlanCollections) {
      console.log("✅ Plan system collections created successfully");
      console.log("📋 Collections now available:");
      console.log("  Current system: content_templates, user_data, users");
      console.log(
        "  Plan system: templateSets, userSpaces, dayEntries, todoItems"
      );
    } else {
      console.error("❌ Failed to create Plan system collections");
      return;
    }

    console.log("\n🎉 Hybrid system setup complete!");
    console.log("📝 Next steps:");
    console.log("1. Both systems now coexist safely");
    console.log("2. Current APIs continue to work unchanged");
    console.log("3. Plan system collections are ready for gradual population");
    console.log("4. Run hybrid data population when ready");
  } catch (error) {
    console.error("❌ Hybrid system creation failed:", error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Run hybrid system creation
createHybridSystem();
