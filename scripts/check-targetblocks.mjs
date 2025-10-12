#!/usr/bin/env node

/**
 * Check existing user data for targetBlock values to determine if migration is needed
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, "..", ".env.local") });

async function checkTargetBlocks() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI not found in environment variables");
    }

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Define the schema structure we're looking for
    const UserData = mongoose.model('UserData', new mongoose.Schema({}, { strict: false }), 'userdatas');

    // Find documents with completed items that have targetBlock values
    const docsWithTargetBlocks = await UserData.find({
      $or: [
        { "masterChecklist.targetBlock": { $exists: true } },
        { "habitBreakChecklist.targetBlock": { $exists: true } },
        { "workoutChecklist.targetBlock": { $exists: true } },
        { "todoList.targetBlock": { $exists: true } }
      ]
    }).select('date userId masterChecklist.targetBlock habitBreakChecklist.targetBlock workoutChecklist.targetBlock todoList.targetBlock').lean();

    console.log(`📊 Found ${docsWithTargetBlocks.length} documents with targetBlock data`);

    if (docsWithTargetBlocks.length > 0) {
      console.log('\n🔍 Sample targetBlock values:');
      
      const allTargetBlocks = new Set();
      
      docsWithTargetBlocks.slice(0, 5).forEach((doc, i) => {
        console.log(`\nDocument ${i + 1} (${doc.date}):`);
        
        [doc.masterChecklist, doc.habitBreakChecklist, doc.workoutChecklist, doc.todoList].forEach((list, j) => {
          const listNames = ['Master', 'Habit', 'Workout', 'Todo'];
          if (list) {
            const targetBlocks = list.filter(item => item.targetBlock !== undefined).map(item => item.targetBlock);
            if (targetBlocks.length > 0) {
              console.log(`  ${listNames[j]}: [${targetBlocks.join(', ')}]`);
              targetBlocks.forEach(tb => allTargetBlocks.add(tb));
            }
          }
        });
      });
      
      console.log(`\n📈 All unique targetBlock values found: [${Array.from(allTargetBlocks).sort((a,b) => a-b).join(', ')}]`);
      
      const maxBlock = Math.max(...Array.from(allTargetBlocks));
      const minBlock = Math.min(...Array.from(allTargetBlocks));
      
      console.log(`\n🎯 Range: ${minBlock} to ${maxBlock}`);
      
      if (maxBlock <= 17 && minBlock >= 0) {
        console.log('\n⚠️  MIGRATION NEEDED: Data uses old 0-17 system');
        console.log('   New system expects 1-18 range');
        console.log('   Existing completions may appear in wrong blocks');
        console.log('\n💡 Recommendation: Run migration script to convert targetBlock values');
      } else if (maxBlock <= 18 && minBlock >= 1) {
        console.log('\n✅ Data already uses new 1-18 system');
      } else {
        console.log('\n🤔 Mixed or unusual targetBlock values detected');
      }
    } else {
      console.log('\n✅ No targetBlock data found - no migration needed');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

checkTargetBlocks();