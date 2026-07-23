"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/csrfClient";
import AuthLayout from "@/auth/components/AuthLayout";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const titles = {
    1: "Forgot password?",
    2: "Verify your identity",
    3: "Set new password",
  };

  const subtitles = {
    1: "No worries, we'll send you reset instructions.",
    2: "Enter the 6-digit code we sent to your email.",
    3: "Choose a strong, unique password for your account.",
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (step === 1) {
        if (!email) {
          toast.error("Please enter your email address");
          return;
        }
        const res = await apiClient.post("/api/forgot-password", { email });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Something went wrong");
        } else {
          setStep(2);
          toast.success(data.message);
          if (data.code) {
            setTimeout(() => {
              toast.info(`Development mode: Your reset code is ${data.code}`, {
                duration: 10000,
              });
            }, 1000);
          }
        }
      } else if (step === 2) {
        if (!code || code.length !== 6) {
          toast.error("Please enter a valid 6-digit code");
          return;
        }
        const res = await apiClient.post("/api/verify-reset-code", { email, code });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Invalid code");
        } else {
          setStep(3);
          toast.success("Code verified successfully");
        }
      } else if (step === 3) {
        if (!password) {
          toast.error("Please enter a new password");
          return;
        }
        if (password !== confirmPassword) {
          toast.error("Passwords don't match");
          return;
        }
        if (password.length < 8) {
          toast.error("Password must be at least 8 characters long");
          return;
        }
        const res = await apiClient.post("/api/reset-password", { email, code, password });
        const data = await res.json();
        if (!res.ok) {
          toast.error(data.error || "Something went wrong");
        } else {
          toast.success("Password reset successfully! Please sign in.");
          router.push("/auth/login");
        }
      }
    } catch (err) {
      toast.error("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title={titles[step]} subtitle={subtitles[step]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: "var(--font-fraunces)" }}>
            {titles[step]}
          </h1>
          <p className="text-sm text-gray-500 mt-1.5 font-medium">
            {subtitles[step]}
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                s <= step ? "bg-green-600" : "bg-gray-100"
              }`}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 1 && (
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
          )}

          {step === 2 && (
            <div className="space-y-1.5 text-center">
              <label htmlFor="code" className="text-sm font-semibold text-gray-700 mb-2 block">Reset code</label>
              <input
                id="code"
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="block w-full text-center text-3xl tracking-[0.5em] h-14 bg-white border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/10 rounded-xl transition-all font-mono text-gray-900 outline-none"
                placeholder="000000"
                maxLength={6}
              />
              <p className="text-xs text-gray-400 mt-2 font-medium">Enter the 6-digit code from your email</p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-semibold text-gray-700 block">New password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
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
              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700 block">Confirm password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    className="pl-10 pr-10 h-11 w-full bg-white border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/10 rounded-xl transition-all text-sm outline-none"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
            </div>
          )}

          <button
            type="submit"
            className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all active:scale-[0.98] shadow-sm shadow-green-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : step === 1 ? (
              "Send reset code"
            ) : step === 2 ? (
              "Verify code"
            ) : (
              "Reset password"
            )}
          </button>

          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Go back
            </button>
          )}
        </form>

        <p className="text-center text-sm text-gray-500">
          Remember your password?{" "}
          <Link
            href="/auth/login"
            className="text-green-600 font-semibold hover:text-green-700 hover:underline underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
