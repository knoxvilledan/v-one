#!/usr/bin/env node

const { MongoClient } = require("mongodb");
require("dotenv").config({ path: ".env.local" });

// MongoDB connection from environment
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://knoxvilledan:SSSDDDeee222@cluster1.fc7watg.mongodb.net/AmpTrack?retryWrites=true&w=majority&appName=Cluster1";

async function testDatabaseSetup() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log("🔗 Connecting to MongoDB...");
    await client.connect();

    const db = client.db("AmpTrack");
    console.log("\n👥 TEST USERS:");
    console.log("================");
    const usersCollection = db.collection("users");
    const testUsers = await usersCollection
      .find({
        email: {
          $in: [
            "alice.smith@example.com",
            "bob.johnson@example.com",
            "carol.williams@example.com",
          ],
        },
      })
      .toArray();

    testUsers.forEach((user) => {
      console.log(`✅ ${user.name} (${user.email})`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Active: ${user.isActive}`);
      console.log(`   Created: ${user.createdAt.toISOString().split("T")[0]}`);
      console.log("");
    });

    console.log("\n📝 CONTENT TEMPLATES:");
    console.log("====================");
    const contentCollection = db.collection("content_templates");
    const templates = await contentCollection.find({}).toArray();

    templates.forEach((template) => {
      console.log(
        `✅ ${template.userRole.toUpperCase()} Template (${template.type})`
      );
      if (template.content) {
        if (template.content.masterChecklist) {
          console.log(
            `   Master Checklist: ${template.content.masterChecklist.length} items`
          );
        }
        if (template.content.habitBreakChecklist) {
          console.log(
            `   Habit Break: ${template.content.habitBreakChecklist.length} items`
          );
        }
        if (template.content.timeBlocks) {
          console.log(
            `   Time Blocks: ${template.content.timeBlocks.length} blocks`
          );
        }
        if (template.content.placeholderText) {
          console.log(`   Placeholder Text: Available`);
        }
      }
      console.log("");
    });

    console.log("\n🧪 TEST SCENARIOS:");
    console.log("==================");
    console.log("1. Sign in as alice.smith@example.com (Public User)");
    console.log("   - Should see editable placeholder content");
    console.log("   - Can customize checklists and time blocks");
    console.log("");
    console.log("2. Sign in as bob.johnson@example.com (Public User)");
    console.log("   - Should see editable placeholder content");
    console.log("   - Independent from Alice's data");
    console.log("");
    console.log("3. Sign in as carol.williams@example.com (Admin User)");
    console.log("   - Should see admin-specific content");
    console.log("   - Access to admin panel at /admin");
    console.log("   - Can switch between admin/public roles");
    console.log("");

    console.log("🌐 TESTING URLS:");
    console.log("===============");
    console.log("Main Site: https://www.jfn-enterprises.com");
    console.log("Sign In: https://www.jfn-enterprises.com/auth/signin");
    console.log("Admin Panel: https://www.jfn-enterprises.com/admin");
    console.log("");

    console.log("🎉 Database setup verification complete!");
  } catch (error) {
    console.error("❌ Error testing database setup:", error);
  } finally {
    await client.close();
    console.log("🔌 MongoDB connection closed");
  }
}

// Run the test
testDatabaseSetup();
