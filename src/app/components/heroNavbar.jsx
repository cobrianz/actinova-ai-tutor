"use client";

import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useAuth } from "./AuthProvider";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";

export default function HeroNavbar({ handleGetStarted }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Handle scroll effect for navbar background
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
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
      } else {
        router.push(`/${href}`);
      }
      setIsMenuOpen(false);
    }
  };

  // Improved active state: only highlight full paths, not anchors
  const isActivePath = (href) => {
    if (href.startsWith("#")) return false; // Don't highlight anchor links
    return pathname === href;
  };

  return (
    <header
      className={`sticky top-0 left-0 right-0 z-[999] transition-all duration-300 border-b border-gray-200/60 dark:border-gray-700/60 ${
        scrolled
          ? "backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 shadow-sm"
          : "backdrop-blur-md bg-white/50 dark:bg-gray-900/50"
      }`}
    >
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center">
              <img
                src="/logo.png"
                alt="Actinova AI Tutor"
                className="w-8 h-8 lg:w-10 lg:h-10 object-contain transition-transform group-hover:scale-110"
              />
            </div>
            <span className="hidden sm:block text-lg font-semibold text-gray-900 dark:text-white">
              Actinova AI Tutor
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={(e) =>
                  link.isAnchor ? handleNavClick(e, link.href, true) : null
                }
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isActivePath(link.href)
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                    : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className="px-5 py-2.5 rounded-lg font-semibold text-sm text-white bg-gradient-to-r from-blue-600/80 to-purple-600/80 hover:from-blue-600 hover:to-purple-600 backdrop-blur-md shadow-sm hover:shadow transition"
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-5 py-2.5 rounded-lg font-medium text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="px-5 py-2.5 rounded-lg font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  Login
                </Link>
                <button
                  onClick={handleGetStartedClick}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-7 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  Get Started
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden fixed left-0 right-0 top-16 z-[999] transition-all duration-300 ease-out ${
          isMenuOpen
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-2 pointer-events-none"
        }`}
      >
        <div className="px-4 py-6 space-y-1 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 shadow-md">
          {navLinks.map((link) =>
            link.isAnchor ? (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href, true)}
                className="block px-4 py-3 text-lg font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMenuOpen(false)}
                className={`block px-4 py-3 text-lg font-medium rounded-lg transition ${
                  isActivePath(link.href)
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                    : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {link.label}
              </Link>
            )
          )}

          <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700 space-y-4">
            {user ? (
              <>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    router.push("/dashboard");
                  }}
                  className="w-full text-center py-3 text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-blue-600/80 to-purple-600/80 hover:from-blue-600 hover:to-purple-600 backdrop-blur-md shadow-sm hover:shadow transition"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full py-3 text-sm font-semibold rounded-lg transition text-red-600 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 backdrop-blur-md shadow-sm hover:shadow"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="block w-full text-center py-3 text-lg font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                >
                  Login
                </Link>
                <button
                  onClick={() => {
                    handleGetStartedClick();
                    setIsMenuOpen(false);
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
