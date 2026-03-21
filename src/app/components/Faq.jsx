"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";
import { data } from "../lib/landingData";
import { cn } from "../lib/utils";

export default function Faq() {
  const { faqs } = data;
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="py-24 bg-transparent relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50/60 border border-[#D2D7F8]/80 text-[#1a1a1a] text-[13px] font-medium mb-6 backdrop-blur-md"
          >
            <HelpCircle className="w-4 h-4 text-green-500" />
            Support
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-[#1a1a1a]"
          >
            Frequently Asked <span className="text-green-500">Questions</span>
          </motion.h2>
          <p className="text-lg text-[#1a1a1a]/60">
            Everything you need to know about Actirova AI Tutor.
          </p>
        </div>

        <div className="space-y-4">
          {(faqs || []).map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                "rounded-[24px] border-2 transition-all duration-300 backdrop-blur-lg overflow-hidden",
                openIndex === index
                  ? "border-[#D2D7F8] bg-white/60"
                  : "border-[#D2D7F8]/60 bg-green-50/40 hover:bg-white/40"
              )}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left"
              >
                <span className="text-lg font-bold text-[#1a1a1a]">{faq.question}</span>
                <ChevronDown className={cn(
                  "w-5 h-5 text-[#1a1a1a]/40 transition-transform duration-300",
                  openIndex === index && "rotate-180 text-green-500"
                )} />
              </button>

              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 text-[#1a1a1a]/60 leading-relaxed font-medium">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Still have questions? */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 p-12 rounded-[32px] bg-[#f1f5f9]/80 backdrop-blur-xl border-2 border-[#D2D7F8]/80 text-center relative overflow-hidden"
        >
          <h3 className="text-2xl font-bold mb-2 text-[#1a1a1a] relative z-10">Still have questions?</h3>
          <p className="text-[#1a1a1a]/60 mb-6 relative z-10 font-medium">We're here to help you on your learning journey.</p>
          <button className="relative z-10 px-8 py-3 bg-white border-2 border-white text-[#1a1a1a] rounded-full font-bold hover:bg-green-50 transition-all shadow-sm">
            Contact Support
          </button>
        </motion.div>
      </div>
    </section>
  );
}
