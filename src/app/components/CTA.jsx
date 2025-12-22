import { Sparkles } from "lucide-react";
import Link from "next/link";

export default function CTA({ handleGetStarted }) {
  return (
    <section className="w-full">
      <div className="max-w-4xl mx-auto my-20 px-6 sm:px-8 md:px-12 lg:px-20 py-16 sm:py-20 lg:py-24 text-center rounded-none sm:rounded-lg bg-gradient-to-r from-blue-600 to-purple-600">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
          Ready to Transform Your Learning?
        </h2>
        <p className="text-lg sm:text-xl text-blue-100 mb-8">
          Join thousands of learners who are already achieving their goals with
          Actinova AI Tutor.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={handleGetStarted}
            className="bg-white border text-blue-600 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold text-base sm:text-lg hover:border-white hover:bg-transparent hover:text-white transition-all inline-flex items-center space-x-2 shadow-lg"
          >
            <Sparkles className="w-5 h-5" />
            <span>Start Your Journey Today</span>
          </button> 
          <Link
            href="/pricing"
            className="border-2 border-gray-300 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-lg font-semibold text-base sm:text-lg hover:bg-white hover:text-blue-600 dark:hover:text-blue-300 transition-all duration-500"
          >
            View Pricing
          </Link>
        </div>
      </div>
    </section>
  );
}
