"use client";

import { useAuth } from "@/components/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import NetworkAI from "@/dashboard/career/components/NetworkAI";
import CareerHeader from "../components/CareerHeader";

export default function NetworkPage() {
  const { user, loading, hasPurchased } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !hasPurchased("career_tools")) {
      router.replace("/dashboard/career");
    }
  }, [loading, hasPurchased, router]);

  if (loading || !hasPurchased("career_tools")) return null;

  return (
    <div className="w-full py-4 sm:py-8 px-0 min-h-[80vh]">
      <CareerHeader />
      <NetworkAI />
    </div>
  );
}
