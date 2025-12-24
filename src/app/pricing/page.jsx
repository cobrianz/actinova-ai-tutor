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
  const [plans, setPlans] = useState([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
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

    const fetchPlans = async () => {
      try {
        const res = await fetch("/api/plans");
        if (res.ok) {
          const data = await res.json();
          setPlans(data.plans || []);
        }
      } catch (error) {
        console.error("Failed to fetch plans:", error);
        toast.error("Failed to load plans");
      } finally {
        setIsLoadingPlans(false);
      }
    };

    fetchUser();
    fetchPlans();
  }, []);

  // Determine current user plan ID
  const getUserPlanId = () => {
    if (!user) return null;
    if (user?.subscription?.plan === 'enterprise' && user?.subscription?.status === 'active') return 'enterprise';
    if (((user?.subscription?.plan === 'pro' || user?.subscription?.plan === 'premium') && user?.subscription?.status === 'active') || user?.isPremium) return 'premium';
    return 'basic';
  };

  const currentPlanId = getUserPlanId();
  const isPro = currentPlanId === 'premium' || currentPlanId === 'enterprise';

  const handlePayment = async (planName, amount) => {
    if (!planName) {
      console.error("Plan ID is missing");
      return;
    }

    if (currentPlanId === 'enterprise') {
      toast.success("You are already on the Enterprise plan!");
      return;
    }

    if (currentPlanId === 'premium' && planName === 'premium') {
      toast.success("You are already on the Premium plan!");
      return;
    }

    if (amount === 0) {
      if (!user) {
        router.push("/auth/signup");
      } else {
        toast.success("You are already on the Basic plan.");
      }
      return;
    }

    if (!user) {
      toast.error("Please login to subscribe");
      router.push("/auth/login");
      return;
    }

    setLoading(prev => ({ ...prev, [planName]: true }));

    try {
      const response = await fetch("/api/billing/create-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          plan: planName === 'premium' ? 'pro' : planName,
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
      setLoading(prev => ({ ...prev, [planName]: false }));
    }
  };

  const getPlanIcon = (planId) => {
    switch (planId) {
      case 'basic': return Sparkles;
      case 'premium': return Zap;
      case 'enterprise': return Crown;
      default: return Sparkles;
    }
  };

  const getCtaText = (plan, isLoading) => {
    if (isLoading) return "Processing...";
    if (plan.id === currentPlanId) return "Current Plan";
    if (plan.price === 0) return user ? "Current Plan" : "Get Started";
    return `Subscribe to ${plan.name}`;
  };

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

  if (isLoadingPlans) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900">
        <HeroNavbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
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
                Welcome back, <strong>{user?.name || 'Member'}! </strong>
                Manage your subscription below.
              </>
            ) : (
              "Start free and upgrade as you grow."
            )}
          </p>

          {isPro && (
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold mb-8">
              <Crown className="w-4 h-4 mr-2" />
              <span>You're on the {currentPlanId === 'enterprise' ? 'Enterprise' : 'Premium'} Plan</span>
            </div>
          )}

          <div className="mb-8">
            <span className="text-gray-600 dark:text-gray-400">
              Simple, transparent monthly pricing. Cancel anytime.
            </span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => {
            const Icon = getPlanIcon(plan.id);
            const isCurrentPlan = plan.id === currentPlanId;
            const isPopular = plan.popular;

            return (
              <div
                key={plan.id}
                className={`relative bg-blue-50/70 dark:bg-blue-900/20 backdrop-blur-sm rounded-2xl border-2 transition-all duration-300 ${isPopular
                  ? "border-blue-500 scale-105 ring-2 ring-blue-500/20 z-10"
                  : isCurrentPlan
                    ? "border-green-500 ring-2 ring-green-500/20"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
              >
                {isCurrentPlan && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-full text-center">
                    <span className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                      Current Plan
                    </span>
                  </div>
                )}

                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-full text-center">
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium shadow-sm">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-8">
                  <div className="flex items-center space-x-3 mb-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${isPopular
                        ? "bg-gradient-to-r from-green-500 to-blue-600"
                        : "bg-gray-100 dark:bg-gray-700"
                        }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${isPopular
                          ? "text-white"
                          : "text-gray-600 dark:text-gray-400"
                          }`}
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {plan.name}
                      </h3>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">
                        ${plan.price}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400 ml-1">
                        /month
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-3 mb-8 min-h-[200px]">
                    {plan.features?.slice(0, 10).map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className="flex items-start space-x-3"
                      >
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600 dark:text-gray-300 text-sm">
                          {feature}
                        </span>
                      </li>
                    ))}
                    {plan.features?.length > 10 && (
                      <li className="text-xs text-gray-500 italic">
                        + {plan.features.length - 10} more features
                      </li>
                    )}
                  </ul>

                  <button
                    onClick={() =>
                      handlePayment(plan.id, plan.price)
                    }
                    disabled={
                      loading[plan.id] || isCurrentPlan
                    }
                    className={`w-full py-3 px-4 rounded-lg font-semibold transition-all group ${isCurrentPlan
                      ? "bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg cursor-default opacity-80"
                      : isPopular
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                  >
                    {getCtaText(plan, loading[plan.id])}
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