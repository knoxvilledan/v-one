#!/usr/bin/env node

/**
 * Reset admin password script
 * - Checks for existing admin user
 * - Resets password with bcrypt hash
 * - Creates admin user if needed
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

async function resetAdminPassword() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    console.log("🔍 Checking for existing admin users...");

    // Find all admin users
    const adminUsers = await User.find({ role: "admin" });
    console.log(`📊 Found ${adminUsers.length} admin user(s)`);

    if (adminUsers.length > 0) {
      console.log("\n👥 Current admin users:");
      adminUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. Email: ${user.email}`);
        console.log(`      Username: ${user.username || "Not set"}`);
        console.log(`      Has Password: ${user.passwordHash ? "Yes" : "No"}`);
        console.log(`      Email Verified: ${user.isEmailVerified}`);
        console.log(`      Wake Time: ${user.wakeTime}`);
        console.log(`      Created: ${user.createdAt}`);
        console.log("");
      });
    }

    // Prompt for admin email and new password
    const readline = await import("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const question = (prompt) => {
      return new Promise((resolve) => {
        rl.question(prompt, resolve);
      });
    };

    let adminEmail;
    if (adminUsers.length === 0) {
      console.log("🆕 No admin users found. Creating new admin user...");
      adminEmail = await question("Enter admin email: ");
    } else if (adminUsers.length === 1) {
      adminEmail = adminUsers[0].email;
      console.log(`🎯 Using existing admin: ${adminEmail}`);
    } else {
      console.log("⚠️  Multiple admin users found. Choose one:");
      adminUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email}`);
      });
      const choice = await question(
        "Enter choice (1, 2, etc.) or enter new email: "
      );
      const choiceNum = parseInt(choice);
      if (choiceNum > 0 && choiceNum <= adminUsers.length) {
        adminEmail = adminUsers[choiceNum - 1].email;
      } else {
        adminEmail = choice;
      }
    }

    const newPassword = await question("Enter new admin password: ");

    if (!newPassword || newPassword.length < 6) {
      console.log("❌ Password must be at least 6 characters long");
      rl.close();
      return;
    }

    console.log("🔐 Hashing new password...");
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    console.log("💾 Updating admin user...");
    const result = await User.findOneAndUpdate(
      { email: adminEmail.toLowerCase() },
      {
        $set: {
          passwordHash,
          role: "admin",
          isEmailVerified: true,
          username: adminEmail.split("@")[0], // Set username to email prefix if not set
        },
        $setOnInsert: {
          email: adminEmail.toLowerCase(),
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
    console.log(`🔑 Password: ${newPassword} (save this securely!)`);
    console.log(`🎭 Role: ${result.role}`);
    console.log(`✉️  Email verified: ${result.isEmailVerified}`);

    // Test the password
    console.log("\n🧪 Testing new password...");
    const isValid = await bcrypt.compare(newPassword, result.passwordHash);
    if (isValid) {
      console.log("✅ Password test successful - login should work!");
    } else {
      console.log("❌ Password test failed - something went wrong!");
    }

    rl.close();
  } catch (error) {
    console.error("❌ Error resetting admin password:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

// Run the reset
console.log("🔐 Starting Admin Password Reset...");
console.log("⚡ This will reset or create admin user credentials");
resetAdminPassword();
