#!/usr/bin/env node

/**
 * Quick admin password reset script (non-interactive)
 * Set admin email and password directly in the script
 */

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
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

// ⚡ CONFIGURE ADMIN CREDENTIALS HERE ⚡
const ADMIN_EMAIL = "knoxvilledan@yahoo.com"; // Your admin email
const ADMIN_PASSWORD = "admin123456"; // Change this to your desired password

// User Schema (matching the model)
const userSchema = new mongoose.Schema(
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
    passwordHash: {
      type: String,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
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

const User = mongoose.model("User", userSchema, "users");

async function quickResetAdminPassword() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    console.log("🔍 Checking for existing admin users...");
    const adminUsers = await User.find({ role: "admin" });
    console.log(`📊 Found ${adminUsers.length} admin user(s)`);

    if (adminUsers.length > 0) {
      console.log("\n👥 Current admin users:");
      adminUsers.forEach((user, index) => {
        console.log(
          `   ${index + 1}. ${user.email} (${user.username || "no username"})`
        );
      });
    }

    console.log(`\n🔐 Setting admin credentials:`);
    console.log(`📧 Email: ${ADMIN_EMAIL}`);
    console.log(`🔑 Password: ${ADMIN_PASSWORD}`);

    console.log("🔐 Hashing new password...");
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, saltRounds);

    console.log("💾 Updating admin user...");
    const result = await User.findOneAndUpdate(
      { email: ADMIN_EMAIL.toLowerCase() },
      {
        $set: {
          passwordHash,
          role: "admin",
          isEmailVerified: true,
          username: ADMIN_EMAIL.split("@")[0],
        },
        $setOnInsert: {
          email: ADMIN_EMAIL.toLowerCase(),
          wakeTime: "--:--",
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    );

    console.log("\n✅ Admin password reset successful!");
    console.log(`📧 Admin email: ${result.email}`);
    console.log(`👤 Username: ${result.username}`);
    console.log(`🔑 Password: ${ADMIN_PASSWORD}`);
    console.log(`🎭 Role: ${result.role}`);

    // Test the password
    console.log("\n🧪 Testing new password...");
    const isValid = await bcrypt.compare(ADMIN_PASSWORD, result.passwordHash);
    if (isValid) {
      console.log("✅ Password test successful - login should work!");
    } else {
      console.log("❌ Password test failed!");
    }

    // Check for any old admin users that need cleanup
    const allAdmins = await User.find({ role: "admin" });
    if (allAdmins.length > 1) {
      console.log("\n⚠️  Multiple admin users found:");
      allAdmins.forEach((user, index) => {
        console.log(
          `   ${index + 1}. ${user.email} (Created: ${user.createdAt})`
        );
      });
      console.log("Consider cleaning up old admin accounts if needed.");
    }
  } catch (error) {
    console.error("❌ Error resetting admin password:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Run the reset
console.log("🔐 Quick Admin Password Reset...");
console.log("⚡ Setting admin credentials as configured in script");
quickResetAdminPassword();
