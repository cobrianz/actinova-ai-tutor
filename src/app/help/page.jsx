"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search, Book, MessageCircle, Mail, Phone, HelpCircle, ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedFaq, setExpandedFaq] = useState(null)

  const faqs = [
    {
      question: "How do I get started with Actinova AI Tutor?",
      answer:
        "Simply sign up for a free account, complete your profile, and start exploring our AI-generated learning paths. You can choose from various topics and difficulty levels to match your learning goals.",
    },
    {
      question: "What's included in the free plan?",
      answer:
        "The free plan includes 5 AI-generated learning paths per month, access to basic courses, community support, progress tracking, and mobile app access.",
    },
    {
      question: "How do certificates work?",
      answer:
        "Certificates are automatically generated when you complete a course with 100% progress. Pro and Enterprise users can download PDF certificates and access them from their profile page.",
    },
    {
      question: "Can I download courses for offline learning?",
      answer:
        "Offline downloads are available for Pro and Enterprise users. You can download course materials, videos, and notes for learning without an internet connection.",
    },
    {
      question: "How does the AI tutor work?",
      answer:
        "Our AI tutor uses advanced language models to provide personalized explanations, answer questions, and adapt to your learning style. It's available 24/7 to help you understand complex concepts.",
    },
    {
      question: "Can I change my subscription plan?",
      answer:
        "Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle, and you'll have immediate access to new features.",
    },
    {
      question: "Is there a mobile app?",
      answer:
        "Yes, our mobile app is available for both iOS and Android. You can access all your courses, track progress, and use the AI tutor on the go.",
    },
    {
      question: "How do I contact support?",
      answer:
        "You can reach our support team through the contact form below, email us at support@actinova.com, or use the live chat feature available to Pro and Enterprise users.",
    },
  ]

  const helpCategories = [
    {
      title: "Getting Started",
      icon: Book,
      articles: [
        "Creating your first learning path",
        "Setting up your profile",
        "Understanding the dashboard",
        "Mobile app setup",
      ],
    },
    {
      title: "Learning Features",
      icon: HelpCircle,
      articles: ["Using the AI tutor", "Taking notes effectively", "Tracking your progress", "Earning certificates"],
    },
    {
      title: "Account & Billing",
      icon: MessageCircle,
      articles: [
        "Managing your subscription",
        "Updating payment methods",
        "Understanding billing cycles",
        "Canceling your account",
      ],
    },
  ]

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <nav className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Book className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">Actinova AI Tutor</span>
            </Link>
            <Link
              href="/dashboard"
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">How can we help you?</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Find answers to common questions or get in touch with our support team
          </p>

          {/* Search */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </motion.div>

        {/* Help Categories */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {helpCategories.map((category, index) => {
            const Icon = category.icon
            return (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{category.title}</h3>
                </div>
                <ul className="space-y-2">
                  {category.articles.map((article, articleIndex) => (
                    <li key={articleIndex}>
                      <a
                        href="#"
                        className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {article}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="font-medium text-gray-900 dark:text-white">{faq.question}</span>
                  {expandedFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600 dark:text-gray-300">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Contact Support */}
        <motion.div
          className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold mb-4">Still need help?</h2>
          <p className="text-blue-100 mb-8">
            Our support team is here to help you succeed. Get in touch and we'll respond as soon as possible.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 rounded-lg p-6">
              <Mail className="w-8 h-8 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Email Support</h3>
              <p className="text-sm text-blue-100 mb-3">Get help via email</p>
              <a
                href="mailto:support@actinova.com"
                className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Send Email
              </a>
            </div>
            <div className="bg-white/10 rounded-lg p-6">
              <MessageCircle className="w-8 h-8 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Live Chat</h3>
              <p className="text-sm text-blue-100 mb-3">Chat with our team</p>
              <button className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors">
                Start Chat
              </button>
            </div>
            <div className="bg-white/10 rounded-lg p-6">
              <Phone className="w-8 h-8 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Phone Support</h3>
              <p className="text-sm text-blue-100 mb-3">Enterprise customers</p>
              <a
                href="tel:+1-555-0123"
                className="bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Call Now
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
