import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import { Sparkles, CheckCircle2, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-white flex overflow-hidden font-sans">
      {/* Left Section: Branding & Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-purple-50 overflow-hidden">
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-purple-100/50 to-white/50 backdrop-blur-[1px]" />
        <img
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2071&auto=format&fit=crop"
          alt="Students learning together"
          className="absolute inset-0 object-cover w-full h-full opacity-40 scale-105 animate-pulse-slow transition-transform duration-10000"
        />
        
        <div className="relative z-20 flex flex-col justify-between p-12 w-full">
          <Link href="/" className="inline-flex items-center space-x-3 group">
            <div className="w-12 h-12 bg-white border border-purple-100 rounded-xl flex items-center justify-center transition-all group-hover:scale-110 shadow-sm">
              <Sparkles className="w-7 h-7 text-purple-600" />
            </div>
            <span className="text-3xl font-bold text-gray-900 tracking-tight font-bricolage">
              Actinova AI
            </span>
          </Link>

          <div className="max-w-md">
            <h1 className="text-5xl font-extrabold text-gray-900 leading-tight mb-6 font-bricolage">
              Elevate your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                learning experience.
              </span>
            </h1>
            
            <div className="space-y-4">
              {[
                "AI-curated learning paths",
                "Real-time tutoring assistance",
                "Advanced progress tracking"
              ].map((text, i) => (
                <div key={i} className="flex items-center space-x-3 text-gray-700">
                  <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0" />
                  <span className="text-lg font-medium">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-8 border-t border-purple-100">
            <div className="flex items-center space-x-2 text-gray-500 mb-4">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium">Secure authentication</span>
            </div>
            <p className="text-gray-500 text-sm font-medium">
              © 2026 Actinova AI. The future of education is here.
            </p>
          </div>
        </div>
      </div>

      {/* Right Section: Clerk SignIn */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-20 overflow-y-auto bg-white">
        <div className="max-w-md w-full flex flex-col items-center">
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center space-x-2 text-2xl font-bold text-gray-900">
              <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center shadow-md">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="font-bricolage">Actinova AI</span>
            </div>
          </div>

            <SignIn 
              appearance={{
                elements: {
                  formButtonPrimary: 
                    "bg-purple-600 hover:bg-purple-700 text-sm normal-case font-bold py-3 rounded-xl shadow-md transition-all active:scale-95",
                  card: "bg-white border-none shadow-none rounded-3xl overflow-hidden",
                  headerTitle: "text-2xl font-bold text-gray-900 font-bricolage",
                  headerSubtitle: "text-gray-500 font-medium",
                  socialButtonsBlockButton: 
                    "border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors font-semibold shadow-none",
                  formFieldLabel: "text-sm font-semibold text-gray-700 mb-1.5",
                  formFieldInput: 
                    "bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all",
                  footerActionLink: "text-purple-600 hover:text-purple-500 font-bold underline decoration-2 underline-offset-4",
                  identityPreviewText: "text-gray-900 font-medium",
                  identityPreviewEditButton: "text-purple-600 hover:text-purple-500",
                  dividerLine: "bg-gray-100",
                  dividerText: "text-gray-400 font-bold text-xs uppercase tracking-widest",
                },
                layout: {
                  socialButtonsPlacement: "bottom",
                  showOptionalFields: false,
                }
              }}
              path="/auth/login"
              routing="path"
              signUpUrl="/auth/signup"
              fallbackRedirectUrl="/dashboard"
            />

        </div>
      </div>
    </div>
  );
}
