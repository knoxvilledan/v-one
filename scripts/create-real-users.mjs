#!/usr/bin/env node

/**
 * Create Real User Accounts
 * 
 * Creates the 2 real user accounts with optimized template data:
 * - knoxvilledan@yahoo.com (admin)
 * - dannelsonjfn@gmail.com (public)
 */

import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required');
  process.exit(1);
}

function getTodayDateString() {
  const today = new Date();
  return today.toISOString().split('T')[0]; // YYYY-MM-DD format
}

async function createRealUsers() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db('AmpTracker');
    
    // Get the optimized templates
    console.log('\n📋 Loading optimized templates...');
    const adminTemplate = await db.collection('adminTemplates').findOne({ _id: 'admin-default-template' });
    const publicTemplate = await db.collection('publicTemplates').findOne({ _id: 'public-default-template' });
    
    if (!adminTemplate || !publicTemplate) {
      console.error('❌ Templates not found. Run clean-start script first.');
      return;
    }
    
    console.log('✅ Templates loaded successfully');
    
    const today = getTodayDateString();
    const now = new Date();
    
    // Create admin user - knoxvilledan@yahoo.com
    console.log('\n👤 Creating admin user: knoxvilledan@yahoo.com');
    
    const adminData = {
      masterChecklist: adminTemplate.masterChecklist.map(item => ({
        ...item,
        completed: false,
        completedAt: null
      })),
      
      habitBreakChecklist: adminTemplate.habitBreakChecklist.map(item => ({
        ...item,
        completed: false,
        completedAt: null
      })),
      
      todoList: [],
      workoutChecklist: [],
      
      timeBlocks: adminTemplate.timeBlocks.map(block => ({
        ...block,
        activities: [...block.activities]
      })),
      
      notes: '',
      createdAt: now,
      updatedAt: now,
      templateUsed: adminTemplate._id
    };
    
    const adminUser = {
      email: 'knoxvilledan@yahoo.com',
      username: 'knoxvilledan',
      role: 'admin',
      passwordHash: await bcrypt.hash('tempPassword123', 10), // You should change this!
      createdAt: now,
      updatedAt: now,
      isEmailVerified: true,
      wakeTime: '06:00',
      adminViewMode: 'admin',
      data: {
        [today]: adminData
      }
    };
    
    // Create public user - dannelsonjfn@gmail.com
    console.log('👤 Creating public user: dannelsonjfn@gmail.com');
    
    const publicData = {
      masterChecklist: publicTemplate.masterChecklist.map(item => ({
        ...item,
        completed: false,
        completedAt: null
      })),
      
      habitBreakChecklist: publicTemplate.habitBreakChecklist.map(item => ({
        ...item,
        completed: false,
        completedAt: null
      })),
      
      todoList: [],
      workoutChecklist: [],
      
      timeBlocks: publicTemplate.timeBlocks.map(block => ({
        ...block,
        activities: [...block.activities]
      })),
      
      notes: '',
      createdAt: now,
      updatedAt: now,
      templateUsed: publicTemplate._id
    };
    
    const publicUser = {
      email: 'dannelsonjfn@gmail.com',
      username: 'dannelsonjfn',
      role: 'public',
      passwordHash: await bcrypt.hash('tempPassword123', 10), // You should change this!
      createdAt: now,
      updatedAt: now,
      isEmailVerified: true,
      wakeTime: '07:00',
      data: {
        [today]: publicData
      }
    };
    
    // Insert users
    await db.collection('users').insertOne(adminUser);
    console.log('✅ Created admin user with optimized template data');
    
    await db.collection('users').insertOne(publicUser);
    console.log('✅ Created public user with optimized template data');
    
    // Verify creation
    const finalUsers = await db.collection('users').find({}).toArray();
    console.log('\n🎉 User creation complete!');
    console.log(`👥 Total users: ${finalUsers.length}`);
    
    finalUsers.forEach(user => {
      console.log(`  ✅ ${user.email} (Role: ${user.role})`);
      const dates = Object.keys(user.data || {});
      console.log(`     Data for ${dates.length} date(s): ${dates.join(', ')}`);
    });
    
    console.log('\n🔐 IMPORTANT: Both users have temporary password: tempPassword123');
    console.log('🔐 Please change passwords after first login!');
    
    console.log('\n✨ Your real users now have:');
    console.log('   • Optimized template data for today');
    console.log('   • Semantic IDs for template items');
    console.log('   • Empty todo/workout lists ready for collision-resistant IDs');
    console.log('   • Mobile-responsive components ready to use');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

createRealUsers();
