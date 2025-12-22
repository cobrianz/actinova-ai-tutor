"use client";

import { useState, useEffect } from "react";
import { Check, Sparkles, Crown, Zap } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import HeroNavbar from "../components/heroNavbar";
import { toast } from "sonner";

export default function PricingPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState({});
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/me", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          console.error("Failed to fetch user:", response.status);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchUser();
  }, []);

  // FIXED & ROBUST PRO DETECTION
  const isPro = !!(
    user &&
    // Main subscription check
    ((user.subscription?.plan?.toLowerCase() === "pro" &&
      (user.subscription?.status?.toLowerCase() === "active" ||
        !user.subscription.status)) || // Handle missing status
      // Legacy fields
      user.isPremium === true ||
      user.plan?.toLowerCase() === "pro" ||
      // Any active subscription
      (user.subscription?.status?.toLowerCase() === "active" &&
        user.subscription.plan))
  );

  // Debug logging
  useEffect(() => {
    if (user) {
      console.log("PRO STATUS DEBUG:", {
        userId: user._id,
        subscription: user.subscription,
        plan: user.subscription?.plan,
        status: user.subscription?.status,
        expiresAt: user.subscription?.expiresAt,
        isPremium: user.isPremium,
        userPlan: user.plan,
        computedIsPro: isPro,
        rawIsPro: !!user?.subscription?.plan,
      });
    }
  }, [user, isPro]);

  const plans = [
    {
      name: "Free",
      description: "Perfect for getting started",
      price: 0,
      icon: Sparkles,
      features: [
        "5 AI-generated learning paths per month",
        "3 modules per course (6 total lessons)",
        "Access to basic courses",
        "Community support",
        "Progress tracking",
        "Mobile app access",
      ],
      cta: isPro ? "Current Plan" : "Get Started",
      popular: false,
    },
    {
      name: "Pro",
      description: "For serious learners",
      price: 35,
      icon: Zap,
      features: [
        "15 AI-generated learning paths per month",
        "12 modules per course (48 total lessons)",
        "Access to all courses",
        "Priority email & chat support",
        "Advanced progress analytics",
        "Offline course downloads",
        "Professional certificates",
        "1-on-1 mentorship sessions",
        "Custom learning goals",
        "AI tutor chat agent",
      ],
      cta: isPro ? "Current Plan" : "Start Pro Trial",
      popular: true,
    },
  ];

  const faqs = [
    {
      question: "Can I change my plan anytime?",
      answer: "Yes, you can upgrade or downgrade your plan at any time.",
    },
    {
      question: "Is there a free trial for paid plans?",
      answer:
        "Yes, we offer a 14-day free trial for all paid plans. No credit card required to start.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit cards and M-Pesa via Paystack. Bank transfers available for enterprise customers.",
    },
    {
      question: "Do you offer refunds?",
      answer:
        "Yes, we offer a 30-day money-back guarantee for all paid plans if you're not satisfied.",
    },
  ];

  const handlePayment = async (planName, amount) => {
    if (isPro && planName.toLowerCase() === "pro") {
      toast.success("You are already on the Pro plan!");
      return;
    }

    if (amount === 0) {
      router.push("/auth/signup");
      return;
    }

    if (!user) {
      toast.error("Please login to subscribe");
      router.push("/auth/login");
      return;
    }

    setLoading({ ...loading, [planName]: true });

    try {
      const response = await fetch("/api/billing/create-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          plan: planName.toLowerCase(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.sessionUrl) {
        window.location.href = data.sessionUrl;
      } else {
        toast.error(data.error || "Failed to initialize payment");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to initialize payment");
    } finally {
      setLoading({ ...loading, [planName]: false });
    }
  };

  // Debug display (remove after fixing)
  const debugInfo = user ? (
    <div className="fixed top-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h4>DEBUG INFO</h4>
      <p>
        <strong>User ID:</strong> {user._id}
      </p>
      <p>
        <strong>Plan:</strong> {user.subscription?.plan || "None"}
      </p>
      <p>
        <strong>Status:</strong> {user.subscription?.status || "None"}
      </p>
      <p>
        <strong>Expires:</strong> {user.subscription?.expiresAt || "Never"}
      </p>
      <p>
        <strong>isPro:</strong> {isPro ? "YES" : "NO"}
      </p>
      <button
        onClick={() => setUser(null)}
        className="ml-2 text-red-300 hover:text-red-100"
      >
        Clear
      </button>
    </div>
  ) : null;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Debug Info */}
      {debugInfo}

      <HeroNavbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Learning Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            {isPro ? (
              <>
                Welcome back, <strong>Pro Member! </strong>
                Manage your subscription below.
              </>
            ) : (
              "Start free and upgrade as you grow."
            )}
          </p>

          {/* Show current plan badge */}
          {isPro && (
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold mb-8">
              <Crown className="w-4 h-4 mr-2" />
              <span>You're on the Pro Plan</span>
            </div>
          )}

          {/* Billing Description - Removed toggle, just show monthly */}
          <div className="mb-8">
            <span className="text-gray-600 dark:text-gray-400">
              Simple, transparent monthly pricing. Cancel anytime.
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {plans.map((plan, index) => {
            const Icon = plan.icon;

            return (
              <div
                key={index}
                className={`relative bg-blue-50/70 dark:bg-blue-900/20 backdrop-blur-sm rounded-2xl border-2 transition-all duration-300 ${
                  plan.popular && !isPro
                    ? "border-blue-500 scale-105 ring-2 ring-blue-500/20"
                    : isPro && plan.name === "Pro"
                      ? "border-green-500 scale-105 ring-2 ring-green-500/20"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                {isPro && plan.name === "Pro" && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                      Current Plan
                    </span>
                  </div>
                )}

                {plan.popular && !isPro && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-8">
                  <div className="flex items-center space-x-3 mb-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        (isPro && plan.name === "Pro") || plan.popular
                          ? "bg-gradient-to-r from-green-500 to-blue-600"
                          : "bg-gray-100 dark:bg-gray-700"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          (isPro && plan.name === "Pro") || plan.popular
                            ? "text-white"
                            : "text-gray-600 dark:text-gray-400"
                        }`}
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {plan.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {plan.description}
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">
                        ${plan.price}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-gray-600 dark:text-gray-400 ml-1">
                          /month
                        </span>
                      )}
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className="flex items-start space-x-3"
                      >
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600 dark:text-gray-300">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() =>
                      handlePayment(plan.name.toLowerCase(), plan.price)
                    }
                    disabled={
                      loading[plan.name] || (isPro && plan.name === "Pro")
                    }
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-all group ${
                      isPro && plan.name === "Pro"
                        ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg cursor-default"
                        : plan.popular
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {loading[plan.name] ? (
                      <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </span>
                    ) : isPro && plan.name === "Pro" ? (
                      <span className="flex items-center justify-center">
                        <Crown className="w-4 h-4 mr-2" />
                        Current Plan
                      </span>
                    ) : plan.price === 0 ? (
                      "Get Started"
                    ) : (
                      `Subscribe to ${plan.name}`
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {faq.question}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Learning?</h2>
          <p className="text-xl text-blue-100 mb-6">
            Join thousands of learners who are already transforming their
            careers
          </p>
          <Link
            href="/auth/signup"
            className="inline-flex items-center space-x-2 bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all"
          >
            <Sparkles className="w-5 h-5" />
            <span>Start Free Trial</span>
          </Link>
        </div>
      </div>
    </div>
  );
}