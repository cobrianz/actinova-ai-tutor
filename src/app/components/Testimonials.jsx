"use client";

import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import { data } from "../lib/landingData";

export default function Testimonials() {
  const { testimonials } = data;

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-6 tracking-tight"
          >
            Loved by <span className="text-gradient">Learners Worldwide</span>
          </motion.h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Don't just take our word for it. Hear from the students and professionals
            who have transformed their learning with Actinova AI.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="relative p-8 rounded-3xl border border-border-accent bg-card hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300"
            >
              <Quote className="absolute top-6 right-8 w-10 h-10 text-primary/10" />

              <div className="flex gap-1 mb-6">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>

              <p className="text-lg text-foreground/90 italic mb-8 relative z-10">
                "{testimonial.content}"
              </p>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold border-2 border-background shadow-lg shadow-blue-500/10">
                  {testimonial.name[0]}
                </div>
                <div>
                  <div className="font-bold text-foreground">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Feature Quote */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-20 p-12 rounded-[3rem] bg-primary/5 border border-primary/10 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.1)_0,transparent_70%)]" />
          <h3 className="text-2xl md:text-3xl font-bold text-primary mb-6 relative z-10">
            "The most effective way to learn in the 21st century."
          </h3>
          <p className="text-muted-foreground font-medium relative z-10 uppercase tracking-widest text-sm">
            — Educational Technology Review 2026
          </p>
        </motion.div>
      </div>
    </section>
  );
}
