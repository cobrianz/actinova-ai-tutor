"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search, Book, MessageCircle, Mail, Phone, HelpCircle, ChevronDown, ChevronUp, Zap, Shield, Sparkles, ArrowRight, FileText, Users, CreditCard, Download, Award, Clock, Bot } from "lucide-react"
import Link from "next/link"
import HeroNavbar from "../components/heroNavbar"

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedFaq, setExpandedFaq] = useState(null)

  const faqs = [
    {
      question: "How do I get started with Actirova AI Tutor?",
      answer: "Simply sign up for a free account, complete your profile, and start exploring our AI-generated learning paths. You can choose from various topics and difficulty levels to match your learning goals. Our AI will personalize your experience based on your interests and learning style.",
    },
    {
      question: "What's included in the free plan?",
      answer: "The free plan includes 5 AI-generated learning paths per month, access to basic courses, community support, progress tracking, and mobile app access. You'll also get access to our AI tutor for basic questions and explanations.",
    },
    {
      question: "How do certificates work?",
      answer: "Certificates are automatically generated when you complete a course with 100% progress. Pro and Enterprise users can download PDF certificates and access them from their profile page. Certificates include your name, course title, completion date, and verification code.",
    },
    {
      question: "Can I download courses for offline learning?",
      answer: "Offline downloads are available for Pro and Enterprise users. You can download course materials, videos, and notes for learning without an internet connection. Our mobile app automatically syncs content when you're online.",
    },
    {
      question: "How does the AI tutor work?",
      answer: "Our AI tutor uses advanced language models to provide personalized explanations, answer questions, and adapt to your learning style. It's available 24/7 to help you understand complex concepts. Simply ask questions in the chat interface and get instant, contextual responses.",
    },
    {
      question: "Can I change my subscription plan?",
      answer: "Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle, and you'll have immediate access to new features. Visit your account settings to manage your subscription.",
    },
    {
      question: "Is there a mobile app?",
      answer: "Yes, our mobile app is available for both iOS and Android. You can access all your courses, track progress, and use the AI tutor on the go. Download from the App Store or Google Play Store.",
    },
    {
      question: "How do I contact support?",
      answer: "You can reach our support team through the contact form below, email us at support@actirova.com, or use the live chat feature available to Pro and Enterprise users. Enterprise customers also have access to priority phone support.",
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, Mastercard, American Express), PayPal, and bank transfers for annual plans. Enterprise customers can also pay via invoice with net-30 terms.",
    },
    {
      question: "How secure is my data?",
      answer: "We use enterprise-grade security with end-to-end encryption, regular security audits, and GDPR/CCPA compliance. Your personal information and learning data are stored securely in our cloud infrastructure with AWS.",
    },
  ]

  const helpCategories = [
    {
      title: "Getting Started",
      icon: Book,
      description: "Learn the basics of using Actirova",
      articles: [
        "Creating your first learning path",
        "Setting up your profile",
        "Understanding the dashboard",
        "Mobile app setup",
        "Navigating course content",
        "Setting learning goals",
      ],
    },
    {
      title: "Learning Features",
      icon: Bot,
      description: "Master our AI-powered tools",
      articles: [
        "Using the AI tutor effectively",
        "Taking notes effectively",
        "Tracking your progress",
        "Earning certificates",
        "Using flashcards",
        "Taking quizzes",
      ],
    },
    {
      title: "Account & Billing",
      icon: CreditCard,
      description: "Manage your subscription",
      articles: [
        "Managing your subscription",
        "Updating payment methods",
        "Understanding billing cycles",
        "Canceling your account",
        "Requesting refunds",
        "Enterprise licensing",
      ],
    },
  ]

  const features = [
    { icon: Zap, title: "AI-Powered Learning", desc: "Personalized education with advanced AI" },
    { icon: Shield, title: "Secure Platform", desc: "Enterprise-grade security" },
    { icon: Award, title: "Certificates", desc: "Earn recognized credentials" },
    { icon: Clock, title: "24/7 Support", desc: "Help whenever you need it" },
  ]

  const toggleFaq = (index) => {
    setExpandedFaq(expandedFaq === index ? null : index)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <HeroNavbar />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-20 h-20 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <HelpCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">How can we help you?</h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8">
            Find answers to common questions or get in touch with our support team
          </p>

          {/* Search */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500"
            />
          </div>
        </motion.div>

        {/* Feature Badges */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {features.map((feature, index) => (
            <div key={index} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center">
              <feature.icon className="w-6 h-6 text-violet-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{feature.title}</p>
              <p className="text-xs text-slate-500">{feature.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* Help Categories */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          {helpCategories.map((category, index) => {
            const Icon = category.icon
            return (
              <div key={index} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center">
                    <Icon className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{category.title}</h3>
                    <p className="text-xs text-slate-500">{category.description}</p>
                  </div>
                </div>
                <ul className="space-y-2">
                  {category.articles.map((article, articleIndex) => (
                    <li key={articleIndex}>
                      <a
                        href="#"
                        className="text-sm text-slate-600 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 transition-colors flex items-center gap-2"
                      >
                        <FileText className="w-3 h-3" />
                        {article}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </motion.div>

        {/* Popular Topics */}
        <motion.div
          className="bg-white dark:bg-slate-800 rounded-2xl p-8 mb-12 border border-slate-200 dark:border-slate-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Popular Topics</h2>
          <div className="flex flex-wrap gap-3">
            {["Getting Started", "AI Tutor", "Certificates", "Billing", "Mobile App", "Progress Tracking", "Premium Features", "Account Settings", "Course Downloads", "API Access"].map((topic, index) => (
                Send Email
              </a>
            </div>
            <div className="bg-white/10 rounded-lg p-6">
              <MessageCircle className="w-8 h-8 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Live Chat</h3>
              <p className="text-sm opacity-80 mb-3">Chat with our team</p>
              <button className="bg-white text-primary px-4 py-2 rounded-lg hover:bg-white/90 transition-colors">
                Start Chat
              </button>
            </div>
            <div className="bg-white/10 rounded-lg p-6">
              <Phone className="w-8 h-8 mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Phone Support</h3>
              <p className="text-sm opacity-80 mb-3">Enterprise customers</p>
              <a
                href="tel:+1-555-0123"
                className="bg-white text-primary px-4 py-2 rounded-lg hover:bg-white/90 transition-colors"
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
