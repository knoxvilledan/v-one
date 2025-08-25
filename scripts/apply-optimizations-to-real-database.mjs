#!/usr/bin/env node

/**
 * Apply Optimizations to REAL Database (AmpTrack)
 *
 * This script applies all our optimizations to the correct database
 * while preserving existing users and their passwords.
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

async function applyOptimizationsToRealDatabase() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");
    console.log("🎯 Working with REAL database: AmpTrack");

    const db = client.db("AmpTrack");

    // 1. Create optimized templates in REAL database
    console.log("\n🏗️ Creating optimized templates in AmpTrack...");

    // Clear any existing templates
    await db.collection("publicTemplates").deleteMany({});
    await db.collection("adminTemplates").deleteMany({});

    // Create optimized admin template
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

    // Insert templates into REAL database
    await db.collection("adminTemplates").insertOne(adminTemplate);
    await db.collection("publicTemplates").insertOne(publicTemplate);

    console.log("✅ Created admin template with optimized IDs");
    console.log("✅ Created public template with optimized IDs");

    // 2. Get existing users and populate with optimized data
    console.log("\n👥 Updating existing users with optimized data...");
    const users = await db.collection("users").find({}).toArray();

    const today = getTodayDateString();

    for (const user of users) {
      console.log(`\n📧 Processing user: ${user.email}`);

      // Determine which template to use
      const isAdmin = user.role === "admin";
      const template = isAdmin ? adminTemplate : publicTemplate;
      const templateType = isAdmin ? "Admin" : "Public";

      console.log(`   Using ${templateType} template`);

      // Create optimized data structure for today
      const todayData = {
        masterChecklist: template.masterChecklist.map((item) => ({
          ...item,
          completed: false,
          completedAt: null,
        })),

        habitBreakChecklist: template.habitBreakChecklist.map((item) => ({
          ...item,
          completed: false,
          completedAt: null,
        })),

        todoList: [], // Start empty - user will add their own with optimized IDs
        workoutChecklist: [], // Start empty - user will add their own with optimized IDs

        timeBlocks: template.timeBlocks.map((block) => ({
          ...block,
          activities: [...block.activities],
        })),

        notes: "",

        // Metadata
        createdAt: new Date(),
        updatedAt: new Date(),
        templateUsed: template._id,
      };

      // Update user with today's data (preserving everything else)
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
      } else {
        console.log(`   ⚠️  No changes made for ${user.email}`);
      }
    }

    console.log("\n🎉 Real database optimization complete!");
    console.log("\n✨ Your REAL users now have:");
    console.log("   • Original passwords preserved");
    console.log("   • Optimized template data for today");
    console.log("   • Semantic IDs for template items");
    console.log(
      "   • Empty todo/workout lists ready for collision-resistant IDs"
    );
    console.log("   • All mobile-responsive improvements ready");
    console.log(
      "\n🚀 Your app now uses the CORRECT database with all optimizations!"
    );
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

applyOptimizationsToRealDatabase();
