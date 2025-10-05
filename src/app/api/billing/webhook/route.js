import { NextResponse } from "next/server"
import { headers } from "next/headers"
import Stripe from "stripe"
import connectToMongoose from "@/lib/mongoose"
import User from "@/models/User"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request) {
  await connectToMongoose()

  try {
    const body = await request.text()
    const sig = headers().get("stripe-signature")

    let event

    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
    } catch (err) {
      console.error("Webhook signature verification failed:", err.message)
      return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 })
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object

        // Update user subscription
        const userId = session.client_reference_id
        const plan = session.metadata?.plan || "premium"

        await User.findByIdAndUpdate(userId, {
          'subscription.plan': plan,
          'subscription.status': 'active',
          'subscription.stripeCustomerId': session.customer,
          'subscription.stripeSubscriptionId': session.subscription,
          'subscription.startedAt': new Date(),
          'billingHistory': [{
            type: 'subscription',
            description: `${plan} plan subscription`,
            amount: session.amount_total / 100, // Convert from cents
            date: new Date(),
            stripeInvoiceId: session.invoice,
          }]
        })

        console.log(`User ${userId} upgraded to ${plan} plan`)
        break

      case "invoice.payment_succeeded":
        // Handle successful payment for recurring subscription
        const invoice = event.data.object
        const customerId = invoice.customer

        // Find user by Stripe customer ID
        const user = await User.findOne({ 'subscription.stripeCustomerId': customerId })
        if (user) {
          // Add to billing history
          await User.findByIdAndUpdate(user._id, {
            $push: {
              'billingHistory': {
                type: 'recurring',
                description: 'Monthly subscription payment',
                amount: invoice.amount_paid / 100,
                date: new Date(),
                stripeInvoiceId: invoice.id,
              }
            }
          })
        }
        break

      case "customer.subscription.deleted":
        // Handle subscription cancellation
        const canceledSubscription = event.data.object
        const canceledCustomerId = canceledSubscription.customer

        const canceledUser = await User.findOne({ 'subscription.stripeCustomerId': canceledCustomerId })
        if (canceledUser) {
          await User.findByIdAndUpdate(canceledUser._id, {
            'subscription.status': 'canceled',
            'subscription.canceledAt': new Date(),
          })
        }
        break

      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 })
  }
}