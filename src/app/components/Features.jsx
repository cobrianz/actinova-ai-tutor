"use client";

import { motion } from "framer-motion";
import { 
  Zap, 
  Brain, 
  Target, 
  TrendingUp, 
  Clock, 
  Shield, 
  BookOpen, 
  Smartphone,
  ChevronRight
} from "lucide-react";
import { data } from "../lib/landingData";

export default function Features() {
  const { features } = data;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  // Map icons to features (fallback to Zap if not found)
  const iconMap = {
    "Personalized Paths": Brain,
    "Smart Progress": TrendingUp,
    "Real-time Feedback": Zap,
    "Expert Content": BookOpen,
    "Learn Anywhere": Smartphone,
    "Secure & Private": Shield,
  };

  return (
    <section id="features" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-[#1a1a1a]"
          >
            Supercharge Your <span className="text-green-500">Learning Experience</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-lg text-[#1a1a1a]/60 max-w-2xl mx-auto"
          >
            Discover a suite of intelligent tools designed to help you learn faster, 
            retain more, and achieve your educational goals with ease.
          </motion.p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
            {(features || []).map((feature, index) => {
              const Icon = iconMap[feature.title] || Zap;
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ y: -5 }}
                  className="group relative p-8 rounded-[32px] border-2 border-[#D2D7F8]/80 bg-green-50/40 backdrop-blur-lg hover:bg-green-50/70 transition-all cursor-pointer overflow-hidden"
                >
                  <div className="absolute top-0 left-[-100%] w-1/2 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12 group-hover:left-[200%] transition-all duration-1000 ease-out" />
                  
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-white/80 border border-[#D2D7F8]/80 flex items-center justify-center mb-6 group-hover:bg-[#1a1a1a] transition-colors">
                      <Icon className="w-6 h-6 text-[#1a1a1a] group-hover:text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-[#1a1a1a]">
                      {feature.title}
                    </h3>
                    <p className="text-[#1a1a1a]/60 leading-relaxed">
                      {feature.description}
                    </p>
                    
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight className="w-5 h-5 text-[#1a1a1a]/40" />
                    </div>
                  </div>
                </motion.div>
            );
          })}
        </motion.div>

        {/* Highlight Section / Social Proof */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-20 p-8 md:p-12 rounded-[32px] bg-green-200/90 backdrop-blur-xl border-2 border-white text-[#1a1a1a] relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-green-400/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-green-400/30 transition-colors" />
          
          <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-3xl md:text-4xl font-bold mb-6 leading-tight text-[#1a1a1a]">
                Ready to transform your learning journey?
              </h3>
              <p className="text-[#1a1a1a]/60 text-lg mb-8">
                Join 50,000+ students who are already using Actirova AI to accelerate their growth.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex -space-x-4">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-white overflow-hidden shadow-sm">
                      <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="User" />
                    </div>
                  ))}
                </div>
                <div className="flex flex-col justify-center ml-2">
                  <div className="flex items-center gap-1 text-yellow-400">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 fill-current" />)}
                  </div>
                  <span className="text-sm font-medium text-[#1a1a1a]/80">4.9/5 from 2,000+ reviews</span>
                </div>
              </div>
            </div>
            <div className="bg-white/60 backdrop-blur-md rounded-[24px] p-6 border-2 border-white shadow-sm">
              <div className="space-y-4">
                {[
                  { label: "Adaptive Learning Rate", value: "94%" },
                  { label: "Retention Improvement", value: "2.4x" },
                  { label: "Completion Rate", value: "88%" }
                ].map((stat, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-[#1a1a1a]/60">{stat.label}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-black/5 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          whileInView={{ width: "100%" }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.5 + i*0.1, duration: 1 }}
                          className="h-full bg-green-500"
                        />
                      </div>
                      <span className="text-lg font-bold text-[#1a1a1a]">{stat.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Star({ className }) {
  return (
    <svg 
      className={className} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
