import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in environment variables');
  process.exit(1);
}

async function migrateIconTracking() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    const collection = db.collection('user_data');
    
    // Find all documents without iconTracking field
    const documentsToUpdate = await collection.find({
      iconTracking: { $exists: false }
    }).toArray();
    
    console.log(`Found ${documentsToUpdate.length} documents to migrate`);
    
    if (documentsToUpdate.length === 0) {
      console.log('No documents need migration');
      return;
    }
    
    // Update all documents to add default iconTracking
    const result = await collection.updateMany(
      { iconTracking: { $exists: false } },
      {
        $set: {
          iconTracking: {
            water: 10,
            cigarettes: 15,
            trees: 10
          }
        }
      }
    );
    
    console.log(`✅ Successfully migrated ${result.modifiedCount} documents`);
    console.log('All user data now has iconTracking field');
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.close();
  }
}

// Run migration
migrateIconTracking().catch(console.error);