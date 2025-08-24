#!/usr/bin/env node

/**
 * Test script to verify the content templates are working with new IDs
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

const ContentTemplate = mongoose.model(
  "content_templates",
  contentTemplateSchema,
  "content_templates"
);

async function verifyTemplates() {
  try {
    console.log("🔍 Verifying content templates...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const templates = await ContentTemplate.find({});
    console.log(`📋 Found ${templates.length} templates`);

    for (const template of templates) {
      console.log(`\n👤 ${template.userRole.toUpperCase()} Template:`);

      if (template.content.masterChecklist) {
        console.log(
          `  📝 Master Checklist (${template.content.masterChecklist.length} items):`
        );
        template.content.masterChecklist.slice(0, 3).forEach((item) => {
          console.log(`    - ${item.id}: ${item.text}`);
        });
      }

      if (template.content.habitBreakChecklist) {
        console.log(
          `  🚫 Habit Break (${template.content.habitBreakChecklist.length} items):`
        );
        template.content.habitBreakChecklist.slice(0, 2).forEach((item) => {
          console.log(`    - ${item.id}: ${item.text}`);
        });
      }

      if (template.content.timeBlocks) {
        console.log(
          `  ⏰ Time Blocks (${template.content.timeBlocks.length} items):`
        );
        template.content.timeBlocks.slice(0, 3).forEach((item) => {
          console.log(`    - ${item.id}: ${item.time} - ${item.label}`);
        });
      }
    }

    console.log("\n✅ Template verification complete!");
  } catch (error) {
    console.error("❌ Verification failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Run verification
verifyTemplates();
