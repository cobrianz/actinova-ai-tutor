"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/csrfClient";
import AuthLayout from "@/auth/components/AuthLayout";

function ResetPasswordForm() {
  const [formData, setFormData] = useState({
    email: "",
    code: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [codeValid, setCodeValid] = useState(null);
  const [passwordReset, setPasswordReset] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");
  const code = searchParams.get("code");
  const token = searchParams.get("token");

  const [tokenValid, setTokenValid] = useState(null);

  const verifyCode = async () => {
    if (!formData.email || !formData.code) return;
    try {
      const res = await apiClient.post("/api/verify-reset-code", { email: formData.email, code: formData.code });
      const data = await res.json();
      if (!res.ok) {
        setCodeValid(false);
        toast.error(data.error || "Invalid code");
      } else {
        setCodeValid(true);
      }
    } catch (error) {
      setCodeValid(false);
      toast.error("Failed to verify code");
    }
  };

  const validateToken = async () => {
    try {
      const res = await apiClient.get(`/api/validate-reset-token?token=${token}`);
      const data = await res.json();
      if (!res.ok) {
        setTokenValid(false);
        toast.error(data.error || "Invalid or expired reset token");
      } else {
        setTokenValid(true);
      }
    } catch (error) {
      setTokenValid(false);
      toast.error("Failed to validate reset token");
    }
  };

  useEffect(() => {
    if (token) {
      validateToken();
    } else if (!email && !code) {
      toast.error("Invalid or missing reset link");
      router.push("/auth/forgot-password");
    }
  }, [token, email, code, router]);

  useEffect(() => {
    if (email && code && !token) {
      setFormData(prev => ({ ...prev, email, code }));
      verifyCode();
    }
  }, [email, code, token]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) errors.push("Password must be at least 8 characters long");
    if (!/(?=.*[a-z])/.test(password)) errors.push("Password must contain at least one lowercase letter");
    if (!/(?=.*[A-Z])/.test(password)) errors.push("Password must contain at least one uppercase letter");
    if (!/(?=.*\d)/.test(password)) errors.push("Password must contain at least one number");
    if (!/(?=.*[@$!%*?&])/.test(password)) errors.push("Password must contain at least one special character (@$!%*?&)");
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
      toast.error(passwordErrors[0]);
      return;
    }

    setLoading(true);
    try {
      const body = token
        ? { token, password: formData.password }
        : { email: formData.email, code: formData.code, password: formData.password };

      const res = await apiClient.post("/api/reset-password", body);
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Something went wrong");
      } else {
        setPasswordReset(true);
        toast.success(data.message);
      }
    } catch (err) {
      toast.error("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (token && tokenValid === null) {
    return (
      <AuthLayout title="Validating link..." subtitle="Please wait while we verify your reset link.">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-green-600" />
        </div>
      </AuthLayout>
    );
  }

  if (token && tokenValid === false) {
    return (
      <AuthLayout title="Invalid link" subtitle="This password reset link is invalid or has expired.">
        <div className="text-center space-y-6">
          <div className="mx-auto h-16 w-16 bg-red-50 rounded-2xl flex items-center justify-center border border-red-100">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: "var(--font-fraunces)" }}>
              Invalid Link
            </h2>
            <p className="text-sm text-gray-500 mt-2 font-medium">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
          </div>
          <Link
            href="/auth/forgot-password"
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all shadow-sm shadow-green-600/20"
          >
            Request new reset link
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (passwordReset) {
    return (
      <AuthLayout title="Password reset!" subtitle="Your password has been updated successfully.">
        <div className="text-center space-y-6">
          <div className="mx-auto h-16 w-16 bg-green-50 rounded-2xl flex items-center justify-center border border-green-100">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: "var(--font-fraunces)" }}>
              Password Reset!
            </h2>
            <p className="text-sm text-gray-500 mt-2 font-medium">
              Your password has been updated. You can now sign in with your new password.
            </p>
          </div>
          <Link
            href="/auth/login"
            className="inline-flex items-center px-6 py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-all shadow-sm shadow-green-600/20"
          >
            Sign in now
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set new password" subtitle="Choose a strong, unique password for your account.">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: "var(--font-fraunces)" }}>
            Set new password
          </h1>
          <p className="text-sm text-gray-500 mt-1.5 font-medium">
            Please enter a strong, unique password
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-sm font-semibold text-gray-700 block">New password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={handleChange}
                className="pl-10 pr-10 h-11 w-full bg-white border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/10 rounded-xl transition-all text-sm outline-none"
                placeholder="Create a strong password"
              />
              <button
                type="button"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
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
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="pl-10 pr-10 h-11 w-full bg-white border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/10 rounded-xl transition-all text-sm outline-none"
                placeholder="Confirm your password"
              />
              <button
                type="button"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600 transition-colors"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="bg-green-50 border border-green-100 rounded-xl p-4">
            <h4 className="text-[11px] font-bold text-green-700 uppercase tracking-wider mb-2">
              Password requirements
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {[
                "8+ characters",
                "Uppercase letter",
                "Lowercase letter",
                "At least one number",
                "Special character",
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-medium text-green-600/80">
                  <div className="w-1.5 h-1.5 bg-green-500/40 rounded-full shrink-0" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all active:scale-[0.98] shadow-sm shadow-green-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Update password"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          <Link
            href="/auth/login"
            className="text-green-600 font-semibold hover:text-green-700 hover:underline underline-offset-4"
          >
            Return to login
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
