"use client"

import React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Crown, Zap, Check, X, Sparkles } from "lucide-react"
import { toast } from "sonner"

export default function Upgrade() {
  const [selectedPlan, setSelectedPlan] = useState("pro")
  const [billingCycle, setBillingCycle] = useState("monthly")
  const [isProcessing, setIsProcessing] = useState(false)

  const plans = {
    free: {
      name: "Free",
      price: { monthly: 0, yearly: 0 },
      description: "Perfect for getting started",
      icon: Sparkles,
      color: "gray",
      features: [
        "5 AI-generated learning paths per month",
        "Access to basic courses",
        "Community support",
        "Progress tracking",
        "Mobile app access",
      ],
      limitations: ["Limited AI interactions", "No offline access", "No certificates", "Basic analytics only"],
    },
    pro: {
      name: "Pro",
      price: { monthly: 19, yearly: 15 },
      description: "For serious learners",
      icon: Zap,
      color: "blue",
      popular: true,
      features: [
        "Unlimited AI-generated learning paths",
        "Access to all courses",
        "Priority support",
        "Advanced progress analytics",
        "Offline course downloads",
        "Industry certificates",
        "1-on-1 mentorship sessions",
        "Custom learning goals",
        "Ad-free experience",
        "Early access to new features",
      ],
      limitations: [],
    },
    enterprise: {
      name: "Enterprise",
      price: { monthly: 49, yearly: 39 },
      description: "For teams and organizations",
      icon: Crown,
      color: "purple",
      features: [
        "Everything in Pro",
        "Team management dashboard",
        "Custom course creation",
        "Advanced analytics & reporting",
        "SSO integration",
        "Dedicated account manager",
        "Custom integrations",
        "Bulk user management",
        "White-label options",
        "24/7 priority support",
        "Custom branding",
        "API access",
      ],
      limitations: [],
    },
  }

  const currentPlan = "free" // This would come from user context

  const handleUpgrade = async (planName) => {
    setIsProcessing(true)

    try {
      const response = await fetch('/api/billing/create-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan: planName
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();
      
      // Redirect to Stripe checkout
      window.location.href = data.sessionUrl;
    } catch (error) {
      console.error('Error upgrading:', error);
      toast.error('Failed to start upgrade process. Please try again.');
      setIsProcessing(false);
    }
  }

  const comparisonFeatures = [
    {
      category: "Learning Features",
      features: [
        { name: "AI-generated learning paths", free: "5/month", pro: "Unlimited", enterprise: "Unlimited" },
        { name: "Course access", free: "Basic only", pro: "All courses", enterprise: "All courses + Custom" },
        { name: "Offline downloads", free: false, pro: true, enterprise: true },
        { name: "Certificates", free: false, pro: true, enterprise: true },
        { name: "Custom learning goals", free: false, pro: true, enterprise: true },
      ],
    },
    {
      category: "Support & Analytics",
      features: [
        { name: "Support", free: "Community", pro: "Priority", enterprise: "24/7 Dedicated" },
        { name: "Progress analytics", free: "Basic", pro: "Advanced", enterprise: "Enterprise" },
        { name: "Mentorship sessions", free: false, pro: "1-on-1", enterprise: "Team sessions" },
        { name: "API access", free: false, pro: false, enterprise: true },
      ],
    },
    {
      category: "Team Features",
      features: [
        { name: "Team management", free: false, pro: false, enterprise: true },
        { name: "Bulk user management", free: false, pro: false, enterprise: true },
        { name: "SSO integration", free: false, pro: false, enterprise: true },
        { name: "White-label options", free: false, pro: false, enterprise: true },
      ],
    },
  ]


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
            Unlock advanced features, unlimited access, and personalized support to accelerate your learning journey.
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
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Current Plan: Free</h3>
              <p className="text-blue-700 dark:text-blue-300">You're using 4 out of 5 monthly AI interactions</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">80%</div>
              <div className="text-sm text-blue-700 dark:text-blue-300">Usage this month</div>
            </div>
          </div>
          <div className="mt-4 w-full bg-blue-200 dark:bg-blue-800 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full" style={{ width: "80%" }}></div>
          </div>
        </motion.div>

        {/* Billing Toggle */}
        <motion.div
          className="flex items-center justify-center space-x-4 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <span
            className={`text-sm ${billingCycle === "monthly" ? "text-gray-900 dark:text-white font-medium" : "text-gray-600 dark:text-gray-400"}`}
          >
            Monthly
          </span>
          <button
            onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              billingCycle === "yearly" ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                billingCycle === "yearly" ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
          <span
            className={`text-sm ${billingCycle === "yearly" ? "text-gray-900 dark:text-white font-medium" : "text-gray-600 dark:text-gray-400"}`}
          >
            Yearly
          </span>
          {billingCycle === "yearly" && (
            <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full text-xs font-medium">
              Save 20%
            </span>
          )}
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          {Object.entries(plans).map(([key, plan]) => {
            const Icon = plan.icon
            const price = billingCycle === "yearly" ? plan.price.yearly : plan.price.monthly
            const isCurrentPlan = key === currentPlan
            const isPopular = plan.popular

            return (
              <motion.div
                key={key}
                className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
                  isPopular
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
                      className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        isPopular
                          ? "bg-gradient-to-r from-blue-600 to-purple-600"
                          : `bg-${plan.color}-100 dark:bg-${plan.color}-900`
                      }`}
                    >
                      <Icon
                        className={`w-6 h-6 ${isPopular ? "text-white" : `text-${plan.color}-600 dark:text-${plan.color}-400`}`}
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">{plan.name}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{plan.description}</p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">${price}</span>
                      {price > 0 && (
                        <span className="text-gray-600 dark:text-gray-400 ml-1">
                          /{billingCycle === "yearly" ? "year" : "month"}
                        </span>
                      )}
                    </div>
                    {billingCycle === "yearly" && price > 0 && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        ${Math.round(price * 12)} billed annually
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                    {plan.limitations.map((limitation, index) => (
                      <li key={index} className="flex items-start space-x-3 opacity-60">
                        <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-500 dark:text-gray-400">{limitation}</span>
                      </li>
                    ))}
                  </ul>

                  <motion.button
                    onClick={() => !isCurrentPlan && handleUpgrade(plan.name)}
                    disabled={isCurrentPlan || isProcessing}
                    whileHover={{ scale: isCurrentPlan ? 1 : 1.02 }}
                    whileTap={{ scale: isCurrentPlan ? 1 : 0.98 }}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                      isCurrentPlan
                        ? "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                        : isPopular
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {isCurrentPlan ? "Current Plan" : isProcessing ? "Processing..." : `Upgrade to ${plan.name}`}
                  </motion.button>
                </div>
              </motion.div>
            )
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
                  <th className="text-left py-4 px-4 text-gray-900 dark:text-white font-semibold">Features</th>
                  <th className="text-center py-4 px-4 text-gray-900 dark:text-white font-semibold">Free</th>
                  <th className="text-center py-4 px-4 text-gray-900 dark:text-white font-semibold">Pro</th>
                  <th className="text-center py-4 px-4 text-gray-900 dark:text-white font-semibold">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((category, categoryIndex) => (
                  <React.Fragment key={categoryIndex}>
                    <tr>
                      <td colSpan={4} className="py-4 px-4">
                        <h4 className="font-semibold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded">
                          {category.category}
                        </h4>
                      </td>
                    </tr>
                    {category.features.map((feature, featureIndex) => (
                      <tr key={featureIndex} className="border-b border-gray-100 dark:border-gray-700">
                        <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{feature.name}</td>
                        <td className="py-3 px-4 text-center">
                          {typeof feature.free === "boolean" ? (
                            feature.free ? (
                              <Check className="w-5 h-5 text-green-500 mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-red-500 mx-auto" />
                            )
                          ) : (
                            <span className="text-gray-600 dark:text-gray-400">{feature.free}</span>
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
                            <span className="text-gray-600 dark:text-gray-400">{feature.pro}</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {typeof feature.enterprise === "boolean" ? (
                            feature.enterprise ? (
                              <Check className="w-5 h-5 text-green-500 mx-auto" />
                            ) : (
                              <X className="w-5 h-5 text-red-500 mx-auto" />
                            )
                          ) : (
                            <span className="text-gray-600 dark:text-gray-400">{feature.enterprise}</span>
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
  )
}
