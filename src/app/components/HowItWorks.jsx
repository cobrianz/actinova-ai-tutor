"use client";

import { motion } from "framer-motion";
import { UserPlus, Compass, BookOpen, GraduationCap, ChevronRight } from "lucide-react";
import { data } from "../lib/landingData";

export default function HowItWorks() {
  const { steps } = data;

  const icons = [UserPlus, Compass, BookOpen, GraduationCap];

  return (
    <section className="py-24 bg-secondary/30 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-6 tracking-tight"
          >
            How it <span className="text-gradient">Works</span>
          </motion.h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Starting your personalized learning journey is simple. Follow these four steps
            to master any skill with the help of AI.
          </p>
        </div>

        <div className="relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden lg:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-blue-600/20 to-transparent -translate-y-1/2" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
            {steps.map((step, index) => {
              const Icon = icons[index] || Compass;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="relative group flex flex-col items-center text-center"
                >
                  <div className="relative mb-8">
                    <div className="w-20 h-20 rounded-[2rem] bg-background border border-border-accent flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 group-hover:border-primary group-hover:shadow-primary/20 duration-500">
                      <Icon className="w-10 h-10 text-primary" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-foreground text-background text-sm font-bold flex items-center justify-center border-4 border-background">
                      {index + 1}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold mb-4">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed px-4">
                    {step.description}
                  </p>

                  {index < steps.length - 1 && (
                    <div className="hidden lg:flex absolute top-10 -right-4 w-8 h-8 items-center justify-center text-primary/30">
                      <ChevronRight className="w-6 h-6" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Feature Teaser */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24 p-1 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-blue-600/20 rounded-[3rem]"
        >
          <div className="bg-background rounded-[2.9rem] p-8 md:p-12 flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 text-blue-600 text-xs font-bold uppercase tracking-wider">
                Feature Highlight
              </div>
              <h3 className="text-3xl font-bold tracking-tight">
                AI-Generated Personalized Study Guides
              </h3>
              <p className="text-muted-foreground text-lg">
                Our AI analyzes your progress and learning style to generate custom
                study guides, practice problems, and concept maps tailored just for you.
              </p>
              <button className="flex items-center gap-2 text-blue-600 font-bold hover:gap-3 transition-all">
                Learn more about adaptive learning <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 w-full max-w-md bg-secondary/50 rounded-3xl aspect-video relative overflow-hidden border border-border-accent shadow-2xl">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full p-6 space-y-4">
                  {[1, 2, 3].map(i => (
                    <motion.div
                      key={i}
                      initial={{ x: -20, opacity: 0 }}
                      whileInView={{ x: 0, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.5 + i * 0.2 }}
                      className="h-12 bg-background rounded-xl border border-border-accent flex items-center px-4 gap-3"
                    >
                      <div className="w-6 h-6 rounded-full bg-blue-600/20" />
                      <div className="h-2 flex-1 bg-muted rounded-full" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
