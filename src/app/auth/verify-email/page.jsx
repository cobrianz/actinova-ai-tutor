"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, AlertCircle, Mail, ArrowLeft, Key, ShieldCheck, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../components/AuthProvider";

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
    // Get email from localStorage
    const email = localStorage.getItem("pendingVerificationEmail");
    if (email) {
      setUserEmail(email);
    }

    // Check for token in URL
    const token = searchParams.get("token");
    if (token) {
      handleTokenVerification(token);
    }
  }, [searchParams]);

  const handleTokenVerification = async (token) => {
    setLoading(true);

    try {
      const res = await fetch("/api/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await res.json();

      if (!res.ok) {
        setVerificationStatus("error");
        toast.error(data.error || "Email verification failed");
      } else {
        toast.success(data.message);

        // Do not persist sensitive user/token info to localStorage; rely on secure HttpOnly cookies and `/api/me`

        // Send welcome email
        try {
          await fetch("/api/send-welcome-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: data.user.email,
              firstName: data.user.name?.split(" ")[0] || "User",
            }),
          });
        } catch (emailError) {
          console.error("Failed to send welcome email:", emailError);
        }

        // Refresh user data from cookies
        await fetchUser();

        // Clear pending verification email
        localStorage.removeItem("pendingVerificationEmail");

        // Redirect to onboarding immediately
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
      const response = await fetch("/api/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Verification email sent! Please check your inbox.");
        setResendCooldown(60); // 60 second cooldown
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
      const res = await fetch("/api/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setVerificationStatus("error");
        toast.error(data.error || "Email verification failed");
      } else {
        toast.success(data.message);

        // Do not persist sensitive user/token info to localStorage; rely on secure HttpOnly cookies and `/api/me`

        // Refresh user data from cookies
        await fetchUser();

        // Clear pending verification email
        localStorage.removeItem("pendingVerificationEmail");

        // Redirect to onboarding immediately
        router.push("/onboarding");
      }
    } catch (error) {
      setVerificationStatus("error");
      toast.error("Failed to verify email");
    } finally {
      setLoading(false);
    }
  };

  // Removed success modal - redirect immediately instead
  if (verificationStatus === "success") {
    return null;
  }

  return (
    <div className="min-h-screen bg-white flex overflow-hidden font-sans">
      {/* Left Section: Branding & Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-purple-50 overflow-hidden">
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-purple-100/50 to-white/50 backdrop-blur-[1px]" />
        <img
          src="https://images.unsplash.com/photo-1577563906417-45a11b3f9f75?q=80&w=2070&auto=format&fit=crop"
          alt="Verification"
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
              Security <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                checkpoint.
              </span>
            </h1>

            <div className="space-y-4">
              {[
                "Instant email authentication",
                "Two-factor verification",
                "Seamless account startup"
              ].map((text, i) => (
                <div key={i} className="flex items-center space-x-3 text-gray-700">
                  <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0" />
                  <span className="text-lg font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-8 border-t border-purple-100">
            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={16} className="text-purple-600" />
              Identity Verification System
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
              <Mail className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 font-bricolage mb-2">Verify Email</h2>
            <p className="text-gray-500 font-medium leading-relaxed">
              We've sent a code to <span className="font-black text-gray-900">{userEmail || "your email"}</span>. Please enter it below.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 ml-1">
                  Verification Code
                </label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="block w-full text-center text-3xl font-mono tracking-[0.5em] pl-10 h-14 bg-gray-50/50 border border-gray-100 rounded-xl focus:ring-purple-500/20 focus:border-purple-600 transition-all"
                    placeholder="000000"
                  />
                </div>
              </div>

              {verificationStatus === "error" && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                  <p className="text-xs font-bold text-red-600">
                    The code you entered is invalid or has expired.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !code.trim() || code.length < 6}
                className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-200 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
                ) : (
                  <span>Verify Account</span>
                )}
              </button>
            </div>

            <div className="text-center space-y-6">
              <p className="text-sm font-bold text-gray-500">
                Didn't receive the email?{" "}
                <button
                  type="button"
                  onClick={handleResendEmail}
                  disabled={resendLoading || resendCooldown > 0}
                  className="text-purple-600 hover:text-purple-700 disabled:opacity-50"
                >
                  {resendLoading
                    ? "Sending..."
                    : resendCooldown > 0
                      ? `Resend in ${resendCooldown}s`
                      : "Resend Code"}
                </button>
              </p>

              <Link
                href="/auth/login"
                className="inline-flex items-center text-sm font-bold text-gray-500 hover:text-purple-600 transition-colors"
              >
                <ArrowLeft size={16} className="mr-2" />
                Back to sign in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
