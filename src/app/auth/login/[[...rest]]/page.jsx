"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useGoogleLogin } from "@react-oauth/google";
import GoogleIcon from "@/components/GoogleIcon";
import {
  Mail,
  Lock,
  Loader2,
  ArrowRight,
  Eye,
  EyeOff,
  ArrowLeft
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
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden font-sans" style={{ backgroundColor: '#DFE3FC' }}>
      {/* Overlay */}
      <div className="absolute inset-0 z-0 opacity-40" style={{ backgroundColor: '#DFE3FC' }} />

      {/* Main Form Container */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full px-6 py-12 md:py-0">
        <div className="w-full max-w-sm space-y-4 py-6 bg-white/30 backdrop-blur-2xl rounded-2xl border-2 border-white p-6">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-6">
            <Link href="/" className="inline-flex items-center space-x-2 text-2xl font-bold text-gray-900">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden p-1.5 bg-white border border-slate-100 shadow-sm">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
            </Link>
          </div>

          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 mb-4">
               <img src="/logo.png" alt="logo" className="w-8 h-8 object-contain" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 font-bricolage mb-2 tracking-tight">Sign in to account</h2>
            <p className="text-gray-600 font-medium">Please enter your details to continue</p>
          </div>

          <div className="space-y-3">
            <form onSubmit={handleEmailLogin} className="space-y-2">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-bold text-gray-700 ml-1">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className="pl-10 h-10 bg-white/80 border-slate-300 focus:border-green-500 focus:ring-green-500/10 rounded-lg transition-all font-medium text-sm shadow-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <Label htmlFor="password" className="text-sm font-bold text-gray-700">Password</Label>
                  <Link
                    href="/auth/forgot-password"
                    className="text-xs font-bold text-green-600 hover:text-green-700 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10 h-10 bg-white/80 border-slate-300 focus:border-green-500 focus:ring-green-500/10 rounded-lg transition-all font-medium text-sm shadow-none"
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

              <div className="flex items-center space-x-2 py-0.5">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={setRememberMe}
                  className="w-4 h-4 border-slate-300 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 transition-colors"
                />
                <label
                  htmlFor="remember"
                  className="text-sm font-medium text-gray-600 cursor-pointer select-none"
                >
                  Remember me for 30 days
                </label>
              </div>

              <Button
                type="submit"
                className="w-full h-10 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all active:scale-[0.98] mt-2 shadow-none border border-green-700"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Continue"}
              </Button>
            </form>

            <div className="relative flex items-center py-1.5">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink-0 mx-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">or</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <div className="space-y-1.5">
              <Button
                variant="outline"
                type="button"
                onClick={() => googleLogin()}
                className="w-full h-10 bg-white border-slate-200 hover:bg-slate-50 text-gray-700 font-bold rounded-lg transition-all flex items-center justify-center gap-3 border shadow-none"
                disabled={loading}
              >
                <div className="w-5 h-5 flex items-center justify-center">
                  <GoogleIcon size={18} />
                </div>
                <span>Sign in with Google</span>
              </Button>
            </div>

            <p className="text-center text-sm font-medium text-gray-500 pt-1">
              Don't have an account?{" "}
              <Link
                href={searchParams.get("callbackUrl") ? `/auth/signup?callbackUrl=${encodeURIComponent(searchParams.get("callbackUrl"))}` : "/auth/signup"}
                className="text-green-600 font-bold hover:text-green-700 hover:underline underline-offset-4"
              >
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
