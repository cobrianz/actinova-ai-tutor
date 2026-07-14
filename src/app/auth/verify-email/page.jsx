"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Key, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../../components/AuthProvider";
import { apiClient } from "@/lib/csrfClient";
import AuthLayout from "@/components/AuthLayout";

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

  return (
    <AuthLayout
      title="Verify your email"
      subtitle="Enter the 6-digit code we sent to your email address to activate your account."
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight" style={{ fontFamily: "var(--font-fraunces)" }}>
            Verify your email
          </h1>
          <p className="text-sm text-gray-500 mt-1.5 font-medium">
            We sent a code to{" "}
            <span className="font-semibold text-gray-700">{userEmail || "your email"}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5 text-center">
            <label htmlFor="code" className="text-sm font-semibold text-gray-700 mb-2 block">Verification code</label>
            <div className="relative">
              <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                id="code"
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="block w-full text-center text-3xl tracking-[0.5em] h-14 bg-white border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-500/10 rounded-xl transition-all font-mono text-gray-900 pl-10 outline-none"
                placeholder="000000"
                maxLength={6}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2 font-medium">Enter the 6-digit code from your inbox</p>
          </div>

          <button
            type="submit"
            className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all active:scale-[0.98] shadow-sm shadow-green-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            disabled={loading || code.length < 6}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify account"}
          </button>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            Didn&apos;t receive the email?{" "}
            <button
              type="button"
              onClick={handleResendEmail}
              disabled={resendLoading || resendCooldown > 0}
              className="text-green-600 font-semibold hover:text-green-700 disabled:opacity-50 transition-colors"
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
    </AuthLayout>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto" />
            <p className="mt-4 text-gray-600 font-medium">Loading...</p>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
