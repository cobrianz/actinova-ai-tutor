"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Sparkles, Mail, Lock, User, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../components/AuthProvider";

export default function SignupPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const router = useRouter();
  const { signup } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) errors.push("At least 8 characters");
    if (!/[a-z]/.test(password)) errors.push("Lowercase letter");
    if (!/[A-Z]/.test(password)) errors.push("Uppercase letter");
    if (!/\d/.test(password)) errors.push("Number");
    if (!/[@$!%*?&]/.test(password)) errors.push("Special character");
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords don't match!");
      return;
    }

    const passwordErrors = validatePassword(formData.password);
    if (passwordErrors.length > 0) {
      toast.error(`Password requires: ${passwordErrors.join(", ")}`);
      return;
    }

    if (!agreedToTerms) {
      toast.error("Please agree to the terms");
      return;
    }

    setLoading(true);

    try {
      const result = await signup({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        acceptTerms: agreedToTerms,
      });

      if (result.success) {
        toast.success(result.message);
        if (result.requiresVerification) {
          localStorage.setItem("pendingVerificationEmail", formData.email);
          router.push("/auth/verify-email");
        } else {
          router.push("/onboarding");
        }
      } else {
        toast.error(result.error || "Signup failed");
      }
    } catch (err) {
      toast.error("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex overflow-hidden">
      {/* Left Section: Branding & Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900 overflow-hidden">
        <div className="absolute inset-0 z-10 bg-gradient-to-tr from-purple-600/30 to-blue-600/30 backdrop-blur-[2px]" />
        <img
          src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop"
          alt="Digital learning"
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
              The future of <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                personalized education.
              </span>
            </h1>
            
            <div className="space-y-4">
              {[
                "AI-driven curriculum design",
                "Adaptive learning speed",
                "Verified digital credentials"
              ].map((text, i) => (
                <div key={i} className="flex items-center space-x-3 text-gray-200">
                  <CheckCircle2 className="w-5 h-5 text-purple-400" />
                  <span className="text-lg font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-8 border-t border-white/10">
            <div className="flex items-center space-x-2 text-white/60 mb-4">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-sm font-medium">Enterprise-grade security</span>
            </div>
            <p className="text-white/60 text-sm">
              Join 50,000+ students mastering the future today.
            </p>
          </div>
        </div>
      </div>

      {/* Right Section: Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-20 overflow-y-auto">
        <div className="max-w-md w-full py-10">
          <div className="lg:hidden text-center mb-10">
            <div className="inline-flex items-center space-x-2 text-2xl font-bold text-gray-900 dark:text-white mb-2">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span>Actinova AI</span>
            </div>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
              Create account
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              Start your journey with free access.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">First Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                  <input
                    name="firstName"
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                    placeholder="John"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Last Name</label>
                <input
                  name="lastName"
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-12 pr-12 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
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

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Confirm Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                  <input
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full pl-12 pr-12 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="agree-terms"
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="h-5 w-5 rounded-lg border-gray-300 text-purple-600 focus:ring-purple-500 dark:border-gray-700 dark:bg-gray-800"
                />
              </div>
              <label htmlFor="agree-terms" className="ml-3 text-sm text-gray-600 dark:text-gray-400">
                I agree to the{" "}
                <Link href="/terms" className="text-purple-600 hover:text-purple-500 font-bold">Terms</Link> and{" "}
                <Link href="/privacy" className="text-purple-600 hover:text-purple-500 font-bold">Privacy Policy</Link>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full group relative flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white py-4 px-6 rounded-2xl font-bold text-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25"
            >
              {loading ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <p className="mt-10 text-center text-gray-500 dark:text-gray-400 font-medium">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="text-purple-600 hover:text-purple-500 font-bold decoration-2 underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
