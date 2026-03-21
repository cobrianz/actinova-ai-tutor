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
  const [activeItem, setActiveItem] = useState("");
  const { user, logout, loading } = useAuth();
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
    { href: "#features", label: "Features", isAnchor: true },
    { href: "/pricing", label: "Pricing", isAnchor: false },
    { href: "/blog", label: "Blog", isAnchor: false },
    { href: "/about", label: "About", isAnchor: false },
  ];

  const handleNavClick = (e, href, isAnchor) => {
    const specificLabel = navLinks.find(link => link.href === href)?.label;
    if (specificLabel) setActiveItem(specificLabel);

    if (isAnchor && href.startsWith("#")) {
      e.preventDefault();
      setIsMenuOpen(false);

      // If not on homepage, navigate there first then scroll
      if (pathname !== "/") {
        router.push("/" + href);
        return;
      }

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
      }
    }
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        "fixed top-6 left-0 right-0 z-[100] transition-all duration-500 px-4",
      )}
    >
      <div className="max-w-5xl mx-auto">
        <nav className="relative flex items-center justify-between pl-4 pr-1.5 py-1.5 rounded-2xl border-2 border-white bg-[#D2D7F8]/80 backdrop-blur-xl transition-all duration-500 group/nav">
          {/* Logo */}
          <Link href="/" onClick={() => setActiveItem("")} className="flex items-center gap-2 group/logo flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-white border border-teal-100 flex items-center justify-center transition-transform group-hover/logo:scale-105 overflow-hidden p-1">
              <img src="/logo.png" alt="Actirova Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-heading text-lg font-bold tracking-tight text-[#1a1a1a]">
              Actirova
            </span>
          </Link>

          {/* Desktop Navigation - Centered Pill */}
          <div className="hidden md:flex items-center bg-[#f5f5f7]/50 rounded-full px-1 py-1 border border-black/5">
            {navLinks.map((link) => {
              const isActive = activeItem === link.label || (!link.isAnchor && pathname === link.href);
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={(e) => link.isAnchor && handleNavClick(e, link.href, true)}
                  className={cn(
                    "text-[13px] font-medium px-5 py-2 rounded-full transition-all relative",
                    isActive 
                      ? "bg-green-300 text-green-900 font-semibold" 
                      : "text-muted-foreground hover:text-[#1a1a1a]"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-2">
            {loading ? (
              <div className="w-24 h-9 rounded-full bg-secondary animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleLogout}
                  className="text-[13px] font-semibold px-2 text-red-500 hover:text-red-600 transition-colors"
                >
                  Logout
                </button>
                <button
                  onClick={() => router.push("/dashboard")}
                  className="px-6 py-2 rounded-full bg-[#1a1a1a] text-white text-[13px] font-semibold hover:bg-black transition-all shadow-sm"
                >
                  Dashboard
                </button>
              </div>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="text-[13px] font-semibold px-4 text-[#1a1a1a] hover:opacity-70 transition-opacity"
                >
                  Sign In
                </Link>
                <button
                  onClick={() => router.push("/auth/signup")}
                  className="px-6 py-2 rounded-full bg-[#1a1a1a] text-white text-[13px] font-semibold hover:bg-black transition-all shadow-sm flex items-center gap-2"
                >
                  Try Demo
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>
      </div>

      {/* Mobile Menu */}
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
                {loading ? (
                  <div className="w-full h-12 rounded-xl bg-secondary animate-pulse" />
                ) : user ? (
                  <>
                    <button
                      onClick={() => router.push("/dashboard")}
                      className="w-full py-4 rounded-xl bg-[#1a1a1a] text-white font-semibold"
                    >
                      Go to Dashboard
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full py-4 rounded-xl bg-red-50 text-red-600 border border-red-100 text-center font-semibold hover:bg-red-100 transition-colors"
                    >
                      Logout
                    </button>
                  </>
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
                      className="w-full py-4 rounded-xl bg-[#1a1a1a] text-white font-semibold"
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
