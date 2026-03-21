"use client";

import { useState, useEffect } from "react";
import { Check, Sparkles, Crown, Zap, Lock, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import HeroNavbar from "../components/heroNavbar";
import { toast } from "sonner";
import { apiClient } from "@/lib/csrfClient";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import { CreditCard, Smartphone } from "lucide-react";

export default function PricingPage() {
  const [user, setUser] = useState(null);
  const [processingPlanId, setProcessingPlanId] = useState(null); // Changed from loading object to single ID
  const [plans, setPlans] = useState([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [selectedPlanForModal, setSelectedPlanForModal] = useState(null);
  const nextBillDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await apiClient.get("/api/me");
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
        const res = await apiClient.get("/api/plans");
        if (res.ok) {
          const data = await res.json();
          // Ensure every plan has a unique ID
          const robustPlans = (data.plans || []).map((p, index) => ({
            ...p,
            id: p.id || p.name.toLowerCase().split(' ')[0] || `plan-${index}`
          }));
          console.log("[Pricing] Loaded plans:", robustPlans);
          setPlans(robustPlans);
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

  const userPlanId = user?.subscription?.status === 'active'
    ? (user?.subscription?.plan === 'pro' ? 'premium' : user?.subscription?.plan)
    : (user?.isPremium ? 'premium' : 'basic');

  const PLAN_LEVELS = {
    'basic': 0,
    'premium': 1,
    'pro': 1,
    'enterprise': 2
  };

  const initiatePaymentSelection = (plan) => {
    if (!plan.id) {
      console.error("Plan ID missing");
      return;
    }

    const targetPlanId = plan.id;
    const targetLevel = PLAN_LEVELS[targetPlanId] || 0;
    const currentLevel = PLAN_LEVELS[userPlanId] || 0;

    if (targetLevel === currentLevel && userPlanId !== 'basic') {
      toast.info(`You are already on the ${plan.name} plan!`);
      return;
    }

    if (targetLevel < currentLevel) {
      toast.warning("You already have a higher-tier subscription active.");
      return;
    }

    if (plan.price === 0) {
      if (!user) {
        router.push("/auth/signup");
      } else {
        toast.success("You are already on the Basic plan.");
      }
      return;
    }

    if (!user) {
      toast.error("Please login to subscribe");
      router.push("/auth/login?redirect=/checkout");
      return;
    }

    router.push(`/checkout?plan=${plan.id}`);
  };

  // Step 2: User selects method -> API call
  const executePayment = async (method) => {
    const plan = selectedPlanForModal;
    if (!plan) return;

    // Reset processing state first (good practice)
    setSelectedPlanForModal(null);
    setProcessingPlanId(plan.id);

    try {
      const response = await apiClient.post("/api/billing/create-session", {
        plan: plan.id === 'premium' ? 'pro' : plan.id,
        paymentMethod: method, // 'card' or 'mobile_money'
      });

      const data = await response.json();

      if (response.ok && data.sessionUrl) {
        window.location.href = data.sessionUrl;
      } else {
        toast.error(data.error || "Failed to initialize payment");
        setProcessingPlanId(null);
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Failed to initialize payment");
      setProcessingPlanId(null);
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
      <div className="min-h-screen bg-background">
        <HeroNavbar />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent relative overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0 fixed">
        <img 
          src="/hero.png" 
          alt="Pricing Background" 
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-white/10" />
      </div>

      <div className="relative z-10">
        <HeroNavbar />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Choose Your Learning Plan
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
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
            <span className="text-muted-foreground">
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
                className={`relative backdrop-blur-xl rounded-[32px] border-2 border-white transition-all duration-300 ${isPopular
                  ? "bg-[#D2D7F8]/80 scale-105 shadow-sm z-10"
                  : isCurrentPlan
                    ? "bg-green-100/80 shadow-sm"
                    : "bg-green-50/40 hover:bg-green-50/60"
                  }`}
              >
                {isCurrentPlan && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-full text-center">
                    <span className="bg-white border border-white text-green-600 px-4 py-1.5 rounded-full text-[13px] font-bold shadow-sm">
                      Current Plan
                    </span>
                  </div>
                )}

                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-full text-center">
                    <span className="bg-[#1a1a1a] border border-[#1a1a1a] text-white px-4 py-1.5 rounded-full text-[13px] font-bold shadow-sm">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-8">
                  <div className="flex items-center space-x-3 mb-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 border-white ${isPopular
                        ? "bg-white"
                        : "bg-white/60"
                        }`}
                    >
                      <Icon
                        className={`w-6 h-6 ${isPopular
                          ? "text-[#1a1a1a]"
                          : "text-green-600"
                          }`}
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-[#1a1a1a]">
                        {plan.name}
                      </h3>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-foreground">
                        ${plan.price}
                      </span>
                      <span className="text-muted-foreground ml-1">
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
                        <span className="text-muted-foreground text-sm">
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
                    onClick={() => initiatePaymentSelection(plan)}
                    disabled={
                      processingPlanId === plan.id || isCurrentPlan
                    }
                    className={`w-full py-4 px-4 rounded-full font-bold transition-all group border-2 border-white ${isCurrentPlan
                      ? "bg-white/40 text-[#1a1a1a]/50 cursor-default"
                      : isPopular
                        ? "bg-green-300 text-green-900 hover:bg-green-400 shadow-sm"
                        : "bg-white/60 text-[#1a1a1a] hover:bg-white"
                      }`}
                  >
                    {getCtaText(plan, processingPlanId === plan.id)}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        </div>

      <Dialog open={!!selectedPlanForModal} onOpenChange={() => setSelectedPlanForModal(null)}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-card border border-border shadow-2xl rounded-2xl">
          <div className="grid grid-cols-1 md:grid-cols-5 h-full">
            {/* Left: Order Summary */}
            <div className="md:col-span-2 bg-secondary/30 p-6 flex flex-col justify-between border-r border-border">
              <div>
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4">
                  Order Summary
                </h3>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-foreground mb-1">
                    {selectedPlanForModal?.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Next bill: {nextBillDate}
                  </p>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline mb-2">
                    <span className="text-3xl font-bold text-foreground">
                      ${selectedPlanForModal?.price}
                    </span>
                    <span className="text-muted-foreground ml-1">/mo</span>
                  </div>
                  <div className="space-y-2 mb-6 pt-4 border-t border-border">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="text-foreground">${selectedPlanForModal?.originalPrice || selectedPlanForModal?.price}</span>
                    </div>
                    {selectedPlanForModal?.originalPrice > selectedPlanForModal?.price && (
                      <div className="flex items-center justify-between text-sm text-green-600 font-medium">
                        <span>Discount</span>
                        <span>-${(selectedPlanForModal.originalPrice - selectedPlanForModal.price).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-border mt-auto">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-base font-semibold text-foreground">Total due today</span>
                    <span className="text-2xl font-bold text-foreground">${selectedPlanForModal?.price?.toFixed(2)}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground text-right italic">
                    Includes all taxes and fees
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Payment Selection */}
            <div className="md:col-span-3 p-6 bg-card flex flex-col">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <DialogTitle className="text-xl font-bold text-foreground">Check out</DialogTitle>
                  <div className="flex items-center text-xs text-green-600 bg-green-500/10 px-2 py-1 rounded-full">
                    <Lock className="w-3 h-3 mr-1" /> Secure
                  </div>
                </div>
                <DialogDescription className="text-sm text-muted-foreground">
                  Choose a payment method to activate your plan.
                </DialogDescription>
              </div>

              <div className="space-y-3 mb-8">
                <button
                  onClick={() => executePayment('card')}
                  className="w-full group relative flex items-center p-4 border-2 border-border rounded-xl hover:border-primary hover:bg-primary/5 transition-all duration-200 text-left"
                >
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 group-hover:scale-110 transition-transform">
                    <CreditCard className="w-6 h-6" />
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">Pay with Card</span>
                      <span className="text-xs font-mono bg-secondary px-2 py-1 rounded text-muted-foreground">USD</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Visa, Mastercard, Amex</p>
                  </div>
                  <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-primary">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </button>

                <button
                  onClick={() => executePayment('mobile_money')}
                  className="w-full group relative flex items-center p-4 border-2 border-border rounded-xl hover:border-green-500 hover:bg-green-500/5 transition-all duration-200 text-left"
                >
                  <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-foreground">Pay with M-Pesa</span>
                      <span className="text-xs font-mono bg-secondary px-2 py-1 rounded text-muted-foreground">KES</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Mobile Money automated</p>
                  </div>
                  <div className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-green-500">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </button>
              </div>

              {/* Trust Footer */}
              <div className="mt-auto pt-6 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  <span>Encrypted & Secure</span>
                </div>
                <div className="flex items-center gap-1 opacity-70">
                  <span>Powered by</span>
                  <span className="font-bold text-foreground">Paystack</span>
                </div>
              </div>

            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}