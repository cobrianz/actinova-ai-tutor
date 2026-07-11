/* eslint-disable no-console */

// Read-only debug: verify whether a stored lesson contains specific sections.
require("dotenv").config({ path: ".env.local" });

const { MongoClient } = require("mongodb");

async function main() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  const dbName = process.env.MONGODB_DB_NAME;
  if (!uri) throw new Error("Missing MONGODB_URI (or MONGO_URI) in .env.local");
  if (!dbName) throw new Error("Missing MONGODB_DB_NAME in .env.local");

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const col = db.collection("library");

  const doc = await col.findOne(
    {
      $or: [
        { title: /data structures and algorithms/i },
        { topic: /data structures and algorithms/i },
        { originalTopic: /data structures and algorithms/i },
        { "courseData.title": /data structures and algorithms/i },
        { "courseData.topic": /data structures and algorithms/i },
      ],
    },
    {
      projection: {
        title: 1,
        topic: 1,
        originalTopic: 1,
        modules: 1,
        courseData: 1,
      },
    }
  );

  if (!doc) {
    console.log("No matching course found in `library` collection.");
    await client.close();
    return;
  }

  const cd = doc.courseData || doc;
  const mods = cd.modules || [];
  const m1 = mods.find((m) => String(m.id || "") === "1") || mods[0];
  const lesson0 = m1?.lessons?.[0];
  const content = typeof lesson0 === "object" ? lesson0.content || "" : "";

  console.log("Course _id:", String(doc._id));
  console.log("Course title:", cd.title || doc.title);
  console.log("Module 1:", m1?.title);
  console.log("Lesson 1:", typeof lesson0 === "object" ? lesson0.title : lesson0);
  console.log("Lesson 1 content length:", content.length);
  console.log("Contains '## Key Takeaways':", content.includes("## Key Takeaways"));
  console.log(
    "Contains '## Further Reading':",
    content.includes("## Further Reading")
  );
  console.log("Tail preview (last 600 chars):\n---\n" + content.slice(-600) + "\n---");

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

