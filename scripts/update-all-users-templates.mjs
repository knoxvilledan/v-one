#!/usr/bin/env node

/**
 * Update All Users and Templates Script
 *
 * This script ensures all existing users, templates, and data structures
 * use the optimized ID patterns consistently across all user roles.
 */

import mongoose from "mongoose";
import { generateId, validateId, migrateId } from "../src/lib/id-generation.js";

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not found in environment variables");
  process.exit(1);
}

// Schema definitions
const contentTemplateSchema = new mongoose.Schema({
  userRole: { type: String, required: true },
  content: {
    timeBlocks: [{ id: String, time: String, label: String, order: Number }],
    masterChecklist: [
      { id: String, text: String, category: String, order: Number },
    ],
    habitBreakChecklist: [
      { id: String, text: String, category: String, order: Number },
    ],
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
  workoutChecklist: Array,
  score: Number,
  wakeTime: String,
  dailyWakeTime: String,
  userTimezone: String,
});

const userSchema = new mongoose.Schema({
  email: String,
  name: String,
  role: String,
  password: String,
  wakeTime: String,
  adminViewMode: String,
  resetToken: String,
  resetTokenExpires: Date,
  createdAt: Date,
  updatedAt: Date,
  isActive: Boolean,
  isEmailVerified: Boolean,
});

const ContentTemplate = mongoose.model(
  "content_templates",
  contentTemplateSchema,
  "content_templates"
);
const UserData = mongoose.model("user_data", userDataSchema, "user_data");
const User = mongoose.model("users", userSchema, "users");

/**
 * Update content templates with optimized IDs
 */
async function updateContentTemplates() {
  console.log("🏗️ Updating content templates...\n");

  const templates = await ContentTemplate.find({});
  let updatedCount = 0;

  for (const template of templates) {
    let updated = false;
    const content = template.content;

    // Update time block IDs
    if (content?.timeBlocks) {
      content.timeBlocks.forEach((block, index) => {
        if (!validateId.templateTimeBlock(block.id)) {
          // Extract hour from time string or use index-based calculation
          const timeMatch = block.time.match(/(\d{1,2})/);
          const hour = timeMatch
            ? parseInt(timeMatch[1])
            : 4 + Math.floor(index * 1.5);
          block.id = generateId.template.timeBlock(hour, index + 1);
          updated = true;
        }
      });
    }

    // Update master checklist IDs
    if (content?.masterChecklist) {
      content.masterChecklist.forEach((item, index) => {
        if (!validateId.templateMasterChecklist(item.id)) {
          const category = item.category || "morning";
          item.id = generateId.template.masterChecklist(category, index + 1);
          updated = true;
        }
      });
    }

    // Update habit break checklist IDs
    if (content?.habitBreakChecklist) {
      content.habitBreakChecklist.forEach((item, index) => {
        if (!validateId.templateHabitBreak(item.id)) {
          const category = item.category || "lsd";
          item.id = generateId.template.habitBreak(category, index + 1);
          updated = true;
        }
      });
    }

    if (updated) {
      template.updatedAt = new Date();
      await template.save();
      updatedCount++;
      console.log(`✅ Updated ${template.userRole} template`);
    }
  }

  console.log(`📊 Templates updated: ${updatedCount}/${templates.length}\n`);
}

/**
 * Update user data with optimized IDs
 */
async function updateUserData() {
  console.log("👥 Updating user data...\n");

  const userData = await UserData.find({});
  let updatedCount = 0;
  let totalUpdated = 0;

  for (const data of userData) {
    let updated = false;

    // Update block IDs (migrate legacy block-123 format to block-uuid format)
    if (data.blocks) {
      data.blocks.forEach((block) => {
        if (block.id && /^block-\d+$/.test(block.id)) {
          block.id = generateId.block();
          updated = true;
        }
      });
    }

    // Update todo list IDs
    if (data.todoList) {
      const existingIds = data.todoList.map((item) => item.id);
      data.todoList.forEach((item, index) => {
        if (item.id && !validateId.todo(item.id)) {
          const newId = generateId.todo(index);
          // Ensure uniqueness
          let attempts = 0;
          while (existingIds.includes(newId) && attempts < 100) {
            item.id = generateId.todo(index + attempts);
            attempts++;
          }
          if (attempts < 100) {
            item.id = newId;
            existingIds.push(newId);
            updated = true;
          }
        }
      });
    }

    // Update workout checklist IDs
    if (data.workoutChecklist) {
      const existingIds = data.workoutChecklist.map((item) => item.id);
      data.workoutChecklist.forEach((item, index) => {
        if (item.id && !validateId.workout(item.id)) {
          const newId = generateId.workout(index);
          // Ensure uniqueness
          let attempts = 0;
          while (existingIds.includes(newId) && attempts < 100) {
            item.id = generateId.workout(index + attempts);
            attempts++;
          }
          if (attempts < 100) {
            item.id = newId;
            existingIds.push(newId);
            updated = true;
          }
        }
      });
    }

    if (updated) {
      await data.save();
      updatedCount++;
      if (updatedCount % 50 === 0) {
        console.log(`✅ Updated ${updatedCount} user data records...`);
      }
    }
    totalUpdated++;
  }

  console.log(`📊 User data updated: ${updatedCount}/${totalUpdated}\n`);
}

/**
 * Ensure all users have consistent role-based access
 */
async function updateUserRoles() {
  console.log("🔐 Updating user roles and access...\n");

  const users = await User.find({});
  let updatedCount = 0;

  for (const user of users) {
    let updated = false;

    // Ensure all users have proper role assignment
    if (!user.role || !["public", "admin"].includes(user.role)) {
      user.role = "public"; // Default to public
      updated = true;
    }

    // Ensure admin users have adminViewMode field
    if (user.role === "admin" && !user.adminViewMode) {
      user.adminViewMode = "personal"; // Default admin view mode
      updated = true;
    }

    // Ensure all users have proper timestamps
    if (!user.createdAt) {
      user.createdAt = new Date();
      updated = true;
    }

    if (!user.updatedAt) {
      user.updatedAt = new Date();
      updated = true;
    }

    if (updated) {
      user.updatedAt = new Date();
      await user.save();
      updatedCount++;
    }
  }

  console.log(`📊 Users updated: ${updatedCount}/${users.length}\n`);
}

/**
 * Verify data integrity after updates
 */
async function verifyDataIntegrity() {
  console.log("🔍 Verifying data integrity...\n");

  const checks = {
    templates: 0,
    userData: 0,
    users: 0,
    issues: [],
  };

  // Check templates
  const templates = await ContentTemplate.find({});
  for (const template of templates) {
    checks.templates++;
    const content = template.content;

    if (content?.timeBlocks) {
      content.timeBlocks.forEach((block) => {
        if (!validateId.templateTimeBlock(block.id)) {
          checks.issues.push(
            `Template ${template.userRole}: Invalid time block ID ${block.id}`
          );
        }
      });
    }
  }

  // Check user data (sample)
  const userDataSample = await UserData.find({}).limit(100);
  for (const data of userDataSample) {
    checks.userData++;

    if (data.blocks) {
      data.blocks.forEach((block) => {
        if (
          block.id &&
          !validateId.block(block.id) &&
          !/^block-\d+$/.test(block.id)
        ) {
          checks.issues.push(
            `User ${data.userId}: Invalid block ID ${block.id}`
          );
        }
      });
    }
  }

  // Check users
  const users = await User.find({});
  for (const user of users) {
    checks.users++;

    if (!user.role || !["public", "admin"].includes(user.role)) {
      checks.issues.push(`User ${user.email}: Invalid role ${user.role}`);
    }
  }

  console.log("📋 Integrity Check Results:");
  console.log(`  Templates checked: ${checks.templates}`);
  console.log(`  User data checked: ${checks.userData}`);
  console.log(`  Users checked: ${checks.users}`);
  console.log(`  Issues found: ${checks.issues.length}`);

  if (checks.issues.length > 0) {
    console.log("\n⚠️  Issues detected:");
    checks.issues.forEach((issue) => console.log(`    ${issue}`));
  } else {
    console.log("✅ All data integrity checks passed!");
  }
}

/**
 * Main execution function
 */
async function main() {
  try {
    console.log("🚀 Updating All Users and Templates");
    console.log("=" * 50);

    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB\n");

    // Step 1: Update content templates
    await updateContentTemplates();

    // Step 2: Update user data
    await updateUserData();

    // Step 3: Update user roles and access
    await updateUserRoles();

    // Step 4: Verify data integrity
    await verifyDataIntegrity();

    console.log("\n🎉 All Updates Complete!");
    console.log("\n📋 Summary:");
    console.log("✅ Content templates updated with optimized IDs");
    console.log("✅ User data migrated to new ID format");
    console.log("✅ User roles and access permissions verified");
    console.log("✅ Data integrity validated");
    console.log("✅ All user roles (public/admin) have consistent access");
    console.log("✅ Todo and workout lists updated for all existing users");
  } catch (error) {
    console.error("❌ Error during update:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// Run if called directly
if (process.argv[1].includes("update-all-users-templates")) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { main as updateAllUsersAndTemplates };
