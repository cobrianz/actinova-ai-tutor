"use client"

import { motion } from "framer-motion"
import { Shield, Eye, Lock, Users, Database, Globe, Mail, ArrowRight, CheckCircle, Server, HandHeart, Bell, Cookie, Trash2 } from "lucide-react"
import Link from "next/link"
import HeroNavbar from "../components/heroNavbar"

export default function PrivacyPage() {
  const sections = [
    {
      title: "Information We Collect",
      icon: Database,
      content: [
        "Account information (name, email, profile details)",
        "Learning progress and course completion data",
        "Usage analytics and interaction patterns",
        "Device information and technical data",
        "Communication preferences and settings",
        "Payment and billing information (processed securely)",
        "Social media profile data (when signing in with social accounts)",
      ],
    },
    {
      title: "How We Use Your Information",
      icon: Eye,
      content: [
        "Provide personalized learning experiences",
        "Generate AI-powered course recommendations",
        "Track your progress and achievements",
        "Improve our services and user experience",
        "Send important updates and notifications",
        "Analyze usage patterns to enhance our platform",
        "Process payments and manage subscriptions",
      ],
    },
    {
      title: "Data Security",
      icon: Lock,
      content: [
        "End-to-end encryption for sensitive data",
        "Regular security audits and monitoring",
        "Secure cloud infrastructure with AWS",
        "Access controls and authentication protocols",
        "GDPR and CCPA compliance measures",
        "Two-factor authentication available",
        "Automatic security updates and patches",
      ],
    },
    {
      title: "Sharing and Disclosure",
      icon: Users,
      content: [
        "We never sell your personal information",
        "Data shared only with your explicit consent",
        "Third-party integrations follow strict privacy standards",
        "Anonymous analytics for service improvement",
        "Legal compliance when required by law",
        "Service providers bound by confidentiality agreements",
      ],
    },
  ]

  const rights = [
    { icon: Eye, title: "Access", desc: "View your personal data anytime" },
    { icon: Trash2, title: "Deletion", desc: "Request account deletion" },
    { icon: Cookie, title: "Cookies", desc: "Manage cookie preferences" },
    { icon: Bell, title: "Notifications", desc: "Control communication settings" },
  ]

  const compliance = [
    { icon: Shield, title: "GDPR Compliant", desc: "European data protection standards" },
    { icon: Lock, title: "CCPA Compliant", desc: "California consumer privacy" },
    { icon: Server, title: "SOC 2 Type II", desc: "Security certification" },
    { icon: HandHeart, title: "COPPA Compliant", desc: "Children's privacy protection" },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <HeroNavbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-16">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-20 h-20 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">Privacy Policy</h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Your privacy is important to us. Learn how we collect, use, and protect your personal information.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-500 mt-4">Last updated: March 2026</p>
        </motion.div>

        {/* Compliance Badges */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {compliance.map((item, index) => (
            <div key={index} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center">
              <item.icon className="w-6 h-6 text-violet-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{item.title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-500">{item.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* Introduction */}
        <motion.div
          className="bg-white dark:bg-slate-800 rounded-2xl p-8 mb-8 border border-slate-200 dark:border-slate-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Introduction</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
            At Actirova AI Tutor, we are committed to protecting your privacy and ensuring the security of your personal
            information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when
            you use our AI-powered learning platform.
          </p>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            By using our services, you agree to the collection and use of information in accordance with this policy. We
            encourage you to read this policy carefully and contact us if you have any questions. Your trust is essential to our mission of providing quality AI-driven education.
          </p>
        </motion.div>

        {/* Privacy Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => {
            const Icon = section.icon
            return (
              <motion.div
                key={index}
                className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.05 }}
              >
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center">
                    <Icon className="w-6 h-6 text-violet-600" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{section.title}</h2>
                </div>
                <ul className="space-y-3">
                  {section.content.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-violet-500 mt-0.5 flex-shrink-0" />
                      <span className="text-slate-600 dark:text-slate-400">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )
          })}
        </div>

        {/* Data Retention */}
        <motion.div
          className="bg-white dark:bg-slate-800 rounded-2xl p-8 mt-8 border border-slate-200 dark:border-slate-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <div className="flex items-center gap-4 mb-5">
            <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center">
              <Database className="w-6 h-6 text-violet-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Data Retention</h2>
          </div>
          <p className="text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
            We retain your personal information only for as long as necessary to fulfill the purposes we collected it for, including for the purposes of satisfying any legal, accounting, or reporting requirements.
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-violet-500 mt-0.5 flex-shrink-0" />
              <span className="text-slate-600 dark:text-slate-400">Account data: Retained while your account is active, plus 30 days after deletion</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-violet-500 mt-0.5 flex-shrink-0" />
              <span className="text-slate-600 dark:text-slate-400">Learning progress: Available for download for 30 days after account deletion</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-violet-500 mt-0.5 flex-shrink-0" />
              <span className="text-slate-600 dark:text-slate-400">Analytics data: Anonymized and retained for up to 2 years for service improvement</span>
            </li>
          </ul>
        </motion.div>

        {/* Cookies Policy */}
        <motion.div
          className="bg-white dark:bg-slate-800 rounded-2xl p-8 mt-8 border border-slate-200 dark:border-slate-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
        >
          <div className="flex items-center gap-4 mb-5">
            <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center">
              <Cookie className="w-6 h-6 text-violet-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Cookies and Tracking</h2>
          </div>
          <p className="text-slate-600 dark:text-slate-400 mb-4 leading-relaxed">
            We use cookies and similar tracking technologies to track activity on our platform and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-violet-500 mt-0.5 flex-shrink-0" />
              <span className="text-slate-600 dark:text-slate-400">Essential cookies: Required for basic platform functionality</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-violet-500 mt-0.5 flex-shrink-0" />
              <span className="text-slate-600 dark:text-slate-400">Analytics cookies: Help us understand how visitors interact with our platform</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-violet-500 mt-0.5 flex-shrink-0" />
              <span className="text-slate-600 dark:text-slate-400">Marketing cookies: Used to deliver relevant advertisements</span>
            </li>
          </ul>
        </motion.div>

        {/* Your Rights */}
        <motion.div
          className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-8 mt-8 text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="flex items-center gap-4 mb-6">
            <Globe className="w-8 h-8" />
            <h2 className="text-2xl font-bold">Your Rights</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {rights.map((right, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <right.icon className="w-6 h-6 mb-2 text-violet-200" />
                <p className="font-semibold text-sm">{right.title}</p>
                <p className="text-xs text-violet-200">{right.desc}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3">Access & Control</h3>
              <ul className="space-y-1 text-violet-100 text-sm">
                <li>• View your personal data</li>
                <li>• Update your information</li>
                <li>• Download your data</li>
                <li>• Delete your account</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Privacy Controls</h3>
              <ul className="space-y-1 text-violet-100 text-sm">
                <li>• Opt-out of marketing emails</li>
                <li>• Control data sharing</li>
                <li>• Manage cookie preferences</li>
                <li>• Request data portability</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* International Transfers */}
        <motion.div
          className="bg-white dark:bg-slate-800 rounded-2xl p-8 mt-8 border border-slate-200 dark:border-slate-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.65 }}
        >
          <div className="flex items-center gap-4 mb-5">
            <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center">
              <Globe className="w-6 h-6 text-violet-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">International Data Transfers</h2>
          </div>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Your information may be transferred to and maintained on computers located outside of your state, province, country, or other governmental jurisdiction where the data protection laws may differ than from your jurisdiction. By using Actirova, you consent to such transfer and processing of your information in accordance with this policy.
          </p>
        </motion.div>

        {/* Contact */}
        <motion.div
          className="bg-white dark:bg-slate-800 rounded-2xl p-8 mt-8 text-center border border-slate-200 dark:border-slate-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Questions About Privacy?</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-xl mx-auto">
            If you have any questions about this Privacy Policy or our data practices, please don't hesitate to contact our privacy team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:privacy@actirova.com"
              className="inline-flex items-center justify-center gap-2 bg-violet-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-violet-700 transition-colors"
            >
              <Mail className="w-5 h-5" />
              Email Privacy Team
            </a>
            <Link
              href="/help"
              className="inline-flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 px-6 py-3 rounded-xl font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Visit Help Center
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
