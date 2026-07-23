"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Menu,
  Share2,
  Download,
  CheckCircle,
  MessageCircle,
} from "lucide-react";

export default function CourseToolbar({
  isSidebarOpen,
  setIsSidebarOpen,
  isRightPanelOpen,
  setIsRightPanelOpen,
  isMyShareActive,
  isSharingToggle,
  canDownloadLessonPdf,
  isCurrentLessonCompleted,
  currentLesson,
  lessonContentLoading,
  handleShare,
  handleDownloadLesson,
  handleMarkCurrentLesson,
  courseData,
}) {
  return (
    <div className="bg-card backdrop-blur-md border-b border-border py-2 px-3 sm:py-2.5 sm:px-4 z-[80] shadow-sm relative">
      <div className="flex items-center justify-between w-full px-0 sm:px-2 lg:px-4">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <Link
            href="/dashboard"
            className="hidden lg:flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-secondary/40 text-muted-foreground hover:bg-secondary transition-all"
            title="Dashboard"
          >
            <LayoutDashboard className="w-4 h-4" />
          </Link>
          <button
            onClick={() => {
              setIsRightPanelOpen(false);
              setIsSidebarOpen(!isSidebarOpen);
            }}
            className={`hidden md:flex items-center space-x-1.5 px-2.5 py-1 text-[11px] sm:text-xs rounded-lg border transition-all font-bold ${isSidebarOpen
              ? "bg-primary/10 text-primary border-primary/20"
              : "bg-secondary/50 text-muted-foreground border-border hover:bg-secondary"
              }`}
          >
            <Menu className="w-4 h-4" />
            <span className="hidden md:inline">Modules</span>
          </button>
        </div>

        <div className="hidden md:flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={handleShare}
            disabled={!courseData?._id || isSharingToggle}
            className={`p-1 sm:p-1.5 rounded-lg border transition-all ${isSharingToggle ? "opacity-50 cursor-not-allowed" : ""} ${
              isMyShareActive
                ? "bg-green-500/10 text-green-500 border-green-500/20 shadow-sm"
                : "bg-secondary/50 text-muted-foreground border-border hover:bg-secondary"
            }`}
            title={isSharingToggle ? "Updating share status..." : (isMyShareActive ? "Shared by me (Click to disable)" : (courseData?.isShared ? "Reshare course" : "Share course"))}
          >
            {isSharingToggle ? (
              <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Share2 className={`w-4 h-4 ${isMyShareActive ? "fill-green-500/10" : ""}`} />
            )}
          </button>
          <button
            onClick={handleDownloadLesson}
            className="p-1 sm:p-1.5 rounded-lg border bg-secondary/50 text-muted-foreground border-border hover:bg-secondary transition-all"
            title="Download Lesson PDF"
            disabled={!canDownloadLessonPdf}
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={handleMarkCurrentLesson}
            className={`flex items-center space-x-1.5 px-2 py-1 text-[11px] sm:text-xs rounded-lg transition-all font-bold border ${isCurrentLessonCompleted
              ? "bg-green-500/10 text-green-500 border-green-500/20"
              : "bg-primary/10 text-primary border-primary/20"
              }`}
            disabled={!currentLesson?.content || lessonContentLoading}
          >
            <CheckCircle className="w-4 h-4" />
            <span className="hidden sm:inline">
              {isCurrentLessonCompleted ? "Done" : "Complete"}
            </span>
          </button>
          <button
            onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
            className={`flex items-center space-x-1.5 px-2 py-1 text-[11px] sm:text-xs rounded-lg border transition-all font-bold ${isRightPanelOpen
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-secondary/50 text-muted-foreground border-border"
              }`}
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">AI Tutor</span>
          </button>
        </div>
      </div>
    </div>
  );
}
