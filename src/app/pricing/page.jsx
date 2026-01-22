"use client";

import { useState, useEffect } from "react";
import { Check, Sparkles, Crown, Zap, Lock, ShieldCheck, ArrowRight, Star, Heart, Rocket } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import HeroNavbar from "../components/heroNavbar";
import { toast } from "sonner";

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
  const [processingPlanId, setProcessingPlanId] = useState(null);
  const [plans, setPlans] = useState([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [selectedPlanForModal, setSelectedPlanForModal] = useState(null);
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
          const robustPlans = (data.plans || []).map((p, index) => ({
            ...p,
            id: p.id || p.name.toLowerCase().split(' ')[0] || `plan-${index}`
          }));
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

  const getUserPlanId = () => {
    if (!user) return null;
    if (user?.subscription?.plan === 'enterprise' && user?.subscription?.status === 'active') return 'enterprise';
    if (((user?.subscription?.plan === 'pro' || user?.subscription?.plan === 'premium') && user?.subscription?.status === 'active') || user?.isPremium) return 'premium';
    return 'basic';
  };

  const currentPlanId = getUserPlanId();
  const isPro = currentPlanId === 'premium' || currentPlanId === 'enterprise';

  const initiatePaymentSelection = (plan) => {
    if (!plan.id) return;
    if (currentPlanId === 'enterprise') {
      toast.success("You are already on the Enterprise plan!");
      return;
    }
    if (currentPlanId === 'premium' && (plan.id === 'premium' || plan.name.toLowerCase().includes('pro'))) {
      toast.success("You are already on the Premium plan!");
      return;
    }
    if (plan.price === 0) {
      if (!user) router.push("/auth/signup");
      else toast.success("You are already on the Basic plan.");
      return;
    }
    if (!user) {
      toast.error("Please login to subscribe");
      router.push("/auth/login");
      return;
    }
    setSelectedPlanForModal(plan);
  };

  const executePayment = async (method) => {
    const plan = selectedPlanForModal;
    if (!plan) return;
    setSelectedPlanForModal(null);
    setProcessingPlanId(plan.id);
    try {
      const response = await fetch("/api/billing/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          plan: plan.id === 'premium' ? 'pro' : plan.id,
          paymentMethod: method,
        }),
      });
      const data = await response.json();
      if (response.ok && data.sessionUrl) {
        window.location.href = data.sessionUrl;
      } else {
        toast.error(data.error || "Failed to initialize payment");
        setProcessingPlanId(null);
      }
    } catch (error) {
      toast.error("Failed to initialize payment");
      setProcessingPlanId(null);
    }
  };

  const getPlanConfig = (planId) => {
    switch (planId) {
      case 'basic': return { icon: Rocket, color: "from-blue-500 to-cyan-500", shadow: "shadow-blue-500/20" };
      case 'premium': return { icon: Zap, color: "from-purple-600 to-indigo-600", shadow: "shadow-purple-500/20" };
      case 'enterprise': return { icon: Crown, color: "from-amber-500 to-orange-600", shadow: "shadow-amber-500/20" };
      default: return { icon: Sparkles, color: "from-blue-500 to-purple-500", shadow: "shadow-blue-500/20" };
    }
  };

  const faqs = [
    {
      question: "Can I change my plan anytime?",
      answer: "Absolutely. You can upgrade, downgrade, or cancel your subscription at any time from your settings page.",
    },
    {
      question: "Is there a free trial for paid plans?",
      answer: "We offer a 7-day full-access trial for our Premium plan so you can experience all the advanced AI features.",
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards globally and M-Pesa/Mobile Money for our African users via Paystack.",
    },
    {
      question: "Do you offer student discounts?",
      answer: "Yes, verified students are eligible for a 50% discount on the Premium plan. Contact support to apply.",
    },
  ];

  if (isLoadingPlans) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#030712] flex flex-col">
        <HeroNavbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full" />
            <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#030712] text-gray-900 dark:text-gray-100 selection:bg-blue-500/30 overflow-x-hidden">
      <HeroNavbar />

      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-[120px] animate-blob" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-[120px] animate-blob [animation-delay:2s]" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <section className="pt-20 pb-16 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-full text-blue-600 dark:text-blue-400 text-sm font-medium mb-8 border border-blue-100 dark:border-blue-800"
            >
              <Star className="w-4 h-4 fill-current" />
              <span>Flexible pricing for every learner</span>
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-6xl font-bold mb-6 tracking-tight"
            >
              Invest in Your <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">Future</span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8"
            >
              Choose the plan that fits your learning goals. All plans include access to our base AI tutor and core features.
            </motion.p>

            {isPro && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center space-x-3 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20 backdrop-blur-sm"
              >
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  Active Subscription: {currentPlanId.toUpperCase()}
                </span>
              </motion.div>
            )}
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="pb-32 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              {plans.map((plan, i) => {
                const config = getPlanConfig(plan.id);
                const Icon = config.icon;
                const isCurrentPlan = plan.id === currentPlanId;
                const isPopular = plan.popular;

                return (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ y: -10 }}
                    className={`relative flex flex-col p-8 rounded-[2.5rem] border-2 transition-all duration-500 ${
                      isPopular
                        ? "bg-white dark:bg-gray-900 border-blue-500 shadow-2xl z-10"
                        : "bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl border-gray-100 dark:border-gray-800 shadow-xl"
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                        <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-1.5 rounded-full text-sm font-bold shadow-lg">
                          MOST POPULAR
                        </span>
                      </div>
                    )}

                    <div className="mb-8">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${config.color} flex items-center justify-center mb-6 shadow-lg ${config.shadow}`}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                      <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed min-h-[40px]">
                        {plan.id === 'basic' ? "Essential features for casual learners." : 
                         plan.id === 'premium' ? "Advanced AI tools for serious students." : 
                         "Full-scale learning infrastructure for experts."}
                      </p>
                    </div>

                    <div className="mb-8">
                      <div className="flex items-baseline">
                        <span className="text-5xl font-bold tracking-tight">${plan.price}</span>
                        <span className="text-gray-500 dark:text-gray-400 ml-2 font-medium">/month</span>
                      </div>
                    </div>

                    <div className="flex-1 mb-10">
                      <ul className="space-y-4">
                        {plan.features?.slice(0, 8).map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start group">
                            <div className={`mt-1 mr-3 rounded-full p-0.5 ${isPopular ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'}`}>
                              <Check className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="text-gray-600 dark:text-gray-300 text-sm font-medium group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <motion.button
                      onClick={() => initiatePaymentSelection(plan)}
                      disabled={processingPlanId === plan.id || isCurrentPlan}
                      whileTap={{ scale: 0.97 }}
                      className={`w-full py-4 px-6 rounded-2xl font-bold text-lg transition-all flex items-center justify-center space-x-2 ${
                        isCurrentPlan
                          ? "bg-emerald-500/10 text-emerald-600 border-2 border-emerald-500/20 cursor-default"
                          : isPopular
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xl hover:shadow-blue-500/40"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700"
                      }`}
                    >
                      {processingPlanId === plan.id ? (
                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>{isCurrentPlan ? "Current Plan" : plan.price === 0 ? "Get Started" : `Go ${plan.name}`}</span>
                          {!isCurrentPlan && <ArrowRight className="w-5 h-5" />}
                        </>
                      )}
                    </motion.button>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-32 px-4 bg-gray-50/50 dark:bg-gray-900/30 border-y border-gray-100 dark:border-gray-800">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Common Questions</h2>
              <p className="text-gray-500 dark:text-gray-400">Everything you need to know about our plans and billing.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="p-8 bg-white dark:bg-gray-800/50 rounded-3xl border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all"
                >
                  <h3 className="text-lg font-bold mb-3 flex items-start">
                    <span className="text-blue-600 mr-2">?</span>
                    {faq.question}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {faq.answer}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Enterprise CTA */}
        <section className="py-32 px-4">
          <div className="max-w-5xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative p-12 md:p-20 rounded-[3rem] bg-[#0f172a] text-white overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-blue-600/20 to-transparent pointer-events-none" />
              
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
                <div className="text-center md:text-left">
                  <h2 className="text-4xl font-bold mb-6">Need something bigger?</h2>
                  <p className="text-xl text-gray-400 max-w-lg mb-8">
                    Custom AI models, dedicated support, and enterprise-grade security for teams and institutions.
                  </p>
                  <Link
                    href="/contact"
                    className="inline-flex items-center space-x-3 bg-white text-gray-900 px-8 py-4 rounded-2xl font-bold hover:bg-blue-50 transition-all"
                  >
                    <span>Contact Enterprise Sales</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {[ShieldCheck, Globe, Users, Zap].map((Icon, i) => (
                    <div key={i} className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <Icon className="w-8 h-8 text-blue-400" />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </div>

      <Dialog open={!!selectedPlanForModal} onOpenChange={() => setSelectedPlanForModal(null)}>
        <AnimatePresence>
          {selectedPlanForModal && (
            <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-white dark:bg-[#030712] border border-gray-100 dark:border-gray-800 shadow-[0_0_50px_rgba(0,0,0,0.3)] rounded-[2rem]">
              <div className="grid grid-cols-1 md:grid-cols-5 h-full">
                {/* Left: Order Summary */}
                <div className="md:col-span-2 bg-gray-50/50 dark:bg-gray-800/20 p-8 flex flex-col justify-between border-r border-gray-100 dark:border-gray-800">
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">Order Summary</h3>
                    <div className="mb-8">
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getPlanConfig(selectedPlanForModal.id).color} flex items-center justify-center mb-4 shadow-lg`}>
                        {(() => {
                          const Icon = getPlanConfig(selectedPlanForModal.id).icon;
                          return <Icon className="w-6 h-6 text-white" />;
                        })()}
                      </div>
                      <h2 className="text-2xl font-bold mb-1">{selectedPlanForModal.name}</h2>
                      <p className="text-sm text-gray-500">Professional Tutoring Access</p>
                    </div>

                    <div className="mb-8 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                      <div className="flex items-baseline mb-2">
                        <span className="text-4xl font-bold">${selectedPlanForModal.price}</span>
                        <span className="text-gray-500 ml-1 font-medium">/mo</span>
                      </div>
                      <p className="text-xs text-gray-400 italic">Billed monthly. Cancel anytime.</p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between text-base font-bold">
                      <span>Total due now</span>
                      <span className="text-blue-600">${selectedPlanForModal.price.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Payment Selection */}
                <div className="md:col-span-3 p-8">
                  <div className="mb-10">
                    <div className="flex items-center justify-between mb-2">
                      <DialogTitle className="text-2xl font-bold">Checkout</DialogTitle>
                      <div className="flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full border border-emerald-500/20">
                        <Lock className="w-3 h-3 mr-1" /> SECURE
                      </div>
                    </div>
                    <DialogDescription className="text-gray-500 text-sm">
                      Choose your preferred payment method to activate your subscription.
                    </DialogDescription>
                  </div>

                  <div className="space-y-4 mb-8">
                    <button
                      onClick={() => executePayment('card')}
                      className="w-full group relative flex items-center p-5 bg-gray-50 dark:bg-gray-900 border-2 border-transparent hover:border-blue-500 rounded-[1.5rem] transition-all duration-300 text-left"
                    >
                      <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 flex-shrink-0 group-hover:scale-110 transition-transform shadow-sm">
                        <CreditCard className="w-6 h-6" />
                      </div>
                      <div className="ml-5 flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-bold text-lg">Card Payment</span>
                          <span className="text-[10px] font-bold bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700">GLOBAL</span>
                        </div>
                        <p className="text-xs text-gray-500">Credit, Debit, Apple Pay, Google Pay</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                    </button>

                    <button
                      onClick={() => executePayment('mobile_money')}
                      className="w-full group relative flex items-center p-5 bg-gray-50 dark:bg-gray-900 border-2 border-transparent hover:border-emerald-500 rounded-[1.5rem] transition-all duration-300 text-left"
                    >
                      <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 flex-shrink-0 group-hover:scale-110 transition-transform shadow-sm">
                        <Smartphone className="w-6 h-6" />
                      </div>
                      <div className="ml-5 flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-bold text-lg">Mobile Money</span>
                          <span className="text-[10px] font-bold bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full border border-gray-200 dark:border-gray-700 text-emerald-600">AFRICA</span>
                        </div>
                        <p className="text-xs text-gray-500">M-Pesa, Airtel, MTN & more</p>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                    </button>
                  </div>

                  <div className="flex items-center justify-center space-x-6 grayscale opacity-40">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-3" alt="Visa" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-6" alt="Mastercard" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" className="h-4" alt="Paypal" />
                  </div>
                </div>
              </div>
            </DialogContent>
          )}
        </AnimatePresence>
      </Dialog>
    </div>
  );
}
