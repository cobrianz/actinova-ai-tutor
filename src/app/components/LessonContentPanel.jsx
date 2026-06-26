"use client";

import { useDeferredValue } from "react";
import { BookOpen, Play } from "lucide-react";
import { renderLessonBlocks } from "@/lib/contentRenderer";
import LessonChart from "./LessonChart";
import LessonTable from "./LessonTable";

export default function LessonContentPanel({
  contentRef,
  isRightPanelOpen,
  isSidebarOpen,
  activeLesson,
  generatingLessons,
  typingLessonKey,
  typingContent,
  currentLesson,
  completedLessons,
  toggleLessonCompletion,
  goToNextLesson,
  courseData,
}) {
  const deferredTypingContent = useDeferredValue(typingContent);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto hide-scrollbar bg-background cursor-pointer lg:cursor-default"
      >
        <div className={`mx-auto p-4 pb-28 sm:p-6 sm:pb-32 lg:p-8 lg:pb-8 transition-all duration-300 ${isRightPanelOpen && isSidebarOpen ? "max-w-4xl" : "max-w-5xl"}`}>
          {(() => {
            const activeKey = `${activeLesson.moduleId}-${activeLesson.lessonIndex}`;
            const isGeneratingActive = generatingLessons.has(activeKey);
            const hasStreamText =
              typingLessonKey === activeKey && String(typingContent || "").trim().length > 0;

            if (isGeneratingActive) {
              if (hasStreamText) {
                return (
                  <div>
                    <div className="prose prose-sm sm:prose-base lg:prose-lg dark:prose-invert max-w-none">
                      <div className="not-prose mb-3">
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground border-b-2 border-slate-300 dark:border-slate-600 pb-2">
                          {currentLesson?.title || "Lesson"}
                        </h1>
                      </div>
                      <div className="space-y-6" id="lesson-content-container">
                        {renderLessonBlocks(deferredTypingContent, { streaming: true, LessonChart, LessonTable })}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                  <h3 className="text-lg font-medium text-foreground mb-2">
                    Generating lesson content...
                  </h3>
                  <p className="text-muted-foreground">
                    Please wait while we create personalized content for you
                  </p>
                </div>
              );
            }

            if (currentLesson?.content) {
              return null;
            }

            return null;
          })() ?? null}

          {(() => {
            const activeKey = `${activeLesson.moduleId}-${activeLesson.lessonIndex}`;
            const isGeneratingActive = generatingLessons.has(activeKey);

            if (isGeneratingActive) return null;

            if (currentLesson?.content) {
              return (
                <div>
                  <div className="prose prose-sm sm:prose-base lg:prose-lg dark:prose-invert max-w-none">
                    <div className="not-prose mb-3">
                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground border-b-2 border-slate-300 dark:border-slate-600 pb-2">
                        {currentLesson?.title || "Lesson"}
                      </h1>
                    </div>
                    <div className="space-y-6" id="lesson-content-container">
                      {renderLessonBlocks(currentLesson.content, { LessonChart, LessonTable })}
                    </div>

                    <div className="mt-12 pt-8 border-t border-border flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        Lesson {activeLesson.lessonIndex + 1} of {
                          courseData?.modules?.find(m => m.id === activeLesson.moduleId)?.lessons?.length || 0
                        }
                      </div>
                      <button
                        onClick={() => {
                          const lessonId = currentLesson?.id || `${activeLesson.moduleId}-${activeLesson.lessonIndex}`;
                          if (!completedLessons.has(lessonId)) {
                            toggleLessonCompletion(activeLesson.moduleId, activeLesson.lessonIndex);
                          }
                          goToNextLesson();
                        }}
                        className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20"
                      >
                        <span>Next Lesson</span>
                        <Play className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Select a lesson to start learning
                </h3>
                <p className="text-muted-foreground">
                  Choose a lesson from the sidebar to begin
                </p>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
