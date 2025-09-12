#!/usr/bin/env node

/**
 * Quick diagnostic script to check which collection has recent data
 */

import { MongoClient } from "mongodb";
import { config } from "dotenv";

// Load env from .env.local if present, else .env
config({ path: ".env.local" });

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI not set");

async function checkCollections() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db();

    console.log("🔍 Checking recent data in collections...\n");

    // Check user_data collection
    const userData = await db
      .collection("user_data")
      .find({})
      .sort({ updatedAt: -1 })
      .limit(3)
      .toArray();
    console.log("📊 user_data collection (last 3 entries):");
    userData.forEach((doc, i) => {
      console.log(
        `  ${i + 1}. userId: ${doc.userId}, date: ${doc.date}, updatedAt: ${
          doc.updatedAt
        }`
      );
    });

    // Check dayEntries collection
    const dayEntries = await db
      .collection("dayEntries")
      .find({})
      .sort({ updatedAt: -1 })
      .limit(3)
      .toArray();
    console.log("\n📊 dayEntries collection (last 3 entries):");
    dayEntries.forEach((doc, i) => {
      console.log(
        `  ${i + 1}. userId: ${doc.userId}, date: ${doc.date}, updatedAt: ${
          doc.updatedAt
        }`
      );
    });

    console.log("\n🎯 Recent activity:");
    console.log(
      `user_data: ${userData.length > 0 ? userData[0]?.updatedAt : "No data"}`
    );
    console.log(
      `dayEntries: ${
        dayEntries.length > 0 ? dayEntries[0]?.updatedAt : "No data"
      }`
    );
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

checkCollections();
