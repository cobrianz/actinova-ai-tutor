import { Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function CTA({ handleGetStarted }) {
  return (
    <section className="w-full relative py-20 lg:py-32 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-400/20 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-purple-400/20 to-transparent rounded-full blur-3xl"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8 md:px-12 lg:px-20 py-16 sm:py-24 lg:py-32 text-center rounded-3xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 shadow-2xl shadow-purple-500/30 border border-white/20 backdrop-blur-xl"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
            Ready to Transform Your Learning?
          </h2>
          <p className="text-lg sm:text-xl text-blue-100 mb-12 leading-relaxed">
            Join thousands of learners who are already achieving their goals with
            Actinova AI Tutor. Start your free trial today.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleGetStarted}
            className="bg-white text-blue-600 px-8 sm:px-10 py-4 sm:py-5 rounded-xl font-bold text-lg sm:text-xl hover:shadow-2xl hover:shadow-white/20 transition-all inline-flex items-center space-x-3 shadow-lg"
          >
            <Sparkles className="w-6 h-6" />
            <span>Start Your Journey Today</span>
            <ArrowRight className="w-5 h-5" />
          </motion.button>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href="/pricing"
              className="border-2 border-white/80 text-white px-8 sm:px-10 py-4 sm:py-5 rounded-xl font-bold text-lg sm:text-xl hover:bg-white hover:text-blue-600 transition-all duration-300 inline-flex items-center space-x-2"
            >
              <span>View Pricing Plans</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Bottom decoration */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
          className="mt-12 text-sm text-blue-100 flex items-center justify-center space-x-2"
        >
          <div className="h-px w-8 bg-blue-100/30"></div>
          <span>No credit card required • Start free today</span>
          <div className="h-px w-8 bg-blue-100/30"></div>
        </motion.div>
      </motion.div>
    </section>
  );
}
