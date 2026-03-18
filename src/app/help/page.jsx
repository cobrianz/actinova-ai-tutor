"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search, Book, MessageCircle, Mail, Phone, HelpCircle, ChevronDown, ChevronUp, Zap, Shield, Sparkles, ArrowRight, FileText, Users, CreditCard, Download, Award, Clock, Bot, User, LayoutDashboard, Smartphone, MapPin, Target, BotMessageSquare, StickyNote, TrendingUp, BadgeCheck, Layers, ClipboardCheck, Wallet, RefreshCw, XCircle, Building2 } from "lucide-react"
import Link from "next/link"
import HeroNavbar from "../components/heroNavbar"

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedFaq, setExpandedFaq] = useState(null)
  const [expandedCategory, setExpandedCategory] = useState(null)

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
        {
          title: "Creating your first learning path",
          icon: Sparkles,
          content: "To create your first learning path, log in to your account and click the 'Generate' button on the dashboard. You can describe what you want to learn in natural language, for example 'I want to learn Python programming for data science.' The AI will generate a personalized curriculum with modules, lessons, and assessments tailored to your goals. You can customize the difficulty level, duration, and specific topics you want to cover. Once satisfied, click 'Start Learning' to begin your journey.",
        },
        {
          title: "Setting up your profile",
          icon: User,
          content: "Setting up your profile helps us personalize your learning experience. Navigate to Profile Settings by clicking your avatar in the top right corner. Here you can: Add your name and profile picture, Set your preferred learning style (visual, auditory, reading/writing, kinesthetic), Choose your areas of interest, Set daily/weekly learning goals, Connect your calendar for study scheduling, Enable notifications for reminders and updates. A complete profile ensures the AI tutor provides the most relevant recommendations.",
        },
        {
          title: "Understanding the dashboard",
          icon: LayoutDashboard,
          content: "Your dashboard is your command center. Here's what you'll find: Progress Overview - Shows your overall completion percentage and streak, Current Course - The active learning path you're working on, Recommended - AI-suggested courses based on your interests, Recent Activity - Your latest lessons, quizzes, and achievements, Quick Actions - Buttons to generate new courses, access library, and chat with AI. The dashboard updates in real-time as you progress through courses. Use the sidebar to navigate between different sections of the platform.",
        },
        {
          title: "Mobile app setup",
          icon: Smartphone,
          content: "Download the Actirova app from the App Store (iOS) or Google Play Store (Android). Open the app and log in with your existing credentials. The mobile app mirrors your web experience with: Offline access to downloaded courses, Push notifications for reminders and updates, Progress syncing across devices, Camera access for document scanning, Voice input for AI tutor conversations. To enable offline mode, go to Downloads in the app and select courses to save for offline use.",
        },
        {
          title: "Navigating course content",
          icon: MapPin,
          content: "Each course is organized into modules and lessons. Use the sidebar or progress bar to navigate between sections. Click on any lesson to begin learning. The interface shows: Lesson overview with objectives, Video or text content, Interactive elements and exercises, Notes section for personal annotations, Quiz at the end of each lesson, Next/Previous navigation buttons. You can bookmark lessons, add notes, and track which sections you've completed. Use the 'Resume' button to pick up where you left off.",
        },
        {
          title: "Setting learning goals",
          icon: Target,
          content: "Setting clear goals helps you stay motivated. Go to Settings > Learning Goals to define: Daily study time commitment (e.g., 30 minutes/day), Weekly completion targets (e.g., 2 lessons per week), Monthly milestones (e.g., complete 1 course per month), Skill acquisition objectives (e.g., learn React by Q2). The AI will recommend study schedules based on your goals. Track progress in the Goals tab of your dashboard. Adjust goals anytime as your schedule changes.",
        },
      ],
    },
    {
      title: "Learning Features",
      icon: Bot,
      description: "Master our AI-powered tools",
      articles: [
        {
          title: "Using the AI tutor effectively",
          icon: BotMessageSquare,
          content: "The AI tutor is your personal learning assistant. Access it through the chat icon in the bottom right. Tips for best results: Be specific in your questions, Ask for examples when concepts are unclear, Request step-by-step explanations, Ask the AI to quiz you on recent topics, Use follow-up questions for deeper understanding, Ask for clarification on any term or concept. The AI remembers your conversation context within each session, so you can build on previous questions. For Pro users, the AI can also generate practice problems and provide detailed feedback on your answers.",
        },
        {
          title: "Taking notes effectively",
          icon: StickyNote,
          content: "Our note-taking system integrates with course content. To add notes: Open any lesson and click the 'Notes' tab, Type your notes or use voice input, Notes are automatically tagged with the current topic, Use markdown for formatting (bold, italic, lists), Add code snippets with syntax highlighting, Create flashcards directly from notes. Access all your notes from the Library > Notes section. Notes are searchable and can be exported. Pro users can use AI to automatically summarize lengthy notes.",
        },
        {
          title: "Tracking your progress",
          icon: TrendingUp,
          content: "Monitor your learning journey in the Progress section. Track: Overall completion percentage across all courses, Time spent learning (daily, weekly, monthly), Streak count for consecutive learning days, Skills acquired and proficiency levels, Quiz scores and improvement over time, Badges and achievements unlocked. View detailed analytics by clicking 'View Analytics' in the Progress tab. Export progress reports for personal records or to share with mentors/employers.",
        },
        {
          title: "Earning certificates",
          icon: BadgeCheck,
          content: "Certificates are awarded when you complete a course with 100% progress. To earn a certificate: Complete all lessons in every module, Pass all quizzes with 70% or higher, Finish any required projects or assessments, Complete the course feedback survey. Certificates include: Your name as registered in your profile, Course title and description, Date of completion, Unique verification ID, QR code for verification. Download as PDF (Pro/Enterprise) or view digital versions. Share on LinkedIn directly from your profile.",
        },
        {
          title: "Using flashcards",
          icon: Layers,
          content: "Flashcards help reinforce learning through spaced repetition. Access flashcards from any course or your Library. Features: AI automatically generates flashcards from course content, Create custom flashcards with images and audio, Review scheduled by the spaced repetition algorithm, Track mastery level per card (Again, Hard, Good, Easy), Compete with friends on leaderboards (coming soon). Pro users can import flashcard decks from other sources. Review your due cards daily for optimal retention.",
        },
        {
          title: "Taking quizzes",
          icon: ClipboardCheck,
          content: "Quizzes test your understanding after each lesson. Quiz features: Multiple choice, true/false, and short answer questions, Immediate feedback with explanations, Retry unlimited times to improve scores, Timed practice quizzes available, AI-generated custom quizzes (Pro), Detailed performance analytics. Aim for 100% but remember quizzes are for learning, not just testing. Review incorrect answers to understand mistakes. Your quiz history is saved for review.",
        },
      ],
    },
    {
      title: "Account & Billing",
      icon: CreditCard,
      description: "Manage your subscription",
      articles: [
        {
          title: "Managing your subscription",
          icon: CreditCard,
          content: "Manage your subscription from Account Settings > Subscription. Here you can: View current plan and its features, See renewal date and billing history, Upgrade to Pro or Enterprise, Downgrade to a lower tier, Pause subscription temporarily, Add or remove payment methods. Changes take effect immediately for upgrades. Downgrades apply at the next billing cycle. Paused accounts retain access until the pause period ends.",
        },
        {
          title: "Updating payment methods",
          icon: Wallet,
          content: "To update your payment method: Go to Account Settings > Billing > Payment Methods, Click 'Add Payment Method', Enter your card details or connect PayPal, Set the new card as default, Optionally remove old methods. We support: Visa, Mastercard, American Express, Discover, PayPal, Bank transfers (annual plans). All payments are processed securely through Stripe. Your card details are never stored on our servers.",
        },
        {
          title: "Understanding billing cycles",
          icon: RefreshCw,
          content: "Billing cycles are monthly or annual. Monthly plans: Billed on the same date each month, Pro-rated charges for mid-cycle upgrades, Cancel anytime with access until period end. Annual plans: One upfront payment, Save up to 20% compared to monthly, Automatic renewal with 7-day advance notice. View detailed billing history in Account Settings > Billing > Invoice History. All invoices are available for download as PDF.",
        },
        {
          title: "Canceling your account",
          icon: XCircle,
          content: "To cancel your subscription: Go to Account Settings > Subscription, Click 'Cancel Subscription', Complete the cancellation survey (helps us improve), Confirm cancellation. What happens after: Access continues until current billing period ends, No automatic renewal, Data retained for 30 days post-cancellation, Reactivate anytime by resubscribing. We don't offer refunds for partial billing periods. Download your data before cancellation if needed.",
        },
        {
          title: "Requesting refunds",
          icon: RefreshCw,
          content: "Refund policy: 7-day money-back guarantee for first-time subscribers, Annual plans can be refunded within 30 days, Pro-rated refunds for billing errors. To request a refund: Contact support@actirova.com with your request, Include order number and reason, Allow 5-7 business days for processing. Refunds are credited to the original payment method. Digital products (certificates, downloads) are non-refundable once accessed.",
        },
        {
          title: "Enterprise licensing",
          icon: Building2,
          content: "Enterprise plans include: Custom number of user seats, Dedicated account manager, Custom integrations (LMS, SSO), Advanced analytics and reporting, Priority support with SLA, Custom branding options, Dedicated API access, Training and onboarding sessions. Contact our sales team at enterprise@actirova.com for a custom quote. Volume discounts available for 50+ users. Annual contracts include dedicated support and implementation assistance.",
        },
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

  const toggleCategory = (index) => {
    setExpandedCategory(expandedCategory === index ? null : index)
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
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">Help Center</h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8">
            Find in-depth guides and tutorials for getting the most out of Actirova
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

        {/* Detailed Articles */}
        <motion.div
          className="space-y-6 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          {helpCategories.map((category, categoryIndex) => {
            const Icon = category.icon
            return (
              <div key={categoryIndex} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(categoryIndex)}
                  className="w-full px-6 py-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center">
                      <Icon className="w-6 h-6 text-violet-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{category.title}</h3>
                      <p className="text-sm text-slate-500">{category.description}</p>
                    </div>
                  </div>
                  {expandedCategory === categoryIndex ? (
                    <ChevronUp className="w-5 h-5 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-500" />
                  )}
                </button>

                {/* Articles */}
                {expandedCategory === categoryIndex && (
                  <div className="border-t border-slate-200 dark:border-slate-700">
                    {category.articles.map((article, articleIndex) => {
                      const ArticleIcon = article.icon
                      return (
                        <div key={articleIndex} className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 last:border-b-0">
                          <div className="flex items-start gap-4">
                            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center flex-shrink-0">
                              <ArticleIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2">{article.title}</h4>
                              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{article.content}</p>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
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
              <a key={index} href="#" className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium hover:bg-violet-100 dark:hover:bg-violet-900/30 hover:text-violet-700 dark:hover:text-violet-400 transition-colors">
                {topic}
              </a>
            ))}
          </div>
        </motion.div>

        {/* FAQ Section */}
        <motion.div
          className="bg-white dark:bg-slate-800 rounded-2xl p-8 mb-12 border border-slate-200 dark:border-slate-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full px-5 py-4 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{faq.question}</span>
                  {expandedFaq === index ? (
                    <ChevronUp className="w-5 h-5 text-slate-500 flex-shrink-0 ml-2" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-500 flex-shrink-0 ml-2" />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="px-5 pb-5">
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Contact Support */}
        <motion.div
          className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-8 text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold mb-4 text-center">Still need help?</h2>
          <p className="opacity-90 mb-8 text-center max-w-xl mx-auto">
            Our support team is here to help you succeed. Get in touch and we'll respond as soon as possible.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5">
              <Mail className="w-7 h-7 mx-auto mb-3" />
              <h3 className="font-semibold mb-1 text-center">Email Support</h3>
              <p className="text-sm opacity-80 mb-3 text-center">24/7 response time</p>
              <a
                href="mailto:support@actirova.com"
                className="block bg-white text-violet-600 px-4 py-2 rounded-lg text-center font-medium hover:bg-white/90 transition-colors"
              >
                Send Email
              </a>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5">
              <MessageCircle className="w-7 h-7 mx-auto mb-3" />
              <h3 className="font-semibold mb-1 text-center">Live Chat</h3>
              <p className="text-sm opacity-80 mb-3 text-center">Pro & Enterprise only</p>
              <button className="w-full bg-white text-violet-600 px-4 py-2 rounded-lg font-medium hover:bg-white/90 transition-colors">
                Start Chat
              </button>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5">
              <Phone className="w-7 h-7 mx-auto mb-3" />
              <h3 className="font-semibold mb-1 text-center">Phone Support</h3>
              <p className="text-sm opacity-80 mb-3 text-center">Enterprise customers</p>
              <a
                href="tel:+1-555-0123"
                className="block bg-white text-violet-600 px-4 py-2 rounded-lg text-center font-medium hover:bg-white/90 transition-colors"
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
