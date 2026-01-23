"use client"

import { motion } from "framer-motion"
import { FileText, Scale, Users, Shield, AlertTriangle, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function TermsPage() {
  const sections = [
    {
      title: "Acceptance of Terms",
      icon: CheckCircle,
      content:
        "By accessing and using Actinova AI Tutor, you accept and agree to be bound by the terms and provision of this agreement. These terms apply to all users of the service, including without limitation users who are browsers, vendors, customers, merchants, and contributors of content.",
    },
    {
      title: "Use License",
      icon: Scale,
      content:
        "Permission is granted to temporarily access and use Actinova AI Tutor for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not: modify or copy the materials, use the materials for any commercial purpose or for any public display, attempt to reverse engineer any software contained on the website, or remove any copyright or other proprietary notations from the materials.",
    },
    {
      title: "User Accounts",
      icon: Users,
      content:
        "When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password and for all activities that occur under your account. You agree not to disclose your password to any third party and to take sole responsibility for activities under your account.",
    },
    {
      title: "Prohibited Uses",
      icon: AlertTriangle,
      content:
        "You may not use our service: for any unlawful purpose or to solicit others to perform unlawful acts, to violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances, to infringe upon or violate our intellectual property rights or the intellectual property rights of others, to harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate, to submit false or misleading information, or to upload or transmit viruses or any other type of malicious code.",
    },
    {
      title: "Content and Intellectual Property",
      icon: Shield,
      content:
        "Our service and its original content, features, and functionality are and will remain the exclusive property of Actinova AI Tutor and its licensors. The service is protected by copyright, trademark, and other laws. Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent.",
    },
    {
      title: "Termination",
      icon: FileText,
      content:
        "We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms. If you wish to terminate your account, you may simply discontinue using the service.",
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
                <FileText className="w-5 h-5 text-white" />
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
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">Terms of Service</h1>
          <p className="text-xl text-muted-foreground">
            Please read these terms carefully before using our service.
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
            Welcome to Actinova AI Tutor. These Terms of Service ("Terms") govern your use of our website and services
            operated by Actinova AI Tutor ("us", "we", or "our").
          </p>
          <p className="text-muted-foreground">
            Your access to and use of the service is conditioned on your acceptance of and compliance with these Terms.
            These Terms apply to all visitors, users, and others who access or use the service.
          </p>
        </motion.div>

        {/* Terms Sections */}
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
                <p className="text-muted-foreground leading-relaxed">{section.content}</p>
              </motion.div>
            )
          })}
        </div>

        {/* Important Notice */}
        <motion.div
          className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl shadow-lg p-8 mt-8 text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="w-8 h-8" />
            <h2 className="text-2xl font-bold">Important Notice</h2>
          </div>
          <p className="text-amber-100 mb-4">
            These terms may be updated from time to time. We will notify you of any changes by posting the new Terms of
            Service on this page and updating the "Last updated" date.
          </p>
          <p className="text-amber-100">
            You are advised to review these Terms periodically for any changes. Changes to these Terms are effective
            when they are posted on this page.
          </p>
        </motion.div>

        {/* Contact */}
        <motion.div
          className="bg-card rounded-2xl shadow-lg p-8 mt-8 text-center border border-border"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <h2 className="text-2xl font-bold text-foreground mb-4">Questions About These Terms?</h2>
          <p className="text-muted-foreground mb-6">
            If you have any questions about these Terms of Service, please contact us.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:legal@actinova.com"
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Contact Legal Team
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
