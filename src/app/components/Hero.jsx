"use client";

import { Sparkles, Play } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";
import { data } from "../lib/landingData";

export default function Hero({ handleGetStarted }) {
  const { stats } = data;
  const { user } = useAuth();
  const router = useRouter();

  const handleCTAClick = () => {
    if (user) {
      router.push("/dashboard");
    } else {
      handleGetStarted();
    }
  };

  return (
    <section className="relative overflow-hidden pt-32 pb-20 lg:pb-32">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-blue-500 via-blue-400 to-transparent opacity-60 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-500 via-purple-400 to-transparent opacity-60 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-gradient-to-br from-pink-500 via-purple-400 to-transparent opacity-60 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* SVG Background Elements */}
      <svg
        className="absolute top-20 left-10 w-32 h-32 opacity-10 animate-float"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M50 10 L90 90 L10 90 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-blue-700"
        />
        <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-700" />
      </svg>

      <svg
        className="absolute bottom-20 right-10 w-40 h-40 opacity-10 animate-float animation-delay-1000"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-700" />
        <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-700" />
        <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="2" className="text-purple-700" />
      </svg>

      <svg
        className="absolute top-1/2 right-20 w-32 h-32 opacity-10 animate-pulse"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="10" y="10" width="80" height="80" fill="none" stroke="currentColor" strokeWidth="2" className="text-pink-700" rx="10" />
        <line x1="50" y1="10" x2="50" y2="90" stroke="currentColor" strokeWidth="2" className="text-pink-700" />
        <line x1="10" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="2" className="text-pink-700" />
      </svg>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-200 to-purple-200 dark:from-blue-900/60 dark:to-purple-900/60 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full text-sm font-medium mb-8 border border-blue-300/70 dark:border-blue-600/70">
            <Sparkles className="w-4 h-4" />
            <span>Powered by Advanced AI</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            Master Any Skill with
            <span className="bg-gradient-to-r from-blue-700 via-purple-700 to-pink-600 bg-clip-text text-transparent">
              {" "}
              AI-Powered
            </span>
            <br />
            Learning
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Get personalized learning paths, track your progress, and achieve
            your goals faster with our intelligent tutoring system. Join over
            100,000 learners worldwide.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <button
              onClick={handleCTAClick}
              className="bg-gradient-to-r from-blue-700 via-purple-700 to-pink-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-2xl hover:shadow-purple-600/60 transition-all flex items-center space-x-2 shadow-lg transform hover:scale-105"
            >
              <Play className="w-5 h-5" />
              <span>{user ? "Continue Learning" : "Start Learning Free"}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-4 rounded-xl bg-gradient-to-br from-white/60 to-white/30 dark:from-gray-800/70 dark:to-gray-800/30 backdrop-blur-md border border-white/40 dark:border-gray-700/40">
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-700 via-purple-700 to-pink-600 bg-clip-text text-transparent mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
    </section>
  );
}
