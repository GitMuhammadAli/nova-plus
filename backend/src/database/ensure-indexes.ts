/**
 * MongoDB Index Initialization Script
 * 
 * This script ensures all indexes are created on application startup.
 * Can also be run standalone: npx ts-node src/database/ensure-indexes.ts
 */

import * as mongoose from 'mongoose';
import { allIndexes } from './indexes';

/**
 * Create indexes for a specific collection
 */
async function createCollectionIndexes(
  db: mongoose.Connection,
  collectionName: string,
  indexes: Array<{ key: Record<string, number>; options: Record<string, any> }>,
): Promise<void> {
  try {
    const collection = db.collection(collectionName);
    
    for (const indexDef of indexes) {
      try {
        await collection.createIndex(indexDef.key, indexDef.options);
        console.log(`✓ Created index ${indexDef.options.name} on ${collectionName}`);
      } catch (error: any) {
        // Index might already exist with different options
        if (error.code === 85 || error.code === 86) {
          console.log(`↻ Index ${indexDef.options.name} already exists on ${collectionName}`);
        } else {
          console.error(`✗ Error creating index ${indexDef.options.name} on ${collectionName}:`, error.message);
        }
      }
    }
  } catch (error) {
    console.error(`Error accessing collection ${collectionName}:`, error);
  }
}

/**
 * Ensure all indexes are created
 */
export async function ensureAllIndexes(connection: mongoose.Connection): Promise<void> {
  console.log('\n=== Starting Index Creation ===\n');
  
  for (const [collectionName, indexes] of Object.entries(allIndexes)) {
    await createCollectionIndexes(connection, collectionName, indexes);
  }
  
  console.log('\n=== Index Creation Complete ===\n');
}

/**
 * Drop all custom indexes (for development/testing)
 */
export async function dropAllCustomIndexes(connection: mongoose.Connection): Promise<void> {
  console.log('\n=== Dropping Custom Indexes ===\n');
  
  for (const collectionName of Object.keys(allIndexes)) {
    try {
      const collection = connection.collection(collectionName);
      await collection.dropIndexes();
      console.log(`✓ Dropped indexes on ${collectionName}`);
    } catch (error: any) {
      if (error.code !== 26) { // 26 = namespace not found
        console.error(`✗ Error dropping indexes on ${collectionName}:`, error.message);
      }
    }
  }
  
  console.log('\n=== Index Drop Complete ===\n');
}

/**
 * List all indexes (for debugging)
 */
export async function listAllIndexes(connection: mongoose.Connection): Promise<void> {
  console.log('\n=== Current Indexes ===\n');
  
  for (const collectionName of Object.keys(allIndexes)) {
    try {
      const collection = connection.collection(collectionName);
      const indexes = await collection.listIndexes().toArray();
      console.log(`\n${collectionName}:`);
      indexes.forEach((idx) => {
        console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
      });
    } catch (error: any) {
      if (error.code !== 26) {
        console.error(`Error listing indexes for ${collectionName}:`, error.message);
      }
    }
  }
}

// Run if called directly
if (require.main === module) {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/novapulse';
  
  mongoose.connect(mongoUri)
    .then(async () => {
      console.log('Connected to MongoDB');
      
      const command = process.argv[2];
      
      switch (command) {
        case 'drop':
          await dropAllCustomIndexes(mongoose.connection);
          break;
        case 'list':
          await listAllIndexes(mongoose.connection);
          break;
        case 'create':
        default:
          await ensureAllIndexes(mongoose.connection);
          break;
      }
      
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to connect to MongoDB:', error);
      process.exit(1);
    });
}

