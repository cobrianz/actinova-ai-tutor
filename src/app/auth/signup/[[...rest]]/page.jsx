import { SignUp } from "@clerk/nextjs";
import Link from "next/link";
import { Sparkles, CheckCircle2, ShieldCheck } from "lucide-react";

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex overflow-hidden font-sans">
      {/* Left Section: Branding & Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900 overflow-hidden">
        <div className="absolute inset-0 z-10 bg-gradient-to-tr from-purple-600/30 to-blue-600/30 backdrop-blur-[2px]" />
        <img
          src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop"
          alt="Digital learning"
          className="absolute inset-0 object-cover w-full h-full opacity-60 scale-105 animate-pulse-slow transition-transform duration-10000"
        />
        
        <div className="relative z-20 flex flex-col justify-between p-12 w-full">
          <Link href="/" className="inline-flex items-center space-x-3 group">
            <div className="w-12 h-12 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl flex items-center justify-center transition-all group-hover:scale-110 shadow-lg">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-white tracking-tight font-bricolage">
              Actinova AI
            </span>
          </Link>

          <div className="max-w-md">
            <h1 className="text-5xl font-extrabold text-white leading-tight mb-6 font-bricolage">
              The future of <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
                personalized education.
              </span>
            </h1>
            
            <div className="space-y-4">
              {[
                "AI-driven curriculum design",
                "Adaptive learning speed",
                "Verified digital credentials"
              ].map((text, i) => (
                <div key={i} className="flex items-center space-x-3 text-gray-200">
                  <CheckCircle2 className="w-5 h-5 text-purple-400 flex-shrink-0" />
                  <span className="text-lg font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-8 border-t border-white/10">
            <div className="flex items-center space-x-2 text-white/60 mb-4">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
              <span className="text-sm font-medium">Enterprise-grade security</span>
            </div>
            <p className="text-white/60 text-sm font-medium">
              Join 50,000+ students mastering the future today.
            </p>
          </div>
        </div>
      </div>

      {/* Right Section: Clerk SignUp */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-20 overflow-y-auto bg-gray-50/50 dark:bg-gray-950/50 backdrop-blur-sm">
        <div className="max-w-md w-full flex flex-col items-center">
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center space-x-2 text-2xl font-bold text-gray-900 dark:text-white">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center shadow-md">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="font-bricolage">Actinova AI</span>
            </div>
          </div>

          <SignUp 
            appearance={{
              elements: {
                formButtonPrimary: 
                  "bg-purple-600 hover:bg-purple-700 text-sm normal-case font-bold py-3 rounded-xl shadow-md transition-all active:scale-95",
                card: "bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xl rounded-3xl overflow-hidden",
                headerTitle: "text-2xl font-bold text-gray-900 dark:text-white font-bricolage",
                headerSubtitle: "text-gray-500 dark:text-gray-400 font-medium",
                socialButtonsBlockButton: 
                  "border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-semibold",
                formFieldLabel: "text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5",
                formFieldInput: 
                  "bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all",
                footerActionLink: "text-purple-600 hover:text-purple-500 font-bold underline decoration-2 underline-offset-4",
                identityPreviewText: "text-gray-900 dark:text-white font-medium",
                identityPreviewEditButton: "text-purple-600 hover:text-purple-500",
                dividerLine: "bg-gray-100 dark:bg-gray-800",
                dividerText: "text-gray-400 font-bold text-xs uppercase tracking-widest",
              },
              layout: {
                socialButtonsPlacement: "bottom",
                showOptionalFields: false,
              }
            }}
            path="/auth/signup"
            routing="path"
            signInUrl="/auth/login"
          />
        </div>
      </div>
    </div>
  );
}
