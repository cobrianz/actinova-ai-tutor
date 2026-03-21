"use client";

import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import { data } from "../lib/landingData";

export default function Testimonials() {
  const { testimonials } = data;

  return (
    <section id="testimonials" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-[#1a1a1a]"
          >
            Loved by <span className="text-green-500">Learners Worldwide</span>
          </motion.h2>
          <p className="text-lg text-[#1a1a1a]/60 max-w-2xl mx-auto">
            Don't just take our word for it. Hear from the students and professionals
            who have transformed their learning with Actirova AI.
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
              className="relative p-8 rounded-[32px] border-2 border-white bg-white/40 backdrop-blur-md hover:bg-white/60 transition-all duration-300"
            >
              <Quote className="absolute top-6 right-8 w-10 h-10 text-green-500/20" />

              <div className="flex gap-1 mb-6">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>

              <p className="text-lg text-[#1a1a1a]/90 italic mb-8 relative z-10">
                "{testimonial.content}"
              </p>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full border-2 border-white bg-white flex items-center justify-center text-[#1a1a1a] font-bold shadow-sm">
                  {testimonial.name[0]}
                </div>
                <div>
                  <div className="font-bold text-[#1a1a1a]">{testimonial.name}</div>
                  <div className="text-sm text-[#1a1a1a]/60">{testimonial.role}</div>
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
          className="mt-20 p-12 rounded-[3rem] bg-green-50/40 backdrop-blur-xl border-2 border-white text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(34,197,94,0.1)_0,transparent_70%)]" />
          <h3 className="text-2xl md:text-3xl font-bold text-[#1a1a1a] mb-6 relative z-10">
            "The most effective way to learn in the 21st century."
          </h3>
          <p className="text-[#1a1a1a]/60 font-medium relative z-10 uppercase tracking-widest text-sm">
            — Educational Technology Review 2026
          </p>
        </motion.div>
      </div>
    </section>
  );
}
