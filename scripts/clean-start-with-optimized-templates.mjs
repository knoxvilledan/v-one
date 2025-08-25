#!/usr/bin/env node

/**
 * Clean Start with Optimized Templates
 *
 * Since you have no meaningful data yet, this will:
 * 1. Clear all user data (keeping accounts)
 * 2. Create optimized template structures
 * 3. Ensure everything starts with best practices
 */

import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI environment variable is required");
  process.exit(1);
}

async function cleanStartWithOptimizedTemplates() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db("AmpTracker");

    // 1. Clear all user data (but keep accounts)
    console.log("\n🧹 Clearing user data...");
    const users = await db.collection("users").find({}).toArray();

    for (const user of users) {
      await db.collection("users").updateOne(
        { _id: user._id },
        {
          $unset: { data: 1 },
          $set: { updatedAt: new Date() },
        }
      );
      console.log(`   Cleared data for: ${user.email}`);
    }

    // 2. Clear and recreate templates with optimized structure
    console.log("\n🏗️ Creating optimized templates...");

    // Clear existing templates
    await db.collection("publicTemplates").deleteMany({});
    await db.collection("adminTemplates").deleteMany({});

    // Create optimized admin templates
    const adminTemplate = {
      _id: "admin-default-template",
      name: "Admin Default Template",
      description: "Optimized admin template with semantic IDs",
      createdAt: new Date(),
      updatedAt: new Date(),

      // Optimized Master Checklist with semantic IDs
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

      // Optimized Habit Break Checklist
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

      // Default empty collections for user-generated content
      todoList: [],
      workoutChecklist: [],

      // Optimized Time Blocks with semantic IDs
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
    };

    // Create optimized public template (simpler version)
    const publicTemplate = {
      _id: "public-default-template",
      name: "Public Default Template",
      description: "Optimized public template for general users",
      createdAt: new Date(),
      updatedAt: new Date(),

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
    };

    // Insert templates
    await db.collection("adminTemplates").insertOne(adminTemplate);
    await db.collection("publicTemplates").insertOne(publicTemplate);

    console.log("✅ Created admin template with optimized IDs");
    console.log("✅ Created public template with optimized IDs");

    // 3. Summary
    console.log("\n🎉 Clean start complete!");
    console.log("   📧 User accounts preserved");
    console.log("   🧹 All user data cleared");
    console.log("   🏗️ Optimized templates created");
    console.log("   🆔 All IDs follow best practices");
    console.log("\n✨ Your app is now ready for production with:");
    console.log("   • Collision-resistant user-generated IDs");
    console.log("   • Semantic template IDs for stability");
    console.log("   • Clean, optimized database structure");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

cleanStartWithOptimizedTemplates();
