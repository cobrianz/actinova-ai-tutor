"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Facebook, Twitter, Instagram, Github, Mail, Phone, MapPin } from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/csrfClient";

export default function Footer() {
  const footerLinks = {
    Product: [
      { label: "Features", href: "#features" },
      { label: "How It Works", href: "#how-it-works" },
      { label: "Testimonials", href: "#testimonials" },
    ],
    Company: [
      { label: "Terms of Service", href: "/terms" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Contact Us", href: "/contact" },
      { label: "Help Center", href: "/help" },
    ],
    Connect: [
      { label: "Twitter", href: "#", icon: Twitter },
      { label: "GitHub", href: "#", icon: Github },
      { label: "Instagram", href: "#", icon: Instagram },
      { label: "Facebook", href: "#", icon: Facebook },
    ],
  };

  return (
    <footer className="bg-[#F2F1EC] pt-24 pb-12 border-t border-black/5 relative overflow-hidden mt-12">
      {/* Decorative Blur */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-primary/5 rounded-full blur-[120px] -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-6 h-6 flex items-center justify-center overflow-hidden pointer-events-none">
                <img src="/logo.png" alt="Actirova Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-xl font-bold tracking-tight text-[#1a1a1a]"
                    style={{ fontFamily: "var(--font-fraunces)" }}>
                Actirova
              </span>
            </Link>
            <p className="text-[#1a1a1a]/60 text-sm leading-relaxed max-w-sm"
               style={{ fontFamily: "var(--font-fraunces)" }}>
              Empowering the next generation of learners with advanced AI-driven
              personalized education. Master any skill at your own pace.
            </p>
            <div className="flex gap-4">
              {footerLinks.Connect.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="w-10 h-10 flex items-center justify-center text-[#1a1a1a] hover:text-green-500 transition-colors duration-300"
                  >
                    <Icon className="w-5 h-5" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(footerLinks).slice(0, 2).map(([title, links]) => (
            <div key={title} className="space-y-6">
              <h4 className="font-bold text-xs uppercase tracking-wider text-[#1a1a1a]"
                  style={{ fontFamily: "var(--font-fraunces)" }}>
                {title}
              </h4>
              <ul className="space-y-4">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[#1a1a1a]/60 hover:text-green-500 transition-colors flex items-center group"
                      style={{ fontFamily: "var(--font-fraunces)" }}
                    >
                      <span className="w-0 group-hover:w-2 h-0.5 bg-green-500 mr-0 group-hover:mr-2 transition-all" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}


          {/* Newsletter Column */}
          <div className="space-y-6">
            <h4 className="font-bold text-xs uppercase tracking-wider text-[#1a1a1a]"
                style={{ fontFamily: "var(--font-fraunces)" }}>
              Newsletter
            </h4>
            <p className="text-[#1a1a1a]/60 text-xs"
               style={{ fontFamily: "var(--font-fraunces)" }}>
              Subscribe to get the latest updates and learning resources.
            </p>
            <NewsletterForm />
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t border-black/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[#1a1a1a]/60 text-sm font-medium"
             style={{ fontFamily: "var(--font-fraunces)" }}>
            © {new Date().getFullYear()} Actirova AI Tutor. All rights reserved.
          </p>
          <div className="flex gap-8 text-sm font-medium text-[#1a1a1a]/60"
               style={{ fontFamily: "var(--font-fraunces)" }}>
            <Link href="/terms" className="hover:text-green-500 transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-green-500 transition-colors">Privacy</Link>
            <Link href="/cookies" className="hover:text-green-500 transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle, loading, success, error

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    try {
      const res = await apiClient.post("/api/newsletter", { email });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setEmail("");
        // Reset success message after 3 seconds
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
      }
    } catch (e) {
      setStatus("error");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {status === "success" ? (
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-500 text-sm font-medium animate-in fade-in slide-in-from-bottom-2">
          Subscribed successfully!
        </div>
      ) : (
        <>
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-3 py-2 rounded-xl bg-white/70 border border-black/10 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all text-xs text-[#1a1a1a] placeholder-[#1a1a1a]/40"
              disabled={status === "loading"}
            />
          </div>
          <button
            disabled={status === "loading"}
            className="w-full px-3 py-2 bg-green-500 text-white rounded-xl font-bold text-xs hover:bg-green-600 transition-all disabled:opacity-50"
          >
            {status === "loading" ? "Subscribing..." : "Subscribe"}
          </button>
          {status === "error" && (
            <p className="text-xs text-red-500">Failed to subscribe. Try again.</p>
          )}
        </>
      )}
    </form>
  );
}
