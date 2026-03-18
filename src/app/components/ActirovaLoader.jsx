"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ActirovaLoader({ text = "course" }) {
  const loadingText =
    text === "flashcards"
      ? "Preparing your flashcards..."
      : text === "quiz" || text.includes("test")
        ? "Creating your quiz..."
        : text.includes("questions")
          ? "Generating your questions..."
          : text === "report" ? "Synthesizing research nodes..." : "Preparing your course...";

  const statuses = [
    "Neural Engine Active",
    "Calibrating AI logic...",
    "Retrieving context...",
    "Optimizing output...",
    "Securing connection...",
    "Researching nodes..."
  ];

  const [statusIndex, setStatusIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % statuses.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [statuses.length]);

  return (
    <div
      data-actirova-loader="true"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-white dark:bg-[#020617]"
    >
      {/* Premium Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.4, 1],
            rotate: [0, 45, 0],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-[20%] -left-[10%] w-[80%] h-[80%] rounded-full bg-gradient-to-br from-blue-600/30 to-indigo-600/10 blur-[150px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            x: [0, -50, 0],
            opacity: [0.1, 0.25, 0.1]
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-[10%] -right-[10%] w-[70%] h-[70%] rounded-full bg-gradient-to-tr from-purple-600/20 to-pink-600/10 blur-[130px]"
        />

        {/* Animated Particles/Grid Effect */}
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] mix-blend-overlay" />
      </div>

      <div className="relative flex flex-col items-center gap-12">
        {/* Central Neural Core - Enhanced */}
        <div className="relative w-56 h-56 flex items-center justify-center">
          {/* Static Ambient Glow */}
          <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-[80px] animate-pulse" />

          {/* Expanded Wave Rings */}
          {[1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{
                scale: [0.5, 2],
                opacity: [0.5, 0]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                delay: i * 1,
                ease: "easeOut"
              }}
              className="absolute inset-0 border-[0.5px] border-blue-400/40 rounded-full"
            />
          ))}

          {/* Main Core Shell */}
          <motion.div
            animate={{
              y: [0, -10, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="relative z-10 w-32 h-32 flex items-center justify-center bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_20px_50px_rgba(59,130,246,0.15)] border border-blue-500/20 ring-1 ring-white/50 dark:ring-white/5"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/10 to-transparent rounded-[2.5rem]" />
            <img
              src="/logo.png"
              alt="Actirova Logo"
              className="w-16 h-16 object-contain relative z-20 drop-shadow-2xl"
            />

            {/* Concentric Orbitals */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-6 border border-dashed border-blue-400/30 rounded-full"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-12 border border-dotted border-purple-400/20 rounded-full"
            />

            {/* Pulse Points */}
            {[0, 90, 180, 270].map((angle) => (
              <motion.div
                key={angle}
                className="absolute w-1.5 h-1.5 bg-blue-400 rounded-full shadow-[0_0_8px_#60a5fa]"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${angle}deg) translate(80px) rotate(-${angle}deg)`
                }}
                animate={{
                  opacity: [0.3, 1, 0.3],
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: angle / 360
                }}
              />
            ))}
          </motion.div>
        </div>

        {/* Content Section */}
        <div className="flex flex-col items-center gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center"
          >
            <h2 className="text-3xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-white dark:to-blue-400 mb-2">
              Actirova
            </h2>
            <div className="h-1 w-12 bg-blue-600/20 rounded-full mb-6" />

            <AnimatePresence mode="wait">
              <motion.p
                key={statusIndex}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-slate-500 dark:text-slate-400 font-bold tracking-[0.05em] uppercase text-[10px] text-center"
              >
                {statuses[statusIndex]}
              </motion.p>
            </AnimatePresence>

            <p className="mt-4 text-slate-400 dark:text-slate-500 font-medium text-xs">
              {loadingText}
            </p>

            {/* Neural Sync Bar */}
            <div className="mt-8 relative w-48 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                animate={{
                  x: ['-100%', '100%']
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-blue-500 to-transparent"
              />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer Meta Data */}
      <div className="absolute bottom-12 flex items-center gap-3 px-4 py-2 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10">
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              className="w-1 h-1 bg-green-500 rounded-full"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
