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
    <div className="min-h-screen flex bg-white font-sans overflow-hidden">
      {/* Left Column - Desktop Only - Glassy like Navbar */}
      <div className="hidden lg:flex lg:w-1/3 bg-[#D2D7F8]/80 backdrop-blur-xl flex-col p-12 border-r-2 border-white relative overflow-hidden">
        {/* Subtle Wavy Pattern Overlay - Sharper */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0 20 Q 25 10 50 20 T 100 20 V 100 H 0 Z" fill="currentColor" />
          </svg>
        </div>
        
        <div className="relative z-10 mb-auto text-left">
          <Link href="/" className="inline-flex items-center space-x-2 text-2xl font-bold text-gray-900 group">
            <div className="w-10 h-10 flex items-center justify-center transition-transform group-hover:scale-105">
              <img src="/logo.png" alt="logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-bricolage transition-colors">Actirova AI</span>
          </Link>
          
          <div className="mt-20 space-y-8">
            {steps.map((s, index) => (
              <div key={s.id} className="flex gap-4 group">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${step >= s.id ? "border-green-600 bg-green-50 text-green-600" : "border-slate-200 bg-white text-slate-400 group-hover:border-slate-300"}`}>
                    {s.id < step ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <span className="text-xs font-black">{s.id}</span>
                    )}
                  </div>
                  {index !== steps.length - 1 && (
                    <div className={`w-0.5 h-12 my-1 transition-colors duration-300 ${step > s.id ? "bg-green-600" : "bg-slate-200"}`} />
                  )}
                </div>
                 <div className="pt-0.5">
                  <h4 className={`text-sm font-bold transition-colors ${step >= s.id ? "text-gray-900" : "text-gray-500"}`}>{s.title}</h4>
                  <p className="text-xs font-medium text-gray-400 mt-0.5">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto">
          <Link 
            href="/auth/login" 
            className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-green-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to login
          </Link>
        </div>
      </div>

      {/* Right Column - Main Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 lg:bg-white overflow-y-auto">
        <div className="w-full max-w-sm space-y-10 py-12">
          {/* Mobile Logo */}
          <div className="lg:hidden flex justify-center mb-8">
             <Link href="/" className="inline-flex items-center space-x-2 text-2xl font-bold text-gray-900 group">
              <div className="w-10 h-10 flex items-center justify-center transition-transform group-hover:scale-105">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
            </Link>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 mb-6">
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

          <form onSubmit={handleSubmit} className="space-y-6">
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
                      className="pl-10 h-11 bg-white border-slate-300 focus:border-green-500 focus:ring-green-500/10 rounded-xl transition-all font-medium text-sm shadow-none"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-1.5 text-center">
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
                  <p className="text-[10px] font-black text-gray-400 mt-4 uppercase tracking-widest">Enter the 6-digit verification code</p>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
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
                className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all active:scale-[0.98] mt-2 shadow-none border border-green-700"
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

            <p className="text-center text-sm font-medium text-gray-500 pt-4">
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
        
        {/* Footer Link for Mobile */}
        <div className="lg:hidden mt-auto pb-8">
           <Link 
            href="/auth/login" 
            className="inline-flex items-center text-sm font-bold text-gray-400 hover:text-green-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to login
          </Link>
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
