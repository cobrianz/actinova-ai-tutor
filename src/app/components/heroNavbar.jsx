"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useAuth } from "./AuthProvider"; // adjust path if needed
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils"; // assuming you have this from shadcn/ui or similar

export default function HeroNavbar({ handleGetStarted }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile on route change
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

  const handleGetStartedClick = () => {
    if (user) {
      router.push("/dashboard");
    } else {
      handleGetStarted();
    }
  };

  const navLinks = [
    { href: "#features", label: "Features", isAnchor: true },
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
        element.scrollIntoView({ behavior: "smooth" });
        setIsMenuOpen(false);
      }
    }
  };

  const isActivePath = (href) =>
    !href.startsWith("#") && pathname === href;

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
      className="fixed top-0 left-0 right-0 z-[999]"
    >
      <nav
        className={cn(
          "mx-4 mt-4 rounded-2xl border border-border/40 transition-all duration-300",
          scrolled
            ? "backdrop-blur-xl bg-background/80 shadow-lg"
            : "backdrop-blur-lg bg-background/60"
        )}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 lg:h-20 items-center justify-between">
            {/* Logo - made similar to KenyaFix style */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="h-10 w-10 lg:h-12 lg:w-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-md">
                <img
                  src="/logo.png"
                  alt="Actinova AI Tutor"
                  className="h-7 w-7 lg:h-9 lg:w-9 object-contain transition-transform group-hover:scale-110"
                />
              </div>
              <span className="font-bold text-xl lg:text-2xl tracking-tight text-foreground">
                Actinova<span className="text-primary">AI</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(e) => link.isAnchor && handleNavClick(e, link.href, true)}
                  className={cn(
                    "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                    isActivePath(link.href)
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/80"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Desktop Auth */}
            <div className="hidden lg:flex items-center gap-4">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="px-6 py-2.5 rounded-full font-semibold text-sm bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:opacity-90 transition-opacity shadow-sm"
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-6 py-2.5 rounded-full font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="px-6 py-2.5 rounded-full font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition"
                  >
                    Login
                  </Link>
                  <button
                    onClick={handleGetStartedClick}
                    className="px-7 py-3 rounded-full font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>

            {/* Mobile Toggle */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-full hover:bg-accent transition"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu - AnimatePresence + motion for smooth open/close */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
            className="lg:hidden mt-2 mx-4 rounded-2xl overflow-hidden border border-border/40 backdrop-blur-xl bg-background/95 shadow-xl"
          >
            <div className="p-6 space-y-4">
              {navLinks.map((link) => (
                <div key={link.href}>
                  {link.isAnchor ? (
                    <a
                      href={link.href}
                      onClick={(e) => handleNavClick(e, link.href, true)}
                      className="block px-5 py-3 text-base font-medium rounded-xl hover:bg-accent transition"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={cn(
                        "block px-5 py-3 text-base font-medium rounded-xl transition",
                        isActivePath(link.href)
                          ? "bg-accent text-foreground"
                          : "hover:bg-accent"
                      )}
                    >
                      {link.label}
                    </Link>
                  )}
                </div>
              ))}

              <div className="pt-6 border-t space-y-4">
                {user ? (
                  <>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        router.push("/dashboard");
                      }}
                      className="w-full py-3.5 rounded-full font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 transition"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="w-full py-3.5 rounded-full font-semibold text-red-600 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 transition"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      onClick={() => setIsMenuOpen(false)}
                      className="block w-full text-center py-3.5 rounded-full font-medium hover:bg-accent transition"
                    >
                      Login
                    </Link>
                    <button
                      onClick={() => {
                        handleGetStartedClick();
                        setIsMenuOpen(false);
                      }}
                      className="w-full py-4 rounded-full font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 shadow-md hover:shadow-lg hover:scale-105 transition-all"
                    >
                      Get Started
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}