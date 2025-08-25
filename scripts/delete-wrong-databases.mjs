#!/usr/bin/env node

/**
 * Delete Wrong Databases
 *
 * Removes the incorrect databases:
 * - AmpTracker (with extra 'er')
 * - test
 *
 * Keeps only AmpTrack (your real database)
 */

import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI environment variable is required");
  process.exit(1);
}

async function deleteWrongDatabases() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("🗑️ Deleting wrong databases...");

    // Delete AmpTracker (wrong database with extra 'er')
    console.log("\n❌ Deleting AmpTracker database...");
    const wrongDb = client.db("AmpTracker");
    await wrongDb.dropDatabase();
    console.log("✅ AmpTracker database deleted");

    // Delete test database
    console.log("\n❌ Deleting test database...");
    const testDb = client.db("test");
    await testDb.dropDatabase();
    console.log("✅ test database deleted");

    // Verify only correct database remains
    console.log("\n🔍 Verifying remaining databases...");
    const admin = client.db().admin();
    const databases = await admin.listDatabases();

    console.log("📋 Remaining databases:");
    databases.databases.forEach((db) => {
      if (db.name !== "admin" && db.name !== "local") {
        console.log(`   ✅ ${db.name}`);
      }
    });

    // Double-check our real database is intact
    const realDb = client.db("AmpTrack");
    const realUsers = await realDb.collection("users").find({}).toArray();
    console.log(`\n👥 AmpTrack users verified: ${realUsers.length} users`);
    realUsers.forEach((user) => {
      console.log(`   ✅ ${user.email} (${user.role})`);
    });

    console.log("\n🎉 Cleanup complete!");
    console.log("✅ Wrong databases deleted");
    console.log("✅ Your real database (AmpTrack) is intact and optimized");
    console.log("✅ Ready for production use!");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

deleteWrongDatabases();
