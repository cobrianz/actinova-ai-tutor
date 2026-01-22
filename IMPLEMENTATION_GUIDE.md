# API Implementation Guide: Critical Fixes

## Overview
This guide provides step-by-step instructions to implement critical security and functionality fixes for the Actinova AI Tutor platform.

---

## 1. IMPLEMENT PLAN EXPIRY VALIDATION

### Step 1: Update User Schema
Add these fields to your User model:

```javascript
// models/User.js
const userSchema = new Schema({
  // ... existing fields
  subscription: {
    tier: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free'
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled', 'suspended'],
      default: 'active'
    },
    expiryDate: Date,
    startDate: Date,
    renewalReminderSent: Boolean,
    renewalReminderSentAt: Date,
    downgradedAt: Date,
  }
});
```

### Step 2: Use planMiddleware.js
Import and use in protected routes:

```javascript
// Example: src/app/api/protected-route/route.js
import { validateSubscriptionStatus, checkCourseAccess } from "@/lib/planMiddleware";
import { withAuth } from "@/lib/middleware";

async function handleGet(request) {
  const user = await validateSubscriptionStatus(request.user._id);
  
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  
  // Rest of your logic
}

export const GET = withAuth(handleGet);
```

### Step 3: Create Cron Job
Set up the cron job endpoint we created:

```bash
# Add to your .env
CRON_SECRET=your-very-secure-secret-key-here

# Call this endpoint daily (e.g., 12:00 AM)
# Using Vercel: Add cron to vercel.json
{
  "crons": [
    {
      "path": "/api/cron/plan-expiry",
      "schedule": "0 0 * * *"
    }
  ]
}

# Or use node-cron if self-hosted
```

---

## 2. IMPLEMENT API RATE LIMITING BY PLAN TIER

### Current Status
✅ planLimits.js already exists and defines limits
⚠️ NOT being enforced in generate-course API

### Implementation Steps

#### Step 1: Update generate-course API
Replace the beginning of `/api/generate-course/route.js`:

```javascript
import { checkAPILimit, trackAPIUsage } from "@/lib/planMiddleware";

export async function POST(request) {
  // ... existing auth code ...

  // ADD THIS: Check API limit
  if (userId) {
    const limitCheck = await checkAPILimit(userId, "generate-course");
    
    if (!limitCheck.withinLimit) {
      return NextResponse.json(
        {
          error: "API rate limit exceeded",
          message: `You have reached your monthly limit of ${limitCheck.limit} course generations`,
          remaining: 0,
          resetDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
        },
        { status: 429 }
      );
    }

    // Log the usage
    await trackAPIUsage(userId, "generate-course");
  }

  // ... rest of your code ...
}
```

#### Step 2: Add to all rate-limited endpoints
Apply the same pattern to:
- `/api/generate-flashcards`
- `/api/chat` (limit responses)
- `/api/quizzes` (limit generation)

---

## 3. IMPLEMENT COURSE ACCESS CONTROL

### Step 1: Add Course Premium Flag
Update course schema:

```javascript
// models/Course.js or in MongoDB
const courseSchema = {
  // ... existing fields
  isPremium: {
    type: Boolean,
    default: false
  },
  tierRequired: {
    type: String,
    enum: ['free', 'pro', 'enterprise'],
    default: 'free'
  }
}
```

### Step 2: Add Course Access Check
Update course listing endpoints:

```javascript
// /api/courses
import { checkCourseAccess } from "@/lib/planMiddleware";

export async function GET(request) {
  const { db } = await connectToDatabase();
  const user = request.user;

  // Get all courses
  let courses = await db.collection("courses").find({}).toArray();

  // Filter based on user's access
  courses = await Promise.all(
    courses.map(async (course) => {
      const access = await checkCourseAccess(user._id, course._id);
      return {
        ...course,
        hasAccess: access.hasAccess,
        accessError: access.reason,
      };
    })
  );

  return NextResponse.json({ courses });
}
```

### Step 3: Protect Course Progress Updates
Update `/api/course-progress`:

```javascript
// Add before updating progress
const access = await checkCourseAccess(user._id, courseId);
if (!access.hasAccess) {
  return NextResponse.json(
    {
      error: "Access denied",
      message: access.reason,
      requiredTier: access.requiredTier,
    },
    { status: 403 }
  );
}
```

---

## 4. ADD SUBSCRIPTION MANAGEMENT ENDPOINTS

### Create Renewal Endpoint
```javascript
// /api/subscription/renew
import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import { withAuth } from "@/lib/middleware";
import { ObjectId } from "mongodb";

async function handlePost(request) {
  const { db } = await connectToDatabase();
  const user = request.user;
  const { planId } = await request.json();

  // Validate plan exists
  const plan = await db.collection("plans").findOne({ _id: new ObjectId(planId) });
  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  // Update subscription
  const expiryDate = new Date();
  if (plan.billingCycle === "monthly") {
    expiryDate.setMonth(expiryDate.getMonth() + 1);
  } else if (plan.billingCycle === "annual") {
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);
  }

  await db.collection("users").updateOne(
    { _id: new ObjectId(user._id) },
    {
      $set: {
        "subscription.tier": plan.tier,
        "subscription.status": "active",
        "subscription.expiryDate": expiryDate,
        "subscription.renewalReminderSent": false,
      },
    }
  );

  return NextResponse.json({ success: true, expiryDate });
}

export const POST = withAuth(handlePost);
```

### Create Cancellation Endpoint
```javascript
// /api/subscription/cancel
async function handlePost(request) {
  const { db } = await connectToDatabase();
  const user = request.user;

  await db.collection("users").updateOne(
    { _id: new ObjectId(user._id) },
    {
      $set: {
        "subscription.status": "cancelled",
        "subscription.cancelledAt": new Date(),
      },
    }
  );

  return NextResponse.json({ success: true });
}
```

---

## 5. FRONTEND INTEGRATION

### Add Subscription Status Display
```javascript
// components/SubscriptionStatus.jsx
import { useEffect, useState } from 'react';

export default function SubscriptionStatus() {
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    const res = await fetch('/api/me');
    const data = await res.json();
    setSubscription(data.user.subscription);
  };

  if (!subscription) return null;

  const daysRemaining = Math.ceil(
    (new Date(subscription.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div className={daysRemaining <= 7 ? 'bg-yellow-50' : 'bg-blue-50'}>
      <p>Plan: {subscription.tier}</p>
      <p>Days Remaining: {daysRemaining}</p>
      {daysRemaining <= 7 && (
        <button onClick={() => router.push('/pricing')}>
          Renew Plan
        </button>
      )}
    </div>
  );
}
```

### Handle API Limit Errors
```javascript
// In any component making API calls
try {
  const res = await fetch('/api/generate-course', {
    method: 'POST',
    body: JSON.stringify({ topic }),
  });

  if (res.status === 429) {
    const error = await res.json();
    showError(`Rate limit exceeded. ${error.message}`);
    return;
  }

  // Check headers for usage info
  const remaining = res.headers.get('X-API-Remaining');
  console.log(`Remaining: ${remaining}`);
} catch (error) {
  showError(error.message);
}
```

---

## 6. TESTING CHECKLIST

### Authentication Tests
- [ ] Free user gets 5 monthly API calls
- [ ] Pro user gets 50 monthly API calls
- [ ] 6th call for free user returns 429
- [ ] Usage counter resets on 1st of month

### Subscription Tests
- [ ] User can renew subscription
- [ ] User can cancel subscription
- [ ] Expired plan downgrades user to free
- [ ] Cron job runs daily successfully
- [ ] Renewal reminder sent 7 days before expiry

### Course Access Tests
- [ ] Free user can't access premium courses
- [ ] Pro user can access pro courses
- [ ] Expired plan loses premium access
- [ ] Course progress blocked for no access

### Error Handling Tests
- [ ] 429 error has retry info
- [ ] 403 error shows reason
- [ ] 401 error redirects to login
- [ ] 500 error logged to monitoring

---

## 7. DEPLOYMENT CHECKLIST

Before deploying, ensure:

- [ ] `.env` file has `CRON_SECRET`
- [ ] Database connection works
- [ ] Cron job configured in vercel.json or node-cron
- [ ] All new API routes have tests
- [ ] Error logging configured
- [ ] User data migration for subscription fields (if needed)
- [ ] Frontend updated with new features
- [ ] API documentation updated

---

## 8. MONITORING & MAINTENANCE

### Add Logging
```javascript
// In API routes
console.log({
  timestamp: new Date().toISOString(),
  endpoint: 'generate-course',
  userId: user._id,
  planTier: user.subscription?.tier,
  usage: limitCheck.currentUsage,
  limit: limitCheck.limit,
});
```

### Set Up Alerts
- Alert if cron job fails
- Alert if API limit errors spike
- Alert if many users being downgraded

### Monthly Review
- Check API usage patterns by tier
- Review subscription expiry trends
- Analyze which features are most used
- Update limits if needed

---

## Quick Start (TL;DR)

1. Copy `planMiddleware.js` to `/src/lib/`
2. Add cron route from our files
3. Update `.env` with CRON_SECRET
4. Modify `/api/generate-course` to use `checkAPILimit`
5. Update User schema with subscription fields
6. Add course access check to course endpoints
7. Deploy and test thoroughly

---

## Support & Issues

If you encounter issues:

1. Check logs in `/api/cron/plan-expiry`
2. Verify `CRON_SECRET` is set correctly
3. Ensure MongoDB connection works
4. Check that user has subscription fields in database
5. Review API rate limit headers in responses

---

*Last Updated: January 22, 2026*
