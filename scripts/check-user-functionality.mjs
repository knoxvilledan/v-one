#!/usr/bin/env node

/**
 * Check existing user functionality and Plan system availability
 * This script checks what functionality existing users have access to
 */

import { config } from "dotenv";
import { MongoClient } from "mongodb";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config({ path: join(__dirname, "..", ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI environment variable is not set");
  process.exit(1);
}

async function checkUserFunctionality() {
  console.log(
    "🔍 Checking existing user functionality and Plan system access...\n"
  );

  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB\n");

    const db = client.db("AmpTrack");

    // Get all existing users
    console.log("=== EXISTING USERS ===");
    const users = await db.collection("users").find({}).toArray();
    console.log(`Found ${users.length} users:`);

    for (const user of users) {
      console.log(
        `  📧 ${user.email} (${user.role}) - Created: ${user.createdAt}`
      );
    }

    console.log("\n=== CURRENT SYSTEM STATUS (user_data) ===");
    const userData = await db.collection("user_data").find({}).toArray();
    console.log(`Found ${userData.length} user data documents:`);

    for (const data of userData) {
      console.log(
        `  📅 User ${data.userId} - Date: ${data.date} - Blocks: ${
          data.blocks?.length || 0
        }`
      );
    }

    console.log("\n=== PLAN SYSTEM STATUS ===");

    // Check userSpaces (Plan system user preferences)
    const userSpaces = await db.collection("userSpaces").find({}).toArray();
    console.log(`\n📦 UserSpaces: ${userSpaces.length}`);

    for (const space of userSpaces) {
      console.log(`  👤 ${space.email}`);
      console.log(`    User ID: ${space.userId}`);
      console.log(`    Last Active: ${space.lastActiveAt}`);
      console.log(
        `    Customizations: ${Object.keys(space.customizations || {}).join(
          ", "
        )}`
      );

      if (space.customizations?.preferences) {
        console.log(`    Preferences:`, space.customizations.preferences);
      }
    }

    // Check dayEntries (Plan system day data)
    const dayEntries = await db.collection("dayEntries").find({}).toArray();
    console.log(`\n📅 DayEntries: ${dayEntries.length}`);

    const userDayCount = {};
    for (const entry of dayEntries) {
      if (!userDayCount[entry.email]) userDayCount[entry.email] = 0;
      userDayCount[entry.email]++;
    }

    for (const [email, count] of Object.entries(userDayCount)) {
      console.log(`  👤 ${email}: ${count} days`);
    }

    // Check todoItems (Plan system todos)
    const todoItems = await db.collection("todoItems").find({}).toArray();
    console.log(`\n✅ TodoItems: ${todoItems.length}`);

    const userTodoCount = {};
    for (const todo of todoItems) {
      if (!userTodoCount[todo.email]) userTodoCount[todo.email] = 0;
      userTodoCount[todo.email]++;
    }

    for (const [email, count] of Object.entries(userTodoCount)) {
      console.log(`  👤 ${email}: ${count} todos`);
    }

    // Check templateSets (Plan system templates)
    const templateSets = await db.collection("templateSets").find({}).toArray();
    console.log(`\n📋 TemplateSets: ${templateSets.length}`);

    for (const template of templateSets) {
      console.log(`  🎯 ${template.role}: ${template.name}`);
      console.log(`    TimeBlocks: ${template.timeBlocks?.length || 0}`);
      console.log(
        `    Checklists: ${Object.keys(template.checklists || {}).length}`
      );
    }

    console.log("\n=== FUNCTIONALITY ANALYSIS ===");

    // Check if existing users have Plan system access
    const existingUsersWithPlanAccess = userSpaces.length;
    const existingUsersTotal = users.length;

    console.log(`\n📊 Summary:`);
    console.log(`  • Total Users: ${existingUsersTotal}`);
    console.log(
      `  • Users with Plan System Access: ${existingUsersWithPlanAccess}`
    );
    console.log(`  • Current System Data: ${userData.length} documents`);
    console.log(`  • Plan System Data: ${dayEntries.length} day entries`);

    if (existingUsersWithPlanAccess === existingUsersTotal) {
      console.log(`\n✅ ALL EXISTING USERS HAVE PLAN SYSTEM ACCESS`);
      console.log(
        `   This means they have access to new customization features!`
      );
    } else if (existingUsersWithPlanAccess > 0) {
      console.log(`\n⚠️  PARTIAL PLAN SYSTEM ACCESS`);
      console.log(
        `   ${
          existingUsersTotal - existingUsersWithPlanAccess
        } users need to be migrated`
      );
    } else {
      console.log(`\n❌ NO EXISTING USERS HAVE PLAN SYSTEM ACCESS`);
      console.log(`   All users need to be migrated to access new features`);
    }

    // Check customization capabilities
    console.log(`\n🎨 Customization Features Available:`);
    let hasCustomizations = false;

    for (const space of userSpaces) {
      if (
        space.customizations &&
        Object.keys(space.customizations).length > 0
      ) {
        hasCustomizations = true;
        console.log(`  👤 ${space.email}:`);

        if (space.customizations.preferences) {
          console.log(`    • Custom Preferences: ✅`);
        }
        if (space.customizations.labels) {
          console.log(`    • Custom Labels: ✅`);
        }
        if (space.customizations.hiddenItems) {
          console.log(`    • Hidden Items: ✅`);
        }
        if (space.customizations.customOrder) {
          console.log(`    • Custom Ordering: ✅`);
        }
      }
    }

    if (!hasCustomizations) {
      console.log(
        `  📝 No custom preferences set yet (but system is ready for them)`
      );
    }
  } catch (error) {
    console.error("❌ Error checking user functionality:", error);
    process.exit(1);
  } finally {
    await client.close();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

// Run the check
checkUserFunctionality().catch(console.error);
