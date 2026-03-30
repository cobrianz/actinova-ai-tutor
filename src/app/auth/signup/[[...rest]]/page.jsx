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
  User,
  ArrowRight,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Sparkles
} from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signup, loading: authLoading, loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false
  });

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const result = await loginWithGoogle(tokenResponse);
      if (result.success) {
        toast.success("Welcome aboard!");
      } else {
        toast.error(result.error || "Google login failed");
      }
    },
    onError: () => toast.error("Google login failed"),
    use_fedcm_for_prompt: true,
  });

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value
    }));
  };

  const handleEmailSignup = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (!formData.acceptTerms) {
      toast.error("You must accept the terms and conditions");
      return;
    }

    setLoading(true);
    try {
      const result = await signup(formData);
      if (result.success) {
        toast.success("Account created! Please check your email for verification.");
        if (result.requiresVerification) {
          router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`);
        } else {
          router.push("/dashboard");
        }
      } else {
        toast.error(result.error || "Signup failed");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 'details', title: 'Your details', desc: 'Provide an email and password', icon: User },
    { id: 'verify', title: 'Verify your email', desc: 'Enter your verification code', icon: Mail },
    { id: 'invite', title: 'Start learning', desc: 'Unlock your personalized journey', icon: Zap },
    { id: 'welcome', title: 'Welcome to Actirova!', desc: 'Get up and running in minutes', icon: Sparkles },
  ];

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
            <h2 className="text-3xl font-bold text-gray-900 font-bricolage mb-2 tracking-tight">Create a free account</h2>
            <p className="text-gray-600 font-medium">Provide your email and choose a password.</p>
          </div>

          <div className="space-y-3">
            <form onSubmit={handleEmailSignup} className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-sm font-bold text-gray-700 ml-1">First name</Label>
                  <Input
                    id="firstName"
                    placeholder="john"
                    className="h-10 bg-white/80 border-slate-300 focus:border-green-500 focus:ring-green-500/10 rounded-lg transition-all font-medium text-sm shadow-none"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-sm font-bold text-gray-700 ml-1">Last name</Label>
                  <Input
                    id="lastName"
                    placeholder="doe"
                    className="h-10 bg-white/80 border-slate-300 focus:border-green-500 focus:ring-green-500/10 rounded-lg transition-all font-medium text-sm shadow-none"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-sm font-bold text-gray-700 ml-1">Email address</Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className="pl-10 h-10 bg-white/80 border-slate-300 focus:border-green-500 focus:ring-green-500/10 rounded-lg transition-all font-medium text-sm shadow-none"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-bold text-gray-700 ml-1">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10 h-10 bg-white/80 border-slate-300 focus:border-green-500 focus:ring-green-500/10 rounded-lg transition-all font-medium text-sm shadow-none"
                    value={formData.password}
                    onChange={handleChange}
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
                {/* Password Strength Indicator - Simple Dots like in image */}
                {formData.password && (
                  <div className="flex gap-1 mt-1.5 px-1">
                    {[1, 2, 3, 4].map((level) => {
                       const strength = (() => {
                        let s = 0;
                        if (formData.password.length >= 8) s++;
                        if (/[A-Z]/.test(formData.password)) s++;
                        if (/[0-9]/.test(formData.password)) s++;
                        if (/[^A-Za-z0-9]/.test(formData.password)) s++;
                        return s;
                      })();
                      return (
                        <div key={level} className={`h-1 flex-1 rounded-full transition-all ${strength >= level ? (strength <= 2 ? "bg-red-500" : strength === 3 ? "bg-yellow-500" : "bg-green-600") : "bg-slate-100"}`} />
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-sm font-bold text-gray-700 ml-1">Confirm password</Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="pl-10 pr-10 h-10 bg-white/80 border-slate-300 focus:border-green-500 focus:ring-green-500/10 rounded-lg transition-all font-medium text-sm shadow-none"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-start space-x-2 pt-0.5">
                <Checkbox
                  id="acceptTerms"
                  checked={formData.acceptTerms}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, acceptTerms: checked }))}
                  className="mt-1 w-4 h-4 border-slate-300 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 transition-colors"
                />
                <label htmlFor="acceptTerms" className="text-xs font-medium text-gray-500 leading-normal cursor-pointer">
                  I agree to the <Link href="/terms" className="text-green-600 font-bold hover:underline">terms of service</Link> and <Link href="/privacy" className="text-green-600 font-bold hover:underline">privacy policy</Link>
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
                <span>Sign up with Google</span>
              </Button>
            </div>

            <p className="text-center text-sm font-medium text-gray-500 pt-1">
              Already have an account?{" "}
              <Link
                href={searchParams.get("callbackUrl") ? `/auth/login?callbackUrl=${encodeURIComponent(searchParams.get("callbackUrl"))}` : "/auth/login"}
                className="text-green-600 font-bold hover:text-green-700 hover:underline underline-offset-4"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
        
        {/* Footer Link for Mobile */}
        <div className="lg:hidden mt-auto pb-8">
           <Link 
            href="/" 
            className="inline-flex items-center text-sm font-bold text-gray-400 hover:text-green-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
