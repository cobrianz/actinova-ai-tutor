"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useGoogleLogin } from "@react-oauth/google";
import GoogleIcon from "@/components/GoogleIcon";
import { isFlutterApp } from "@/lib/appBridge";
import AuthLayout from "@/components/AuthLayout";
import {
  Mail,
  Lock,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

export default function LoginPage() {
  const { login, loading: authLoading, loginWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const result = await loginWithGoogle(tokenResponse);
      if (result.success) {
        toast.success("Welcome back!");
        const redirect = searchParams.get("redirect") || "/dashboard";
        router.push(redirect);
      } else {
        toast.error(result.error || "Google login failed");
      }
    },
    onError: () => toast.error("Google login failed"),
  });

  const handleGoogleLogin = () => {
    if (isFlutterApp()) {
      window.location.href = "/api/auth/google-redirect";
    } else {
      googleLogin();
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      const result = await login({ email, password, rememberMe });
      if (result.success) {
        toast.success("Welcome back!");
      } else {
        if (result.requiresVerification) {
          toast.error(result.error || "Please verify your email first");
          router.push(`/auth/verify-email?email=${encodeURIComponent(result.email || email)}`);
        } else {
          toast.error(result.error || "Login failed");
        }
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue learning with AI-powered courses, flashcards, and study plans."
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: "var(--font-fraunces)" }}>
            Sign in to your account
          </h1>
          <p className="text-sm text-gray-500 mt-1.5 font-medium">
            Enter your credentials to continue
          </p>
        </div>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-semibold text-gray-700 block">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
                className="pl-10 h-11 w-full bg-white border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/10 rounded-xl transition-all text-sm outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label htmlFor="password" className="text-sm font-semibold text-gray-700 block">Password</label>
              <Link
                href="/auth/forgot-password"
                className="text-xs font-semibold text-green-600 hover:text-green-700 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                className="pl-10 pr-10 h-11 w-full bg-white border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/10 rounded-xl transition-all text-sm outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <input
              id="remember"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500/10 transition-colors"
            />
            <label
              htmlFor="remember"
              className="text-sm font-medium text-gray-600 cursor-pointer select-none"
            >
              Remember me for 30 days
            </label>
          </div>

          <button
            type="submit"
            className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all active:scale-[0.98] shadow-sm shadow-green-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign in"}
          </button>
        </form>

        <div className="relative flex items-center">
          <div className="flex-grow border-t border-gray-200" />
          <span className="flex-shrink-0 mx-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">or</span>
          <div className="flex-grow border-t border-gray-200" />
        </div>

        <button
          type="button"
          onClick={() => handleGoogleLogin()}
          className="w-full h-11 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-all flex items-center justify-center gap-3 border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          <GoogleIcon size={18} />
          <span>Continue with Google</span>
        </button>

        <p className="text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link
            href={searchParams.get("callbackUrl") ? `/auth/signup?callbackUrl=${encodeURIComponent(searchParams.get("callbackUrl"))}` : "/auth/signup"}
            className="text-green-600 font-semibold hover:text-green-700 hover:underline underline-offset-4"
          >
            Create account
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
