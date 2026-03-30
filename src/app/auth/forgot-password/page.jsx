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
  User,
  Zap,
  Sparkles,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/csrfClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

  const steps = [
    { id: 1, title: 'Identity', desc: 'Enter your account email', icon: Mail },
    { id: 2, title: 'Verification', desc: 'Enter the reset code', icon: ShieldCheck },
    { id: 3, title: 'New Password', desc: 'Secure your account', icon: Lock },
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
             <Link href="/" className="inline-flex items-center space-x-2 text-2xl font-bold text-gray-900 group">
              <div className="w-10 h-10 flex items-center justify-center transition-transform group-hover:scale-105">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
            </Link>
          </div>

          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-12 h-12 mb-4">
               <Lock className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 font-bricolage mb-2 tracking-tight">
              {step === 1 && "Forgot password?"}
              {step === 2 && "Verify identity"}
              {step === 3 && "Reset password"}
            </h2>
            <p className="text-gray-600 font-medium">
              {step === 1 && "No worries, we'll send you reset instructions."}
              {step === 2 && `We've sent a 6-digit code to your email.`}
              {step === 3 && "Please enter your new secure password."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-4">
              {step === 1 && (
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
              )}

              {step === 2 && (
                <div className="space-y-1 text-center">
                  <Label htmlFor="code" className="text-sm font-bold text-gray-700 mb-2 block">Reset code</Label>
                  <input
                    id="code"
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="block w-full text-center text-3xl tracking-[0.5em] h-14 bg-white border-slate-300 focus:border-green-500 focus:ring-green-500/10 rounded-xl transition-all font-mono border-2 text-gray-900 shadow-none"
                    placeholder="000000"
                    maxLength={6}
                  />
                  <p className="text-[10px] font-black text-gray-400 mt-2.5 uppercase tracking-widest">Enter the 6-digit verification code</p>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-sm font-bold text-gray-700 ml-1">New password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10 h-11 bg-white border-slate-300 focus:border-green-500 focus:ring-green-500/10 rounded-xl transition-all font-medium text-sm shadow-none"
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
                    <Label htmlFor="confirmPassword" className="text-sm font-bold text-gray-700 ml-1">Confirm password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10 h-11 bg-white border-slate-300 focus:border-green-500 focus:ring-green-500/10 rounded-xl transition-all font-medium text-sm shadow-none"
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

              <Button
                type="submit"
                className="w-full h-10 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-all active:scale-[0.98] mt-2 shadow-none border border-green-700"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  step === 1 ? "Request link" : step === 2 ? "Verify code" : "Update password"
                )}
              </Button>
              
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="w-full text-center text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors mt-2"
                >
                  Go back
                </button>
              )}
            </div>

            <p className="text-center text-sm font-medium text-gray-500 pt-1">
              Remember your password?{" "}
              <Link
                href="/auth/login"
                className="text-green-600 font-bold hover:text-green-700 hover:underline underline-offset-4"
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

// Helper icons
function ShieldCheck(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function CheckCircle(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="m9 11 3 3L22 4" />
    </svg>
  );
}
