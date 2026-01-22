"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Zap,
  Crown,
  Check,
  ArrowLeft,
  Lock,
  Shield,
  CreditCard,
  Star,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const plans = [
  {
    id: "premium",
    name: "Premium",
    price: 9.99,
    originalPrice: 14.99,
    icon: Zap,
    gradient: "from-violet-600 via-purple-600 to-indigo-600",
    shadowColor: "shadow-purple-500/25",
    popular: true,
    features: [
      "Unlimited AI-generated courses",
      "Unlimited quizzes & flashcards",
      "Advanced learning analytics",
      "Priority customer support",
      "Certificate generation",
      "Offline course downloads",
      "No ads experience",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 29.99,
    originalPrice: 49.99,
    icon: Crown,
    gradient: "from-amber-500 via-orange-500 to-red-500",
    shadowColor: "shadow-orange-500/25",
    popular: false,
    features: [
      "Everything in Premium",
      "Team collaboration tools",
      "Custom branding options",
      "API access for integrations",
      "Dedicated account manager",
      "Advanced reporting & insights",
      "SSO authentication",
      "Custom course templates",
    ],
  },
];

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedPlan, setSelectedPlan] = useState("premium");
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  const canceled = searchParams.get("canceled");
  const planFromQuery = searchParams.get("plan");

  useEffect(() => {
    if (planFromQuery && ["premium", "enterprise"].includes(planFromQuery)) {
      setSelectedPlan(planFromQuery);
    }
  }, [planFromQuery]);

  useEffect(() => {
    if (canceled) {
      toast.error("Payment was canceled. Please try again.");
    }
  }, [canceled]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setIsLoadingUser(false);
      }
    };
    fetchUser();
  }, []);

  const handleCheckout = async () => {
    if (!user) {
      toast.error("Please log in to continue");
      router.push("/auth/login?redirect=/checkout");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/billing/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          plan: selectedPlan,
          billingCycle: "monthly",
          paymentMethod: "card"
        }),
      });

      const data = await res.json();

      if (res.ok && data.sessionUrl) {
        window.location.href = data.sessionUrl;
      } else {
        toast.error(data.error || "Failed to start checkout");
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast.error("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  const currentPlan = plans.find((p) => p.id === selectedPlan);

  if (isLoadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back to Pricing</span>
        </Link>

        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm font-medium mb-6"
          >
            <Sparkles className="w-4 h-4" />
            <span>Special Launch Offer - Save 33%</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Upgrade Your Learning
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg max-w-2xl mx-auto"
          >
            Unlock unlimited AI-powered courses, advanced analytics, and premium features
          </motion.p>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800 p-6"
            >
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400" />
                Select Your Plan
              </h2>

              <div className="space-y-4">
                {plans.map((plan, index) => {
                  const Icon = plan.icon;
                  const isSelected = selectedPlan === plan.id;

                  return (
                    <motion.button
                      key={plan.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`w-full relative p-5 rounded-xl border-2 transition-all duration-300 text-left group ${
                        isSelected
                          ? `bg-gradient-to-r ${plan.gradient} border-transparent ${plan.shadowColor} shadow-lg`
                          : "bg-slate-800/50 border-slate-700 hover:border-slate-600"
                      }`}
                    >
                      {plan.popular && (
                        <span className="absolute -top-3 right-4 px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-400 text-slate-900 text-xs font-bold rounded-full">
                          MOST POPULAR
                        </span>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                              isSelected
                                ? "bg-white/20"
                                : `bg-gradient-to-br ${plan.gradient}`
                            }`}
                          >
                            <Icon
                              className={`w-6 h-6 ${
                                isSelected ? "text-white" : "text-white"
                              }`}
                            />
                          </div>

                          <div>
                            <h3
                              className={`text-lg font-bold ${
                                isSelected ? "text-white" : "text-white"
                              }`}
                            >
                              {plan.name}
                            </h3>
                            <p
                              className={`text-sm ${
                                isSelected ? "text-white/70" : "text-slate-400"
                              }`}
                            >
                              Billed monthly
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="flex items-baseline gap-2">
                            <span
                              className={`text-sm line-through ${
                                isSelected ? "text-white/50" : "text-slate-500"
                              }`}
                            >
                              ${plan.originalPrice}
                            </span>
                            <span
                              className={`text-2xl font-bold ${
                                isSelected ? "text-white" : "text-white"
                              }`}
                            >
                              ${plan.price}
                            </span>
                          </div>
                          <span
                            className={`text-xs ${
                              isSelected ? "text-white/60" : "text-slate-500"
                            }`}
                          >
                            per month
                          </span>
                        </div>
                      </div>

                      <div
                        className={`absolute right-5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? "bg-white border-white"
                            : "border-slate-600 group-hover:border-slate-500"
                        }`}
                      >
                        {isSelected && (
                          <Check className="w-3 h-3 text-purple-600" />
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800 p-6"
            >
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-400" />
                What's Included
              </h2>

              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedPlan}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid sm:grid-cols-2 gap-3"
                >
                  {currentPlan?.features.map((feature, index) => (
                    <motion.div
                      key={feature}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30"
                    >
                      <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <span className="text-slate-300 text-sm">{feature}</span>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>

          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="sticky top-8 bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800 overflow-hidden"
            >
                <div className="p-6 border-b border-slate-800">
                  <h2 className="text-xl font-semibold text-white mb-1">
                    Order Summary
                  </h2>
                  <p className="text-slate-400 text-sm">
                    Secure checkout powered by Paystack
                  </p>
                </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {currentPlan && (
                      <div
                        className={`w-10 h-10 rounded-lg bg-gradient-to-br ${currentPlan.gradient} flex items-center justify-center`}
                      >
                        <currentPlan.icon className="w-5 h-5 text-white" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-white">
                        {currentPlan?.name} Plan
                      </p>
                      <p className="text-sm text-slate-400">Monthly subscription</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-500 line-through">
                      ${currentPlan?.originalPrice}
                    </p>
                    <p className="font-semibold text-white">
                      ${currentPlan?.price}
                    </p>
                  </div>
                </div>

                <div className="h-px bg-slate-800"></div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Subtotal</span>
                  <span className="text-white">${currentPlan?.price}</span>
                </div>

                <div className="flex items-center justify-between text-emerald-400">
                  <span>Launch Discount</span>
                  <span>
                    -$
                    {(
                      (currentPlan?.originalPrice || 0) -
                      (currentPlan?.price || 0)
                    ).toFixed(2)}
                  </span>
                </div>

                <div className="h-px bg-slate-800"></div>

                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold text-white">
                    Total Due Today
                  </span>
                  <span className="text-2xl font-bold text-white">
                    ${currentPlan?.price}
                  </span>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isLoading}
                  className={`w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r ${currentPlan?.gradient} hover:opacity-90 transition-all flex items-center justify-center gap-2 group ${
                    isLoading ? "opacity-70 cursor-not-allowed" : ""
                  }`}
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5" />
                      Continue to Payment
                      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-4 text-sm text-slate-500">
                  <div className="flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Secure</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" />
                    <span>30-day guarantee</span>
                  </div>
                </div>

                {!user && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-200">
                      You'll need to{" "}
                      <Link
                        href="/auth/login?redirect=/checkout"
                        className="underline hover:text-amber-100"
                      >
                        log in
                      </Link>{" "}
                      or{" "}
                      <Link
                        href="/auth/signup?redirect=/checkout"
                        className="underline hover:text-amber-100"
                      >
                        create an account
                      </Link>{" "}
                      to complete checkout.
                    </p>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-slate-800/30 border-t border-slate-800">
                <p className="text-xs text-slate-500 text-center">
                  By subscribing, you agree to our{" "}
                  <Link href="/terms" className="underline hover:text-slate-400">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="underline hover:text-slate-400">
                    Privacy Policy
                  </Link>
                  . Cancel anytime.
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center gap-6 p-4 rounded-xl bg-slate-900/50 border border-slate-800">
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Lock className="w-4 h-4" />
              <span>256-bit SSL</span>
            </div>
            <div className="h-4 w-px bg-slate-700"></div>
            <div className="flex items-center gap-2 text-slate-400 text-sm">
              <Shield className="w-4 h-4" />
              <span>PCI Compliant</span>
            </div>
            <div className="h-4 w-px bg-slate-700"></div>
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <CreditCard className="w-4 h-4" />
                <span>Powered by Paystack</span>
              </div>
          </div>
        </motion.div>
        </div>
      </div>
    );
  }

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
