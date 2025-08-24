#!/usr/bin/env node

/**
 * Check admin users script
 * Lists all admin users and their details
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, "..", ".env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI environment variable is required");
  process.exit(1);
}

// User Schema (matching the model)
const userSchema = new mongoose.Schema(
  {
    authUserId: String,
    email: String,
    username: String,
    passwordHash: String,
    isEmailVerified: Boolean,
    role: String,
    wakeTime: String,
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema, "users");

async function checkAdminUsers() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    console.log("🔍 Checking all users...");
    const allUsers = await User.find({});
    console.log(`📊 Total users in database: ${allUsers.length}`);

    console.log("\n👥 All users by role:");
    const usersByRole = {};
    allUsers.forEach((user) => {
      if (!usersByRole[user.role]) {
        usersByRole[user.role] = [];
      }
      usersByRole[user.role].push(user);
    });

    Object.keys(usersByRole).forEach((role) => {
      console.log(
        `\n🎭 ${role.toUpperCase()} users (${usersByRole[role].length}):`
      );
      usersByRole[role].forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email}`);
        console.log(`      Username: ${user.username || "Not set"}`);
        console.log(`      Has Password: ${user.passwordHash ? "Yes" : "No"}`);
        console.log(`      Email Verified: ${user.isEmailVerified}`);
        console.log(`      Wake Time: ${user.wakeTime}`);
        console.log(`      Auth User ID: ${user.authUserId || "Not set"}`);
        console.log(`      Created: ${user.createdAt}`);
        console.log(`      Updated: ${user.updatedAt}`);
        console.log("");
      });
    });

    // Special focus on admin users
    const adminUsers = await User.find({ role: "admin" });
    if (adminUsers.length === 0) {
      console.log("⚠️  NO ADMIN USERS FOUND!");
      console.log(
        "   You need to create an admin user to access admin features."
      );
      console.log("   Run: node scripts/quick-reset-admin.mjs");
    } else {
      console.log(`\n🎯 ADMIN USER SUMMARY:`);
      console.log(`   Count: ${adminUsers.length}`);
      adminUsers.forEach((admin, index) => {
        console.log(
          `   ${index + 1}. ${admin.email} - ${
            admin.passwordHash ? "Has Password" : "No Password"
          }`
        );
      });
    }
  } catch (error) {
    console.error("❌ Error checking admin users:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Run the check
console.log("👥 Checking Admin Users...");
checkAdminUsers();
