"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";

export default function CTA({ handleGetStarted }) {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-[3rem] bg-green-50/80 backdrop-blur-xl border-2 border-[#D2D7F8]/80 text-[#1a1a1a] p-12 md:p-20 overflow-hidden text-center shadow-sm"
        >
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            <img 
              src="/bg.png" 
              alt="CTA Background" 
              className="w-full h-full object-cover"
            />
          </div>

          {/* Removed decorative backgrounds for clear bg.png view */}
          
          <div className="relative z-10 max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 border border-[#D2D7F8]/80 text-white text-[13px] font-medium mb-8 backdrop-blur-md"
            >
              <Sparkles className="w-4 h-4 text-green-500" />
              Join the Future of Learning
            </motion.div>

            <h2 className="text-4xl md:text-6xl font-bold mb-8 leading-[1.1] tracking-tight text-white">
              Start your journey to <span className="text-green-400">mastery</span> today.
            </h2>
            
            <p className="text-lg md:text-xl text-white/80 mb-12 leading-relaxed">
              Experience the power of personalized AI tutoring. No credit card required 
              to start. Cancel anytime.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
              <button
                onClick={handleGetStarted}
                className="group w-full sm:w-auto px-8 py-4 bg-white border-2 border-[#D2D7F8]/80 text-[#1a1a1a] rounded-full font-bold text-base transition-all hover:bg-green-50 active:scale-95 flex items-center justify-center gap-2 shadow-sm"
              >
                Get Started for Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="w-full sm:w-auto px-8 py-4 bg-transparent hover:bg-white/20 text-white rounded-full font-bold text-base border-2 border-[#D2D7F8]/80 transition-all">
                Schedule a Demo
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-white/80 font-medium">
              {[
                "No credit card required",
                "14-day free trial",
                "Advanced AI features",
                "24/7 Support"
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
