#!/usr/bin/env node

import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;

async function checkCurrentState() {
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  const db = client.db("AmpTrack");

  console.log("=== CHECKING CURRENT STATE ===");

  // Check templates
  const templates = await db.collection("content_templates").find({}).toArray();
  console.log("\n📋 TEMPLATES:");
  templates.forEach((t) => {
    console.log(
      `  ${t.userRole}: ${t.masterChecklist?.length || 0} master, ${
        t.timeBlocks?.length || 0
      } blocks`
    );
    if (t.masterChecklist?.length > 0) {
      console.log(`    Sample master: ${t.masterChecklist[0].text}`);
    }
    if (t.timeBlocks?.length > 0) {
      console.log(
        `    Sample block: ${
          t.timeBlocks[0].hour
        }h - ${t.timeBlocks[0].activities?.join(", ")}`
      );
    }
  });

  // Check users
  const users = await db.collection("users").find({}).toArray();
  console.log("\n👥 USERS:");
  users.forEach((u) => {
    const hasData = !!u.data;
    const dateCount = hasData ? Object.keys(u.data).length : 0;
    console.log(`  ${u.email} (${u.role}): ${dateCount} dates`);

    if (hasData) {
      const latestDate = Object.keys(u.data).sort().pop();
      const latestData = u.data[latestDate];
      console.log(`    Latest (${latestDate}):`);
      console.log(`      - ${latestData.todoList?.length || 0} todos`);
      console.log(
        `      - ${latestData.workoutChecklist?.length || 0} workouts`
      );
      console.log(
        `      - ${latestData.masterChecklist?.length || 0} master items`
      );
      console.log(`      - ${latestData.timeBlocks?.length || 0} time blocks`);

      if (latestData.masterChecklist?.length > 0) {
        console.log(
          `      - Sample master: ${latestData.masterChecklist[0].text}`
        );
      }
    }
  });

  await client.close();
}

checkCurrentState().catch(console.error);
