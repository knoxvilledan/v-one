#!/usr/bin/env node

/**
 * Migration Script: Backfill v2 IDs
 * 
 * This script migrates the actual user_data structure:
 * - Each document represents one date/user combination
 * - Assigns UUIDs to blocks that have null IDs
 * - Converts targetBlock indices to blockId references
 * - Adds IDs to any missing checklist items
 */

import { randomUUID } from 'crypto';
import { MongoClient } from 'mongodb';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

// Fallback ID generation
const makeId = (prefix) => `${prefix}_${randomUUID()}`;

// ID prefixes - must match the canonical API
const ID_PREFIX = {
  CHECKLIST: 'ck_',
  HABIT_BREAK: 'hb_', 
  WORKOUT: 'wx_',
  TODO: 'td_',
  TIME_BLOCK: 'tb_',
  NOTE: 'nt_',
  SCORE: 'sc_'
};

async function runMigration() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('🔗 Connecting to MongoDB...');
    await client.connect();
    
    const db = client.db('AmpTrack');
    const collection = db.collection('user_data');
    
    console.log('📊 Starting ID migration...');
    
    const userDocs = await collection.find({}).toArray();
    console.log(`� Found ${userDocs.length} user_data documents to migrate`);
    
    let updatedDocs = 0;
    
    for (const doc of userDocs) {
      let hasUpdates = false;
      console.log(`\n🔄 Processing document for date: ${doc.date}, userId: ${doc.userId}`);
      
      // 1. Add IDs to time blocks that don't have them
      if (doc.blocks) {
        for (const block of doc.blocks) {
          if (!block.id) {
            block.id = makeId(ID_PREFIX.TIME_BLOCK);
            hasUpdates = true;
          }
        }
      }
      
      // 2. Convert targetBlock indices to blockId references
      const checklists = [
        ...(doc.masterChecklist || []),
        ...(doc.habitBreakChecklist || []),
        ...(doc.todoList || [])
      ];
      
      for (const item of checklists) {
        if (typeof item.targetBlock === 'number') {
          const targetBlockIndex = item.targetBlock;
          const targetBlock = doc.blocks?.[targetBlockIndex];
          
          if (targetBlock && targetBlock.id) {
            item.blockId = targetBlock.id;
            delete item.targetBlock;
            hasUpdates = true;
            console.log(`  Converted targetBlock ${targetBlockIndex} to blockId ${targetBlock.id}`);
          }
        }
      }
      
      // 3. Add IDs to checklist items that don't have them (most already have them)
      if (doc.masterChecklist) {
        for (const item of doc.masterChecklist) {
          if (!item.id) {
            item.id = makeId(ID_PREFIX.CHECKLIST);
            hasUpdates = true;
          }
        }
      }
      
      if (doc.habitBreakChecklist) {
        for (const item of doc.habitBreakChecklist) {
          if (!item.id) {
            item.id = makeId(ID_PREFIX.HABIT_BREAK);
            hasUpdates = true;
          }
        }
      }
      
      if (doc.todoList) {
        for (const item of doc.todoList) {
          if (!item.id) {
            item.id = makeId(ID_PREFIX.TODO);
            hasUpdates = true;
          }
        }
      }
      
      // 4. Add IDs to notes that don't have them
      if (doc.blocks) {
        for (const block of doc.blocks) {
          if (block.notes && Array.isArray(block.notes)) {
            for (const note of block.notes) {
              if (typeof note === 'object' && !note.id) {
                note.id = makeId(ID_PREFIX.NOTE);
                hasUpdates = true;
              }
            }
          }
        }
      }
      
      // Update the document if we made changes
      if (hasUpdates) {
        await collection.updateOne(
          { _id: doc._id },
          { $set: { 
            blocks: doc.blocks,
            masterChecklist: doc.masterChecklist,
            habitBreakChecklist: doc.habitBreakChecklist,
            todoList: doc.todoList
          } }
        );
        updatedDocs++;
        console.log(`✅ Updated document ${doc._id}`);
      } else {
        console.log(`⏭️  No updates needed for document ${doc._id}`);
      }
    }
    
    console.log(`\n🎉 Migration complete! Updated ${updatedDocs} out of ${userDocs.length} documents.`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.close();
    console.log('🔌 MongoDB connection closed');
  }
}

runMigration();
