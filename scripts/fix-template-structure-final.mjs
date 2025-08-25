#!/usr/bin/env node

/**
 * Fix Template Data Structure
 *
 * Updates your content_templates to match the structure expected by the app
 */

import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;

async function fixTemplateStructure() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db("AmpTrack");
    const templates = await db
      .collection("content_templates")
      .find({})
      .toArray();

    console.log("🔍 Current template structure:");
    templates.forEach((t) => {
      console.log(`  ${t.userRole}: ${Object.keys(t).join(", ")}`);
    });

    // Fix admin template structure
    const adminTemplate = await db
      .collection("content_templates")
      .findOne({ userRole: "admin" });
    if (adminTemplate) {
      console.log("\n🔧 Fixing admin template structure...");

      const correctedAdmin = {
        userRole: "admin",
        type: "placeholderText",
        content: {
          masterChecklist: adminTemplate.masterChecklist || [],
          habitBreakChecklist: adminTemplate.habitBreakChecklist || [],
          workoutChecklist: adminTemplate.workoutChecklist || [],
          timeBlocks: adminTemplate.timeBlocks || [],
          placeholderText: {
            masterChecklistTitle: "Master Checklist",
            masterChecklistDescription: "Complete your daily essential tasks",
            habitBreakTitle: "Habit Break Tracker",
            habitBreakDescription: "Track habits you want to break",
            todoTitle: "To-Do List",
            todoDescription: "Daily tasks and goals",
            workoutTitle: "Workout Checklist",
            workoutDescription: "Track your fitness activities",
            timeBlocksTitle: "Time Blocks",
            timeBlocksDescription: "Plan your daily schedule",
          },
        },
        createdAt: adminTemplate.createdAt || new Date(),
        updatedAt: new Date(),
      };

      await db
        .collection("content_templates")
        .updateOne({ _id: adminTemplate._id }, { $set: correctedAdmin });
      console.log("✅ Fixed admin template structure");
    }

    // Fix public template structure
    const publicTemplate = await db
      .collection("content_templates")
      .findOne({ userRole: "public" });
    if (publicTemplate) {
      console.log("\n🔧 Fixing public template structure...");

      const correctedPublic = {
        userRole: "public",
        type: "placeholderText",
        content: {
          masterChecklist: publicTemplate.masterChecklist || [],
          habitBreakChecklist: publicTemplate.habitBreakChecklist || [],
          workoutChecklist: publicTemplate.workoutChecklist || [],
          timeBlocks: publicTemplate.timeBlocks || [],
          placeholderText: {
            masterChecklistTitle: "Master Checklist",
            masterChecklistDescription: "Complete your daily essential tasks",
            habitBreakTitle: "Habit Break Tracker",
            habitBreakDescription: "Track habits you want to break",
            todoTitle: "To-Do List",
            todoDescription: "Daily tasks and goals",
            workoutTitle: "Workout Checklist",
            workoutDescription: "Track your fitness activities",
            timeBlocksTitle: "Time Blocks",
            timeBlocksDescription: "Plan your daily schedule",
          },
        },
        createdAt: publicTemplate.createdAt || new Date(),
        updatedAt: new Date(),
      };

      await db
        .collection("content_templates")
        .updateOne({ _id: publicTemplate._id }, { $set: correctedPublic });
      console.log("✅ Fixed public template structure");
    }

    // Verify the fix
    console.log("\n🔍 Verification after fix:");
    const updatedTemplates = await db
      .collection("content_templates")
      .find({})
      .toArray();
    updatedTemplates.forEach((t) => {
      console.log(`\n📋 ${t.userRole.toUpperCase()} Template:`);
      console.log(
        `  ✅ Structure: type=${t.type}, content keys=${Object.keys(
          t.content
        ).join(", ")}`
      );
      console.log(
        `  ✅ Data: ${t.content.masterChecklist?.length || 0} master, ${
          t.content.timeBlocks?.length || 0
        } blocks`
      );
    });

    console.log("\n🎉 Template structure fixed!");
    console.log(
      "📱 Your app should now load the optimized templates correctly"
    );
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

fixTemplateStructure();
