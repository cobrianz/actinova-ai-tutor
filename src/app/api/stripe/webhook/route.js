import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  const { db } = await connectToDatabase();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        
        if (session.payment_status === 'paid' && session.metadata?.userId) {
          const userId = session.metadata.userId;
          const planId = session.metadata.planId || 'premium';

          const now = new Date();
          const expiresAt = new Date(now);
          expiresAt.setMonth(expiresAt.getMonth() + 1);

          await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            {
              $set: {
                isPremium: true,
                'subscription.plan': planId,
                'subscription.tier': planId === 'enterprise' ? 'enterprise' : 'pro',
                'subscription.status': 'active',
                'subscription.stripeCustomerId': session.customer,
                'subscription.stripeSubscriptionId': session.subscription,
                'subscription.stripeSessionId': session.id,
                'subscription.startedAt': now,
                'subscription.startDate': now,
                'subscription.expiresAt': expiresAt,
                'subscription.expiryDate': expiresAt,
                'subscription.autoRenew': true,
              },
              $push: {
                billingHistory: {
                  type: 'subscription',
                  description: `${planId === 'enterprise' ? 'Enterprise' : 'Premium'} subscription activation`,
                  amount: session.amount_total / 100,
                  currency: session.currency?.toUpperCase() || 'USD',
                  date: now,
                  reference: session.id,
                  transactionId: session.payment_intent,
                  status: 'success',
                  plan: planId,
                },
              },
            }
          );

          console.log(`[Webhook] User ${userId} upgraded to ${planId}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        const user = await db.collection('users').findOne({
          'subscription.stripeCustomerId': customerId,
        });

        if (user) {
          const status = subscription.status === 'active' ? 'active' : 
                         subscription.status === 'past_due' ? 'expired' : 
                         subscription.status;

          await db.collection('users').updateOne(
            { _id: user._id },
            {
              $set: {
                isPremium: subscription.status === 'active',
                'subscription.status': status,
                'subscription.expiresAt': new Date(subscription.current_period_end * 1000),
                'subscription.expiryDate': new Date(subscription.current_period_end * 1000),
                'subscription.autoRenew': !subscription.cancel_at_period_end,
              },
            }
          );

          console.log(`[Webhook] Subscription updated for customer ${customerId}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        await db.collection('users').updateOne(
          { 'subscription.stripeCustomerId': customerId },
          {
            $set: {
              isPremium: false,
              'subscription.status': 'canceled',
              'subscription.plan': 'free',
              'subscription.tier': 'free',
              'subscription.canceledAt': new Date(),
              'subscription.autoRenew': false,
            },
          }
        );

        console.log(`[Webhook] Subscription canceled for customer ${customerId}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const customerId = invoice.customer;

        await db.collection('users').updateOne(
          { 'subscription.stripeCustomerId': customerId },
          {
            $set: {
              'subscription.status': 'expired',
            },
            $push: {
              billingHistory: {
                type: 'subscription',
                description: 'Payment failed',
                amount: invoice.amount_due / 100,
                currency: invoice.currency?.toUpperCase() || 'USD',
                date: new Date(),
                reference: invoice.id,
                status: 'failed',
              },
            },
          }
        );

        console.log(`[Webhook] Payment failed for customer ${customerId}`);
        break;
      }

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Webhook] Error processing event:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
