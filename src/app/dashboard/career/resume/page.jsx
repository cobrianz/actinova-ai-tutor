"use client";

import { useAuth } from "@/components/AuthProvider";
import ResumeBuilder from "@/dashboard/career/components/ResumeBuilder";
import CareerHeader from "../components/CareerHeader";

export default function ResumePage() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <div className="w-full py-4 sm:py-8 px-0 min-h-[80vh]">
      <CareerHeader />
      <ResumeBuilder />
    </div>
  );
}
