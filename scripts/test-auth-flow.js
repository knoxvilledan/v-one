#!/usr/bin/env node

const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;

async function testAuthFlow() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log("🔗 Testing authentication flow...\n");
    await client.connect();

    const db = client.db("AmpTrack");
    const users = db.collection("users");

    // Test the exact flow that NextAuth uses
    const testCredentials = {
      email: "alice.smith@example.com",
      password: "test123",
    };

    console.log(`🧪 Testing login for: ${testCredentials.email}`);

    // Step 1: Find user (same as NextAuth)
    const user = await users.findOne({ email: testCredentials.email });

    if (!user) {
      console.log("❌ User not found");
      return;
    }

    console.log("✅ User found");
    console.log(`   Name: ${user.name}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Role: ${user.role}`);

    // Step 2: Verify password (same as NextAuth)
    const isPasswordValid = await bcrypt.compare(
      testCredentials.password,
      user.password
    );

    if (!isPasswordValid) {
      console.log("❌ Password invalid");
      return;
    }

    console.log("✅ Password valid");

    // Step 3: Return user object (same as NextAuth)
    const authResult = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
    };

    console.log("✅ Auth flow successful");
    console.log("📋 Auth result:", authResult);

    console.log(
      "\n🎯 Try logging in now at: http://localhost:3000/auth/signin"
    );
    console.log(`📧 Email: ${testCredentials.email}`);
    console.log(`🔐 Password: ${testCredentials.password}`);
  } catch (error) {
    console.error("❌ Auth flow error:", error);
  } finally {
    await client.close();
  }
}

testAuthFlow();
