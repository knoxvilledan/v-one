#!/usr/bin/env node

import { MongoClient } from "mongodb";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.join(__dirname, "..", ".env.local");
try {
  const envFile = await fs.readFile(envPath, "utf8");
  const envVars = envFile.split("\n").reduce((acc, line) => {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0) {
      acc[key.trim()] = valueParts.join("=").trim();
    }
    return acc;
  }, {});

  Object.assign(process.env, envVars);
} catch (error) {
  console.error("Error loading .env.local:", error.message);
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not found in environment variables");
  process.exit(1);
}

async function backupDatabase() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log("🔗 Connecting to MongoDB...");
    await client.connect();

    const db = client.db("AmpTrack");

    // Create backup directory with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupDir = path.join(
      __dirname,
      "..",
      "backups",
      `backup-${timestamp}`
    );
    await fs.mkdir(backupDir, { recursive: true });

    console.log(`📁 Creating backup in: ${backupDir}`);

    // Get all collections
    const collections = await db.listCollections().toArray();
    console.log(`📋 Found ${collections.length} collections to backup`);

    const backup = {
      timestamp: new Date().toISOString(),
      database: "AmpTrack",
      collections: {},
    };

    // Backup each collection
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      console.log(`💾 Backing up collection: ${collectionName}`);

      const collection = db.collection(collectionName);
      const documents = await collection.find({}).toArray();

      backup.collections[collectionName] = documents;

      // Also save individual collection files
      const collectionFile = path.join(backupDir, `${collectionName}.json`);
      await fs.writeFile(collectionFile, JSON.stringify(documents, null, 2));

      console.log(`  ✅ ${documents.length} documents backed up`);
    }

    // Save complete backup
    const backupFile = path.join(backupDir, "complete-backup.json");
    await fs.writeFile(backupFile, JSON.stringify(backup, null, 2));

    // Create summary
    const summary = {
      timestamp: backup.timestamp,
      database: "AmpTrack",
      collections: Object.keys(backup.collections).map((name) => ({
        name,
        documentCount: backup.collections[name].length,
      })),
      totalCollections: collections.length,
      totalDocuments: Object.values(backup.collections).reduce(
        (sum, docs) => sum + docs.length,
        0
      ),
    };

    const summaryFile = path.join(backupDir, "backup-summary.json");
    await fs.writeFile(summaryFile, JSON.stringify(summary, null, 2));

    console.log("\n🎉 Backup completed successfully!");
    console.log(`📍 Backup location: ${backupDir}`);
    console.log(
      `📊 Summary: ${summary.totalDocuments} documents across ${summary.totalCollections} collections`
    );

    return backupDir;
  } catch (error) {
    console.error("❌ Backup failed:", error);
    throw error;
  } finally {
    await client.close();
  }
}

// Run backup if called directly
if (process.argv[1] === __filename) {
  backupDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { backupDatabase };
