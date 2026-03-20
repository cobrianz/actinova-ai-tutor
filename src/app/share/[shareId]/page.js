import LearnContent from "@/components/LearnContent";
import { Suspense } from "react";
import ActirovaLoader from "@/components/ActirovaLoader";

export const metadata = {
  title: "Shared Course | Actinova AI Tutor",
  description: "View this shared AI-generated course on Actinova.",
};

export default function SharedCoursePage() {
  return (
    <main className="min-h-screen bg-background">
      <Suspense fallback={<ActirovaLoader text="Loading shared course..." />}>
        <LearnContent />
      </Suspense>
    </main>
  );
}
