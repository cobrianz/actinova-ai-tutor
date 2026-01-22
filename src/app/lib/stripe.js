import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
});

export const PLANS = {
  premium: {
    priceId: null,
    name: 'Premium',
    price: 9.99,
    features: [
      'Unlimited AI courses',
      'Unlimited quizzes & flashcards',
      'Priority support',
      'Advanced analytics',
      'Certificate generation',
    ],
  },
  enterprise: {
    priceId: null,
    name: 'Enterprise',
    price: 29.99,
    features: [
      'Everything in Premium',
      'Team collaboration',
      'Custom branding',
      'API access',
      'Dedicated support',
    ],
  },
};
