/**
 * Migrates data from the 'test' database to the 'actinova-ai-tutor' database.
 *
 * Usage:
 *   node scripts/migrate-test-to-actinova.js
 *
 * Requires:
 *   MONGODB_URI and MONGODB_DB_NAME in environment (loads .env.local automatically)
 */

import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config({ path: ".env.local" });
dotenv.config();

const uri = process.env.MONGODB_URI;
const targetDbName = process.env.MONGODB_DB_NAME;

if (!uri) {
  console.error("Missing MONGODB_URI env var.");
  process.exit(1);
}

if (!targetDbName) {
  console.error("Missing MONGODB_DB_NAME env var.");
  process.exit(1);
}

const SOURCE_DB_NAME = "test";

async function run() {
  const client = new MongoClient(uri);
  await client.connect();

  try {
    const sourceDb = client.db(SOURCE_DB_NAME);
    const targetDb = client.db(targetDbName);

    console.log(`Migrating from '${SOURCE_DB_NAME}' to '${targetDbName}'...`);

    // Get all collections from source database
    const collections = await sourceDb
      .listCollections({}, { nameOnly: true })
      .toArray();

    if (collections.length === 0) {
      console.log("No collections found in source database.");
      return;
    }

    console.log(`Found ${collections.length} collections to migrate:`);
    collections.forEach((c) => console.log(`  - ${c.name}`));

    // Migrate each collection
    for (const collectionInfo of collections) {
      const collectionName = collectionInfo.name;
      console.log(`\nMigrating collection: ${collectionName}`);

      const sourceCollection = sourceDb.collection(collectionName);
      const targetCollection = targetDb.collection(collectionName);

      // Get all documents from source
      const documents = await sourceCollection.find({}).toArray();
      console.log(`  Found ${documents.length} documents`);

      if (documents.length === 0) {
        console.log(`  Skipping empty collection`);
        continue;
      }

      // Check if target collection already has data
      const targetCount = await targetCollection.countDocuments();
      if (targetCount > 0) {
        console.log(`  Target collection already has ${targetCount} documents`);
        const overwrite = process.argv.includes("--overwrite");
        if (!overwrite) {
          console.log(`  Skipping (use --overwrite to replace)`);
          continue;
        }
        console.log(`  Overwriting existing data...`);
        await targetCollection.deleteMany({});
      }

      // Insert documents in batches for better performance
      const batchSize = 1000;
      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        await targetCollection.insertMany(batch, { ordered: false });
        console.log(
          `  Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(documents.length / batchSize)}`
        );
      }

      // Copy indexes (excluding _id_ which is automatic)
      const indexes = await sourceCollection.indexes();
      for (const index of indexes) {
        if (index.name === "_id_") continue; // Skip default _id index

        try {
          const indexOptions = {
            unique: index.unique,
            sparse: index.sparse,
            name: index.name,
          };

          // Remove undefined values
          Object.keys(indexOptions).forEach(
            (key) => indexOptions[key] === undefined && delete indexOptions[key]
          );

          await targetCollection.createIndex(index.key, indexOptions);
          console.log(`  Created index: ${index.name}`);
        } catch (err) {
          console.log(`  Warning: Could not create index ${index.name}: ${err.message}`);
        }
      }

      console.log(`  ✓ Migrated ${documents.length} documents`);
    }

    console.log(`\nMigration complete!`);
    console.log(`Data is now in the '${targetDbName}' database.`);
  } finally {
    await client.close();
  }
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
