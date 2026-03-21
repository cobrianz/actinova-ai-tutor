const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const CRON_SECRET = process.env.CRON_SECRET || "your-secret-key";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

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

    const data = await response.json();
    if (response.ok) {
      console.log(`✅ ${job.name} completed successfully.`);
      console.log(`   Message: ${data.message || 'No message'}`);
      if (data.stats) console.log(`   Stats: ${JSON.stringify(data.stats)}`);
    } else {
      console.error(`❌ ${job.name} failed with status ${response.status}.`);
      console.error(`   Error: ${data.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.error(`❌ ${job.name} failed due to network error.`);
    console.error(`   Error: ${error.message}`);
  }
}

async function main() {
  console.log("=== Actirova Cron Job Runner ===");
  console.log(`Target URL: ${BASE_URL}`);
  
  const jobName = process.argv[2];
  
  if (jobName) {
    const job = CRON_JOBS.find(j => j.name.toLowerCase().includes(jobName.toLowerCase()) || j.path.includes(jobName));
    if (job) {
      await runCron(job);
    } else {
      console.error(`Job "${jobName}" not found.`);
    }
  } else {
    for (const job of CRON_JOBS) {
      await runCron(job);
    }
  }
}

main().catch(console.error);
