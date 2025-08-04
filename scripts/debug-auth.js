#!/usr/bin/env node

const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

async function debugAuthentication() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log("🔗 Connecting to MongoDB...");
    await client.connect();

    const db = client.db("AmpTrack");
    const usersCollection = db.collection("users");

    console.log("\n🔍 Debugging Authentication Issues...\n");

    // Check test users
    const testEmails = [
      "alice.test@example.com",
      "bob.test@example.com",
      "carol.test@example.com",
    ];

    for (const email of testEmails) {
      console.log(`👤 Checking user: ${email}`);
      const user = await usersCollection.findOne({ email });

      if (user) {
        console.log(`  ✅ User exists`);
        console.log(`  📧 Email: ${user.email}`);
        console.log(`  👤 Name: ${user.name}`);
        console.log(`  🔐 Has password: ${user.password ? "Yes" : "No"}`);
        console.log(
          `  🔐 Password length: ${
            user.password ? user.password.length : "N/A"
          }`
        );
        console.log(`  🎭 Role: ${user.role}`);
        console.log(`  ✨ Active: ${user.isActive}`);
        console.log(`  📅 Created: ${user.createdAt}`);

        // Test password verification
        if (user.password) {
          const testPassword = "password123";
          const isValid = await bcrypt.compare(testPassword, user.password);
          console.log(
            `  🔓 Password test (${testPassword}): ${
              isValid ? "✅ Valid" : "❌ Invalid"
            }`
          );
        }

        console.log("");
      } else {
        console.log(`  ❌ User NOT found`);
        console.log("");
      }
    }

    // Check database structure
    console.log("📊 Database Structure:");
    const collections = await db.listCollections().toArray();
    console.log(`  Collections: ${collections.map((c) => c.name).join(", ")}`);

    const userCount = await usersCollection.countDocuments();
    console.log(`  Total users: ${userCount}`);

    // Show all existing users
    console.log("\n👥 All existing users:");
    const allUsers = await usersCollection.find({}).toArray();
    allUsers.forEach((user, index) => {
      console.log(
        `  ${index + 1}. ${user.email || user.name || "No email"} (ID: ${
          user._id
        })`
      );
    });

    console.log("\n🔧 Recommendations:");
    console.log("1. Make sure your app is using the AmpTrack database");
    console.log(
      "2. Check that NextAuth is configured to use the users collection"
    );
    console.log("3. Verify the password hashing matches your auth system");
    console.log("4. Test locally first before production");
  } catch (error) {
    console.error("❌ Error debugging authentication:", error);
  } finally {
    await client.close();
    console.log("🔌 MongoDB connection closed");
  }
}

debugAuthentication();
