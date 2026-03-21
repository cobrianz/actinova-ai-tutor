"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, ArrowLeft, Key, Loader2, User, Zap, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../components/AuthProvider";
import { apiClient } from "@/lib/csrfClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function VerifyEmailContent() {
  const [code, setCode] = useState("");
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [userEmail, setUserEmail] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const { fetchUser } = useAuth();

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setUserEmail(emailParam);
    } else {
      const email = localStorage.getItem("pendingVerificationEmail");
      if (email) {
        setUserEmail(email);
      }
    }

    const token = searchParams.get("token");
    if (token) {
      handleTokenVerification(token);
    }
  }, [searchParams]);

  const handleTokenVerification = async (token) => {
    setLoading(true);
    try {
      const res = await apiClient.post("/api/verify-email", { token });
      const data = await res.json();
      if (!res.ok) {
        setVerificationStatus("error");
        toast.error(data.error || "Email verification failed");
      } else {
        toast.success(data.message);
        try {
          await apiClient.post("/api/send-welcome-email", {
            email: data.user.email,
            firstName: data.user.name?.split(" ")[0] || "User",
          });
        } catch (emailError) {
          console.error("Failed to send welcome email:", emailError);
        }
        await fetchUser();
        localStorage.removeItem("pendingVerificationEmail");
        router.push("/onboarding");
      }
    } catch (error) {
      setVerificationStatus("error");
      toast.error("Failed to verify email");
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;
    setResendLoading(true);
    try {
      const response = await apiClient.post("/api/resend-verification", { email: userEmail });
      const data = await response.json();
      if (response.ok) {
        toast.success("Verification email sent! Please check your inbox.");
        setResendCooldown(60);
        const interval = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        toast.error(data.error || "Failed to resend email");
      }
    } catch (error) {
      toast.error("Failed to resend verification email");
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error("Please enter the verification code from your email");
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.post("/api/verify-email", { code });
      const data = await res.json();
      if (!res.ok) {
        setVerificationStatus("error");
        toast.error(data.error || "Email verification failed");
      } else {
        toast.success(data.message);
        await fetchUser();
        localStorage.removeItem("pendingVerificationEmail");
        router.push("/onboarding");
      }
    } catch (error) {
      setVerificationStatus("error");
      toast.error("Failed to verify email");
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { id: 'details', title: 'Your details', desc: 'Provide an email and password', icon: User, complete: true },
    { id: 'verify', title: 'Verify your email', desc: 'Enter your verification code', icon: Mail, current: true },
    { id: 'invite', title: 'Start learning', desc: 'Unlock your personalized journey', icon: Zap },
    { id: 'welcome', title: 'Welcome to Actirova!', desc: 'Get up and running in minutes', icon: Sparkles },
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
            {steps.map((step, index) => (
              <div key={step.id} className="flex gap-4 group">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${step.complete ? "border-green-600 bg-green-600 text-white" : step.current ? "border-green-600 bg-green-50 text-green-600" : "border-slate-200 bg-white text-slate-400 group-hover:border-slate-300"}`}>
                    <step.icon className="w-5 h-5" />
                  </div>
                  {index !== steps.length - 1 && (
                    <div className={`w-0.5 h-12 my-1 transition-colors duration-300 ${step.complete ? "bg-green-600" : "bg-slate-200"}`} />
                  )}
                </div>
                <div className="pt-0.5">
                  <h4 className={`text-sm font-bold transition-colors ${step.current || step.complete ? "text-gray-900" : "text-gray-500"}`}>{step.title}</h4>
                  <p className="text-xs font-medium text-gray-400 mt-0.5">{step.desc}</p>
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
               <Mail className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 font-bricolage mb-2 tracking-tight">Verify your email</h2>
            <p className="text-gray-600 font-medium">We've sent a 6-digit code to <span className="font-bold text-gray-900">{userEmail || "your email"}</span>.</p>
          </div>

          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1.5 text-center">
                <Label htmlFor="code" className="text-sm font-bold text-gray-700 mb-2 block">Verification code</Label>
                <div className="relative">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    id="code"
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="block w-full text-center text-3xl tracking-[0.5em] h-14 bg-white border-slate-300 focus:border-green-500 focus:ring-green-500/10 rounded-xl transition-all font-mono border-2 text-gray-900 pl-8 shadow-none"
                    placeholder="000000"
                    maxLength={6}
                  />
                </div>
                <p className="text-[10px] font-black text-gray-400 mt-4 uppercase tracking-widest">Enter the code from your inbox</p>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all active:scale-[0.98] mt-2 shadow-none border border-green-700"
                disabled={loading || code.length < 6}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify account"}
              </Button>
            </form>

            <div className="text-center space-y-4">
              <p className="text-sm font-medium text-gray-500">
                Didn't receive the email?{" "}
                <button
                  type="button"
                  onClick={handleResendEmail}
                  disabled={resendLoading || resendCooldown > 0}
                  className="text-green-600 font-bold hover:text-green-700 disabled:opacity-50 transition-colors"
                >
                  {resendLoading
                    ? "Sending..."
                    : resendCooldown > 0
                      ? `Resend in ${resendCooldown}s`
                      : "Resend code"}
                </button>
              </p>
            </div>
          </div>
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

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
