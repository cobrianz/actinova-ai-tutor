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
    <section className="py-24 bg-secondary/30 relative overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4"
          >
            <HelpCircle className="w-4 h-4" />
            Support
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold tracking-tight mb-4"
          >
            Frequently Asked <span className="text-gradient">Questions</span>
          </motion.h2>
          <p className="text-lg text-muted-foreground">
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
                "rounded-2xl border transition-all duration-300",
                openIndex === index
                  ? "border-primary/30 bg-background shadow-xl shadow-primary/5"
                  : "border-border-accent bg-background/50 hover:bg-background"
              )}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left"
              >
                <span className="text-lg font-semibold">{faq.question}</span>
                <ChevronDown className={cn(
                  "w-5 h-5 text-muted-foreground transition-transform duration-300",
                  openIndex === index && "rotate-180 text-primary"
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
                    <div className="px-6 pb-6 text-muted-foreground leading-relaxed">
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
          className="mt-16 p-8 rounded-3xl bg-primary text-primary-foreground text-center"
        >
          <h3 className="text-xl font-bold mb-2">Still have questions?</h3>
          <p className="opacity-80 mb-6">We're here to help you on your learning journey.</p>
          <button className="px-6 py-3 bg-background text-foreground rounded-xl font-semibold hover:bg-opacity-90 transition-all">
            Contact Support
          </button>
        </motion.div>
      </div>
    </section>
  );
}
