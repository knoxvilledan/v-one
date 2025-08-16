import { MongoClient } from "mongodb";
import mongoose from "mongoose";
import { config } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const envPath = [".env.local", ".env"].map((f) => resolve(process.cwd(), f)).find((p) => existsSync(p));
config(envPath ? { path: envPath } : undefined);

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI not set");

function usage() {
  console.log(`Usage:
  node scripts/db-maintenance.mjs list-owners
  node scripts/db-maintenance.mjs wipe-user-owned [--userId <id>]  # if no userId, wipes all user-owned
  node scripts/db-maintenance.mjs clear-auth [--all]                # --all also clears users collection
  node scripts/db-maintenance.mjs reindex
  node scripts/db-maintenance.mjs counts
  node scripts/db-maintenance.mjs list-dbs
`);
}

async function listOwners(client) {
  const db = client.db();
  const col = db.collection("user_data");
  const ids = await col.distinct("userId", { userId: { $exists: true } });
  console.log(JSON.stringify({ collection: "user_data", owners: ids }, null, 2));
}

async function wipeUserOwned(client, userId) {
  const db = client.db();
  const col = db.collection("user_data");
  const filter = userId ? { userId } : { userId: { $exists: true } };
  const before = await col.countDocuments(filter);
  const res = await col.deleteMany(filter);
  const after = await col.countDocuments(filter);
  console.log(JSON.stringify({ collection: "user_data", deleted: res.deletedCount, before, after }, null, 2));
}

async function clearAuth(client, includeUsers) {
  const db = client.db();
  const targets = [
    { name: "accounts", filter: {} },
    { name: "sessions", filter: {} },
    { name: "verificationTokens", filter: {} },
  ];
  if (includeUsers) targets.push({ name: "users", filter: {} });
  for (const t of targets) {
    const col = db.collection(t.name);
    const before = await col.countDocuments(t.filter);
    const res = await col.deleteMany(t.filter);
    const after = await col.countDocuments(t.filter);
    console.log(JSON.stringify({ collection: t.name, deleted: res.deletedCount, before, after }, null, 2));
  }
}

async function reindex() {
  // Use mongoose for simple ensure of expected indexes
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  // Clean legacy/invalid docs that break unique indexes
  await db.collection("user_data").deleteMany({ $or: [{ userId: null }, { userId: { $exists: false } }] });
  await db.collection("user_data").createIndex({ userId: 1, date: 1 }, { unique: true });
  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  await db.collection("content_templates").createIndex({ userRole: 1 }, { unique: true });
  await mongoose.connection.close();
  console.log("REINDEX_OK");
}

async function counts(client) {
  const db = client.db();
  const names = [
    "users",
    "accounts",
    "sessions",
    "verificationTokens",
    "user_data",
    "content_templates",
  ];
  const result = {};
  for (const n of names) {
    result[n] = await db.collection(n).countDocuments();
  }
  console.log(JSON.stringify({ db: db.databaseName, counts: result }, null, 2));
}

async function listDbs() {
  const client = new MongoClient(uri);
  await client.connect();
  try {
    const admin = client.db().admin();
    const res = await admin.listDatabases();
    console.log(JSON.stringify(res.databases.map((d) => ({ name: d.name, sizeOnDisk: d.sizeOnDisk })), null, 2));
  } finally {
    await client.close();
  }
}

async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  if (!cmd) return usage();
  if (cmd === "reindex") return reindex();
  if (cmd === "list-dbs") return listDbs();
  const client = new MongoClient(uri);
  await client.connect();
  try {
    switch (cmd) {
      case "list-owners":
        await listOwners(client);
        break;
      case "counts":
        await counts(client);
        break;
      case "wipe-user-owned": {
        const idx = rest.indexOf("--userId");
        const userId = idx >= 0 ? rest[idx + 1] : undefined;
        await wipeUserOwned(client, userId);
        break;
      }
      case "clear-auth": {
        const includeUsers = rest.includes("--all");
        await clearAuth(client, includeUsers);
        break;
      }
      default:
        usage();
    }
  } finally {
    await client.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
