"use client";

import LandingPage from "./components/LandingPage";
import { useEffect } from "react";
import { apiClient } from "@/lib/csrfClient";

export default function Home() {
  useEffect(() => {
    // Increment visitor counter on page load
    apiClient.get("/api/visitor-counter").catch(() => {
      // Ignore errors for visitor counter in production
    });
  }, []);

  return (
    <div>
      <LandingPage />
    </div>
  );
}
