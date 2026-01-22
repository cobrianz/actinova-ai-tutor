"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, CheckCircle2, ShieldCheck, Mail, Lock, Eye, EyeOff, Loader2, Github, User } from "lucide-react";
import { useSignUp } from "@clerk/nextjs";
import { toast } from "react-hot-toast";

export default function SignupPage() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const router = useRouter();

  const handleCustomSignup = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!acceptTerms) {
      toast.error("Please accept the terms and conditions");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          firstName, 
          lastName, 
          email, 
          password, 
          confirmPassword, 
          acceptTerms 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Account created successfully!");
        if (data.requiresVerification) {
          router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
        } else {
          router.push("/onboarding");
        }
      } else {
        toast.error(data.error || "Signup failed");
      }
    } catch (error) {
      toast.error("An error occurred during signup");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignup = async (strategy) => {
    if (!isLoaded) return;

    try {
      await signUp.authenticateWithRedirect({
        strategy: strategy,
        redirectUrl: "/api/auth/callback",
        redirectUrlComplete: "/onboarding",
      });
    } catch (err) {
      toast.error("Social signup failed");
    }
  };

  return (
    <div className="min-h-screen bg-white flex overflow-hidden font-sans">
      {/* Left Section: Branding & Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-purple-50 overflow-hidden">
        <div className="absolute inset-0 z-10 bg-gradient-to-tr from-purple-100/50 to-white/50 backdrop-blur-[1px]" />
        <img
          src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop"
          alt="Digital learning"
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
              The future of <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                personalized education.
              </span>
            </h1>
            
            <div className="space-y-4">
              {[
                "AI-driven curriculum design",
                "Adaptive learning speed",
                "Verified digital credentials"
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
              <span className="text-sm font-medium">Enterprise-grade security</span>
            </div>
            <p className="text-gray-500 text-sm font-medium">
              Join 50,000+ students mastering the future today.
            </p>
          </div>
        </div>
      </div>

      {/* Right Section: Custom Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-16 overflow-y-auto bg-white">
        <div className="max-w-md w-full flex flex-col">
          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-gray-900 font-bricolage mb-2">Create Account</h2>
            <p className="text-gray-500 font-medium">Join our community of lifelong learners</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <button
              onClick={() => handleSocialSignup("oauth_google")}
              className="flex items-center justify-center space-x-3 py-3 px-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 6.16l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>Google</span>
            </button>
            <button
              onClick={() => handleSocialSignup("oauth_github")}
              className="flex items-center justify-center space-x-3 py-3 px-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors font-semibold"
            >
              <Github className="w-5 h-5" />
              <span>GitHub</span>
            </button>
          </div>

          <div className="relative mb-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <span className="relative px-4 bg-white text-xs font-bold text-gray-400 uppercase tracking-widest">Or register with email</span>
          </div>

          <form onSubmit={handleCustomSignup} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">First Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="John"
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none text-sm"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Last Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none text-sm"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none text-sm"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2.5 pl-10 pr-10 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1.5 block">Confirm</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all outline-none text-sm"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 py-2">
              <input
                type="checkbox"
                id="terms"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-200 rounded focus:ring-purple-500"
              />
              <label htmlFor="terms" className="text-xs text-gray-500 font-medium leading-none cursor-pointer">
                I agree to the{" "}
                <Link href="/terms" className="text-purple-600 hover:underline">Terms</Link>
                {" "}and{" "}
                <Link href="/privacy" className="text-purple-600 hover:underline">Privacy Policy</Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 rounded-xl shadow-none transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <span>Create Account</span>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-gray-500 font-medium text-sm">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-purple-600 hover:text-purple-500 font-bold underline decoration-2 underline-offset-4">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
