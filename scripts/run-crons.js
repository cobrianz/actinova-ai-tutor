const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const CRON_SECRET = process.env.CRON_SECRET;
const BASE_URL = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const CRON_JOBS = [
  { name: "Plan Expiry", path: "/api/cron/plan-expiry" },
  { name: "Trending Topics", path: "/api/cron/trending-topics" },
  { name: "Trending Career", path: "/api/cron/trending-career" },
  { name: "Trending Premium", path: "/api/cron/trending-premium" },
  { name: "Weekly Blogs", path: "/api/cron/generate-weekly-blogs" },
];

async function runCron(job) {
  console.log(`\n[CRON] Triggering ${job.name}...`);

  try {
    const response = await fetch(`${BASE_URL}${job.path}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CRON_SECRET}`,
        'Content-Type': 'application/json',
      },
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (response.ok) {
      console.log(`[OK] ${job.name} completed successfully.`);
      console.log(`   Message: ${data.message || 'No message'}`);
      if (data.stats) {
        console.log(`   Stats: ${JSON.stringify(data.stats)}`);
      }
      return;
    }

    console.error(`[FAIL] ${job.name} failed with status ${response.status}.`);
    console.error(`   Error: ${data.error || 'Unknown error'}`);
  } catch (error) {
    console.error(`[FAIL] ${job.name} failed due to network error.`);
    console.error(`   Error: ${error.message}`);
  }
}

async function main() {
  console.log("=== Actirova Cron Job Runner ===");
  console.log(`Target URL: ${BASE_URL}`);

  if (!CRON_SECRET) {
    console.error("CRON_SECRET is not set. Refusing to call protected cron endpoints.");
    process.exitCode = 1;
    return;
  }

  const jobName = process.argv[2];

  if (jobName) {
    const job = CRON_JOBS.find(
      (entry) =>
        entry.name.toLowerCase().includes(jobName.toLowerCase()) ||
        entry.path.includes(jobName)
    );

    if (!job) {
      console.error(`Job "${jobName}" not found.`);
      process.exitCode = 1;
      return;
    }

    await runCron(job);
    return;
  }

  for (const job of CRON_JOBS) {
    await runCron(job);
  }
}

main().catch(console.error);
