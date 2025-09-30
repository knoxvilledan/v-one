#!/usr/bin/env node

/**
 * One-time restore script to bring back To-Do list and Time-Block labels
 * from September 24th, 2025 as the source.
 *
 * Usage: node scripts/oneoff-restore-from-2025-09-24.mjs --username=<publicUsername> --target=<YYYY-MM-DD>
 */

import { MongoClient } from "mongodb";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { readFileSync } from "fs";

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

try {
  const envPath = join(projectRoot, ".env.local");
  const envContent = readFileSync(envPath, "utf8");
  envContent.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0) {
      const value = valueParts.join("=").replace(/^["']|["']$/g, "");
      process.env[key.trim()] = value.trim();
    }
  });
} catch (error) {
  console.warn(
    "Could not load .env.local file, using existing environment variables:",
    error.message
  );
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};

  for (const arg of args) {
    if (arg.startsWith("--username=")) {
      parsed.username = arg.split("=")[1];
    } else if (arg.startsWith("--target=")) {
      parsed.target = arg.split("=")[1];
    } else if (arg === "--help" || arg === "-h") {
      showUsage();
      process.exit(0);
    }
  }

  return parsed;
}

function showUsage() {
  console.log(`
Usage: node scripts/oneoff-restore-from-2025-09-24.mjs --username=<publicUsername> --target=<YYYY-MM-DD>

Arguments:
  --username=<publicUsername>  The public username to restore data for
  --target=<YYYY-MM-DD>       The target date to restore data into (e.g., 2025-09-30)

Example:
  node scripts/oneoff-restore-from-2025-09-24.mjs --username=knoxvilledan --target=2025-09-30

Description:
  This script restores To-Do list items and Time-Block labels from September 24th, 2025
  into the specified target date. Only these fields are copied:
  
  - todoList: All items with completion state reset
  - blocks: Only id and label (names), with notes and completion reset
  
  Master/habit/workout checklists are left untouched.
`);
}

function validateDate(dateString) {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  return date.toISOString().split("T")[0] === dateString;
}

async function findUserByUsername(db, username) {
  const usersCollection = db.collection("users");
  const user = await usersCollection.findOne({
    $or: [
      { username: username },
      { email: username }, // Also try email in case username is actually email
    ],
  });

  if (!user) {
    throw new Error(`User not found with username: ${username}`);
  }

  console.log(`✅ Found user: ${user.email} (ID: ${user._id})`);
  return user;
}

async function loadUserData(db, userId, date) {
  const userDataCollection = db.collection("userdatas");
  const userData = await userDataCollection.findOne({
    userId: userId,
    date: date,
  });

  return userData;
}

async function createUserDataForDate(db, userId, userEmail, date) {
  const userDataCollection = db.collection("userdatas");

  const newUserData = {
    userId: userId,
    date: date,
    displayDate: new Date(date).toLocaleDateString(),
    wakeTime: "04:00",
    userTimezone: "America/New_York", // Default timezone
    blocks: [],
    masterChecklist: [],
    habitBreakChecklist: [],
    workoutChecklist: [],
    todoList: [],
    score: 0,
    dailyWakeTime: "04:00",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await userDataCollection.insertOne(newUserData);
  console.log(`📝 Created new UserData document for ${date}`);

  return { ...newUserData, _id: result.insertedId };
}

function copyTodoListForRestore(sourceList) {
  if (!sourceList || sourceList.length === 0) return [];

  return sourceList.map((item) => ({
    ...item,
    completed: false,
    completedAt: undefined,
    timezoneOffset: undefined,
    completionTimezone: undefined,
    // Keep: text, id, category, targetBlock
  }));
}

function copyBlocksForRestore(sourceBlocks) {
  if (!sourceBlocks || sourceBlocks.length === 0) return [];

  return sourceBlocks.map((block) => ({
    ...block,
    notes: [], // Reset notes
    complete: false, // Reset completion
    // Keep: id, label (the custom name), time, duration, index, blockId
  }));
}

async function main() {
  const args = parseArgs();

  // Validate arguments
  if (!args.username || !args.target) {
    console.error("❌ Error: Missing required arguments");
    showUsage();
    process.exit(1);
  }

  if (!validateDate(args.target)) {
    console.error("❌ Error: Invalid target date format. Use YYYY-MM-DD");
    process.exit(1);
  }

  // Check MongoDB URI
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("❌ Error: MONGODB_URI not found in environment variables");
    process.exit(1);
  }

  const sourceDate = "2025-09-24";
  const targetDate = args.target;
  const username = args.username;

  console.log(`🚀 Starting restoration process...`);
  console.log(`   Source date: ${sourceDate}`);
  console.log(`   Target date: ${targetDate}`);
  console.log(`   Username: ${username}`);

  let client;

  try {
    // Connect to MongoDB
    client = new MongoClient(mongoUri);
    await client.connect();
    console.log("🔗 Connected to MongoDB");

    const db = client.db("Amplify");

    // Find user by username
    const user = await findUserByUsername(db, username);
    const userId = user._id.toString();

    // Load source data from 2025-09-24
    console.log(`📖 Loading source data from ${sourceDate}...`);
    const sourceData = await loadUserData(db, userId, sourceDate);

    if (!sourceData) {
      console.error(
        `❌ Error: No data found for ${sourceDate} for user ${username}`
      );
      process.exit(1);
    }

    console.log(`✅ Found source data:`, {
      todoList: sourceData.todoList?.length || 0,
      blocks: sourceData.blocks?.length || 0,
      masterChecklist: sourceData.masterChecklist?.length || 0,
      habitBreakChecklist: sourceData.habitBreakChecklist?.length || 0,
      workoutChecklist: sourceData.workoutChecklist?.length || 0,
    });

    // Load or create target data
    console.log(`📖 Loading target data for ${targetDate}...`);
    let targetData = await loadUserData(db, userId, targetDate);

    if (!targetData) {
      console.log(
        `📝 No data found for ${targetDate}, creating new document...`
      );
      targetData = await createUserDataForDate(
        db,
        userId,
        user.email,
        targetDate
      );
    } else {
      console.log(`✅ Found existing target data for ${targetDate}`);
    }

    // Copy todoList with reset completion
    const restoredTodos = copyTodoListForRestore(sourceData.todoList);
    console.log(
      `📋 Copying ${restoredTodos.length} todo items with reset completion...`
    );

    // Copy blocks with reset notes/completion but keep labels
    const restoredBlocks = copyBlocksForRestore(sourceData.blocks);
    console.log(
      `⏰ Copying ${restoredBlocks.length} time blocks with custom labels...`
    );

    // Update target data
    const userDataCollection = db.collection("userdatas");
    const updateResult = await userDataCollection.updateOne(
      { userId: userId, date: targetDate },
      {
        $set: {
          todoList: restoredTodos,
          blocks: restoredBlocks,
          updatedAt: new Date(),
        },
      }
    );

    if (updateResult.matchedCount === 0) {
      console.error(`❌ Error: Could not find target document to update`);
      process.exit(1);
    }

    console.log(`✨ Successfully restored data!`);
    console.log(`📊 Restoration summary:`);
    console.log(
      `   📋 Todo items: ${restoredTodos.length} (all reset to incomplete)`
    );
    console.log(
      `   ⏰ Time blocks: ${restoredBlocks.length} (labels preserved, notes/completion reset)`
    );

    // Log the final success message
    console.log(
      `\n🎉 Restored To-Dos and block names from ${sourceDate} into ${targetDate} for ${username}`
    );
  } catch (error) {
    console.error("❌ Error during restoration:", error.message);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log("🔐 Disconnected from MongoDB");
    }
  }
}

// Run the script
main().catch((error) => {
  console.error("❌ Unexpected error:", error);
  process.exit(1);
});
