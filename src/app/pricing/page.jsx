"use client"

import { useState } from "react"
import { Check, Sparkles, Crown, Zap } from "lucide-react"
import Link from "next/link"

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false)

  const plans = [
    {
      name: "Free",
      description: "Perfect for getting started",
      price: { monthly: 0, annual: 0 },
      icon: Sparkles,
      features: [
        "5 AI-generated learning paths per month",
        "Access to basic courses",
        "Community support",
        "Progress tracking",
        "Mobile app access",
      ],
      limitations: ["Limited AI interactions", "No offline access", "No certificates"],
      cta: "Get Started",
      popular: false,
    },
    {
      name: "Pro",
      description: "For serious learners",
      price: { monthly: 19, annual: 15 },
      icon: Zap,
      features: [
        "Unlimited AI-generated learning paths",
        "Access to all courses",
        "Priority support",
        "Advanced progress analytics",
        "Offline course downloads",
        "Industry certificates",
        "1-on-1 mentorship sessions",
        "Custom learning goals",
      ],
      cta: "Start Pro Trial",
      popular: true,
    },
    {
      name: "Enterprise",
      description: "For teams and organizations",
      price: { monthly: 49, annual: 39 },
      icon: Crown,
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
      ],
      cta: "Contact Sales",
      popular: false,
    },
  ]

  const faqs = [
    {
      question: "Can I change my plan anytime?",
      answer:
        "Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.",
    },
    {
      question: "Is there a free trial for paid plans?",
      answer: "Yes, we offer a 14-day free trial for all paid plans. No credit card required to start.",
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, PayPal, and bank transfers for enterprise customers.",
    },
    {
      question: "Do you offer refunds?",
      answer: "Yes, we offer a 30-day money-back guarantee for all paid plans if you're not satisfied.",
    },
  ]

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Navigation */}
      <nav className="border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Actinova AI Tutor</span>
            </Link>

            <div className="flex items-center space-x-4">
              <Link href="/" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                Back to Home
              </Link>
              <Link
                href="/auth/login"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Learning Plan
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            Start free and upgrade as you grow. All plans include our core AI-powered learning features.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <span
              className={`text-sm ${!isAnnual ? "text-gray-900 dark:text-white font-medium" : "text-gray-600 dark:text-gray-400"}`}
            >
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isAnnual ? "bg-blue-600" : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isAnnual ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span
              className={`text-sm ${isAnnual ? "text-gray-900 dark:text-white font-medium" : "text-gray-600 dark:text-gray-400"}`}
            >
              Annual
            </span>
            {isAnnual && (
              <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-full text-xs font-medium">
                Save 20%
              </span>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => {
            const Icon = plan.icon
            const price = isAnnual ? plan.price.annual : plan.price.monthly

            return (
              <div
                key={index}
                className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
                  plan.popular
                    ? "border-blue-500 scale-105"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                {plan.popular && (
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
                        plan.popular ? "bg-gradient-to-r from-blue-600 to-purple-600" : "bg-gray-100 dark:bg-gray-700"
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${plan.popular ? "text-white" : "text-gray-600 dark:text-gray-400"}`} />
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
                        <span className="text-gray-600 dark:text-gray-400 ml-1">/{isAnnual ? "year" : "month"}</span>
                      )}
                    </div>
                    {isAnnual && price > 0 && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Billed annually (${Math.round(price * 12 * 0.8)}/year)
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start space-x-3">
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-600 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                    {plan.limitations &&
                      plan.limitations.map((limitation, limitIndex) => (
                        <li key={limitIndex} className="flex items-start space-x-3 opacity-60">
                          <div className="w-5 h-5 flex-shrink-0 mt-0.5">
                            <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mt-1"></div>
                          </div>
                          <span className="text-gray-500 dark:text-gray-400">{limitation}</span>
                        </li>
                      ))}
                  </ul>

                  <button
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${
                      plan.popular
                        ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {plan.cta}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Enterprise Features */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl p-8 mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Enterprise Features</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Everything you need to scale learning across your organization
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              "Custom course creation and curation",
              "Advanced analytics and reporting",
              "Single Sign-On (SSO) integration",
              "Dedicated customer success manager",
              "API access for custom integrations",
              "White-label and branding options",
              "Bulk user management and provisioning",
              "Custom learning paths for teams",
              "Priority support with SLA guarantees",
            ].map((feature, index) => (
              <div key={index} className="flex items-start space-x-3">
                <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700 dark:text-gray-300">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{faq.question}</h3>
                <p className="text-gray-600 dark:text-gray-300">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Learning?</h2>
          <p className="text-xl text-blue-100 mb-6">
            Join thousands of learners who are already transforming their careers
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
  )
}
