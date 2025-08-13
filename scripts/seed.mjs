import mongoose from 'mongoose';
import 'dotenv/config';
import User from '../dist/src/models/User.js';
// Note: we import Mongoose models compiled by Next on build in production.
// For local runs before build, fallback to TS via dynamic import transpilation is not available.
// Instead, this script only seeds minimal data using plain collections if model import fails.

async function run(){
  const uri = process.env.MONGODB_URI;
  if(!uri) throw new Error('MONGODB_URI not set');
  await mongoose.connect(uri);

  // Admin seed (placeholder)
  const adminEmail = 'admin@example.com';
  const now = new Date();
  await User.updateOne(
    { email: adminEmail },
    { $setOnInsert: { email: adminEmail, role: 'admin', isEmailVerified: true, wakeTime: '--:--', createdAt: now, updatedAt: now } },
    { upsert: true }
  );

  // Content templates seed (idempotent)
  const db = mongoose.connection.db;
  await db.collection('content_templates').updateOne(
    { userRole: 'public' },
    { $setOnInsert: { userRole: 'public', type: 'placeholderText', content: { masterChecklist: [], habitBreakChecklist: [], timeBlocks: [] }, createdAt: now, updatedAt: now } },
    { upsert: true }
  );
  await db.collection('content_templates').updateOne(
    { userRole: 'admin' },
    { $setOnInsert: { userRole: 'admin', type: 'placeholderText', content: { masterChecklist: [], habitBreakChecklist: [], timeBlocks: [] }, createdAt: now, updatedAt: now } },
    { upsert: true }
  );

  await mongoose.connection.close();
  console.log('SEED_OK');
}

run().catch(e=>{ console.error('SEED_FAIL', e); process.exit(1); });
