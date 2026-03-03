"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Facebook, Twitter, Instagram, Github, Mail, Phone, MapPin } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  const footerLinks = {
    Product: [
      { label: "Features", href: "#features" },
      { label: "How It Works", href: "#how-it-works" },
      { label: "Pricing", href: "/pricing" },
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
    <footer className="bg-background pt-24 pb-12 border-t border-border-accent relative overflow-hidden">
      {/* Decorative Blur */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-primary/5 rounded-full blur-[120px] -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="text-primary-foreground font-bold text-xl">A</span>
              </div>
              <span className="font-heading text-2xl font-bold tracking-tight">
                Actirova<span className="text-primary">AI</span>
              </span>
            </Link>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-sm">
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
                    className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-300"
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
              <h4 className="font-bold text-lg uppercase tracking-wider text-primary text-sm">
                {title}
              </h4>
              <ul className="space-y-4">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-primary transition-colors flex items-center group"
                    >
                      <span className="w-0 group-hover:w-2 h-0.5 bg-primary mr-0 group-hover:mr-2 transition-all" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}


          {/* Newsletter Column */}
          <div className="space-y-6">
            <h4 className="font-bold text-lg uppercase tracking-wider text-primary text-sm">
              Newsletter
            </h4>
            <p className="text-muted-foreground text-sm">
              Subscribe to get the latest updates and learning resources.
            </p>
            <NewsletterForm />
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t border-border-accent flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-muted-foreground text-sm font-medium">
            © {new Date().getFullYear()} Actirova AI Tutor. All rights reserved.
          </p>
          <div className="flex gap-8 text-sm font-medium text-muted-foreground">
            <Link href="/terms" className="hover:text-primary transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
            <Link href="/contact" className="hover:text-primary transition-colors">Cookies</Link>
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
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
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
              className="w-full px-4 py-3 rounded-xl bg-secondary border border-border-accent focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-sm"
              disabled={status === "loading"}
            />
          </div>
          <button
            disabled={status === "loading"}
            className="w-full px-4 py-3 bg-foreground text-background rounded-xl font-bold text-sm hover:bg-foreground/90 transition-all disabled:opacity-50"
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
