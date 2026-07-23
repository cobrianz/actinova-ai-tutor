"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useGoogleLogin } from "@react-oauth/google";
import GoogleIcon from "@/auth/components/GoogleIcon";
import { isFlutterApp } from "@/lib/appBridge";
import AuthLayout from "@/auth/components/AuthLayout";
import {
  Mail,
  Lock,
  Loader2,
  Eye,
  EyeOff,
  GraduationCap,
  BookMarked,
  Users,
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
  const [selectedRole, setSelectedRole] = useState("student");

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const result = await loginWithGoogle(tokenResponse, { role: selectedRole });
      if (result.success) {
        toast.success("Welcome aboard!");
        router.push("/onboarding");
      } else {
        toast.error(result.error || "Google login failed");
      }
    },
    onError: () => toast.error("Google login failed"),
  });

  const handleGoogleSignup = () => {
    if (isFlutterApp()) {
      window.location.href = "/api/auth/google-redirect";
    } else {
      googleLogin();
    }
  };

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
      const result = await signup({ ...formData, role: selectedRole });
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

  const getPasswordStrength = () => {
    let s = 0;
    if (formData.password.length >= 8) s++;
    if (/[A-Z]/.test(formData.password)) s++;
    if (/[0-9]/.test(formData.password)) s++;
    if (/[^A-Za-z0-9]/.test(formData.password)) s++;
    return s;
  };

  const strength = formData.password ? getPasswordStrength() : 0;

  return (
    <AuthLayout
      title="Create your free account"
      subtitle="Get started with AI-powered learning. Generate courses, quizzes, flashcards, and study plans in seconds."
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: "var(--font-fraunces)" }}>
            Create a free account
          </h1>
          <p className="text-sm text-gray-500 mt-1.5 font-medium">
            Fill in your details to get started
          </p>
        </div>

        {/* Role Selector */}
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-2">I am a...</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: "student", label: "Student", desc: "Learn with AI courses", icon: GraduationCap },
              { id: "instructor", label: "Instructor", desc: "Teach and manage classes", icon: BookMarked },
            ].map(({ id, label, desc, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSelectedRole(id)}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                  selectedRole === id
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  selectedRole === id ? "bg-green-500 text-white" : "bg-gray-100 text-gray-500"
                }`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
                <div>
                  <p className={`text-sm font-semibold ${selectedRole === id ? "text-green-700" : "text-gray-900"}`}>{label}</p>
                  <p className="text-[11px] text-gray-500">{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleEmailSignup} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="firstName" className="text-sm font-semibold text-gray-700 block">First name</label>
              <input
                id="firstName"
                placeholder="John"
                className="h-11 w-full bg-white border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/10 rounded-xl transition-all text-sm outline-none px-3.5"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="lastName" className="text-sm font-semibold text-gray-700 block">Last name</label>
              <input
                id="lastName"
                placeholder="Doe"
                className="h-11 w-full bg-white border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/10 rounded-xl transition-all text-sm outline-none px-3.5"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-semibold text-gray-700 block">Email address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
                className="pl-10 h-11 w-full bg-white border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/10 rounded-xl transition-all text-sm outline-none"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-semibold text-gray-700 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                className="pl-10 pr-10 h-11 w-full bg-white border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/10 rounded-xl transition-all text-sm outline-none"
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
            {formData.password && (
              <div className="flex gap-1.5 mt-2">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1.5 flex-1 rounded-full transition-all ${
                      strength >= level
                        ? strength <= 2
                          ? "bg-red-500"
                          : strength === 3
                          ? "bg-yellow-500"
                          : "bg-green-500"
                        : "bg-gray-100"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700 block">Confirm password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm your password"
                className="pl-10 pr-10 h-11 w-full bg-white border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/10 rounded-xl transition-all text-sm outline-none"
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

          <div className="flex items-start space-x-2.5">
            <input
              id="acceptTerms"
              type="checkbox"
              checked={formData.acceptTerms}
              onChange={(e) => setFormData(prev => ({ ...prev, acceptTerms: e.target.checked }))}
              className="mt-1 w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500/10 transition-colors"
            />
            <label htmlFor="acceptTerms" className="text-xs font-medium text-gray-500 leading-relaxed cursor-pointer">
              I agree to the{" "}
              <Link href="/terms" className="text-green-600 font-semibold hover:underline">terms of service</Link>
              {" "}and{" "}
              <Link href="/privacy" className="text-green-600 font-semibold hover:underline">privacy policy</Link>
            </label>
          </div>

          <button
            type="submit"
            className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all active:scale-[0.98] shadow-sm shadow-green-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            disabled={loading}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create account"}
          </button>
        </form>

        <div className="relative flex items-center">
          <div className="flex-grow border-t border-gray-200" />
          <span className="flex-shrink-0 mx-4 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">or</span>
          <div className="flex-grow border-t border-gray-200" />
        </div>

        <button
          type="button"
          onClick={() => handleGoogleSignup()}
          className="w-full h-11 bg-white hover:bg-gray-50 text-gray-700 font-semibold rounded-xl transition-all flex items-center justify-center gap-3 border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={loading}
        >
          <GoogleIcon size={18} />
          <span>Continue with Google</span>
        </button>

        <p className="text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link
            href={searchParams.get("callbackUrl") ? `/auth/login?callbackUrl=${encodeURIComponent(searchParams.get("callbackUrl"))}` : "/auth/login"}
            className="text-green-600 font-semibold hover:text-green-700 hover:underline underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
