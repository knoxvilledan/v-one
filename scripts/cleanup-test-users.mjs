#!/usr/bin/env node

/**
 * Clean Database - Keep Only Real Users
 * 
 * Removes test users and keeps only the 2 real user accounts:
 * - knoxvilledan@yahoo.com (admin)
 * - dannelsonjfn@gmail.com (public)
 */

import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required');
  process.exit(1);
}

async function cleanupDatabase() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('🧹 Cleaning up database...');
    
    const db = client.db('AmpTracker');
    
    // List current users
    const allUsers = await db.collection('users').find({}).toArray();
    console.log('\n📋 Current users in database:');
    allUsers.forEach(user => {
      console.log(`  📧 ${user.email} (Role: ${user.role || 'public'})`);
    });
    
    // Keep only the 2 real users
    const realUsers = ['knoxvilledan@yahoo.com', 'dannelsonjfn@gmail.com'];
    const testUsers = allUsers.filter(user => !realUsers.includes(user.email));
    
    console.log('\n🗑️ Test users to remove:');
    testUsers.forEach(user => {
      console.log(`  ❌ ${user.email}`);
    });
    
    // Remove test users
    if (testUsers.length > 0) {
      const testEmails = testUsers.map(user => user.email);
      const deleteResult = await db.collection('users').deleteMany({
        email: { $in: testEmails }
      });
      console.log(`\n✅ Removed ${deleteResult.deletedCount} test users`);
    } else {
      console.log('\n✅ No test users to remove');
    }
    
    // Verify final state
    const finalUsers = await db.collection('users').find({}).toArray();
    console.log('\n👥 Final users in database:');
    finalUsers.forEach(user => {
      console.log(`  ✅ ${user.email} (Role: ${user.role || 'public'})`);
    });
    
    console.log(`\n🎉 Database cleanup complete! You now have ${finalUsers.length} users.`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

cleanupDatabase();
