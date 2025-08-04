#!/usr/bin/env node

const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

async function createTestUsers() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log("🔗 Connecting to MongoDB...");
    await client.connect();

    const db = client.db("AmpTrack");
    const usersCollection = db.collection("users");

    console.log("👥 Creating test users...");

    const testUsers = [
      {
        email: "alice.test@example.com",
        name: "Alice Test",
        password: "password123",
      },
      {
        email: "bob.test@example.com",
        name: "Bob Test",
        password: "password123",
      },
      {
        email: "carol.test@example.com",
        name: "Carol Test",
        password: "password123",
      },
    ];

    for (const userData of testUsers) {
      // Check if user already exists
      const existingUser = await usersCollection.findOne({
        email: userData.email,
      });

      if (existingUser) {
        console.log(`  ⚠️  User ${userData.email} already exists, skipping...`);
        continue;
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // Create user object
      const user = {
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
        role: "user",
        active: true,
        createdAt: new Date(),
      };

      // Insert user
      const result = await usersCollection.insertOne(user);
      console.log(
        `  ✅ Created user: ${userData.email} (ID: ${result.insertedId})`
      );
    }

    console.log("\n🎉 Test users created successfully!");
    console.log("\nYou can now test login with:");
    console.log("  Email: alice.test@example.com");
    console.log("  Email: bob.test@example.com");
    console.log("  Email: carol.test@example.com");
    console.log("  Password: password123");
  } catch (error) {
    console.error("❌ Error creating test users:", error);
  } finally {
    await client.close();
    console.log("🔌 MongoDB connection closed");
  }
}

createTestUsers();
