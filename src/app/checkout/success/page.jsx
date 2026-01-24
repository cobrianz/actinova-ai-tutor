"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Crown,
  Zap,
  PartyPopper,
  Download,
  Book,
} from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("ref") || searchParams.get("reference") || searchParams.get("session_id");
  const [isVerifying, setIsVerifying] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    if (sessionId) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#a855f7", "#6366f1", "#ec4899", "#f59e0b"],
      });

      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ["#a855f7", "#6366f1"],
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ["#ec4899", "#f59e0b"],
        });
      }, 300);

      setIsVerifying(false);
      setVerified(true);
    } else {
      router.push("/checkout");
    }
  }, [sessionId, router]);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground font-medium">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50 dark:opacity-100">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 right-1/3 w-64 h-64 bg-violet-600/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", duration: 0.6 }}
          className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center mb-8 shadow-lg shadow-emerald-500/30"
        >
          <CheckCircle2 className="w-12 h-12 text-white" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <PartyPopper className="w-6 h-6 text-amber-400" />
            <span className="text-amber-400 font-medium">Welcome to Premium!</span>
            <PartyPopper className="w-6 h-6 text-amber-400 transform scale-x-[-1]" />
          </div>

          <h1
            className="text-3xl md:text-5xl font-bold text-foreground mb-4"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Payment Successful!
          </h1>

          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Your subscription is now active. You have full access to all premium
            features.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card/50 backdrop-blur-xl rounded-2xl border border-border p-8 max-w-lg w-full mb-8"
        >
          <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            What's Unlocked for You
          </h2>

          <div className="space-y-4">
            {[
              {
                icon: Zap,
                title: "Unlimited AI Courses",
                description: "Generate as many courses as you need",
                color: "text-purple-400",
                bg: "bg-purple-500/10",
              },
              {
                icon: Book,
                title: "Advanced Learning Tools",
                description: "Quizzes, flashcards, and detailed analytics",
                color: "text-indigo-400",
                bg: "bg-indigo-500/10",
              },
              {
                icon: Download,
                title: "Offline Downloads",
                description: "Access your courses anywhere, anytime",
                color: "text-emerald-400",
                bg: "bg-emerald-500/10",
              },
              {
                icon: Crown,
                title: "Priority Support",
                description: "Get help from our team within 24 hours",
                color: "text-amber-400",
                bg: "bg-amber-500/10",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-start gap-4 p-4 rounded-xl bg-secondary/30"
              >
                <div
                  className={`w-10 h-10 rounded-lg ${feature.bg} flex items-center justify-center flex-shrink-0`}
                >
                  <feature.icon className={`w-5 h-5 ${feature.color}`} />
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link
            href="/dashboard?celebrate=true"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 transition-all group"
          >
            Go to Dashboard
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            href="/explore"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl font-semibold text-muted-foreground bg-secondary hover:bg-secondary/80 transition-all border border-border"
          >
            <Sparkles className="w-4 h-4" />
            Explore Courses
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-sm text-muted-foreground"
        >
          A confirmation email has been sent to your inbox.
        </motion.p>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}

