#!/usr/bin/env node

/**
 * CAUTIOUS DATA SYNC
 *
 * This script populates the Plan system collections with data from the current system
 * while keeping the current system untouched as a fallback.
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
 * Generate consistent IDs for Plan system
 */
function generatePlanId(type, category = "", sequence = 1) {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 4);

  if (type === "template") {
    return `tmpl_${category}_v1_${random}`;
  } else if (type === "checklist") {
    return `cl_${category}_${sequence.toString().padStart(3, "0")}`;
  } else if (type === "block") {
    return `tb_${category}_${sequence.toString().padStart(3, "0")}`;
  } else if (type === "item") {
    return `item_${timestamp}_${random}`;
  } else if (type === "todo") {
    return `todo_${timestamp}_${random}`;
  }

  return `${type}_${timestamp}_${random}`;
}

/**
 * Convert content template to template set (Plan system format)
 */
function convertContentTemplateToTemplateSet(contentTemplate) {
  // Convert time blocks
  const timeBlocks = (contentTemplate.content?.timeBlocks || []).map(
    (block, index) => ({
      blockId:
        block.blockId || block.id || generatePlanId("block", "time", index + 1),
      time: block.time,
      label: block.label,
      order: block.order || index + 1,
    })
  );

  // Convert checklists
  const checklists = [];

  // Master checklist
  if (contentTemplate.content?.masterChecklist?.length) {
    const items = contentTemplate.content.masterChecklist.map(
      (item, index) => ({
        itemId: item.itemId || item.id || generatePlanId("item"),
        text: item.text,
        order: item.order || index + 1,
      })
    );

    checklists.push({
      checklistId: "master_checklist",
      title: "Daily Master Checklist",
      items,
      itemsOrder: items.map((item) => item.itemId),
      order: 1,
    });
  }

  // Habit break checklist
  if (contentTemplate.content?.habitBreakChecklist?.length) {
    const items = contentTemplate.content.habitBreakChecklist.map(
      (item, index) => ({
        itemId: item.itemId || item.id || generatePlanId("item"),
        text: item.text,
        order: item.order || index + 1,
      })
    );

    checklists.push({
      checklistId: "habit_break_checklist",
      title: "Habit Break Tracker",
      items,
      itemsOrder: items.map((item) => item.itemId),
      order: 2,
    });
  }

  // Workout checklist
  if (contentTemplate.content?.workoutChecklist?.length) {
    const items = contentTemplate.content.workoutChecklist.map(
      (item, index) => ({
        itemId: item.itemId || item.id || generatePlanId("item"),
        text: item.text,
        order: item.order || index + 1,
      })
    );

    checklists.push({
      checklistId: "workout_checklist",
      title: "Workout Tracker",
      items,
      itemsOrder: items.map((item) => item.itemId),
      order: 3,
    });
  }

  return {
    version: "1.0.0",
    role: contentTemplate.userRole,
    name: `${
      contentTemplate.userRole.charAt(0).toUpperCase() +
      contentTemplate.userRole.slice(1)
    } Template Set`,
    description: `Converted from content_templates for ${contentTemplate.userRole} users`,
    timeBlocks,
    timeBlocksOrder: timeBlocks.map((tb) => tb.blockId),
    checklists,
    checklistsOrder: checklists.map((cl) => cl.checklistId),
    isActive: true,
    createdAt: contentTemplate.createdAt || new Date(),
    updatedAt: new Date(),
    createdBy: contentTemplate.userRole === "admin" ? "system" : null,
  };
}

/**
 * Convert user data to day entry (Plan system format)
 */
function convertUserDataToDayEntry(
  userData,
  userEmail,
  templateVersion = "1.0.0"
) {
  return {
    userId: userData.userId,
    email: userEmail,
    date: userData.date,
    displayDate: userData.displayDate || userData.date,
    templateVersion,
    data: {
      timeBlocks: (userData.blocks || []).map((block) => ({
        blockId: block.blockId || block.id,
        time: block.time,
        label: block.label,
        notes: block.notes || [],
        complete: block.complete || false,
        duration: block.duration,
      })),
      checklists: {
        master: (userData.masterChecklist || []).map((item) => ({
          itemId: item.itemId || item.id,
          text: item.text,
          completed: item.completed || false,
          category: item.category,
          completedAt: item.completedAt,
        })),
        habitBreak: (userData.habitBreakChecklist || []).map((item) => ({
          itemId: item.itemId || item.id,
          text: item.text,
          completed: item.completed || false,
          category: item.category,
          completedAt: item.completedAt,
        })),
        workout: (userData.workoutChecklist || []).map((item) => ({
          itemId: item.itemId || item.id,
          text: item.text,
          completed: item.completed || false,
          category: item.category,
          completedAt: item.completedAt,
        })),
      },
      todos: (userData.todoList || []).map((item) => ({
        itemId: item.itemId || item.id,
        text: item.text,
        completed: item.completed || false,
        category: item.category,
        dueDate: item.dueDate,
      })),
      score: userData.score || 0,
      wakeTime: userData.dailyWakeTime || userData.wakeTime || "",
      notes: {},
    },
    metadata: {
      timezone: userData.userTimezone || null,
      lastModified: userData.updatedAt || new Date(),
    },
    createdAt: userData.createdAt || new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Create user space with minimal customizations
 */
function createUserSpace(userId, userEmail, userData) {
  return {
    userId,
    email: userEmail,
    customizations: {
      timeBlocks: {}, // No customizations initially
      checklists: {}, // No customizations initially
      preferences: {
        wakeTime: userData.dailyWakeTime || userData.wakeTime,
        timezone: userData.userTimezone,
      },
    },
    lastActiveAt: userData.updatedAt || new Date(),
    version: "1.0.0",
    createdAt: userData.createdAt || new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Sync current system data to Plan system
 */
async function syncToPlanSystem() {
  try {
    console.log("🔄 Syncing current system data to Plan system...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    const db = mongoose.connection.db;

    // Verify both systems exist
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((c) => c.name);

    const currentSystemCollections = [
      "content_templates",
      "user_data",
      "users",
    ];
    const planSystemCollections = [
      "templateSets",
      "userSpaces",
      "dayEntries",
      "todoItems",
    ];

    const hasCurrentSystem = currentSystemCollections.every((name) =>
      collectionNames.includes(name)
    );
    const hasPlanSystem = planSystemCollections.every((name) =>
      collectionNames.includes(name)
    );

    if (!hasCurrentSystem) {
      console.error("❌ Current system collections missing!");
      return;
    }

    if (!hasPlanSystem) {
      console.error(
        "❌ Plan system collections missing! Run create-hybrid-system first."
      );
      return;
    }

    // Step 1: Sync content templates to template sets
    console.log("\n📋 Step 1: Syncing content templates to template sets...");
    const contentTemplates = await db
      .collection("content_templates")
      .find({})
      .toArray();
    console.log(`Found ${contentTemplates.length} content templates`);

    for (const contentTemplate of contentTemplates) {
      const templateSet = convertContentTemplateToTemplateSet(contentTemplate);

      await db
        .collection("templateSets")
        .replaceOne(
          { role: templateSet.role, version: templateSet.version },
          templateSet,
          { upsert: true }
        );

      console.log(
        `✅ Synced ${contentTemplate.userRole} template to TemplateSet`
      );
    }

    // Step 2: Get user email mappings
    console.log("\n👤 Step 2: Building user mappings...");
    const users = await db.collection("users").find({}).toArray();
    const userEmailMap = {};
    users.forEach((user) => {
      userEmailMap[user._id.toString()] = user.email;
    });
    console.log(`Found ${users.length} users`);

    // Step 3: Sync user data to day entries and create user spaces
    console.log("\n📅 Step 3: Syncing user data to day entries...");
    const userData = await db.collection("user_data").find({}).toArray();
    console.log(`Found ${userData.length} user data records`);

    const userSpaces = new Map();
    let syncedDayEntries = 0;

    for (const userRecord of userData) {
      const userEmail = userEmailMap[userRecord.userId];
      if (!userEmail) {
        console.warn(`⚠️  No email found for userId: ${userRecord.userId}`);
        continue;
      }

      // Create user space if not exists
      if (!userSpaces.has(userRecord.userId)) {
        const userSpace = createUserSpace(
          userRecord.userId,
          userEmail,
          userRecord
        );
        userSpaces.set(userRecord.userId, userSpace);
      }

      // Convert to day entry
      const dayEntry = convertUserDataToDayEntry(userRecord, userEmail);

      await db
        .collection("dayEntries")
        .replaceOne(
          { userId: userRecord.userId, date: userRecord.date },
          dayEntry,
          { upsert: true }
        );

      syncedDayEntries++;
    }

    // Step 4: Create user spaces
    console.log("\n🏠 Step 4: Creating user spaces...");
    let createdUserSpaces = 0;
    for (const [userId, userSpace] of userSpaces) {
      await db
        .collection("userSpaces")
        .replaceOne({ userId }, userSpace, { upsert: true });
      createdUserSpaces++;
    }

    // Step 5: Extract todos to todo items
    console.log("\n✅ Step 5: Extracting todo items...");
    let createdTodos = 0;

    for (const userRecord of userData) {
      const userEmail = userEmailMap[userRecord.userId];
      if (!userEmail || !userRecord.todoList?.length) continue;

      for (const todoItem of userRecord.todoList) {
        const todo = {
          todoId: todoItem.itemId || todoItem.id || generatePlanId("todo"),
          userId: userRecord.userId,
          email: userEmail,
          title: todoItem.text,
          description: "",
          status: todoItem.completed ? "completed" : "pending",
          priority: "medium",
          category: todoItem.category || "general",
          tags: [],
          dueDate: todoItem.dueDate ? new Date(todoItem.dueDate) : null,
          scheduledDate: new Date(userRecord.date),
          completedAt: todoItem.completedAt
            ? new Date(todoItem.completedAt)
            : null,
          createdAt: userRecord.createdAt || new Date(),
          updatedAt: new Date(),
        };

        await db
          .collection("todoItems")
          .replaceOne(
            { todoId: todo.todoId, userId: userRecord.userId },
            todo,
            { upsert: true }
          );

        createdTodos++;
      }
    }

    // Verification
    console.log("\n🔍 Verifying sync results...");
    const templateSetsCount = await db
      .collection("templateSets")
      .countDocuments();
    const userSpacesCount = await db.collection("userSpaces").countDocuments();
    const dayEntriesCount = await db.collection("dayEntries").countDocuments();
    const todoItemsCount = await db.collection("todoItems").countDocuments();

    console.log("📊 Sync Summary:");
    console.log(`  TemplateSet: ${templateSetsCount} documents`);
    console.log(
      `  UserSpace: ${userSpacesCount} documents (${createdUserSpaces} created)`
    );
    console.log(
      `  DayEntry: ${dayEntriesCount} documents (${syncedDayEntries} synced)`
    );
    console.log(
      `  TodoItem: ${todoItemsCount} documents (${createdTodos} created)`
    );

    console.log("\n🎉 Data sync completed successfully!");
    console.log("📝 Status:");
    console.log("✅ Current system: UNTOUCHED and fully functional");
    console.log("✅ Plan system: POPULATED and ready for user customizations");
    console.log("✅ Both systems: Available for gradual transition");
  } catch (error) {
    console.error("❌ Data sync failed:", error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Run data sync
syncToPlanSystem();
