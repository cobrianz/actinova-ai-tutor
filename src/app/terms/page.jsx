"use client"

import { motion } from "framer-motion"
import { FileText, Scale, Users, Shield, AlertTriangle, CheckCircle, Mail, Clock, BookOpen, Sparkles, Heart, Zap, Star, ArrowRight } from "lucide-react"
import Link from "next/link"
import HeroNavbar from "../components/heroNavbar"

export default function TermsPage() {
  const sections = [
    {
      title: "Acceptance of Terms",
      icon: CheckCircle,
      content: "By accessing and using Actirova AI Tutor, you accept and agree to be bound by the terms and provision of this agreement. These terms apply to all users of the service, including without limitation users who are browsers, vendors, customers, merchants, and contributors of content. Your continued use of our platform constitutes your agreement to these terms.",
    },
    {
      title: "Use License",
      icon: Scale,
      content: "Permission is granted to temporarily access and use Actirova AI Tutor for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not: modify or copy the materials, use the materials for any commercial purpose or for any public display, attempt to reverse engineer any software contained on the website, or remove any copyright or other proprietary notations from the materials.",
    },
    {
      title: "User Accounts",
      icon: Users,
      content: "When you create an account with us, you must provide information that is accurate, complete, and current at all times. You are responsible for safeguarding the password and for all activities that occur under your account. You agree not to disclose your password to any third party and to take sole responsibility for activities under your account.",
    },
    {
      title: "Prohibited Uses",
      icon: AlertTriangle,
      content: "You may not use our service: for any unlawful purpose or to solicit others to perform unlawful acts, to violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances, to infringe upon or violate our intellectual property rights or the intellectual property rights of others, to harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate, to submit false or misleading information, or to upload or transmit viruses or any other type of malicious code.",
    },
    {
      title: "Content and Intellectual Property",
      icon: Shield,
      content: "Our service and its original content, features, and functionality are and will remain the exclusive property of Actirova AI Tutor and its licensors. The service is protected by copyright, trademark, and other laws. Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent.",
    },
    {
      title: "Limitation of Liability",
      icon: AlertTriangle,
      content: "In no event shall Actirova AI Tutor, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the service.",
    },
    {
      title: "Service Changes",
      icon: Zap,
      content: "We reserve the right to modify or replace these Terms at any time. We will provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion. By continuing to access or use our service after those revisions become effective, you agree to be bound by the revised terms.",
    },
    {
      title: "Governing Law",
      icon: BookOpen,
      content: "These Terms shall be governed and construed in accordance with the laws of the jurisdiction in which Actirova AI Tutor operates, without regard to its conflict of law provisions. Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights.",
    },
  ]

  const features = [
    { icon: BookOpen, title: "AI-Powered Learning", desc: "Personalized education powered by advanced artificial intelligence" },
    { icon: Shield, title: "Secure Platform", desc: "Enterprise-grade security to protect your data" },
    { icon: Heart, title: "User-Centric Design", desc: "Built with your learning needs in mind" },
    { icon: Star, title: "Quality Content", desc: "Expert-crafted curriculum and materials" },
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
            <FileText className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">Terms of Service</h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Please read these terms carefully before using our AI-powered learning platform.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-500 mt-4">Last updated: March 2026</p>
        </motion.div>

        {/* Features Banner */}
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
            Welcome to Actirova AI Tutor. These Terms of Service ("Terms") govern your use of our website and services
            operated by Actirova AI Tutor ("us", "we", or "our").
          </p>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
            Your access to and use of the service is conditioned on your acceptance of and compliance with these Terms.
            These Terms apply to all visitors, users, and others who access or use the service. By accessing or using the service,
            you agree to be bound by these Terms.
          </p>
        </motion.div>

        {/* Terms Sections */}
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
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{section.content}</p>
              </motion.div>
            )
          })}
        </div>

        {/* Additional Content - FAQ */}
        <motion.div
          className="bg-white dark:bg-slate-800 rounded-2xl p-8 mt-8 border border-slate-200 dark:border-slate-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">Can I use Actirova for commercial purposes?</h3>
              <p className="text-slate-600 dark:text-slate-400">Our service is primarily designed for personal, non-commercial learning. Commercial use of our platform requires separate licensing. Please contact our business development team for enterprise solutions.</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">What happens if I violate these terms?</h3>
              <p className="text-slate-600 dark:text-slate-400">We reserve the right to suspend or terminate your account without prior notice if you violate these Terms. Repeated violations may result in permanent account suspension and legal action where appropriate.</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">How do I report copyright infringement?</h3>
              <p className="text-slate-600 dark:text-slate-400">If you believe your copyrighted work has been infringed, please send a detailed notice to our legal team at legal@actirova.com with the nature of the infringement and your contact information.</p>
            </div>
          </div>
        </motion.div>

        {/* Important Notice */}
        <motion.div
          className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-8 mt-8 text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <div className="flex items-center gap-4 mb-4">
            <AlertTriangle className="w-8 h-8" />
            <h2 className="text-2xl font-bold">Important Notice</h2>
          </div>
          <p className="text-violet-100 mb-3 leading-relaxed">
            These terms may be updated from time to time. We will notify you of any changes by posting the new Terms of
            Service on this page and updating the "Last updated" date.
          </p>
          <p className="text-violet-100 leading-relaxed">
            You are advised to review these Terms periodically for any changes. Changes to these Terms are effective
            when they are posted on this page. Your continued use of the platform after any changes constitutes acceptance of the new terms.
          </p>
        </motion.div>

        {/* Contact */}
        <motion.div
          className="bg-white dark:bg-slate-800 rounded-2xl p-8 mt-8 text-center border border-slate-200 dark:border-slate-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Questions About These Terms?</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-xl mx-auto">
            If you have any questions about these Terms of Service, please reach out to our legal team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="mailto:legal@actirova.com"
              className="inline-flex items-center justify-center gap-2 bg-violet-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-violet-700 transition-colors"
            >
              <Mail className="w-5 h-5" />
              Contact Legal Team
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
