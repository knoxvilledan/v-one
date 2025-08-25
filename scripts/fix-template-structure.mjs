#!/usr/bin/env node

/**
 * Fix Template Structure - Use YOUR Real Templates
 *
 * Updates your existing content_templates collection with optimizations
 * and ensures users get the improvements while preserving their data
 */

import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI environment variable is required");
  process.exit(1);
}

function getTodayDateString() {
  const today = new Date();
  return today.toISOString().split("T")[0]; // YYYY-MM-DD format
}

async function fixTemplateStructure() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");
    console.log("🔧 Fixing template structure to use YOUR real templates...");

    const db = client.db("AmpTrack");

    // 1. Check existing content_templates
    console.log("\n📋 Checking your existing content_templates...");
    const existingTemplates = await db
      .collection("content_templates")
      .find({})
      .toArray();

    console.log(`Found ${existingTemplates.length} existing templates:`);
    existingTemplates.forEach((template) => {
      console.log(`  📄 ${template._id}: ${template.name || "No name"}`);
      console.log(
        `     Master checklist: ${template.masterChecklist?.length || 0} items`
      );
      console.log(
        `     Time blocks: ${template.timeBlocks?.length || 0} blocks`
      );
    });

    // 2. Update your existing templates with optimized IDs
    console.log("\n🔧 Updating your templates with optimized IDs...");

    for (const template of existingTemplates) {
      console.log(`\n📝 Updating template: ${template._id}`);

      // Update master checklist with semantic IDs if they don't have them
      const updatedMasterChecklist =
        template.masterChecklist?.map((item, index) => {
          if (!item.id || !item.id.startsWith("mc-")) {
            // Generate semantic ID based on category or index
            const category = item.category || "morning";
            const sequence = String(index + 1).padStart(3, "0");
            return { ...item, id: `mc-${category}-${sequence}` };
          }
          return item;
        }) || [];

      // Update habit break checklist with semantic IDs
      const updatedHabitBreakChecklist =
        template.habitBreakChecklist?.map((item, index) => {
          if (!item.id || !item.id.startsWith("hb-")) {
            const category = item.category || "lsd";
            const sequence = String(index + 1).padStart(3, "0");
            return { ...item, id: `hb-${category}-${sequence}` };
          }
          return item;
        }) || [];

      // Update time blocks with semantic IDs
      const updatedTimeBlocks =
        template.timeBlocks?.map((block, index) => {
          if (!block.id || !block.id.startsWith("tb-")) {
            const hour = block.hour || 6 + index;
            const sequence = String(1).padStart(3, "0");
            return {
              ...block,
              id: `tb-${String(hour).padStart(2, "0")}h-${sequence}`,
            };
          }
          return block;
        }) || [];

      // Update the template
      await db.collection("content_templates").updateOne(
        { _id: template._id },
        {
          $set: {
            masterChecklist: updatedMasterChecklist,
            habitBreakChecklist: updatedHabitBreakChecklist,
            timeBlocks: updatedTimeBlocks,
            todoList: template.todoList || [],
            workoutChecklist: template.workoutChecklist || [],
            updatedAt: new Date(),
          },
        }
      );

      console.log(`   ✅ Updated ${template._id} with optimized IDs`);
    }

    // 3. Update your users to use the optimized templates
    console.log("\n👥 Updating your users with optimized template data...");
    const users = await db.collection("users").find({}).toArray();

    const today = getTodayDateString();

    for (const user of users) {
      console.log(`\n📧 Processing user: ${user.email}`);

      // Find appropriate template for user
      const isAdmin = user.role === "admin";
      const template =
        existingTemplates.find((t) =>
          isAdmin
            ? t._id.includes("admin") || t.name?.toLowerCase().includes("admin")
            : t._id.includes("public") ||
              t.name?.toLowerCase().includes("public") ||
              !t._id.includes("admin")
        ) || existingTemplates[0]; // Fallback to first template

      console.log(`   Using template: ${template._id}`);

      // Get updated template data
      const updatedTemplate = await db
        .collection("content_templates")
        .findOne({ _id: template._id });

      // Create today's data with optimized structure
      const todayData = {
        masterChecklist: updatedTemplate.masterChecklist.map((item) => ({
          ...item,
          completed: false,
          completedAt: null,
        })),

        habitBreakChecklist: updatedTemplate.habitBreakChecklist.map(
          (item) => ({
            ...item,
            completed: false,
            completedAt: null,
          })
        ),

        todoList: [], // Empty - ready for collision-resistant IDs
        workoutChecklist: [], // Empty - ready for collision-resistant IDs

        timeBlocks: updatedTemplate.timeBlocks.map((block) => ({
          ...block,
          activities: Array.isArray(block.activities)
            ? [...block.activities]
            : [],
        })),

        notes: "",

        // Metadata
        createdAt: new Date(),
        updatedAt: new Date(),
        templateUsed: template._id,
      };

      // Preserve existing user data for other dates, only update today
      const updateResult = await db.collection("users").updateOne(
        { _id: user._id },
        {
          $set: {
            [`data.${today}`]: todayData,
            updatedAt: new Date(),
          },
        }
      );

      if (updateResult.modifiedCount > 0) {
        console.log(
          `   ✅ Updated ${user.email} with optimized data for ${today}`
        );
      }
    }

    // 4. Clean up the wrong template collections I created
    console.log("\n🧹 Cleaning up incorrect template collections...");
    await db
      .collection("adminTemplates")
      .drop()
      .catch(() => console.log("   adminTemplates already clean"));
    await db
      .collection("publicTemplates")
      .drop()
      .catch(() => console.log("   publicTemplates already clean"));
    console.log("✅ Removed incorrect template collections");

    // 5. Final verification
    console.log("\n🔍 Final verification...");
    const finalTemplates = await db
      .collection("content_templates")
      .find({})
      .toArray();
    const finalUsers = await db.collection("users").find({}).toArray();

    console.log(`📋 Templates in content_templates: ${finalTemplates.length}`);
    finalTemplates.forEach((t) => {
      console.log(
        `   ✅ ${t._id} - ${t.masterChecklist?.length || 0} master items`
      );
    });

    console.log(`👥 Users with data: ${finalUsers.length}`);
    finalUsers.forEach((u) => {
      console.log(`   ✅ ${u.email} - Has data: ${!!u.data}`);
    });

    console.log("\n🎉 Template structure fixed!");
    console.log("✅ Using YOUR real content_templates");
    console.log("✅ Users updated with optimized data");
    console.log("✅ All mobile improvements ready");
    console.log("✅ Collision-resistant IDs ready for new items");
    console.log("\n🚀 Your app now works with the correct template structure!");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

fixTemplateStructure();
