import assert from 'node:assert';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
if(!uri) throw new Error('MONGODB_URI not set');

async function run(){
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();
  const col = db.collection('smoke_test');
  const marker = { _type: 'smoke', ts: new Date() };
  const ins = await col.insertOne(marker);
  assert.ok(ins.insertedId, 'insert failed');
  const found = await col.findOne({ _id: ins.insertedId });
  assert.ok(found, 'document not found');
  await col.deleteOne({ _id: ins.insertedId });
  await client.close();
  console.log('SMOKE_TEST_OK');
}
run().catch(e=>{ console.error('SMOKE_TEST_FAIL', e); process.exit(1); });
