"use client";

import LandingPage from "./components/LandingPage";
import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    // Increment visitor counter on page load
    fetch("/api/visitor-counter").catch(() => {
      // Ignore errors for visitor counter in production
    });
  }, []);

  return (
    <div>
      <LandingPage />
    </div>
  );
}
