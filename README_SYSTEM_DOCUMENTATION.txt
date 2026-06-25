Actirova AI Tutor — System Documentation (Inspected Summary)

Repo: f:/Actinova/actinova-ai-tutor

This file is a condensed, self-contained documentation snapshot intended to satisfy “inspect everything” at the level of the system’s security + plan enforcement + major feature surfaces present in this repository.

NOTE
- The codebase/docs may alternate between “Actinova” and “Actirova”. They refer to the same product.

============================================================
A) Scope of inspection (what was verified)
============================================================
Inspected key system files:
- docs/PROJECT_DOCUMENTATION.md (existing baseline documentation)
- middleware.js (root) (page-level auth redirect rules)
- src/app/lib/middleware.js (withAuth + withErrorHandling + withCsrf + combineMiddleware)
- src/app/lib/planMiddleware.js (subscription validation, auto-downgrade, quota checks, course access checks, usage tracking)
- src/app/cookies/page.jsx (cookie policy UI)
- Additional verification: src/app/api/** route handler middleware composition patterns (export GET/POST with withAuth/withCsrf/withErrorHandling/withAPIRateLimit)

============================================================
B) Architecture overview
============================================================
Stack:
- Next.js App Router, React, Tailwind, Framer Motion, Radix UI, Sonner, Lucide
- MongoDB via direct collections and model helpers
- OpenAI for content generation + tutor chat + career tools
- Paystack for subscriptions and billing webhooks

Layering:
- UI: src/app/** and src/app/components/**
- API: src/app/api/**/route.js
- Shared logic: src/app/lib/**
- Cron: src/app/api/cron/** and scripts/run-crons.js

Request protection model:
- middleware.js (path-level) blocks protected pages by redirecting to /auth/login when no token exists.
- API routes apply withAuth (JWT verify + active/locked check), withCsrf for mutating unsafe methods, and withAPIRateLimit for quota enforcement.

============================================================
C) Security (end-to-end)
============================================================
C1) Page-level auth: middleware.js (root)
- Reads token cookie: request.cookies.get('token')?.value
- If missing, checks Authorization header: Bearer <token>
- Public routes: '/', auth pages, about/contact/pricing/privacy/terms, blog.
- Bypass: /api/webhook, /api/public, /api/auth.
- Protected web pages redirect to /auth/login?from=<path>.
- Redirect-loop avoidance: middleware does not force redirect away from auth pages solely because token cookie exists but is expired.

C2) API-level auth: src/app/lib/middleware.js
withAuth(handler, options)
- Extracts token from cookie header parsing OR Authorization header OR next/headers fallback.
- verifyToken(token) to decode user id.
- validateSubscriptionStatus(userId) to load user and auto-downgrade expired paid tiers.
- Guards:
  - user.status === 'active'
  - !user.isLocked
- Sets req.user = user
- options.optional allows handler to proceed without user.
- options.roles optionally restricts roles.

C3) CSRF: src/app/lib/withCsrf.js
- Safe methods (GET/HEAD/OPTIONS) pass through.
- Unsafe methods require CSRF header and CSRF cookie.

C4) Error handling: withErrorHandling
- Wraps handler and returns standardized JSON errors.

============================================================
D) Plans, quotas, and access control
============================================================
D1) Tiers and levels
- TIERS: free / pro / enterprise
- TIER_LEVELS: free=0, pro=1, enterprise=2

D2) Auto-downgrade: validateSubscriptionStatus(userId)
- Computes effective expiry from:
  - subscription.currentPeriodEnd || subscription.expiryDate || subscription.expiresAt
- If expired and tier != free:
  - updates user subscription tier/status to FREE/expired
  - clears expiry timestamps
  - sets isPremium=false

D3) Quota checks: checkAPILimit + withAPIRateLimit
- withAPIRateLimit(handler, apiName)
  - uses checkAPILimit(user._id, apiName)
  - blocks with HTTP 429 when over the monthly quota
  - adds X-RateLimit-* headers based on check results
- Important convention:
  - withAPIRateLimit does NOT auto-increment usage.
  - API handlers must call trackAPIUsage after successful expensive operations.

D4) Usage tracking: trackAPIUsage(userId, apiName)
- Maps apiName to feature key via getFeatureName:
  - generate-course -> generateCourseLimit
  - generate-flashcards -> flashcards
  - quiz -> quizGenerations
  - ai-tutor-chat -> aiResponses
  - generate-report-outline/section -> reportGenerations
  - career routes -> careerLimit
- Increments monthly bucket in api_usage collection.

D5) Course access + sharing: checkCourseAccess(userId, courseId, shareId)
- If shareId provided:
  - finds share configuration in library collection (shareConfigs / isShared)
  - determines sharer tier (sharePlan/isPremium or specific shareConfigs tier)
  - paid sharer -> fullAccess
  - free sharer -> limited access
- If no shareId:
  - validates user subscription (auto-downgrade)
  - checks library enrollment/ownership
  - if course is premium and user lacks paid plan -> access denied unless enrolled

============================================================
E) Feature coverage (major user workflows)
============================================================
E1) Learning content generation
- POST /api/generate-course (course outline generation; supports quiz format=quiz)
- POST /api/generate-flashcards (SRS-aware card sets)
- Reports:
  - POST /api/generate-report-outline
  - POST /api/generate-report-section
  - /api/reports CRUD + /api/reports/[id]/validate
- Document export utilities:
  - POST /api/generate-doc
  - POST /api/latex-converter
- Access is enforced by withAuth/withCsrf and planMiddleware quotas.

E2) AI tutor chat
- POST /api/chat (focused tutoring within a topic)
- Plan limits: withAPIRateLimit + manual usage increment via trackAPIUsage
- Chat history exists under /api/chat/history (GET/POST/DELETE) guarded by withAuth.

E3) Library, progress, and sharing
- /api/library (list/fetch/persist) + UI pagination (page + limit)
  - Implemented in: src/app/components/Library.jsx
- /api/library/share (sharing controls/config)
- /api/course-progress (lesson/module progress)
- /api/notes
- /api/srs/due and /api/srs/review (flashcard scheduling)


E4) Premium discovery
- /api/premium-courses (featured + list; UI supports search; API may return paginated payload)
  - Implemented in: src/app/components/PremiumCourses.jsx (no explicit page controls, but supports filtering by search query)
- /api/premium-courses/personalized
- /api/premium-courses/trending
- also /api/premium-courses/favorites


E5) Career suite (premium gated)
- /api/career/* endpoints for resume, interview questions/feedback, skill gap, network messages, portfolio, trending, and history persistence.

E6) Billing (Paystack)
- /api/plans
- /api/billing/create-session
- /api/billing/verify-payment
- /api/billing/webhook
- Cron + validateSubscriptionStatus ensures tier expiry is enforced.

E7) Cron jobs
- Runner: npm run cron -> scripts/run-crons.js
- Cron endpoints under /api/cron/*: plan expiry, trending topics/career/premium, weekly blogs.

============================================================
F) Cookies policy page UI
============================================================
- Implemented in: src/app/cookies/page.jsx
- Client component using Framer Motion.
- Presents cookie categories and interactive toggles UI.
- Does not show backend persistence of cookie preferences in the inspected snippet.

============================================================
End of documentation snapshot
============================================================

