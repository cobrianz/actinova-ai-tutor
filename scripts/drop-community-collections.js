/**
 * Drops deprecated community/study group collections from MongoDB.
 *
 * Usage:
 *   node scripts/drop-community-collections.js
 *
 * Requires:
 *   MONGODB_URI in environment (same as app uses)
 */

import { MongoClient } from "mongodb";
import dotenv from "dotenv";

// Load local env for scripts (Next.js loads this automatically; Node scripts do not).
dotenv.config({ path: ".env.local" });
dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Missing MONGODB_URI env var.");
  process.exit(1);
}

const COLLECTIONS = [
  "study_groups",
  "community_study_groups",
  "community_discussions",
  "community_hub",
];

async function run() {
  const client = new MongoClient(uri);
  await client.connect();

  try {
    const dbNameFromUri = (() => {
      try {
        const u = new URL(uri);
        const p = u.pathname?.replace(/^\//, "");
        return p || null;
      } catch {
        return null;
      }
    })();

    const db = client.db(dbNameFromUri || undefined);

    const existing = new Set(await db.listCollections({}, { nameOnly: true }).toArray().then((x) => x.map((c) => c.name)));

    for (const name of COLLECTIONS) {
      if (!existing.has(name)) {
        console.log(`[skip] ${name} (does not exist)`);
        continue;
      }
      await db.collection(name).drop();
      console.log(`[dropped] ${name}`);
    }

    console.log("Done.");
  } finally {
    await client.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
