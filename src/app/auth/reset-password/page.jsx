"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

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


  const verifyCode = async () => {
    if (!formData.email || !formData.code) return;

    try {
      const res = await fetch("/api/verify-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, code: formData.code }),
      });

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

  // Only verify code if we have both email and code (not token-based)
  useEffect(() => {
    if (email && code && !token) {
      setFormData(prev => ({ ...prev, email, code }));
      verifyCode();
    }
  }, [email, code, token]); // eslint-disable-line react-hooks/exhaustive-deps

  const [tokenValid, setTokenValid] = useState(null);
  const token = searchParams.get("token");

  useEffect(() => {
    // If we have a token, validate it
    if (token) {
      validateToken();
    }
    // If no token and no email/code, redirect to forgot-password
    else if (!email && !code) {
      toast.error("Invalid or missing reset link");
      router.push("/auth/forgot-password");
    }
  }, [token, email, code, router]); // eslint-disable-line react-hooks/exhaustive-deps

  const validateToken = async () => {
    try {
      const res = await fetch(`/api/validate-reset-token?token=${token}`);
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push("Password must contain at least one number");
    }
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push(
        "Password must contain at least one special character (@$!%*?&)"
      );
    }
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
      // Use token-based flow if token exists, otherwise use code-based flow
      const body = token
        ? { token, password: formData.password }
        : { email: formData.email, code: formData.code, password: formData.password };

      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

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

  // Show loading only if we're validating a token
  if (token && tokenValid === null) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-100 border-t-purple-600"></div>
      </div>
    );
  }

  // Show error only if token validation failed
  if (token && tokenValid === false) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto h-20 w-20 bg-red-50 rounded-2xl flex items-center justify-center mb-6 border border-red-100 shadow-sm">
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 font-bricolage mb-2">
            Invalid Link
          </h2>
          <p className="text-gray-500 font-medium mb-8">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Link
            href="/auth/forgot-password"
            className="inline-flex items-center px-8 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-200"
          >
            New Reset Request
          </Link>
        </div>
      </div>
    );
  }

  if (passwordReset) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto h-20 w-20 bg-green-50 rounded-2xl flex items-center justify-center mb-6 border border-green-100 shadow-sm">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 font-bricolage mb-2">
            Password Reset!
          </h2>
          <p className="text-gray-500 font-medium mb-8">
            Your password has been updated. You can now securely sign in to your accounts.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center px-8 py-3 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-700 transition-all shadow-lg shadow-purple-200"
          >
            Sign In Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex overflow-hidden font-sans">
      {/* Left Section: Branding & Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-purple-50 overflow-hidden">
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-purple-100/50 to-white/50 backdrop-blur-[1px]" />
        <img
          src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop"
          alt="Secure Recovery"
          className="absolute inset-0 object-cover w-full h-full opacity-40 scale-105"
        />

        <div className="relative z-20 flex flex-col justify-between p-12 w-full">
          <Link href="/" className="inline-flex items-center space-x-3 group">
            <div className="w-12 h-12 bg-white border border-purple-100 rounded-xl flex items-center justify-center transition-all group-hover:scale-110 shadow-sm overflow-hidden p-2">
              <img src="/logo.png" alt="Actirova Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-3xl font-bold text-gray-900 tracking-tight font-bricolage">
              Actirova AI
            </span>
          </Link>

          <div className="max-w-md">
            <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-6 font-bricolage">
              Finalize <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                your updates.
              </span>
            </h1>

            <div className="space-y-4">
              {[
                "Enhanced security protocols",
                "Encrypted data syncing",
                "Account recovery protection"
              ].map((text, i) => (
                <div key={i} className="flex items-center space-x-3 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0" />
                  <span className="text-lg font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-8 border-t border-purple-100">
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">
              Secured by Actirova Intelligence
            </p>
          </div>
        </div>
      </div>

      {/* Right Section: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-20 overflow-y-auto bg-white">
        <div className="max-w-md w-full flex flex-col">
          <div className="lg:hidden text-center mb-10">
            <div className="inline-flex items-center space-x-2 text-2xl font-bold text-gray-900">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center shadow-md overflow-hidden p-1.5">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain brightness-0 invert" />
              </div>
              <span className="font-bricolage">Actirova AI</span>
            </div>
          </div>

          <div className="text-left mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl mb-6">
              <Lock className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 font-bricolage mb-2">Set New Password</h2>
            <p className="text-gray-500 font-medium">Please enter a strong, unique password</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-bold text-gray-700 ml-1"
                >
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-10 py-3.5 bg-gray-50/50 border border-gray-100 rounded-xl focus:ring-purple-500/20 focus:border-purple-600 transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-purple-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-purple-600" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-bold text-gray-700 ml-1"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-10 py-3.5 bg-gray-50/50 border border-gray-100 rounded-xl focus:ring-purple-500/20 focus:border-purple-600 transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-purple-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-purple-600" />
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-100 rounded-xl p-5">
                <h4 className="text-[11px] font-black text-purple-900 uppercase tracking-wider mb-2">
                  Validation Checklist:
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    "8+ Characters",
                    "Case-sensitive letters",
                    "At least one number",
                    "Special character (@$!%*?&)"
                  ].map((text, i) => (
                    <div key={i} className="flex items-center space-x-2 text-[10px] font-bold text-purple-700">
                      <div className="w-1.5 h-1.5 bg-purple-400 rounded-full" />
                      <span>{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-200 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
                ) : (
                  <span>Update Password</span>
                )}
              </button>
            </div>

            <div className="pt-6 text-center">
              <Link
                href="/auth/login"
                className="text-sm font-bold text-gray-500 hover:text-purple-600 transition-colors"
              >
                Return to Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
