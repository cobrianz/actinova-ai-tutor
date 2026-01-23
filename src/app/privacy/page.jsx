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
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/dashboard" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-foreground">Actinova AI Tutor</span>
            </Link>
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground transition-colors"
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
          <h1 className="text-4xl font-bold text-foreground mb-4">Privacy Policy</h1>
          <p className="text-xl text-muted-foreground">
            Your privacy is important to us. Learn how we collect, use, and protect your information.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">Last updated: December 2024</p>
        </motion.div>

        {/* Introduction */}
        <motion.div
          className="bg-card rounded-2xl shadow-lg p-8 mb-8 border border-border"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className="text-2xl font-bold text-foreground mb-4">Introduction</h2>
          <p className="text-muted-foreground mb-4">
            At Actinova AI Tutor, we are committed to protecting your privacy and ensuring the security of your personal
            information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when
            you use our AI-powered learning platform.
          </p>
          <p className="text-muted-foreground">
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
                className="bg-card rounded-2xl shadow-lg p-8 border border-border"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">{section.title}</h2>
                </div>
                <ul className="space-y-3">
                  {section.content.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-muted-foreground">{item}</span>
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
          className="bg-card rounded-2xl shadow-lg p-8 mt-8 text-center border border-border"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <h2 className="text-2xl font-bold text-foreground mb-4">Questions About Privacy?</h2>
          <p className="text-muted-foreground mb-6">
            If you have any questions about this Privacy Policy or our data practices, please don't hesitate to contact
            us.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:privacy@actinova.com"
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Email Privacy Team
            </a>
            <Link
              href="/help"
              className="border border-border text-foreground px-6 py-3 rounded-lg hover:bg-secondary transition-colors"
            >
              Visit Help Center
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
