#!/usr/bin/env node

/**
 * Production cleanup script for empty placeholder items
 * Run this AFTER deploying to production to clean up existing user data
 * 
 * IMPORTANT: Make sure your .env.local has the correct production MONGODB_URI
 * before running this script.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local for production connection
dotenv.config({ path: join(__dirname, '..', '.env.local') });

// MongoDB connection string - using production database
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required');
  console.error('💡 Make sure .env.local is configured with production MongoDB URI');
  process.exit(1);
}

// Schemas for production data
const userDataSchema = new mongoose.Schema({
  date: String,
  userId: String,
  displayDate: String,
  blocks: [{
    id: String,
    time: String,
    label: String,
    notes: [String],
    complete: Boolean,
    duration: Number,
    index: Number,
    todos: [{
      id: String,
      text: String,
      completed: Boolean,
      category: String,
      dueDate: String,
      targetBlock: Number,
      completedAt: Date
    }]
  }],
  masterChecklist: [{
    id: String,
    text: String,
    completed: Boolean,
    category: String,
    targetBlock: Number,
    completedAt: Date
  }],
  habitBreakChecklist: [{
    id: String,
    text: String,
    completed: Boolean,
    category: String,
    targetBlock: Number,
    completedAt: Date
  }],
  todoList: [{
    id: String,
    text: String,
    completed: Boolean,
    category: String,
    dueDate: String,
    targetBlock: Number,
    completedAt: Date
  }],
  score: Number,
  wakeTime: String
}, { timestamps: true });

const UserData = mongoose.model('user_data', userDataSchema, 'user_data');

async function cleanupProductionData() {
  try {
    console.log('🌐 Production Database Cleanup Starting...');
    console.log('🔗 Connecting to Production MongoDB...');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to Production MongoDB');
    
    // Verify we're connected to the right database
    const dbName = mongoose.connection.db.databaseName;
    console.log(`📊 Connected to database: ${dbName}`);

    console.log('📊 Fetching all production user data...');
    const users = await UserData.find({});
    console.log(`📁 Found ${users.length} user data records in production`);

    if (users.length === 0) {
      console.log('ℹ️  No user data found in production database');
      return;
    }

    let totalUpdatedUsers = 0;
    let totalRemovedItems = 0;

    for (const userData of users) {
      let userUpdated = false;
      let userRemovedItems = 0;

      console.log(`\n👤 Processing Production User: ${userData.userId} (${userData.date})`);

      // Clean up timeBlock todos (called "blocks" in this schema)
      if (userData.blocks) {
        for (const timeBlock of userData.blocks) {
          if (timeBlock.todos) {
            const originalCount = timeBlock.todos.length;
            timeBlock.todos = timeBlock.todos.filter(todo => todo.text && todo.text.trim() !== '');
            const removedCount = originalCount - timeBlock.todos.length;
            if (removedCount > 0) {
              console.log(`  📝 TimeBlock "${timeBlock.label}": Removed ${removedCount} empty todos`);
              userRemovedItems += removedCount;
              userUpdated = true;
            }
          }
        }
      }

      // Clean up master checklist
      if (userData.masterChecklist) {
        const originalCount = userData.masterChecklist.length;
        userData.masterChecklist = userData.masterChecklist.filter(item => 
          item.text && item.text.trim() !== ''
        );
        const removedCount = originalCount - userData.masterChecklist.length;
        if (removedCount > 0) {
          console.log(`  ✅ Master Checklist: Removed ${removedCount} empty items`);
          userRemovedItems += removedCount;
          userUpdated = true;
        }
      }

      // Clean up habit break checklist
      if (userData.habitBreakChecklist) {
        const originalCount = userData.habitBreakChecklist.length;
        userData.habitBreakChecklist = userData.habitBreakChecklist.filter(item => 
          item.text && item.text.trim() !== ''
        );
        const removedCount = originalCount - userData.habitBreakChecklist.length;
        if (removedCount > 0) {
          console.log(`  🚫 Habit Break Checklist: Removed ${removedCount} empty items`);
          userRemovedItems += removedCount;
          userUpdated = true;
        }
      }

      // Clean up todo list
      if (userData.todoList) {
        const originalCount = userData.todoList.length;
        userData.todoList = userData.todoList.filter(item => 
          item.text && item.text.trim() !== ''
        );
        const removedCount = originalCount - userData.todoList.length;
        if (removedCount > 0) {
          console.log(`  📋 Todo List: Removed ${removedCount} empty items`);
          userRemovedItems += removedCount;
          userUpdated = true;
        }
      }

      // Save if updated
      if (userUpdated) {
        await userData.save();
        console.log(`  💾 Saved updates for production user ${userData.userId} (${userRemovedItems} items removed)`);
        totalUpdatedUsers++;
        totalRemovedItems += userRemovedItems;
      } else {
        console.log(`  ✨ No empty items found for ${userData.userId}`);
      }
    }

    console.log('\n🎉 Production Cleanup Complete!');
    console.log(`📊 Production Summary:`);
    console.log(`   - User data records processed: ${users.length}`);
    console.log(`   - Records updated: ${totalUpdatedUsers}`);
    console.log(`   - Empty items removed: ${totalRemovedItems}`);

    if (totalUpdatedUsers > 0) {
      console.log('\n✅ All production users now have clean data with accurate remaining counts!');
      console.log('🌐 Production site should now show correct remaining counts.');
    } else {
      console.log('\n✨ All production user data was already clean!');
    }

  } catch (error) {
    console.error('❌ Error during production cleanup:', error);
    console.error('💡 Make sure you have deployed the latest code to production first');
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from Production MongoDB');
    console.log('🚀 Production cleanup completed successfully!');
  }
}

// Run the production cleanup
console.log('🌐 Starting Production Database Cleanup...');
console.log('⚠️  This will clean up production user data!');
cleanupProductionData();
