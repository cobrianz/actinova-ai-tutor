# Actinova AI Tutor — Deployment & Running Cost Breakdown

> **Stack:** Next.js (Vercel) · MongoDB Atlas · OpenAI GPT-4o-mini · Paystack/Stripe  
> **Last updated:** March 2026

---

## 🏗️ Hosting — Vercel

| Tier | Monthly Cost | Notes |
|------|-------------|-------|
| Hobby (Free) | $0 | No custom domains, 100GB bandwidth, 10s function timeout |
| **Pro** ⭐ *Recommended* | **$20/mo** | Custom domain, 1TB bandwidth, 60s timeout (critical for OpenAI calls) |
| Enterprise | $400+/mo | Only needed at large scale |

> Next.js 16 App Router deploys natively on Vercel with zero config. The **Pro plan is required** once you have real users — the free tier's 10s serverless timeout will cut off long OpenAI streaming calls.

---

## 🗄️ Database — MongoDB Atlas

| Tier | Monthly Cost | Notes |
|------|-------------|-------|
| **M0 Free** | $0 | 512MB storage, shared — fine for dev & early launch |
| **M10** ⭐ *Launch* | **~$57/mo** | 2GB RAM, 10GB storage, dedicated instance |
| M20 *(Growth)* | ~$150/mo | 4GB RAM — best for 1,000+ active users |

> Start on **M0 Free** until ~50 real users. Upgrade to M10 when you see performance pressure.

---

## 🤖 OpenAI API — GPT-4o-mini

**Pricing:**

| | Rate |
|-|------|
| Input tokens | $0.15 / 1M tokens |
| Output tokens | $0.60 / 1M tokens |

**Cost per action:**

| Action | Avg Tokens | Est. Cost |
|--------|-----------|-----------|
| Generate course outline | ~2K in / 3K out | ~$0.002 |
| Generate full course (3 modules) | ~5K in / 10K out | ~$0.007 |
| Generate report outline | ~1K in / 2K out | ~$0.001 |
| Generate 1 report section (1 page) | ~3K in / 4K out | ~$0.003 |
| Full 6-section report | ~15K in / 20K out | ~$0.015 |
| AI chat message | ~2K in / 1K out | ~$0.001 |
| Generate quiz | ~2K in / 3K out | ~$0.002 |

**Monthly projection by user volume:**

| Users | Actions/user/mo | Est. OpenAI Cost |
|-------|-----------------|-----------------|
| 50 free users | ~5 | ~$3/mo |
| 200 users (mix) | ~10 | ~$20/mo |
| 1,000 users (mix) | ~15 | ~$80–150/mo |
| 5,000 users | ~20 | ~$500–800/mo |

> ⚠️ Your **Free tier limits** (1 report/mo, 5 courses/mo, 3 AI chat/day) are critical cost controls — they let users experience value without draining your OpenAI budget.

---

## 💳 Payment Processing

| Provider | Fee | Best For |
|----------|-----|---------|
| **Paystack** ⭐ | 1.5% + ₦100 local / 3.9% intl | Nigerian / African users |
| **Stripe** | 2.9% + $0.30 per transaction | International users |

> On a $10/mo Pro plan: Paystack takes ~$0.45, you net ~$9.55.

---

## 🌐 Domain Name

| Extension | Annual Cost |
|----------|------------|
| `.com` | ~$10–15/yr |
| `.io` | ~$30–50/yr |
| `.ai` | ~$70–100/yr |

---

## 📧 Transactional Email *(Optional but Recommended)*

| Service | Free Tier | Paid |
|---------|-----------|------|
| **Resend** ⭐ | 3,000 emails/mo | $20/mo for 50K |
| SendGrid | 100/day | $19.95/mo for 50K |
| Mailgun | 1,000/mo | $35/mo for 50K |

---

## 📊 Total Monthly Cost Summary

| Scale | Vercel | MongoDB | OpenAI | Email | **Total** |
|-------|--------|---------|--------|-------|-----------|
| **Launch (0–50 users)** | $0 | $0 | ~$3 | $0 | **~$3/mo** |
| **Early Growth (50–200)** | $20 | $0 | ~$20 | $0 | **~$40/mo** |
| **Growing (200–1K)** | $20 | $57 | ~$100 | $20 | **~$200/mo** |
| **Scaling (1K–5K)** | $20 | $150 | ~$600 | $20 | **~$790/mo** |

---

## 💡 Break-Even Analysis

At **$10/mo Pro plan** pricing:

| Users | Monthly Revenue | Monthly Costs | Profit | Margin |
|-------|----------------|--------------|--------|--------|
| 10 Pro subscribers | $100 | ~$40 | $60 | 60% |
| 50 Pro subscribers | $500 | ~$80 | $420 | 84% |
| 200 Pro subscribers | $2,000 | ~$200 | $1,800 | **90%** |
| 1,000 Pro subscribers | $10,000 | ~$790 | $9,210 | **92%** |

The model is highly profitable at scale — OpenAI costs grow linearly while subscriptions give predictable recurring revenue. The tighter the Free tier limits, the better your margins.
