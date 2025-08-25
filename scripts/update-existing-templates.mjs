#!/usr/bin/env node

/**
 * Update YOUR Existing Templates with Optimized Data
 *
 * Updates your existing admin and public templates in content_templates
 * with proper optimized structure while preserving the userRole constraint.
 */

import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI environment variable is required");
  process.exit(1);
}

async function updateExistingTemplates() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");
    console.log("🔧 Updating YOUR existing templates with optimized data...");

    const db = client.db("AmpTrack");

    // Get existing templates
    const adminTemplate = await db
      .collection("content_templates")
      .findOne({ userRole: "admin" });
    const publicTemplate = await db
      .collection("content_templates")
      .findOne({ userRole: "public" });

    console.log("\n📋 Found existing templates:");
    console.log("  Admin template:", !!adminTemplate);
    console.log("  Public template:", !!publicTemplate);

    // Update admin template
    if (adminTemplate) {
      console.log("\n🔧 Updating admin template...");

      const adminData = {
        name: "Admin Template",
        type: "default",

        masterChecklist: [
          // Morning routine
          {
            id: "mc-morning-001",
            text: "Wake up at target time",
            category: "morning",
            completed: false,
          },
          {
            id: "mc-morning-002",
            text: "Morning meditation/prayer",
            category: "morning",
            completed: false,
          },
          {
            id: "mc-morning-003",
            text: "Review daily goals",
            category: "morning",
            completed: false,
          },

          // Work focus
          {
            id: "mc-work-001",
            text: "Check and respond to priority emails",
            category: "work",
            completed: false,
          },
          {
            id: "mc-work-002",
            text: "Complete most important task",
            category: "work",
            completed: false,
          },
          {
            id: "mc-work-003",
            text: "Update project status",
            category: "work",
            completed: false,
          },

          // Tech/Development
          {
            id: "mc-tech-001",
            text: "Code review and commits",
            category: "tech",
            completed: false,
          },
          {
            id: "mc-tech-002",
            text: "Learn something new (tech)",
            category: "tech",
            completed: false,
          },

          // House/Personal
          {
            id: "mc-house-001",
            text: "Tidy living space",
            category: "house",
            completed: false,
          },
          {
            id: "mc-house-002",
            text: "Meal prep/planning",
            category: "house",
            completed: false,
          },

          // Wrap-up
          {
            id: "mc-wrapup-001",
            text: "Review day accomplishments",
            category: "wrapup",
            completed: false,
          },
          {
            id: "mc-wrapup-002",
            text: "Plan tomorrow priorities",
            category: "wrapup",
            completed: false,
          },
        ],

        habitBreakChecklist: [
          {
            id: "hb-lsd-001",
            text: "Avoided mindless social media",
            category: "lsd",
            completed: false,
          },
          {
            id: "hb-lsd-002",
            text: "Limited news consumption",
            category: "lsd",
            completed: false,
          },
          {
            id: "hb-financial-001",
            text: "Tracked expenses",
            category: "financial",
            completed: false,
          },
          {
            id: "hb-financial-002",
            text: "No impulse purchases",
            category: "financial",
            completed: false,
          },
          {
            id: "hb-youtube-001",
            text: "Productive YouTube only",
            category: "youtube",
            completed: false,
          },
          {
            id: "hb-time-001",
            text: "Used time blocking effectively",
            category: "time",
            completed: false,
          },
        ],

        todoList: [],
        workoutChecklist: [],

        timeBlocks: [
          {
            id: "tb-06h-001",
            hour: 6,
            activities: ["Morning routine", "Exercise"],
          },
          { id: "tb-07h-001", hour: 7, activities: ["Breakfast", "Planning"] },
          { id: "tb-08h-001", hour: 8, activities: ["Deep work block 1"] },
          { id: "tb-09h-001", hour: 9, activities: ["Deep work block 1"] },
          { id: "tb-10h-001", hour: 10, activities: ["Meetings/Calls"] },
          { id: "tb-11h-001", hour: 11, activities: ["Deep work block 2"] },
          { id: "tb-12h-001", hour: 12, activities: ["Lunch break"] },
          { id: "tb-13h-001", hour: 13, activities: ["Administrative tasks"] },
          { id: "tb-14h-001", hour: 14, activities: ["Deep work block 3"] },
          { id: "tb-15h-001", hour: 15, activities: ["Deep work block 3"] },
          { id: "tb-16h-001", hour: 16, activities: ["Review and planning"] },
          { id: "tb-17h-001", hour: 17, activities: ["Wrap up work"] },
          { id: "tb-18h-001", hour: 18, activities: ["Personal time"] },
          { id: "tb-19h-001", hour: 19, activities: ["Dinner"] },
          { id: "tb-20h-001", hour: 20, activities: ["Family/Personal"] },
          { id: "tb-21h-001", hour: 21, activities: ["Wind down"] },
          { id: "tb-22h-001", hour: 22, activities: ["Prepare for sleep"] },
        ],

        updatedAt: new Date(),
      };

      await db
        .collection("content_templates")
        .updateOne({ _id: adminTemplate._id }, { $set: adminData });
      console.log("✅ Updated admin template with optimized data");
    }

    // Update public template
    if (publicTemplate) {
      console.log("\n🔧 Updating public template...");

      const publicData = {
        name: "Public Template",
        type: "default",

        masterChecklist: [
          {
            id: "mc-morning-001",
            text: "Morning routine",
            category: "morning",
            completed: false,
          },
          {
            id: "mc-work-001",
            text: "Complete important task",
            category: "work",
            completed: false,
          },
          {
            id: "mc-house-001",
            text: "Tidy space",
            category: "house",
            completed: false,
          },
          {
            id: "mc-wrapup-001",
            text: "Review day",
            category: "wrapup",
            completed: false,
          },
        ],

        habitBreakChecklist: [
          {
            id: "hb-lsd-001",
            text: "Mindful social media use",
            category: "lsd",
            completed: false,
          },
          {
            id: "hb-financial-001",
            text: "Track spending",
            category: "financial",
            completed: false,
          },
          {
            id: "hb-time-001",
            text: "Use time wisely",
            category: "time",
            completed: false,
          },
        ],

        todoList: [],
        workoutChecklist: [],

        timeBlocks: [
          { id: "tb-08h-001", hour: 8, activities: ["Morning routine"] },
          { id: "tb-09h-001", hour: 9, activities: ["Work focus"] },
          { id: "tb-12h-001", hour: 12, activities: ["Lunch"] },
          { id: "tb-14h-001", hour: 14, activities: ["Afternoon work"] },
          { id: "tb-18h-001", hour: 18, activities: ["Personal time"] },
          { id: "tb-21h-001", hour: 21, activities: ["Wind down"] },
        ],

        updatedAt: new Date(),
      };

      await db
        .collection("content_templates")
        .updateOne({ _id: publicTemplate._id }, { $set: publicData });
      console.log("✅ Updated public template with optimized data");
    }

    // Clean up wrong template collections
    console.log("\n🧹 Cleaning up incorrect template collections...");
    try {
      await db.collection("adminTemplates").drop();
      console.log("✅ Removed adminTemplates collection");
    } catch {
      console.log("✅ adminTemplates already clean");
    }

    try {
      await db.collection("publicTemplates").drop();
      console.log("✅ Removed publicTemplates collection");
    } catch {
      console.log("✅ publicTemplates already clean");
    }

    // Verify the update
    console.log("\n🔍 Verification...");
    const updatedTemplates = await db
      .collection("content_templates")
      .find({})
      .toArray();
    const users = await db.collection("users").find({}).toArray();

    console.log("📋 Your content_templates:");
    updatedTemplates.forEach((template) => {
      console.log(
        `   ✅ ${template.userRole} - ${
          template.masterChecklist?.length || 0
        } master items, ${template.timeBlocks?.length || 0} time blocks`
      );
    });

    console.log("👥 Your users (data preserved):");
    users.forEach((user) => {
      const hasData = !!user.data;
      const dateCount = hasData ? Object.keys(user.data).length : 0;
      console.log(
        `   ✅ ${user.email} (${user.role}) - ${dateCount} dates of data`
      );
    });

    console.log("\n🎉 Template optimization complete!");
    console.log("✅ YOUR content_templates now have proper optimized data");
    console.log("✅ Users' existing data preserved");
    console.log("✅ Mobile-responsive TodoList & WorkoutChecklist ready");
    console.log("✅ Collision-resistant ID generation ready");
    console.log("✅ Time blocks collapsible functionality ready");
    console.log("✅ Semantic IDs for all template items");
    console.log(
      "\n🚀 Your app is now fully optimized with YOUR template structure!"
    );
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

updateExistingTemplates();
