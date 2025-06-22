
import { Sparkles } from "lucide-react"
import Link from "next/link"

export default function CTA({ handleGetStarted }) {
  return (
    <section className="py-18 bg-gradient-to-r from-blue-600 to-purple-600 my-20 max-w-5xl m-auto">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl font-bold text-white mb-4">Ready to Transform Your Learning?</h2>
        <p className="text-xl text-blue-100 mb-8">
          Join thousands of learners who are already achieving their goals with Actinova AI Tutor.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={handleGetStarted}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-gray-600 transition-all inline-flex items-center space-x-2 shadow-lg">
            <Sparkles className="w-5 h-5" />
            <span>Start Your Journey Today</span>
          </button>
          <Link
            href="/pricing"
            className="border-2 border-gray-300 text-white px-2 py-3 rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 dark:hover:text-blue-300 transition-all duration-500">
            View Pricing
          </Link>
        </div>
      </div>
    </section>
  )
};