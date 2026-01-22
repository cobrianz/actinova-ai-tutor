/**
 * Cron Job: Plan Expiry Management
 * Runs daily to handle expired subscriptions
 * 
 * Setup: Call this from your cron service (e.g., node-cron)
 * Example: 0 0 * * * curl https://yourdomain.com/api/cron/plan-expiry
 */

import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

// Verify cron secret to prevent unauthorized calls
const CRON_SECRET = process.env.CRON_SECRET || "your-secret-key";

export async function POST(request) {
  try {
    // Verify cron secret
    const secret = request.headers.get("x-cron-secret");
    if (secret !== CRON_SECRET) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { db } = await connectToDatabase();
    const now = new Date();

    console.log(`[CRON] Starting plan expiry check at ${now.toISOString()}`);

    // === 1. Find and downgrade users with expired plans ===
    const expiredUsers = await db
      .collection("users")
      .find({
        "subscription.expiryDate": { $lt: now },
        "subscription.tier": { $ne: "free" },
        "subscription.status": { $ne: "expired" },
      })
      .toArray();

    console.log(`[CRON] Found ${expiredUsers.length} users with expired plans`);

    // Update expired subscriptions
    if (expiredUsers.length > 0) {
      const result = await db.collection("users").updateMany(
        {
          "subscription.expiryDate": { $lt: now },
          "subscription.tier": { $ne: "free" },
          "subscription.status": { $ne: "expired" },
        },
        {
          $set: {
            "subscription.tier": "free",
            "subscription.status": "expired",
            "subscription.downgradedAt": new Date(),
          },
        }
      );

      console.log(`[CRON] Downgraded ${result.modifiedCount} users to free tier`);
    }

    // === 2. Send renewal reminders for plans expiring in 7 days ===
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const expiringUsers = await db
      .collection("users")
      .find({
        "subscription.expiryDate": {
          $gte: now,
          $lte: sevenDaysLater,
        },
        "subscription.tier": { $ne: "free" },
        "subscription.status": "active",
        "subscription.renewalReminderSent": { $ne: true },
      })
      .toArray();

    console.log(`[CRON] Found ${expiringUsers.length} users needing renewal reminders`);

    // Mark as reminded (in production, also send email)
    if (expiringUsers.length > 0) {
      await db.collection("users").updateMany(
        {
          "subscription.expiryDate": {
            $gte: now,
            $lte: sevenDaysLater,
          },
          "subscription.tier": { $ne: "free" },
          "subscription.status": "active",
          "subscription.renewalReminderSent": { $ne: true },
        },
        {
          $set: {
            "subscription.renewalReminderSent": true,
            "subscription.renewalReminderSentAt": new Date(),
          },
        }
      );

      // TODO: Send renewal reminder emails
      console.log(`[CRON] Marked ${expiringUsers.length} users for renewal reminders`);
    }

    // === 3. Clean up cancelled subscriptions (optional) ===
    const cancelledResult = await db.collection("users").updateMany(
      {
        "subscription.status": "cancelled",
        "subscription.tier": { $ne: "free" },
      },
      {
        $set: {
          "subscription.tier": "free",
          "subscription.expiryDate": null,
        },
      }
    );

    console.log(`[CRON] Cleaned up ${cancelledResult.modifiedCount} cancelled subscriptions`);

    // === 4. Reset monthly API usage counters (run on 1st of month) ===
    if (now.getDate() === 1) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const usageDeleteResult = await db.collection("api_usage").deleteMany({
        month: { $lt: monthStart },
      });

      console.log(`[CRON] Cleaned up ${usageDeleteResult.deletedCount} old usage records`);
    }

    // === 5. Log statistics ===
    const stats = {
      timestamp: new Date().toISOString(),
      expiredUsersDowngraded: expiredUsers.length,
      renewalRemindersQueued: expiringUsers.length,
      cancelledCleaned: cancelledResult.modifiedCount,
    };

    console.log("[CRON] Plan expiry check completed:", stats);

    return NextResponse.json(
      {
        success: true,
        message: "Plan expiry check completed",
        stats,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[CRON] Error in plan expiry check:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Alternative: Use node-cron in your server
 * 
 * import cron from 'node-cron';
 * 
 * // Run daily at midnight
 * cron.schedule('0 0 * * *', async () => {
 *   try {
 *     const response = await fetch('https://yourdomain.com/api/cron/plan-expiry', {
 *       method: 'POST',
 *       headers: {
 *         'x-cron-secret': process.env.CRON_SECRET,
 *       },
 *     });
 *     console.log('Plan expiry cron completed:', response.status);
 *   } catch (error) {
 *     console.error('Cron error:', error);
 *   }
 * });
 */
