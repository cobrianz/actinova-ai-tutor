"use client";

import React from "react";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Crown,
  Zap,
  Check,
  X,
  Sparkles,
  CreditCard,
  Smartphone,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "./AuthProvider";

export default function Upgrade() {
  const { user, loading } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState("pro");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [usage, setUsage] = useState({
    used: 0,
    limit: 5,
    percentage: 0,
    isPremium: false,
    remaining: 5
  });

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const res = await fetch("/api/user/usage", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setUsage(data);
        }
      } catch (error) {
        console.error("Failed to fetch usage:", error);
      }
    };

    if (user) {
      fetchUsage();
    }
  }, [user]);

  const plans = {
    free: {
      name: "Free",
      price: 0,
      description: "Perfect for getting started",
      icon: Sparkles,
      color: "gray",
      features: [
        "5 AI-generated learning paths per month",
        "3 modules per course (6 total lessons)",
        "Access to basic courses",
        "Community support",
        "Progress tracking",
        "Mobile app access",
      ],
      limitations: [
        "Limited AI interactions",
        "No offline access",
        "No certificates",
        "Basic analytics only",
      ],
    },
    pro: {
      name: "Pro",
      price: 35,
      description: "For serious learners",
      icon: Zap,
      color: "blue",
      popular: true,
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
      limitations: [],
    },
  };

  const isPro = !!(
    (user?.subscription?.plan === "pro" && user?.subscription?.status === "active") ||
    user?.isPremium
  );

  const currentPlan = isPro ? "pro" : "free";

  const handleUpgrade = async (planName) => {
    setIsProcessing(true);

    try {
      const response = await fetch("/api/billing/create-session", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: planName,
          paymentMethod: paymentMethod,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          toast.error("Please log in to upgrade.");
          setTimeout(() => {
            window.location.href = "/auth/login";
          }, 800);
        }
        const serverMessage = errorData.message || errorData.details || errorData.error;
        throw new Error(serverMessage || "Failed to create checkout session");
      }

      const data = await response.json();

      if (data.sessionUrl) {
        // Redirect to Paystack checkout
        window.location.href = data.sessionUrl;
      } else {
        throw new Error("No payment URL received");
      }
    } catch (error) {
      toast.error(error.message || "Failed to start upgrade process. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const comparisonFeatures = [
    {
      category: "Learning Features",
      features: [
        {
          name: "AI-generated learning paths",
          free: "5/month",
          pro: "15/month",
        },
        {
          name: "Course structure",
          free: "3 modules (6 lessons)",
          pro: "12 modules (48 lessons)",
        },
        { name: "Course access", free: "Basic only", pro: "All courses" },
        { name: "Offline downloads", free: false, pro: true },
        { name: "Certificates", free: false, pro: true },
        { name: "Custom learning goals", free: false, pro: true },
      ],
    },
    {
      category: "Support & Analytics",
      features: [
        { name: "Support", free: "Community", pro: "Priority" },
        { name: "Progress analytics", free: "Basic", pro: "Advanced" },
        { name: "Mentorship sessions", free: false, pro: "1-on-1" },
        { name: "AI tutor chat agent", free: false, pro: true },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Upgrade Your Learning Experience
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Unlock advanced features, unlimited access, and personalized support
            to accelerate your learning journey.
          </p>
        </motion.div>

        {/* Current Plan Status */}
        <motion.div
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                Current Plan: {usage.isPremium ? "Pro" : "Free"}
              </h3>
              <p className="text-blue-700 dark:text-blue-300">
                You're using {usage.used} out of {usage.limit} monthly AI interactions
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {usage.percentage}%
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                Usage this month
              </div>
            </div>
          </div>
          <div className="mt-4 w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${usage.percentage}%` }}
            ></div>
          </div>
        </motion.div>

        {/* Billing Description */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <span className="text-gray-600 dark:text-gray-400">
            Simple, transparent monthly pricing. Cancel anytime.
          </span>
        </motion.div>

        {/* Payment Method Selection */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Select Payment Method
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setPaymentMethod("card")}
              className={`flex items-center space-x-3 p-4 border-2 rounded-lg transition-all ${paymentMethod === "card"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
            >
              <CreditCard
                className={`w-5 h-5 ${paymentMethod === "card" ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"}`}
              />
              <div className="text-left">
                <div
                  className={`font-medium ${paymentMethod === "card" ? "text-blue-900 dark:text-blue-100" : "text-gray-900 dark:text-white"}`}
                >
                  Credit/Debit Card
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Visa, Mastercard, etc.
                </div>
              </div>
            </button>
            <button
              onClick={() => setPaymentMethod("mobile_money")}
              className={`flex items-center space-x-3 p-4 border-2 rounded-lg transition-all ${paymentMethod === "mobile_money"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
            >
              <Smartphone
                className={`w-5 h-5 ${paymentMethod === "mobile_money" ? "text-blue-600 dark:text-blue-400" : "text-gray-600 dark:text-gray-400"}`}
              />
              <div className="text-left">
                <div
                  className={`font-medium ${paymentMethod === "mobile_money" ? "text-blue-900 dark:text-blue-100" : "text-gray-900 dark:text-white"}`}
                >
                  Mobile Money
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  M-Pesa, MTN, etc.
                </div>
              </div>
            </button>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {Object.entries(plans).map(([key, plan]) => {
            const Icon = plan.icon;
            const isCurrentPlan = key === currentPlan;
            const isPopular = plan.popular;

            return (
              <motion.div
                key={key}
                className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${isPopular
                  ? "border-blue-500 scale-105"
                  : isCurrentPlan
                    ? "border-green-500"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                whileHover={{ y: -5 }}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                {isCurrentPlan && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-green-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Current Plan
                    </span>
                  </div>
                )}

                <div className="p-8">
                  <div className="flex items-center space-x-3 mb-4">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center ${isPopular
                        ? "bg-gradient-to-r from-blue-600 to-purple-600"
                        : `bg-${plan.color}-100 dark:bg-${plan.color}-900`
                        }`}
                    >
                      <Icon
                        className={`w-6 h-6 ${isPopular ? "text-white" : `text-${plan.color}-600 dark:text-${plan.color}-400`}`}
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
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600 dark:text-gray-300">
                          {feature}
                        </span>
                      </li>
                    ))}
                    {plan.limitations.map((limitation, index) => (
                      <li
                        key={index}
                        className="flex items-start space-x-3 opacity-60"
                      >
                        <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-500 dark:text-gray-400">
                          {limitation}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <motion.button
                    onClick={() => !isCurrentPlan && handleUpgrade(key)}
                    disabled={isCurrentPlan || isProcessing}
                    whileHover={{ scale: isCurrentPlan ? 1 : 1.02 }}
                    whileTap={{ scale: isCurrentPlan ? 1 : 0.98 }}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${isCurrentPlan
                      ? "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                      : isPopular
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                  >
                    {isCurrentPlan
                      ? "Current Plan"
                      : isProcessing
                        ? "Processing..."
                        : `Upgrade to ${plan.name}`}
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Feature Comparison */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
            Detailed Feature Comparison
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-4 px-4 text-gray-900 dark:text-white font-semibold">
                    Features
                  </th>
                  <th className="text-center py-4 px-4 text-gray-900 dark:text-white font-semibold">
                    Free
                  </th>
                  <th className="text-center py-4 px-4 text-gray-900 dark:text-white font-semibold">
                    Pro
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((category, categoryIndex) => (
                  <React.Fragment key={categoryIndex}>
                    <tr>
                      <td colSpan={3} className="py-4 px-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded">
                          {category.category}
                        </h4>
                      </td>
                    </tr>
                    {category.features.map((feature, featureIndex) => (
                      <tr
                        key={featureIndex}
                        className="border-b border-gray-100 dark:border-gray-700"
                      >
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                          {feature.name}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {typeof feature.free === "boolean" ? (
                            feature.free ? (
                              <Check className="w-5 h-5 text-green-500 mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-red-500 mx-auto" />
                            )
                          ) : (
                            <span className="text-gray-600 dark:text-gray-400">
                              {feature.free}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {typeof feature.pro === "boolean" ? (
                            feature.pro ? (
                              <Check className="w-5 h-5 text-green-500 mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-red-500 mx-auto" />
                            )
                          ) : (
                            <span className="text-gray-600 dark:text-gray-400">
                              {feature.pro}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
}