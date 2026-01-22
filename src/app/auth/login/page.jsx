"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Sparkles, Mail, Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../components/AuthProvider";

export default function LoginPage() {
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login({ email, password, rememberMe });

      if (result.success) {
        toast.success("Welcome back!");
        const user = result.user;

        if (!user.emailVerified && user.status === "pending") {
          localStorage.setItem("pendingVerificationEmail", email);
          router.push("/auth/verify-email");
          return;
        }

        if (user.onboardingCompleted === false) {
          router.push("/onboarding");
          return;
        }

        router.push("/dashboard");
      } else {
        if (result.requiresVerification) {
          localStorage.setItem("pendingVerificationEmail", result.email || email);
          toast.info("Please verify your email to continue");
          router.push("/auth/verify-email");
          return;
        }
        toast.error(result.error || "Login failed");
      }
    } catch (err) {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex overflow-hidden">
      {/* Left Section: Branding & Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900 overflow-hidden">
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-blue-600/30 to-purple-600/30 backdrop-blur-[2px]" />
        <img
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop"
          alt="Students learning together"
          className="absolute inset-0 object-cover w-full h-full opacity-60 scale-105 animate-pulse-slow"
        />
        
        <div className="relative z-20 flex flex-col justify-between p-12 w-full">
          <Link href="/" className="inline-flex items-center space-x-3 group">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center transition-all group-hover:scale-110">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-white tracking-tight">
              Actinova AI
            </span>
          </Link>

          <div className="max-w-md">
            <h1 className="text-5xl font-extrabold text-white leading-tight mb-6">
              Master any skill <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                with AI precision.
              </span>
            </h1>
            
            <div className="space-y-4">
              {[
                "Personalized learning paths",
                "24/7 AI tutoring assistant",
                "Professional certification prep"
              ].map((text, i) => (
                <div key={i} className="flex items-center space-x-3 text-gray-200">
                  <CheckCircle2 className="w-5 h-5 text-blue-400" />
                  <span className="text-lg font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-8 border-t border-white/10">
            <p className="text-white/60 text-sm">
              © 2026 Actinova AI Tutor. Empowering the next generation of learners.
            </p>
          </div>
        </div>
      </div>

      {/* Right Section: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-20 overflow-y-auto">
        <div className="max-w-md w-full">
          <div className="lg:hidden text-center mb-10">
            <div className="inline-flex items-center space-x-2 text-2xl font-bold text-gray-900 dark:text-white mb-2">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span>Actinova AI</span>
            </div>
          </div>

          <div className="mb-10">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
              Welcome back
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Sign in to access your workspace.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Password
                  </label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-sm font-semibold text-blue-600 hover:text-blue-500 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-5 w-5 rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
              />
              <label htmlFor="remember-me" className="ml-3 text-sm text-gray-600 dark:text-gray-400 font-medium">
                Keep me signed in
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full group relative flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white py-4 px-6 rounded-2xl font-bold text-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
            >
              {loading ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-100 dark:border-gray-800" />
              </div>
              <div className="relative flex justify-center text-sm uppercase tracking-wider font-bold">
                <span className="px-4 bg-white dark:bg-gray-950 text-gray-400">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button className="flex items-center justify-center space-x-2 py-3.5 px-4 border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-900 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                <span>Google</span>
              </button>
              <button className="flex items-center justify-center space-x-2 py-3.5 px-4 border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-900 text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <img src="https://www.svgrepo.com/show/475647/github-color.svg" alt="GitHub" className="w-5 h-5" />
                <span>GitHub</span>
              </button>
            </div>
          </form>

          <p className="mt-10 text-center text-gray-500 dark:text-gray-400 font-medium">
            New to Actinova?{" "}
            <Link
              href="/auth/signup"
              className="text-blue-600 hover:text-blue-500 font-bold decoration-2 underline-offset-4 hover:underline"
            >
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
