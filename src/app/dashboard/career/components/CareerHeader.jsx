"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";

export default function CareerHeader() {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center mb-8 px-2"
    >
      <button
        onClick={() => router.push("/dashboard/career")}
        className="group flex items-center gap-2 text-muted-foreground hover:text-foreground hover:bg-transparent p-0 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-all">
          <ChevronLeft size={18} />
        </div>
        <span className="font-bold tracking-tight">Back to Hub</span>
      </button>
    </motion.div>
  );
}
