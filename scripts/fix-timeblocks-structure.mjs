#!/usr/bin/env node

/**
 * Fix Time Blocks Structure
 *
 * Converts time blocks to the correct format expected by the API
 */

import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;

function hourToTimeString(hour) {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:00 ${period}`;
}

async function fixTimeBlocksStructure() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");

    const db = client.db("AmpTrack");
    const templates = await db
      .collection("content_templates")
      .find({})
      .toArray();

    for (const template of templates) {
      console.log(`\n🔧 Fixing ${template.userRole} time blocks...`);

      if (
        template.content.timeBlocks &&
        template.content.timeBlocks.length > 0
      ) {
        const fixedTimeBlocks = template.content.timeBlocks.map(
          (block, index) => {
            // Convert from { hour, activities } to { time, label }
            if (block.hour !== undefined && block.activities) {
              return {
                id: block.id,
                time: hourToTimeString(block.hour),
                label: block.activities.join(", "),
                order: index + 1,
              };
            } else if (block.time && block.label) {
              // Already in correct format
              return {
                id: block.id,
                time: block.time,
                label: block.label,
                order: block.order || index + 1,
              };
            } else {
              // Fallback
              return {
                id: block.id || `tb-${index}-001`,
                time: `${6 + index}:00 AM`,
                label: "Time block",
                order: index + 1,
              };
            }
          }
        );

        await db.collection("content_templates").updateOne(
          { _id: template._id },
          {
            $set: {
              "content.timeBlocks": fixedTimeBlocks,
              updatedAt: new Date(),
            },
          }
        );

        console.log(
          `  ✅ Fixed ${fixedTimeBlocks.length} time blocks for ${template.userRole}`
        );
        console.log(
          `  📋 Sample: "${fixedTimeBlocks[0].time}" - "${fixedTimeBlocks[0].label}"`
        );
      }
    }

    // Verify the fix
    console.log("\n🔍 Final verification:");
    const verifyTemplates = await db
      .collection("content_templates")
      .find({})
      .toArray();
    verifyTemplates.forEach((t) => {
      const sample = t.content.timeBlocks?.[0];
      if (sample) {
        console.log(
          `  ${t.userRole}: "${sample.time}" - "${sample.label}" (${t.content.timeBlocks.length} total)`
        );
      }
    });

    console.log("\n🎉 Time blocks structure fixed!");
    console.log("📱 Your app should now display time blocks correctly");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
  }
}

fixTimeBlocksStructure();
