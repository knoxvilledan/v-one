#!/usr/bin/env node

const { MongoClient } = require("mongodb");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: ".env.local" });

// MongoDB connection from environment
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://knoxvilledan:SSSDDDeee222@cluster1.fc7watg.mongodb.net/AmpTracker?retryWrites=true&w=majority&appName=Cluster1";

const testUsers = [
  {
    email: "alice.smith@example.com",
    name: "Alice Smith",
    password: "test123", // Plain text password - will be hashed
    role: "public",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    email: "bob.johnson@example.com",
    name: "Bob Johnson",
    password: "test123", // Plain text password - will be hashed
    role: "public",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    email: "carol.williams@example.com",
    name: "Carol Williams",
    password: "admin123", // Plain text password - will be hashed
    role: "admin",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

async function setupTestUsers() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log("🔗 Connecting to MongoDB...");
    await client.connect();

    const db = client.db("AmpTracker");
    const usersCollection = db.collection("users");

    console.log("👥 Setting up test users...");

    // Create index on email for faster lookups and uniqueness
    await usersCollection.createIndex({ email: 1 }, { unique: true });

    // Insert or update each test user
    for (const user of testUsers) {
      try {
        const existingUser = await usersCollection.findOne({
          email: user.email,
        });

        // Hash the password
        const hashedPassword = await bcrypt.hash(user.password, 10);
        const userWithHashedPassword = {
          ...user,
          password: hashedPassword,
        };
        delete userWithHashedPassword.password; // Remove plain text
        userWithHashedPassword.password = hashedPassword; // Add hashed

        if (existingUser) {
          // Update existing user but keep original createdAt
          await usersCollection.updateOne(
            { email: user.email },
            {
              $set: {
                name: user.name,
                password: hashedPassword,
                role: user.role,
                isActive: user.isActive,
                updatedAt: new Date(),
              },
            }
          );
          console.log(
            `🔄 Updated user: ${user.name} (${user.email}) - Role: ${user.role} - Password: ${user.password}`
          );
        } else {
          // Create new user
          await usersCollection.insertOne(userWithHashedPassword);
          console.log(
            `✅ Created user: ${user.name} (${user.email}) - Role: ${user.role} - Password: ${user.password}`
          );
        }
      } catch (error) {
        if (error.code === 11000) {
          console.log(`⚠️  User already exists: ${user.email}`);
        } else {
          console.error(`❌ Error with user ${user.email}:`, error.message);
        }
      }
    }

    // Display all users
    console.log("\n📋 All users in database:");
    const allUsers = await usersCollection.find({}).toArray();
    allUsers.forEach((user) => {
      console.log(
        `  - ${user.name} (${user.email}) - Role: ${user.role} - Active: ${user.isActive}`
      );
    });

    console.log(`\n🎉 Setup complete! Total users: ${allUsers.length}`);
  } catch (error) {
    console.error("❌ Error setting up test users:", error);
  } finally {
    await client.close();
    console.log("🔌 MongoDB connection closed");
  }
}

// Run the setup
setupTestUsers();
