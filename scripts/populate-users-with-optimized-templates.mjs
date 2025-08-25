#!/usr/bin/env node

/**
 * Populate Users with Optimized Templates
 *
 * This script takes the optimized templates we created and applies them
 * to all users so they can start using the improved components immediately.
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

async function populateUsersWithOptimizedTemplates() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db("AmpTracker");

    // Get the optimized templates
    console.log("\n📋 Loading optimized templates...");
    const adminTemplate = await db
      .collection("adminTemplates")
      .findOne({ _id: "admin-default-template" });
    const publicTemplate = await db
      .collection("publicTemplates")
      .findOne({ _id: "public-default-template" });

    if (!adminTemplate || !publicTemplate) {
      console.error("❌ Templates not found. Run clean-start script first.");
      return;
    }

    console.log("✅ Templates loaded successfully");

    // Get all users
    const users = await db.collection("users").find({}).toArray();
    console.log(`\n👥 Found ${users.length} users to populate`);

    const today = getTodayDateString();

    for (const user of users) {
      console.log(`\n📧 Processing user: ${user.email}`);

      // Determine which template to use based on user role
      const isAdmin = user.role === "admin" || user.email.includes("knoxville");
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
          activities: [...block.activities], // Copy activities
        })),

        notes: "",

        // Metadata
        createdAt: new Date(),
        updatedAt: new Date(),
        templateUsed: template._id,
      };

      // Update user with today's data
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
          `   ✅ Populated ${user.email} with optimized data for ${today}`
        );
      } else {
        console.log(`   ⚠️  No changes made for ${user.email}`);
      }
    }

    console.log("\n🎉 User population complete!");
    console.log("\n✨ All users now have:");
    console.log("   • Optimized template data for today");
    console.log("   • Semantic IDs for template items");
    console.log(
      "   • Empty todo/workout lists ready for collision-resistant IDs"
    );
    console.log("   • Mobile-responsive components ready to use");
    console.log("\n🚀 Your app is now fully ready with optimized data!");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

populateUsersWithOptimizedTemplates();
