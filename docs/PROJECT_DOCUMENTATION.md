# Actinova AI Tutor Project Documentation

## 1. Overview

Actinova AI Tutor is a full-stack AI learning platform built with Next.js App Router, React, MongoDB, OpenAI, and Paystack. The product combines AI-generated learning content with study workflows, premium subscriptions, career tools, and account management.

The codebase uses both the names `Actinova` and `Actirova` in different places. In practice, they refer to the same application.

Core product goals:

- Generate structured AI learning courses
- Turn topics into flashcards, quizzes, and long-form reports
- Provide an AI tutor chat for guided learning
- Personalize content from onboarding and usage history
- Sell premium access through Paystack
- Track usage limits by plan tier

## 2. Tech Stack

### Frontend

- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- Framer Motion
- Radix UI primitives
- Sonner for toasts
- Lucide React icons

### Backend

- Next.js route handlers under `src/app/api`
- MongoDB with Mongoose/native collection access
- JWT authentication with refresh-token rotation
- OpenAI for content generation
- Nodemailer for transactional email
- Paystack for billing

### Build and runtime scripts

- `npm run dev` or `bun run dev`
- `npm run build`
- `npm run start`
- `npm run lint`
- `npm run cron`

## 3. High-Level Architecture

### Application layers

1. UI routes and components live in `src/app` and `src/app/components`
2. API handlers live in `src/app/api`
3. Shared business logic lives in `src/app/lib`
4. MongoDB models live in `src/app/models`
5. Background/maintenance triggers live in `src/app/api/cron` and `scripts/run-crons.js`

### Main architectural patterns

- App Router pages are mostly client-rendered feature shells.
- Authentication is cookie-based, with `token` and `refreshToken` set server-side.
- MongoDB is used for users, generated learning content, usage tracking, reports, billing, and shared course access.
- OpenAI is called directly from server routes to generate courses, quizzes, flashcards, reports, blogs, and career-related content.
- Plan enforcement is centralized in `planLimits.js`, `planMiddleware.js`, and `usageSummary.js`.

## 4. User-Facing Product Areas

### Marketing and public pages

- `/` landing page with hero, features, testimonials, CTA, and footer
- `/about`
- `/contact`
- `/pricing`
- `/blog`
- `/privacy`
- `/terms`
- `/cookies`
- `/help`

### Auth and onboarding

- `/auth/login`
- `/auth/signup`
- `/auth/verify-email`
- `/auth/forgot-password`
- `/auth/reset-password`
- `/onboarding`

### Main app

- `/dashboard`
- `/learn/[topic]`
- `/explore`
- `/profile`
- `/quizzes`
- `/reports/[id]`
- `/checkout`
- `/checkout/success`
- `/share/[shareId]`

## 5. UI and Navigation

### Landing page

The landing page is assembled from:

- `HeroNavbar`
- `Hero`
- `Features`
- `HowItWorks`
- `Testimonials`
- `CTA`
- `Footer`

It also increments a visitor counter through `/api/visitor-counter`.

### Dashboard layout

The dashboard is the primary application shell. It uses query-string tab routing:

- `generate`
- `chat`
- `explore`
- `library`
- `reports-library`
- `career`
- `flashcards`
- `quizzes`
- `premium-courses`
- `profile`

The sidebar also exposes:

- usage summary
- current plan state
- upgrade shortcut
- account/logout controls

### Generate experience

The `Generate` tab is the main creation hub. Users can choose:

- Course
- Flashcards
- Practice Quiz
- Report

Important UI behavior:

- Free users are restricted by plan limits
- Intermediate and advanced difficulty are gated behind paid plans
- Reports are Pro-only
- Popular topics are fetched from `/api/popular-topics`

### Learn experience

The learning view includes:

- left lesson/module sidebar
- lesson content panel
- notes panel
- AI tutor chat panel
- per-lesson completion tracking
- module locking for free users after module 3
- PDF export for paid users
- support for shared course access via `shareId`

Lesson content rendering supports:

- prose
- code blocks
- chart blocks
- table blocks
- KaTeX for formulas

### Library

The library supports:

- course and flashcard listing
- pagination and search
- pinning up to 3 items
- progress display
- PDF course download for paid users
- course sharing via generated share links
- shared course enrollment

### Premium courses

The premium area shows:

- seeded premium courses for fallback
- trending premium courses for Pro users
- AI-personalized premium recommendations
- featured premium course
- plan upsell for free users

### Career Growth

The career suite includes:

- Resume Builder
- Interview Preparation
- Skill Gap Analysis
- Network AI
- trending careers and skills overview

This area is mostly premium-gated.

### Profile

The profile area includes:

- overview
- usage analytics
- password change
- settings/preferences
- billing history
- receipt download

## 6. Authentication and Session Flow

### Auth model

The app uses JWT access tokens and refresh tokens stored in cookies:

- `token` for access
- `refreshToken` for refresh
- `csrfToken` for CSRF protection
- `emailVerified` and `onboardingCompleted` as helper cookies

### Signup flow

`POST /api/signup`

- validates names, email, password, terms acceptance
- hashes password
- creates a pending user
- generates both email verification token and 6-digit code
- sends verification email

### Email verification flow

`POST /api/verify-email`

- accepts verification token or code
- marks account active
- marks email verified
- issues auth cookies immediately

### Login flow

`POST /api/login`

- validates email/password
- blocks unverified users
- supports remember-me behavior
- stores refresh token records in MongoDB
- sets JWT cookies and CSRF cookie

### Google login flow

`POST /api/login/google`

- verifies Google token or access token
- creates or updates user record
- auto-verifies Google users
- issues the same session cookies as email login

### Session refresh

`POST /api/refresh`

- validates refresh token
- checks stored refresh token record
- rotates refresh token
- revokes old token
- sets new access and refresh cookies
- rotates CSRF token

### Logout

`POST /api/logout`

- clears cookies
- attempts to invalidate refresh state
- redirects client back to the public flow through client logout handling

### Password reset

Relevant endpoints:

- `POST /api/forgot-password`
- `POST /api/reset-password`
- `POST /api/validate-reset-token`
- `POST /api/verify-reset-code`

The app supports a code-based reset flow and also contains token-based reset handling.

### Route protection

`middleware.js` protects non-public pages. Public routes include:

- home
- auth pages
- about/contact/pricing/privacy/terms
- blog

Protected pages require a valid cookie token or bearer token.

## 7. Authorization, Plans, and Limits

### Supported tiers

- Free
- Pro
- Enterprise

### Central plan behavior

Defined in `src/app/lib/planLimits.js`.

Current effective limits:

#### Free

- course generations: 2
- quizzes: 1 or 2 depending on route usage mapping
- flashcards: 8
- report generations: 0
- AI tutor responses: 3/day style limit key
- career features: limited
- readable modules per course: 3
- difficulty access: beginner only

#### Pro

- courses: 15
- quizzes: 20
- flashcards: 40
- reports: 20
- career actions: 15
- readable modules: full course
- difficulty access: beginner/intermediate/advanced

#### Enterprise

- unlimited generation quotas for major features

### Limit enforcement

Limit enforcement is handled by:

- `checkAPILimit`
- `trackAPIUsage`
- `withAPIRateLimit`
- `checkCourseAccess`
- `getTrackedUsageSummary`

Usage is stored in the `api_usage` collection by month.

## 8. Core Feature Documentation

### 8.1 Course generation

Primary endpoint: `POST /api/generate-course`

Behavior:

- requires auth and CSRF
- validates topic, format, and difficulty
- enforces monthly limits
- canonicalizes topic with OpenAI to detect duplicates
- reuses an existing course if already generated
- upgrades existing free course structures for premium users
- creates a 20-module, 100-lesson course structure
- stores result in `library`

Notes:

- course outlines are generated first
- individual lesson content is loaded later from the learn flow
- free users can only read the first 3 modules

### 8.2 Flashcards

Primary endpoint: `POST /api/generate-flashcards`

Behavior:

- generates a card set with SRS metadata
- stores cards in `cardSets`
- supports appending cards to an existing set
- avoids duplicate card-set creation for same topic/difficulty

### 8.3 Quizzes

Primary generation path: `POST /api/generate-course` with `format=quiz`

Behavior:

- generates multiple-choice questions with 4 options each
- stores quizzes in `tests`
- reuses existing topic/difficulty quiz when present

### 8.4 Reports and essays

Relevant endpoints:

- `POST /api/generate-report-outline`
- `POST /api/generate-report-section`
- `GET/POST /api/reports`
- `GET/PUT/DELETE /api/reports/[id]`
- `POST /api/reports/[id]/validate`

Behavior:

- outline generation creates section metadata first
- section generation produces paragraph arrays plus references
- report editor flow stores section content and aggregate document state
- reports are a paid feature

### 8.5 AI tutor chat

Primary endpoint: `POST /api/chat`

Behavior:

- requires auth and CSRF
- topic-scoped tutoring only
- conversation history limited to recent messages
- response length constrained
- usage tracked against plan

### 8.6 Library and sharing

Relevant endpoints:

- `GET/POST /api/library`
- `GET/POST /api/library/share`

Supported actions include:

- list items
- fetch single item
- pin
- bookmark
- delete
- save conversation
- restore conversation
- add personalized course to library
- enable/disable course sharing
- enroll through share link

Share model:

- each course can have one or more `shareConfigs`
- share links can be disabled
- inherited access depth depends on sharer tier

### 8.7 Premium discovery

Relevant endpoints:

- `GET /api/premium-courses`
- `POST /api/premium-courses/personalized`
- `GET /api/premium-courses/trending`

Behavior:

- returns either seeded, trending, or personalized premium suggestions
- uses onboarding interests and goals
- caches/generated personalized discovery results

### 8.8 Career tools

Relevant endpoint groups:

- `/api/career/resume/*`
- `/api/career/cover-letter/generate`
- `/api/career/interview/*`
- `/api/career/skill-gap`
- `/api/career/network`
- `/api/career/portfolio/*`
- `/api/career/trending`
- `/api/career/history`
- `/api/career/ai/edit`

Capabilities include:

- resume generation and refinement
- resume-job matching
- cover-letter generation
- interview question generation and feedback
- networking message support
- portfolio generation/refinement
- skill-gap analysis
- trending career insights

## 9. API Catalog

Below is the functional API grouping used in the codebase.

### Authentication and user session

- `/api/signup`
- `/api/login`
- `/api/login/google`
- `/api/logout`
- `/api/me`
- `/api/refresh`
- `/api/session/start`
- `/api/session/end`
- `/api/verify-email`
- `/api/resend-verification`
- `/api/forgot-password`
- `/api/reset-password`
- `/api/validate-reset-token`
- `/api/verify-reset-code`
- `/api/change-password`

### Profile and settings

- `/api/profile`
- `/api/profile/update`
- `/api/settings/update`
- `/api/user/usage`

### Learning generation

- `/api/generate-course`
- `/api/generate-flashcards`
- `/api/generate-report-outline`
- `/api/generate-report-section`
- `/api/generate-doc`
- `/api/latex-converter`
- `/api/rewrite-content`
- `/api/course-agent`

### Course, library, progress, and study tools

- `/api/courses`
- `/api/courses/[id]`
- `/api/courses/delete`
- `/api/course-progress`
- `/api/library`
- `/api/library/share`
- `/api/flashcards`
- `/api/flashcards/[id]`
- `/api/quizzes`
- `/api/quizzes/[id]`
- `/api/quizzes/[id]/performance`
- `/api/srs/due`
- `/api/srs/review`
- `/api/notes`

### Discovery and recommendations

- `/api/explore`
- `/api/explore/category-courses`
- `/api/explore/persisted-courses`
- `/api/explore/trending-topics`
- `/api/popular-topics`
- `/api/premium-courses`
- `/api/premium-courses/favorites`
- `/api/premium-courses/personalized`
- `/api/premium-courses/trending`

### Reports

- `/api/reports`
- `/api/reports/[id]`
- `/api/reports/[id]/validate`

### Blog and content marketing

- `/api/blog`
- `/api/blog/[slug]`
- `/api/blog/[slug]/bookmark`
- `/api/blog/generate`
- `/api/posts`
- `/api/posts/[id]`
- `/api/newsletter`
- `/api/contact`

### Billing

- `/api/plans`
- `/api/billing/create-session`
- `/api/billing/verify-payment`
- `/api/billing/webhook`

### Miscellaneous

- `/api/visitor-counter`
- `/api/send-welcome-email`

### Cron endpoints

- `/api/cron/plan-expiry`
- `/api/cron/trending-topics`
- `/api/cron/trending-career`
- `/api/cron/trending-premium`
- `/api/cron/generate-weekly-blogs`

## 10. Data Model Summary

### User

The `User` model is the central record. It stores:

- name, email, password
- role and status
- email verification fields
- password reset fields
- refresh token history
- profile/preferences/settings
- onboarding answers
- learning progress
- subscription state
- billing history
- generated premium course references

### Other important collections/models

- `Course`
- `Chat`
- `CareerHistory`
- `Session`
- `Post`
- `Quiz`
- `VisitorCounter`
- `Newsletter`
- `Contact`
- `PersonalizedDiscovery`
- `TrendingCareer`

Also used through raw collections:

- `library`
- `cardSets`
- `tests`
- `reports`
- `plans`
- `api_usage`
- `refreshTokens`
- `premium_courses`
- `premium_trending_courses`
- `user_library`

## 11. Billing and Subscription Flow

### Provider

Paystack is used for checkout and webhook verification.

### Entry points

- pricing page fetches plans from `/api/plans`
- checkout session is initialized by `/api/billing/create-session`
- callback verification happens at `/api/billing/verify-payment`
- webhook confirmation happens at `/api/billing/webhook`

### Payment methods

- Card in USD
- Mobile money / M-Pesa style flow in KES

### Subscription updates

Successful payment updates:

- `isPremium`
- `subscription.plan`
- `subscription.tier`
- `subscription.status`
- billing history
- renewal/payment metadata

## 12. Email System

Transactional email templates exist for:

- email verification
- welcome email
- password reset code
- password reset link
- password changed notification
- contact form forwarding
- upgrade confirmation

SMTP is configured through environment variables and implemented in `src/app/lib/email.js`.

## 13. Background Jobs and Cron

### Local/manual runner

`npm run cron`

This runs `scripts/run-crons.js`, which calls protected cron endpoints using `CRON_SECRET`.

### Cron job responsibilities

- plan expiry validation and downgrade
- trending topics refresh
- trending career refresh
- trending premium course refresh
- weekly blog generation

### Cron security

Cron endpoints require a matching `Authorization: Bearer <CRON_SECRET>` or `x-cron-secret`.

## 14. Environment Variables

The following variables are referenced in the codebase:

### Required for core app

- `MONGODB_URI`
- `JWT_SECRET`
- `OPENAI_API_KEY`

### Auth/session config

- `JWT_EXPIRES_IN`
- `JWT_REFRESH_EXPIRES_IN`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`

### URLs/origin

- `APP_URL`
- `NEXT_PUBLIC_APP_URL`
- `CORS_ORIGIN`
- `NEXTAUTH_URL`

### Billing

- `PAYSTACK_SECRET_KEY`

### Email

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

### Cron

- `CRON_SECRET`
- `ENABLE_INTERNAL_CRON`

### Runtime/platform

- `NODE_ENV`
- `PORT`
- `NEXT_RUNTIME`

## 15. Local Development Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` with the required secrets.

3. Run the app:

```bash
npm run dev
```

4. Optional: run cron jobs manually:

```bash
npm run cron
```

## 16. Operational Notes

- MongoDB access is mixed between Mongoose models and direct collection calls.
- Some routes rely on cookies, some also accept bearer tokens.
- CSRF protection is present for mutating authenticated endpoints that use `withCsrf`.
- The app uses monthly usage counters stored in `api_usage`.
- Public share links can expose limited or full course access depending on the sharer’s plan.

## 17. Known Codebase Characteristics

These are worth knowing before extending the project:

- Branding is inconsistent between `Actinova` and `Actirova`.
- Some route comments/paths still reflect older names.
- The project contains a large API surface, but the main production-critical flows are auth, generation, library, billing, and plan enforcement.
- Several features depend directly on OpenAI responses, so response-format validation matters when modifying prompts.

## 18. Recommended Documentation Follow-Ups

If you want this documentation to become production-grade for external teams, the next useful additions are:

- endpoint-by-endpoint request/response schemas
- collection schema diagrams
- sequence diagrams for signup, refresh-token rotation, and billing
- deployment instructions for Vercel and MongoDB Atlas
- test strategy and QA checklist

