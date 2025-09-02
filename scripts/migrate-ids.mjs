#!/usr/bin/env node

/**
 * Migration script to:
 * 1. Update existing content templates with optimized IDs
 * 2. Migrate existing user data to use new ID format
 * 3. Sync wakeTime and dailyWakeTime fields
 * 4. Apply new template structure to all existing users
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

// Define schemas
const contentTemplateSchema = new mongoose.Schema({
  userRole: String,
  type: String,
  content: {
    masterChecklist: Array,
    habitBreakChecklist: Array,
    timeBlocks: Array,
    placeholderText: Object,
  },
  createdAt: Date,
  updatedAt: Date,
});

const userDataSchema = new mongoose.Schema({
  date: String,
  userId: String,
  displayDate: String,
  blocks: Array,
  masterChecklist: Array,
  habitBreakChecklist: Array,
  todoList: Array,
  score: Number,
  wakeTime: String,
  dailyWakeTime: String,
  userTimezone: String,
});

const ContentTemplate = mongoose.model(
  "content_templates",
  contentTemplateSchema,
  "content_templates"
);
const UserData = mongoose.model("user_data", userDataSchema, "user_data");

// ID mapping for migration
const ID_MAPPING = {
  // Master Checklist mappings
  m1: "mc-morning-101",
  m2: "mc-morning-102",
  m3: "mc-morning-103",
  m4: "mc-morning-104",
  m5: "mc-morning-105",
  m6: "mc-morning-106",
  w1: "mc-work-101",
  t1: "mc-tech-101",
  t2: "mc-tech-102",
  h1: "mc-house-101",
  wr1: "mc-wrapup-101",

  // Habit Break mappings
  hb1: "hb-lsd-101",
  hb2: "hb-lsd-102",
  hb3: "hb-financial-101",
  hb4: "hb-youtube-101",
  hb5: "hb-time-101",

  // Time Block mappings
  tb1: "tb-04h-101",
  tb2: "tb-05h-101",
  tb3: "tb-06h-101",
  tb4: "tb-07h-101",
  tb5: "tb-08h-101",
  tb6: "tb-09h-101",
  tb7: "tb-17h-101",
  tb8: "tb-20h-101",
  tb9: "tb-21h-101",
};

// Public template ID mappings
const PUBLIC_ID_MAPPING = {
  m1: "mc-morning-001",
  m2: "mc-morning-002",
  w1: "mc-work-001",
  t1: "mc-tech-001",
  h1: "mc-house-001",
  wr1: "mc-wrapup-001",

  hb1: "hb-lsd-001",
  hb2: "hb-lsd-002",
  hb3: "hb-financial-001",
  hb4: "hb-time-001",

  tb1: "tb-04h-001",
  tb2: "tb-05h-001",
  tb3: "tb-06h-001",
  tb4: "tb-07h-001",
  tb5: "tb-12h-001",
  tb6: "tb-17h-001",
  tb7: "tb-20h-001",
};

function migrateIds(items, mapping) {
  return items.map((item) => ({
    ...item,
    id: mapping[item.id] || item.id,
  }));
}

async function migrateContentTemplates() {
  console.log("📋 Migrating content templates...");

  const templates = await ContentTemplate.find({});
  console.log(`Found ${templates.length} content templates`);

  for (const template of templates) {
    let updated = false;
    const mapping =
      template.userRole === "admin" ? ID_MAPPING : PUBLIC_ID_MAPPING;

    if (template.content.masterChecklist) {
      template.content.masterChecklist = migrateIds(
        template.content.masterChecklist,
        mapping
      );
      updated = true;
    }

    if (template.content.habitBreakChecklist) {
      template.content.habitBreakChecklist = migrateIds(
        template.content.habitBreakChecklist,
        mapping
      );
      updated = true;
    }

    if (template.content.timeBlocks) {
      template.content.timeBlocks = migrateIds(
        template.content.timeBlocks,
        mapping
      );
      updated = true;
    }

    if (updated) {
      template.updatedAt = new Date();
      await template.save();
      console.log(`✅ Updated ${template.userRole} template`);
    }
  }
}

async function migrateUserData() {
  console.log("👤 Migrating user data...");

  const userData = await UserData.find({});
  console.log(`Found ${userData.length} user data records`);

  let migratedCount = 0;

  for (const record of userData) {
    let updated = false;

    // Sync wake time fields
    if (record.wakeTime && !record.dailyWakeTime) {
      record.dailyWakeTime = record.wakeTime;
      updated = true;
    }

    // Migrate IDs in master checklist
    if (record.masterChecklist) {
      record.masterChecklist = migrateIds(record.masterChecklist, ID_MAPPING);
      updated = true;
    }

    // Migrate IDs in habit break checklist
    if (record.habitBreakChecklist) {
      record.habitBreakChecklist = migrateIds(
        record.habitBreakChecklist,
        ID_MAPPING
      );
      updated = true;
    }

    // Migrate IDs in todo list
    if (record.todoList) {
      record.todoList = migrateIds(record.todoList, ID_MAPPING);
      updated = true;
    }

    // Migrate IDs in time blocks
    if (record.blocks) {
      record.blocks = migrateIds(record.blocks, ID_MAPPING);
      updated = true;
    }

    if (updated) {
      await record.save();
      migratedCount++;
    }
  }

  console.log(`✅ Migrated ${migratedCount} user data records`);
}

async function runMigration() {
  try {
    console.log("🚀 Starting ID optimization migration...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    await migrateContentTemplates();
    await migrateUserData();

    console.log("🎉 Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Run the migration
runMigration();
