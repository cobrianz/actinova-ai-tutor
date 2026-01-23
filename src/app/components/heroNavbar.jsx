"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { cn } from "../lib/utils";

export default function HeroNavbar({ handleGetStarted }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Successfully logged out");
      router.push("/");
    } catch (error) {
      toast.error("Logout failed. Please try again.");
    }
  };

  const navLinks = [
    { href: "/about", label: "About", isAnchor: false },
    { href: "/pricing", label: "Pricing", isAnchor: false },
    { href: "/blog", label: "Blog", isAnchor: false },
    { href: "/contact", label: "Contact", isAnchor: false },
  ];

  const handleNavClick = (e, href, isAnchor) => {
    if (isAnchor && href.startsWith("#")) {
      e.preventDefault();
      const element = document.querySelector(href);
      if (element) {
        const offset = 100;
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth"
        });
        setIsMenuOpen(false);
      }
    }
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        "fixed top-0 left-0 right-0 z-[100] transition-all duration-500",
        scrolled ? "py-4" : "py-6"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="relative flex items-center justify-between px-6 py-3 rounded-2xl border transition-all duration-500 bg-secondary/80 shadow-xs border-border backdrop-blur-3xl">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl bg-white border border-purple-100 flex items-center justify-center shadow-lg shadow-primary/20 transition-transform group-hover:scale-110 overflow-hidden p-1.5">
            <img src="/logo.png" alt="Actirova Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-heading text-xl font-bold tracking-tight">
            Actirova<span className="text-primary">AI</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={(e) => link.isAnchor && handleNavClick(e, link.href, true)}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors relative group"
            >
              {link.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
            </Link>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <button
              onClick={() => router.push("/dashboard")}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Dashboard
            </button>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="text-sm font-semibold hover:text-primary transition-colors"
              >
                Sign In
              </Link>
              <button
                onClick={() => router.push("/auth/signup")}
                className="px-6 py-2.5 rounded-xl bg-foreground text-background text-sm font-semibold hover:bg-foreground/90 transition-all flex items-center gap-2"
              >
                Join Now
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-2 rounded-xl bg-secondary/50 border border-border-accent transition-colors"
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </nav>
    </div>

      {/* Mobile Menu */ }
  <AnimatePresence>
    {isMenuOpen && (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="md:hidden mx-4 mt-2 overflow-hidden rounded-2xl glass border-white/20"
      >
        <div className="p-6 space-y-4">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={(e) => link.isAnchor && handleNavClick(e, link.href, true)}
              className="block text-lg font-medium text-foreground hover:text-primary transition-colors"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-4 border-t border-border-accent flex flex-col gap-4">
            {user ? (
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="w-full py-4 rounded-xl bg-secondary text-center font-semibold"
                >
                  Sign In
                </Link>
                <button
                  onClick={() => router.push("/auth/signup")}
                  className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold"
                >
                  Get Started Free
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
    </motion.header >
  );
}
