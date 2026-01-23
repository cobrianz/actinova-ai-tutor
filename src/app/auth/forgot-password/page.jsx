"use client";
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Send,
  CheckCircle,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: email, 2: code, 3: password
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (step === 1) {
        // Send reset code
        if (!email) {
          toast.error("Please enter your email address");
          return;
        }

        const res = await fetch("/api/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "Something went wrong");
        } else {
          setStep(2);
          toast.success(data.message);
          if (data.code) {
            // In development mode, show the code
            setTimeout(() => {
              toast.info(`Development mode: Your reset code is ${data.code}`, {
                duration: 10000,
              });
            }, 1000);
          }
        }
      } else if (step === 2) {
        // Verify code
        if (!code || code.length !== 6) {
          toast.error("Please enter a valid 6-digit code");
          return;
        }

        const res = await fetch("/api/verify-reset-code", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code }),
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "Invalid code");
        } else {
          setStep(3);
          toast.success("Code verified successfully");
        }
      } else if (step === 3) {
        // Reset password
        if (!password) {
          toast.error("Please enter a new password");
          return;
        }

        if (password !== confirmPassword) {
          toast.error("Passwords don't match");
          return;
        }

        // Basic password validation
        if (password.length < 8) {
          toast.error("Password must be at least 8 characters long");
          return;
        }

        const res = await fetch("/api/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "Something went wrong");
        } else {
          toast.success("Password reset successfully! Please sign in.");
          // Redirect to login immediately (no auto-login)
          router.push("/auth/login");
        }
      }
    } catch (err) {
      toast.error("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Step indicators
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center space-x-2 mb-10 overflow-hidden">
      {[1, 2, 3].map((stepNum) => (
        <div key={stepNum} className="flex items-center flex-1 max-w-[80px]">
          <div
            className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${step >= stepNum
              ? "bg-purple-600 shadow-sm"
              : "bg-gray-100"
              }`}
          />
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-white flex overflow-hidden font-sans">
      {/* Left Section: Branding & Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-purple-50 overflow-hidden">
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-purple-100/50 to-white/50 backdrop-blur-[1px]" />
        <img
          src="https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?q=80&w=2070&auto=format&fit=crop"
          alt="Security and Recovery"
          className="absolute inset-0 object-cover w-full h-full opacity-40 scale-105"
        />

        <div className="relative z-20 flex flex-col justify-between p-12 w-full">
          <Link href="/" className="inline-flex items-center space-x-3 group">
            <div className="w-12 h-12 bg-white border border-purple-100 rounded-xl flex items-center justify-center transition-all group-hover:scale-110 shadow-sm overflow-hidden p-2">
              <img src="/logo.png" alt="Actinova Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-3xl font-bold text-gray-900 tracking-tight font-bricolage">
              Actinova AI
            </span>
          </Link>

          <div className="max-w-md">
            <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-6 font-bricolage">
              Account <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                Security & Recovery.
              </span>
            </h1>

            <div className="space-y-4">
              {[
                "Secure multi-step recovery",
                "Instant verification codes",
                "Protected user privacy"
              ].map((text, i) => (
                <div key={i} className="flex items-center space-x-3 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0" />
                  <span className="text-lg font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-8 border-t border-purple-100">
            <div className="flex items-center space-x-2 text-gray-500 mb-4">
              <Lock className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium">Enterprise-grade protection</span>
            </div>
            <p className="text-gray-500 text-sm font-medium">
              © 2026 Actinova AI. Secured by advanced encryption.
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
              <span className="font-bricolage">Actinova AI</span>
            </div>
          </div>

          <div className="text-left mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 rounded-xl mb-6">
              <Lock className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 font-bricolage mb-2">
              {step === 1 && "Forgot Password?"}
              {step === 2 && "Verify Identity"}
              {step === 3 && "Reset Password"}
            </h2>
            <p className="text-gray-500 font-medium">
              {step === 1 && "Enter your email for a reset code"}
              {step === 2 && `Code sent to ${email}`}
              {step === 3 && "Create a secure new password"}
            </p>
          </div>

          {renderStepIndicator()}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="bg-transparent">
              <div className="space-y-6">
                {step === 1 && (
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 bg-gray-50/50 border border-gray-100 rounded-xl focus:ring-purple-500/20 focus:border-purple-600 transition-all"
                        placeholder="name@example.com"
                      />
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <label
                      htmlFor="code"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Reset Code
                    </label>
                    <input
                      id="code"
                      name="code"
                      type="text"
                      required
                      value={code}
                      onChange={(e) =>
                        setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      className="block w-full text-center text-2xl tracking-widest bg-gray-50/50 border border-gray-100 rounded-xl focus:ring-purple-500/20 focus:border-purple-600 transition-all font-mono"
                      placeholder="000000"
                      maxLength={6}
                    />
                    <p className="text-[11px] font-bold text-gray-400 mt-2 ml-1 uppercase tracking-wider text-center">
                      Enter the 6-digit code from your email
                    </p>
                  </div>
                )}

                {step === 3 && (
                  <>
                    <div>
                      <label
                        htmlFor="password"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        New Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="block w-full pl-10 pr-10 py-3 bg-gray-50/50 border border-gray-100 rounded-xl focus:ring-purple-500/20 focus:border-purple-600 transition-all"
                          placeholder="Create a new password"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="h-5 w-5 text-gray-400 hover:text-purple-600 transition-colors" />
                          ) : (
                            <Eye className="h-5 w-5 text-gray-400 hover:text-purple-600 transition-colors" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="confirmPassword"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                      >
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          autoComplete="new-password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="block w-full pl-10 pr-10 py-3 bg-gray-50/50 border border-gray-100 rounded-xl focus:ring-purple-500/20 focus:border-purple-600 transition-all"
                          placeholder="Confirm your new password"
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="h-5 w-5 text-gray-400 hover:text-purple-600 transition-colors" />
                          ) : (
                            <Eye className="h-5 w-5 text-gray-400 hover:text-purple-600 transition-colors" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                      <h4 className="text-[11px] font-black text-purple-900 uppercase tracking-wider mb-2">
                        Password Requirements:
                      </h4>
                      <ul className="text-[11px] text-purple-700 font-bold space-y-1">
                        <li>• MINIMUM 8 CHARACTERS</li>
                        <li>• CASE SENSITIVE LETTERS</li>
                        <li>• AT LEAST ONE NUMBER</li>
                        <li>• ONE SPECIAL CHARACTER (@$!%*?&)</li>
                      </ul>
                    </div>
                  </>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={() => setStep(step - 1)}
                      className="flex-1 py-3 px-4 border border-gray-100 text-sm font-bold rounded-xl text-gray-600 bg-white hover:bg-gray-50 transition-all active:scale-[0.98]"
                    >
                      Go Back
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={loading}
                    className={`flex-1 py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white transition-all active:scale-[0.98] shadow-lg shadow-purple-200 ${loading ? "bg-purple-400" : "bg-purple-600 hover:bg-purple-700"}`}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                      </div>
                    ) : (
                      <>
                        {step === 1 && "Request Code"}
                        {step === 2 && "Confirm Code"}
                        {step === 3 && "Update Password"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 text-center">
              <Link
                href="/auth/login"
                className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-purple-600 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Return to sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
