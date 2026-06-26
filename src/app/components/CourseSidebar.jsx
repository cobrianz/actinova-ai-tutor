"use client";

import { Download, Lock, ChevronUp, ChevronDown, Play } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function CourseSidebar({
  isSidebarOpen,
  courseData,
  isPro,
  FREE_READABLE_MODULES,
  expandedModules,
  toggleModule,
  activeLesson,
  selectLesson,
  completedLessons,
  generatingLessons,
  progressPercentage,
  canDownloadCoursePdf,
  handleDownloadCourse,
  isMyShareActive,
  isSharingToggle,
  handleShare,
  format,
}) {
  const router = useRouter();

  return (
    <div
      className={`${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } w-full lg:w-80 bg-card border-r border-border flex flex-col absolute z-[80] transition-transform duration-300 max-w-[90vw] md:max-w-[400px] h-full overflow-y-auto hide-scrollbar shadow-xl pb-24 md:pb-0`}
    >
      <div className="p-4 lg:p-6 border-b border-border">
        {courseData ? (
          <>
            <div className="flex justify-between flex-wrap flex-col">
              <h2 className="font-bold text-lg text-foreground mb-1">
                {courseData.title}
              </h2>
              {courseData.sharerName && (
                <p className="text-[11px] text-primary font-medium italic mb-2">
                  Shared by {courseData.sharerName.split(' ')[0]}
                </p>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {courseData.totalModules || 0} modules • {courseData.totalLessons || 0}{" "}
              lessons
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Loading course...</p>
        )}
        <button
          onClick={handleDownloadCourse}
          disabled={!canDownloadCoursePdf}
          className={
            canDownloadCoursePdf
              ? "w-full mb-4 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-500/20"
              : "w-full mb-4 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium bg-secondary text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed"
          }
        >
          <Download className="w-4 h-4" />
          <span>
            {canDownloadCoursePdf
              ? `Download ${format === "flashcards" ? "Flashcards" : "Course"} as PDF`
              : "Unlock course to download PDF"}
          </span>
        </button>
        {courseData && (
          <>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center text-sm font-semibold">
                {Math.round(progressPercentage)}%
              </div>
              <span className="text-sm text-muted-foreground">
                Completed
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </>
        )}
      </div>
      <div className="flex-1">
        {courseData && Array.isArray(courseData.modules) &&
          courseData.modules.map((module, moduleIndex) => (
            <div
              key={module?.id ?? moduleIndex}
              className="border-b border-border last:border-b-0"
            >
              <button
                onClick={() => {
                  if (!isPro && moduleIndex >= FREE_READABLE_MODULES) {
                    toast.error("Upgrade to Pro to unlock all 20 modules.", {
                      action: {
                        label: "Upgrade",
                        onClick: () => router.push("/dashboard"),
                      },
                    });
                    return;
                  }
                  toggleModule(module.id);
                }}
                className={`w-full p-4 flex items-center justify-between transition-colors ${
                  !isPro && moduleIndex >= FREE_READABLE_MODULES
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-secondary/50"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    !isPro && moduleIndex >= FREE_READABLE_MODULES
                      ? "bg-muted text-muted-foreground"
                      : "bg-green-500/10 text-green-600"
                  }`}>
                    {!isPro && moduleIndex >= FREE_READABLE_MODULES ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      moduleIndex + 1
                    )}
                  </div>
                  <span className={`text-sm font-medium text-left ${
                    !isPro && moduleIndex >= FREE_READABLE_MODULES
                      ? "text-muted-foreground"
                      : "text-foreground"
                  }`}>
                    {module.title}
                  </span>
                </div>
                {!isPro && moduleIndex >= FREE_READABLE_MODULES ? (
                  <Lock className="w-3.5 h-3.5 text-muted-foreground/50" />
                ) : expandedModules.has(module.id) ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              {expandedModules.has(module.id) && (
                <div className="bg-secondary/30">
                  {module.lessons.map((lesson, lessonIndex) => {
                    const lessonTitle =
                      typeof lesson === "string" ? lesson : lesson.title;
                    const lessonId =
                      (typeof lesson !== "string" && lesson.id) ||
                      `${module.id}-${lessonIndex}`;
                    const spinnerKey = `${module.id}-${lessonIndex}`;
                    const isCompleted = completedLessons.has(lessonId) ||
                      (typeof lesson !== "string" && (lesson.completed || (lesson.content && lesson.content.length > 100)));
                    const isActive =
                      activeLesson.moduleId === module.id &&
                      activeLesson.lessonIndex === lessonIndex;
                    return (
                      <button
                        key={lessonIndex}
                        id={`sidebar-lesson-${module.id}-${lessonIndex}`}
                        onClick={() => selectLesson(module.id, lessonIndex)}
                        className={`w-full p-3 pl-12 flex items-center justify-between hover:bg-secondary/20 transition-colors ${isActive
                          ? "bg-primary/5 border-r-2 border-primary"
                          : ""
                          }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-medium ${isCompleted
                              ? "bg-green-500 border-green-500 text-white"
                              : "border-border text-muted-foreground"
                              }`}
                          >
                            {isCompleted ? "✓" : lessonIndex + 1}
                          </div>
                          <span
                            className={`text-sm text-left flex-1 ${isActive
                              ? "text-primary font-medium"
                              : "text-foreground/80"
                              }`}
                          >
                            {lessonTitle}
                          </span>
                          {generatingLessons.has(spinnerKey) && (
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600 ml-2"></div>
                          )}
                        </div>
                        {!isCompleted && !generatingLessons.has(spinnerKey) && (
                          <Play className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
      </div>

      {!isPro && courseData && (
        <div className="p-4 border-t border-border bg-gradient-to-r from-primary/5 to-green-500/5">
          <div className="flex items-center space-x-2 mb-2">
            <Lock className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-foreground">
              {(courseData.totalModules || 0) - FREE_READABLE_MODULES} modules locked
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mb-3 leading-relaxed">
            You can read modules 1-2 for free. Upgrade to Pro or unlock this course to access all 20 modules.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="w-full py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:opacity-90 transition-opacity"
          >
            Upgrade to Pro
          </button>
        </div>
      )}
    </div>
  );
}
