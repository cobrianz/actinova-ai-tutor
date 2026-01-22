"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, CheckCircle2, ShieldCheck, Mail, Lock, Eye, EyeOff, Loader2, Github } from "lucide-react";
import { useSignIn } from "@clerk/nextjs";
import { toast } from "react-hot-toast";

export default function LoginPage() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleCustomLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Welcome back!");
        router.push("/dashboard");
      } else {
        toast.error(data.error || "Login failed");
      }
    } catch (error) {
      toast.error("An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (strategy) => {
    if (!isLoaded) return;

    try {
      await signIn.authenticateWithRedirect({
        strategy: strategy,
        redirectUrl: "/api/auth/callback", // Or wherever you handle social callback
        redirectUrlComplete: "/dashboard",
      });
    } catch (err) {
      toast.error("Social login failed");
    }
  };

  return (
    <div className="min-h-screen bg-white flex overflow-hidden font-sans">
      {/* Left Section: Branding & Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-purple-50 overflow-hidden">
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-purple-100/50 to-white/50 backdrop-blur-[1px]" />
        <img
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop"
          alt="Students learning together"
          className="absolute inset-0 object-cover w-full h-full opacity-40 scale-105"
        />
        
        <div className="relative z-20 flex flex-col justify-between p-12 w-full">
          <Link href="/" className="inline-flex items-center space-x-3 group">
            <div className="w-12 h-12 bg-white border border-purple-100 rounded-xl flex items-center justify-center transition-all group-hover:scale-110 shadow-sm">
              <Sparkles className="w-7 h-7 text-purple-600" />
            </div>
            <span className="text-3xl font-bold text-gray-900 tracking-tight font-bricolage">
              Actinova AI
            </span>
          </Link>

          <div className="max-w-md">
            <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-6 font-bricolage">
              Elevate your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                learning experience.
              </span>
            </h1>
            
            <div className="space-y-4">
              {[
                "AI-curated learning paths",
                "Real-time tutoring assistance",
                "Advanced progress tracking"
              ].map((text, i) => (
                <div key={i} className="flex items-center space-x-3 text-gray-700">
                  <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0" />
                  <span className="text-lg font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-8 border-t border-purple-100">
            <div className="flex items-center space-x-2 text-gray-500 mb-4">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium">Secure authentication</span>
            </div>
            <p className="text-gray-500 text-sm font-medium">
              © 2026 Actinova AI. The future of education is here.
            </p>
          </div>
        </div>
      </div>

      {/* Right Section: Custom Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-20 overflow-y-auto bg-white">
        <div className="max-w-md w-full flex flex-col">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-gray-900 font-bricolage mb-2">Welcome Back</h2>
            <p className="text-gray-500 font-medium">Enter your credentials to access your account</p>
          </div>

          <form onSubmit={handleCustomLogin} className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-12 pr-4 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-gray-700">Password</label>
                <Link href="/auth/forgot-password" title="Forgot Password?" className="text-xs font-bold text-purple-600 hover:text-purple-500">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-3 pl-12 pr-12 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl shadow-none transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center space-x-2 mt-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span>Sign In</span>
              )}
            </button>
          </form>

          <div className="relative my-8 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <span className="relative px-4 bg-white text-xs font-bold text-gray-400 uppercase tracking-widest">Or continue with</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleSocialLogin("oauth_google")}
              className="flex items-center justify-center space-x-3 py-3 px-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 6.16l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Google</span>
            </button>
            <button
              onClick={() => handleSocialLogin("oauth_github")}
              className="flex items-center justify-center space-x-3 py-3 px-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
            >
              <Github className="w-5 h-5" />
              <span>GitHub</span>
            </button>
          </div>

          <p className="mt-10 text-center text-gray-500 font-medium">
            Don't have an account?{" "}
            <Link href="/auth/signup" className="text-purple-600 hover:text-purple-500 font-bold underline decoration-2 underline-offset-4">
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
