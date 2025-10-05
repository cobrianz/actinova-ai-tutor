import { NextResponse } from "next/server"
import { withAuth, withErrorHandling } from "@/lib/middleware"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

async function createCheckoutSessionHandler(request) {
  const user = request.user
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  }

  try {
    const { plan } = await request.json()

    if (!plan) {
      return NextResponse.json({ error: "Plan is required" }, { status: 400 })
    }

    // Determine origin for success/cancel URLs
    const headers = request.headers
    const origin = headers.get('origin') || process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Define plan prices
    // In production use pre-created price IDs; here we will use price_data for flexibility
    const planPrices = {
      pro: { amount: 1200, name: "Pro Plan", mode: "subscription", interval: "month" },
      team: { amount: 2900, name: "Team Plan", mode: "subscription", interval: "month" },
      premium: { amount: 999, name: "Premium Plan", mode: "subscription", interval: "month" },
      "editors-choice": { amount: 4900, name: "Editor’s Choice Premium Course", mode: "payment" }, // one-time
    }

    if (!planPrices[plan]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    const cfg = planPrices[plan]

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: cfg.name,
              description: cfg.mode === "payment" ? "One-time premium course purchase" : `Monthly subscription for ${cfg.name.toLowerCase()}`,
            },
            unit_amount: cfg.amount,
            ...(cfg.mode === "subscription" ? { recurring: { interval: cfg.interval || "month" } } : {}),
          },
          quantity: 1,
        },
      ],
      mode: cfg.mode,
      success_url: `${origin}/settings?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/settings?canceled=true`,
      client_reference_id: user._id.toString(),
      metadata: {
        userId: user._id.toString(),
        plan,
      },
    })

    return NextResponse.json({ sessionUrl: session.url })
  } catch (error) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}

const authenticatedHandler = withAuth(createCheckoutSessionHandler)
const errorHandledHandler = withErrorHandling(authenticatedHandler)

export const POST = errorHandledHandler