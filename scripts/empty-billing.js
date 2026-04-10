/**
 * Empties all billing/payment records for everyone.
 *
 * What it does:
 * - Clears `users.billingHistory`
 * - Resets all users to Free (subscription + isPremium)
 * - Removes paid resume-export markers in `careerhistories`
 * - Deletes entitlement/payment intent collections used by billing flows:
 *   `enrollments`, `premium_generation_intents`
 *
 * Usage:
 *   node scripts/empty-billing.js
 *
 * Requires:
 *   MONGODB_URI in env (loads .env.local automatically)
 */

import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config({ path: ".env.local" });
dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("Missing MONGODB_URI env var.");
  process.exit(1);
}

function tryDbNameFromUri(u) {
  try {
    const parsed = new URL(u);
    const name = String(parsed.pathname || "").replace(/^\//, "");
    return name || null;
  } catch {
    return null;
  }
}

async function run() {
  const client = new MongoClient(uri);
  await client.connect();

  try {
    const db = client.db(tryDbNameFromUri(uri) || undefined);
    const colls = await db
      .listCollections({}, { nameOnly: true })
      .toArray()
      .then((x) => x.map((c) => c.name));
    const has = new Set(colls);

    const results = {};

    if (has.has("users")) {
      const res = await db.collection("users").updateMany(
        {},
        {
          $set: {
            billingHistory: [],
            isPremium: false,
            subscription: {
              plan: "free",
              tier: "free",
              status: "inactive",
              autoRenew: false,
            },
          },
          $unset: {
            generatedPremiumCourses: "",
          },
        }
      );
      results.usersUpdated = res.modifiedCount || 0;
    } else {
      results.usersUpdated = 0;
      console.log("[skip] users collection not found");
    }

    if (has.has("careerhistories")) {
      const res = await db.collection("careerhistories").updateMany(
        { type: "resume" },
        {
          $unset: {
            "metadata.exportPaid": "",
            "metadata.exportPaidAt": "",
            "metadata.exportReference": "",
            "metadata.exportAmount": "",
            "metadata.exportCurrency": "",
          },
        }
      );
      results.resumeFlagsCleared = res.modifiedCount || 0;
    } else {
      results.resumeFlagsCleared = 0;
      console.log("[skip] careerhistories collection not found");
    }

    if (has.has("enrollments")) {
      const res = await db.collection("enrollments").deleteMany({});
      results.enrollmentsDeleted = res.deletedCount || 0;
    } else {
      results.enrollmentsDeleted = 0;
      console.log("[skip] enrollments collection not found");
    }

    if (has.has("premium_generation_intents")) {
      const res = await db.collection("premium_generation_intents").deleteMany(
        {}
      );
      results.premiumGenerationIntentsDeleted = res.deletedCount || 0;
    } else {
      results.premiumGenerationIntentsDeleted = 0;
      console.log("[skip] premium_generation_intents collection not found");
    }

    console.log("Billing wipe complete:", results);
  } finally {
    await client.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

