#!/usr/bin/env node
// Test script to verify user creation and database connectivity
require("dotenv").config({ path: ".env.local" });

const mongoose = require("mongoose");

// User model definition (copied from the app)
const UserSchema = new mongoose.Schema(
  {
    authUserId: {
      type: String,
      unique: true,
      sparse: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    username: {
      type: String,
    },
    role: {
      type: String,
      enum: ["admin", "public", "guest"],
      default: "public",
    },
    wakeTime: {
      type: String,
      default: "--:--",
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", UserSchema);

async function testUserCreation() {
  try {
    console.log("Testing MongoDB connection and user creation...");

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Test user creation
    const testUser = {
      authUserId: "test-auth-user-id-" + Date.now(),
      email: "test-user-" + Date.now() + "@example.com",
      username: "Test User",
      role: "public",
      wakeTime: "--:--",
    };

    const createdUser = await User.create(testUser);
    console.log("✅ Test user created successfully:", {
      id: createdUser._id,
      authUserId: createdUser.authUserId,
      email: createdUser.email,
      role: createdUser.role,
    });

    // Clean up test user
    await User.deleteOne({ _id: createdUser._id });
    console.log("✅ Test user cleaned up");

    // List existing users
    const existingUsers = await User.find({}).select(
      "authUserId email role createdAt"
    );
    console.log("\n📋 Existing users in database:");
    if (existingUsers.length === 0) {
      console.log("   No users found");
    } else {
      existingUsers.forEach((user) => {
        console.log(
          `   - ${user.email} (${user.role}) - authId: ${
            user.authUserId || "none"
          }`
        );
      });
    }

    console.log("\n🎉 Database test completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

testUserCreation();
