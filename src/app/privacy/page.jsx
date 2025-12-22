"use client"

import { motion } from "framer-motion"
import { Shield, Eye, Lock, Users, Database, Globe } from "lucide-react"
import Link from "next/link"

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
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navigation */}
      <nav className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
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

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Privacy Policy</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300">
            Your privacy is important to us. Learn how we collect, use, and protect your information.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Last updated: December 2024</p>
        </motion.div>

        {/* Introduction */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Introduction</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            At Actinova AI Tutor, we are committed to protecting your privacy and ensuring the security of your personal
            information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when
            you use our AI-powered learning platform.
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            By using our services, you agree to the collection and use of information in accordance with this policy. We
            encourage you to read this policy carefully and contact us if you have any questions.
          </p>
        </motion.div>

        {/* Privacy Sections */}
        <div className="space-y-8">
          {sections.map((section, index) => {
            const Icon = section.icon
            return (
              <motion.div
                key={index}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{section.title}</h2>
                </div>
                <ul className="space-y-3">
                  {section.content.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-600 dark:text-gray-300">{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )
          })}
        </div>

        {/* Your Rights */}
        <motion.div
          className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg p-8 mt-8 text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="flex items-center space-x-3 mb-6">
            <Globe className="w-8 h-8" />
            <h2 className="text-2xl font-bold">Your Rights</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Access & Control</h3>
              <ul className="space-y-1 text-blue-100">
                <li>• View your personal data</li>
                <li>• Update your information</li>
                <li>• Download your data</li>
                <li>• Delete your account</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Privacy Controls</h3>
              <ul className="space-y-1 text-blue-100">
                <li>• Opt-out of marketing emails</li>
                <li>• Control data sharing</li>
                <li>• Manage cookie preferences</li>
                <li>• Request data portability</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Contact */}
        <motion.div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 mt-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Questions About Privacy?</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            If you have any questions about this Privacy Policy or our data practices, please don't hesitate to contact
            us.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:privacy@actinova.com"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Email Privacy Team
            </a>
            <Link
              href="/help"
              className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Visit Help Center
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
