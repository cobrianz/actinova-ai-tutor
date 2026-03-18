"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useGoogleLogin } from "@react-oauth/google";
import GoogleIcon from "@/components/GoogleIcon";
import {
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Mail,
  Lock,
  Loader2,
  Github,
  ArrowRight,
  Eye,
  EyeOff
} from "lucide-react";

export default function LoginPage() {
  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();
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
      } else {
        toast.error(result.error || "Google login failed");
      }
    },
    onError: () => toast.error("Google login failed"),
    use_fedcm_for_prompt: true,
  });

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
        // Redirect is handled by AuthProvider's effect
      } else {
        // If account requires verification, redirect to verify-email
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
    <div className="min-h-screen bg-white flex overflow-hidden font-sans">
      {/* Centered Custom Login Form */}
      <div className="w-full flex items-center justify-center p-8 sm:p-12 lg:p-20 overflow-y-auto bg-white">
        <div className="max-w-md w-full flex flex-col">
          <div className="text-center mb-10">
            <Link href="/" className="inline-flex items-center space-x-2 text-2xl font-bold text-gray-900 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden p-1.5">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <span className="font-bricolage">Actirova AI</span>
            </Link>
          </div>

          <div className="text-left mb-8">
            <h2 className="text-3xl font-bold text-gray-900 font-bricolage mb-2">welcome back</h2>
            <p className="text-gray-500 font-medium">sign in to your account to continue</p>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">email address</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="pl-10 h-12 bg-gray-50/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-primary/20 focus:border-primary transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="password">password</Label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs font-bold text-primary hover:opacity-80 transition-opacity"
                >
                  forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10 h-12 bg-gray-50/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-primary/20 focus:border-primary transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-2 py-1">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={setRememberMe}
                className="border-gray-200 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <label
                htmlFor="remember"
                className="text-sm font-medium text-gray-600 cursor-pointer select-none"
              >
                remember me for 30 days
              </label>
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-primary hover:opacity-90 text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] group"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  sign in
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>
          
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-200"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500 font-bold">or continue with</span>
            </div>
          </div>

          <div className="flex justify-center w-full">
            <Button
              variant="outline"
              type="button"
              onClick={() => googleLogin()}
              className="w-[240px] h-11 border-slate-200 hover:bg-slate-50 text-gray-700 font-bold rounded-full transition-all flex items-center justify-center gap-2"
              disabled={loading}
            >
              <GoogleIcon size={18} />
              <span>sign in with google</span>
            </Button>
          </div>

          <p className="mt-10 text-center text-sm font-medium text-gray-500">
            don't have an account?{" "}
            <Link
              href="/auth/signup"
              className="text-primary font-bold hover:opacity-80 underline decoration-2 underline-offset-4"
            >
              create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
