"use client";

import { Menu, MessageCircle, CheckCircle, LayoutDashboard, Download } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MobileBottomNav({
  isSidebarOpen,
  setIsSidebarOpen,
  isRightPanelOpen,
  setIsRightPanelOpen,
  currentLesson,
  lessonContentLoading,
  isCurrentLessonCompleted,
  handleMarkCurrentLesson,
  handleDownloadLesson,
  canDownloadLessonPdf,
}) {
  const router = useRouter();

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-[90] border-t border-border bg-card/95 backdrop-blur-xl px-2 py-2">
      <div className="grid grid-cols-5 gap-1">
        <button
          onClick={() => {
            setIsRightPanelOpen(false);
            setIsSidebarOpen((prev) => !prev);
          }}
          className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-colors bg-transparent ${
            isSidebarOpen ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Menu className="w-4 h-4" />
          <span>Modules</span>
        </button>
        <button
          onClick={handleMarkCurrentLesson}
          disabled={!currentLesson?.content || lessonContentLoading}
          className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-colors bg-transparent ${
            isCurrentLessonCompleted ? "text-green-600" : "text-muted-foreground hover:text-foreground"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <CheckCircle
            className="w-4 h-4"
            fill={isCurrentLessonCompleted ? "currentColor" : "none"}
          />
          <span>Status</span>
        </button>
        <button
          onClick={() => router.push("/dashboard")}
          className="flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </button>
        <button
          onClick={handleDownloadLesson}
          disabled={!canDownloadLessonPdf}
          className="flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          <span>Save</span>
        </button>
        <button
          onClick={() => {
            setIsSidebarOpen(false);
            setIsRightPanelOpen((prev) => !prev);
          }}
          className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-colors bg-transparent ${
            isRightPanelOpen ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <MessageCircle
            className="w-4 h-4"
            fill={isRightPanelOpen ? "currentColor" : "none"}
          />
          <span>Tools</span>
        </button>
      </div>
    </div>
  );
}
