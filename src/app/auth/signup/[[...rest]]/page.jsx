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
  User,
  ArrowRight,
  Eye,
  EyeOff
} from "lucide-react";

export default function SignupPage() {
  const { signup, loginWithGoogle } = useAuth();
  const router = useRouter();
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

        // Redirect to verify-email page with email as query param
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



  return (
    <div className="min-h-screen bg-white flex overflow-hidden font-sans">
      {/* Centered Custom Signup Form */}
      <div className="w-full flex items-center justify-center p-8 sm:p-12 lg:p-20 overflow-y-auto bg-white">
        <div className="max-w-md w-full flex flex-col">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center space-x-2 text-2xl font-bold text-gray-900 hover:opacity-80 transition-opacity">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center shadow-md overflow-hidden p-1.5">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain brightness-0 invert" />
              </div>
              <span className="font-bricolage">Actirova AI</span>
            </Link>
          </div>

          <div className="text-left mb-6">
            <h2 className="text-3xl font-bold text-gray-900 font-bricolage mb-2">create account</h2>
            <p className="text-gray-500 font-medium">join us and start your learning journey</p>
          </div>

          <form onSubmit={handleEmailSignup} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">first name</Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    id="firstName"
                    placeholder="John"
                    className="pl-10 h-11 bg-gray-50/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-primary/20 focus:border-primary transition-all"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">last name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  className="h-11 bg-gray-50/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-primary/20 focus:border-primary transition-all"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">email address</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  className="pl-10 h-11 bg-gray-50/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-primary/20 focus:border-primary transition-all"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>


            <div className="space-y-1.5">
              <Label htmlFor="password">password</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  className="pl-10 pr-10 h-11 bg-gray-50/50 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-primary/20 focus:border-primary transition-all"
                  value={formData.password}
                  onChange={handleChange}
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

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4].map((level) => {
                    const strength = (() => {
                      let s = 0;
                      if (formData.password.length >= 8) s++;
                      if (/[A-Z]/.test(formData.password)) s++;
                      if (/[0-9]/.test(formData.password)) s++;
                      if (/[^A-Za-z0-9]/.test(formData.password)) s++;
                      return s;
                    })();

                    let color = "bg-gray-200";
                    if (strength >= level) {
                      if (strength <= 2) color = "bg-red-500";
                      else if (strength === 3) color = "bg-yellow-500";
                      else color = "bg-green-500";
                    }

                    return (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${color}`}
                      />
                    );
                  })}
                </div>
              )}
            </div>


            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">confirm password</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repeat your password"
                  className={`pl-10 pr-10 h-11 bg-gray-50/50 border rounded-xl focus:ring-primary/20 focus:border-primary transition-all ${formData.confirmPassword && formData.password !== formData.confirmPassword
                    ? "border-red-300 bg-red-50/30"
                    : "border-slate-200 dark:border-slate-800"
                    }`}
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-primary transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-[11px] font-bold text-red-500 mt-1 ml-1">passwords do not match</p>
              )}
            </div>

            <div className="flex items-start space-x-2 pt-1">
              <Checkbox
                id="acceptTerms"
                checked={formData.acceptTerms}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, acceptTerms: checked }))}
                className="mt-1 border-gray-200 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <label
                htmlFor="acceptTerms"
                className="text-xs font-medium text-gray-500 leading-normal cursor-pointer"
              >
                I agree to the{" "}
                <Link href="/terms" className="text-primary hover:underline">terms of service</Link>
                {" "}and{" "}
                <Link href="/privacy" className="text-primary hover:underline">privacy policy</Link>
              </label>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-primary hover:opacity-90 text-primary-foreground font-bold rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] group"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  create account
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          <div className="relative my-7">
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
              <span>sign up with google</span>
            </Button>
          </div>

          <div className="relative my-6 text-center">
            {/* Social signup removed */}
          </div>

          <p className="mt-8 text-center text-sm font-medium text-gray-500">
            already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-primary font-bold hover:opacity-80 underline decoration-2 underline-offset-4"
            >
              sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
