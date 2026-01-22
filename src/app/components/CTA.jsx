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
          className="relative rounded-[3rem] bg-foreground text-background p-12 md:p-20 overflow-hidden text-center"
        >
          {/* Decorative backgrounds */}
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_0%,rgba(99,102,241,0.15)_0,transparent_50%)]" />
          <div className="absolute bottom-0 right-0 w-full h-full bg-[radial-gradient(circle_at_100%_100%,rgba(139,92,246,0.15)_0,transparent_50%)]" />
          
          <div className="relative z-10 max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold mb-8"
            >
              <Sparkles className="w-4 h-4" />
              Join the Future of Learning
            </motion.div>

            <h2 className="text-4xl md:text-6xl font-bold mb-8 leading-[1.1] tracking-tight">
              Start your journey to <span className="text-primary">mastery</span> today.
            </h2>
            
            <p className="text-lg md:text-xl text-background/70 mb-12 leading-relaxed">
              Experience the power of personalized AI tutoring. No credit card required 
              to start. Cancel anytime.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
              <button
                onClick={handleGetStarted}
                className="group w-full sm:w-auto px-10 py-5 bg-primary text-primary-foreground rounded-2xl font-bold text-lg hover:shadow-[0_0_40px_rgba(99,102,241,0.4)] transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
              >
                Get Started for Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="w-full sm:w-auto px-10 py-5 bg-background/10 hover:bg-background/20 text-background rounded-2xl font-bold text-lg border border-background/20 transition-all">
                Schedule a Demo
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-background/60 font-medium">
              {[
                "No credit card required",
                "14-day free trial",
                "Advanced AI features",
                "24/7 Support"
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
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
