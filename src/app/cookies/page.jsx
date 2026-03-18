"use client"

import { motion } from "framer-motion"
import { Cookie, Shield, Eye, Settings, Trash2, CheckCircle, XCircle, Info, Mail, ArrowRight } from "lucide-react"
import Link from "next/link"
import HeroNavbar from "../components/heroNavbar"

export default function CookiesPage() {
  const cookieTypes = [
    {
      title: "Essential Cookies",
      description: "Required for the platform to function properly",
      icon: Shield,
      examples: ["Session authentication", "Security tokens", "Load balancing", "Language preferences"],
      required: true,
      duration: "Session",
    },
    {
      title: "Analytics Cookies",
      description: "Help us understand how visitors interact with our platform",
      icon: Eye,
      examples: ["Page views", "Time on page", "Navigation patterns", "Device information"],
      required: false,
      duration: "2 years",
    },
    {
      title: "Functional Cookies",
      description: "Enable enhanced functionality and personalization",
      icon: Settings,
      examples: ["Saved preferences", "Customization settings", "Chat history", "Bookmarked content"],
      required: false,
      duration: "1 year",
    },
    {
      title: "Marketing Cookies",
      description: "Used to deliver relevant advertisements",
      icon: Cookie,
      examples: ["Ad preferences", "Campaign performance", "Social media tracking", "Conversion tracking"],
      required: false,
      duration: "90 days",
    },
  ]

  const sections = [
    {
      title: "What Are Cookies",
      content: "Cookies are small text files that are placed on your computer or mobile device when you visit a website. They are widely used to make websites work more efficiently and provide information to website owners. Cookies allow websites to recognize your device and remember information about your visit, such as your preferred language, login information, and other settings. This can make your next visit easier and the site more useful to you.",
    },
    {
      title: "How We Use Cookies",
      content: "We use cookies for a variety of reasons, including to authenticate users, remember user preferences, analyze site traffic and trends, and improve our overall service. The specific cookies we use and the purposes for which we use them are described in this policy. We use both session cookies (which expire when you close your browser) and persistent cookies (which stay on your device for a set period of time) to keep you logged in and provide a personalized experience.",
    },
    {
      title: "Third-Party Cookies",
      content: "Some cookies are placed by third-party services that appear on our pages. We do not control these cookies. The third parties include analytics providers like Google Analytics, advertising networks, and social media platforms. These third parties may use cookies to track your activity across different websites to build a profile of your interests. You can opt out of these third-party cookies by visiting the Network Advertising Initiative opt-out page or the Google Analytics opt-out page.",
    },
    {
      title: "Managing Your Cookies",
      content: "You have the right to decide whether to accept or reject cookies. You can exercise your cookie preferences by clicking on the appropriate opt-out links provided in this policy or by adjusting your browser settings. Most web browsers allow you to control cookies through their settings preferences. However, if you limit the ability of websites to set cookies, you may worsen your overall user experience, since it won't be personalized to you anymore. It may also stop you from saving customized settings like login information.",
    },
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
            <Cookie className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">Cookie Policy</h1>
          <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Learn how we use cookies and similar technologies to enhance your experience on our platform.
          </p>
          <p className="text-sm text-slate-500 dark:text-slate-500 mt-4">Last updated: March 2026</p>
        </motion.div>

        {/* Quick Summary */}
        <motion.div
          className="bg-white dark:bg-slate-800 rounded-2xl p-8 mb-8 border border-slate-200 dark:border-slate-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Cookie Overview</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
            We use cookies to improve your experience on Actirova AI Tutor. Some cookies are essential for the platform to function, while others help us analyze usage and deliver personalized content. You can manage your cookie preferences at any time.
          </p>
          <div className="flex flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 bg-violet-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-violet-700 transition-colors">
              <Settings className="w-4 h-4" />
              Cookie Settings
            </button>
            <Link href="/privacy" className="inline-flex items-center gap-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 px-5 py-2.5 rounded-xl font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              Privacy Policy
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>

        {/* Cookie Types */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Types of Cookies We Use</h2>
          <div className="space-y-4">
            {cookieTypes.map((type, index) => (
              <div key={index} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${type.required ? 'bg-violet-100 dark:bg-violet-900/30' : 'bg-slate-100 dark:bg-slate-700'}`}>
                    <type.icon className={`w-6 h-6 ${type.required ? 'text-violet-600' : 'text-slate-600 dark:text-slate-400'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{type.title}</h3>
                      {type.required ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-xs font-semibold rounded-full">
                          <Shield className="w-3 h-3" /> Required
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs font-semibold rounded-full">
                          Optional
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 mb-3">{type.description}</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {type.examples.map((example, i) => (
                        <span key={i} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs font-medium rounded-lg">
                          {example}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-500">
                      <span className="font-semibold">Duration:</span> {type.duration}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Detailed Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <motion.div
              key={index}
              className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + index * 0.05 }}
            >
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">{section.title}</h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{section.content}</p>
            </motion.div>
          ))}
        </div>

        {/* Cookie Management */}
        <motion.div
          className="bg-white dark:bg-slate-800 rounded-2xl p-8 mt-8 border border-slate-200 dark:border-slate-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Managing Your Preferences</h2>
          
          <div className="space-y-4 mb-8">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-violet-600" />
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Essential Cookies</p>
                  <p className="text-sm text-slate-500">Required for platform functionality</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-violet-600">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Always Active</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-slate-600" />
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Analytics Cookies</p>
                  <p className="text-sm text-slate-500">Help us improve our platform</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:bg-slate-600 peer-checked:bg-violet-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-slate-600" />
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Functional Cookies</p>
                  <p className="text-sm text-slate-500">Enhance your experience</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:bg-slate-600 peer-checked:bg-violet-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <div className="flex items-center gap-3">
                <Cookie className="w-5 h-5 text-slate-600" />
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Marketing Cookies</p>
                  <p className="text-sm text-slate-500">Personalized advertisements</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:bg-slate-600 peer-checked:bg-violet-600"></div>
              </label>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button className="inline-flex items-center justify-center gap-2 bg-violet-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-violet-700 transition-colors">
              <CheckCircle className="w-5 h-5" />
              Save Preferences
            </button>
            <button className="inline-flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 px-6 py-3 rounded-xl font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
              <Trash2 className="w-5 h-5" />
              Reject All Optional
            </button>
          </div>
        </motion.div>

        {/* Browser Instructions */}
        <motion.div
          className="bg-white dark:bg-slate-800 rounded-2xl p-8 mt-8 border border-slate-200 dark:border-slate-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
        >
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Browser Cookie Settings</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Most browsers allow you to control cookies through their settings. Here's how to manage cookies in popular browsers:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Google Chrome</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Settings → Privacy → Cookies → Manage cookie settings</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Mozilla Firefox</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Options → Privacy → Enhanced Tracking Protection</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Safari</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Preferences → Privacy → Cookies</p>
            </div>
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Microsoft Edge</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Settings → Privacy → Cookies</p>
            </div>
          </div>
        </motion.div>

        {/* Updates */}
        <motion.div
          className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-8 mt-8 text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="flex items-center gap-4 mb-4">
            <Info className="w-8 h-8" />
            <h2 className="text-2xl font-bold">Policy Updates</h2>
          </div>
          <p className="text-violet-100 leading-relaxed mb-4">
            We may update this Cookie Policy from time to time to reflect changes in our practices or for operational, legal, or regulatory reasons. We will post any changes on this page and update the "Last updated" date at the top of this policy.
          </p>
          <p className="text-violet-100 leading-relaxed">
            We encourage you to review this policy periodically to stay informed about our use of cookies and related technologies.
          </p>
        </motion.div>

        {/* Contact */}
        <motion.div
          className="bg-white dark:bg-slate-800 rounded-2xl p-8 mt-8 text-center border border-slate-200 dark:border-slate-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Questions About Cookies?</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-xl mx-auto">
            If you have any questions about our Cookie Policy or how we use cookies, please contact our privacy team.
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
