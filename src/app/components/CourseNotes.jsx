"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Star, ChevronDown, ChevronRight, Save, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/csrfClient";

export default function CourseNotes({ courseId, lessons = [], onClose }) {
  const [notesMap, setNotesMap] = useState({});
  const [expandedLesson, setExpandedLesson] = useState(null);
  const [dirtyLessons, setDirtyLessons] = useState(new Set());
  const [savingLesson, setSavingLesson] = useState(null);
  const saveTimers = useRef({});

  const fetchNotes = useCallback(async () => {
    if (!courseId) return;
    try {
      const res = await apiClient.get(`/api/course-notes?courseId=${courseId}`);
      if (!res.ok) throw new Error("Failed to fetch notes");
      const data = await res.json();
      const map = {};
      (data.notes || []).forEach((n) => {
        map[n.lessonId] = n;
      });
      setNotesMap(map);
    } catch (err) {
      console.error("Error fetching course notes:", err);
    }
  }, [courseId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const groupedByModule = {};
  lessons.forEach((lesson) => {
    const mod = lesson.moduleTitle || "Uncategorized";
    if (!groupedByModule[mod]) groupedByModule[mod] = [];
    groupedByModule[mod].push(lesson);
  });

  const sortedModules = Object.entries(groupedByModule).sort(([a], [b]) => {
    const aHasBookmark = groupedByModule[a].some((l) => notesMap[l.id]?.bookmarked);
    const bHasBookmark = groupedByModule[b].some((l) => notesMap[l.id]?.bookmarked);
    if (aHasBookmark && !bHasBookmark) return -1;
    if (!aHasBookmark && bHasBookmark) return 1;
    return 0;
  });

  const handleNoteChange = (lessonId, value) => {
    setNotesMap((prev) => ({
      ...prev,
      [lessonId]: {
        ...prev[lessonId],
        lessonId,
        note: value,
        bookmarked: prev[lessonId]?.bookmarked || false,
      },
    }));
    setDirtyLessons((prev) => new Set(prev).add(lessonId));

    if (saveTimers.current[lessonId]) clearTimeout(saveTimers.current[lessonId]);
    saveTimers.current[lessonId] = setTimeout(() => {
      saveNote(lessonId);
    }, 2000);
  };

  const saveNote = async (lessonId) => {
    const entry = notesMap[lessonId];
    if (!entry) return;

    setSavingLesson(lessonId);
    try {
      const res = await apiClient.post("/api/course-notes", {
        courseId,
        lessonId,
        note: entry.note || "",
        bookmarked: entry.bookmarked || false,
      });
      if (!res.ok) throw new Error("Failed to save");
      setDirtyLessons((prev) => {
        const next = new Set(prev);
        next.delete(lessonId);
        return next;
      });
    } catch (err) {
      console.error("Save note error:", err);
      toast.error("Failed to save note");
    } finally {
      setSavingLesson(null);
    }
  };

  const toggleBookmark = async (lessonId) => {
    const entry = notesMap[lessonId] || { lessonId, note: "", bookmarked: false };
    const newBookmarked = !entry.bookmarked;

    setNotesMap((prev) => ({
      ...prev,
      [lessonId]: { ...entry, bookmarked: newBookmarked },
    }));

    try {
      const res = await apiClient.post("/api/course-notes", {
        courseId,
        lessonId,
        note: entry.note || "",
        bookmarked: newBookmarked,
      });
      if (!res.ok) throw new Error("Failed to toggle bookmark");
      toast.success(newBookmarked ? "Bookmarked!" : "Bookmark removed");
    } catch (err) {
      setNotesMap((prev) => ({
        ...prev,
        [lessonId]: { ...entry, bookmarked: !newBookmarked },
      }));
      toast.error("Failed to update bookmark");
    }
  };

  const deleteNote = async (lessonId) => {
    try {
      const res = await apiClient.delete(
        `/api/course-notes?courseId=${courseId}&lessonId=${lessonId}`
      );
      if (!res.ok) throw new Error("Failed to delete");
      setNotesMap((prev) => {
        const next = { ...prev };
        delete next[lessonId];
        return next;
      });
      toast.success("Note deleted");
    } catch (err) {
      console.error("Delete note error:", err);
      toast.error("Failed to delete note");
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 sm:p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm sm:text-base text-foreground">
              Course Notes & Bookmarks
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {lessons.length} lessons
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              <span className="sr-only">Close</span>
              &times;
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {sortedModules.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <p className="text-sm text-muted-foreground">No lessons available</p>
          </div>
        ) : (
          sortedModules.map(([moduleTitle, moduleLessons]) => (
            <div key={moduleTitle} className="border-b border-border">
              <div className="px-3 sm:px-4 py-2 bg-muted/30">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {moduleTitle}
                </p>
              </div>

              {moduleLessons.map((lesson) => {
                const entry = notesMap[lesson.id];
                const isExpanded = expandedLesson === lesson.id;
                const isDirty = dirtyLessons.has(lesson.id);
                const isSaving = savingLesson === lesson.id;
                const hasNote = entry?.note?.trim();
                const isBookmarked = entry?.bookmarked || false;

                return (
                  <div key={lesson.id} className="border-b border-border/50 last:border-b-0">
                    <div
                      className="flex items-center gap-2 px-3 sm:px-4 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => setExpandedLesson(isExpanded ? null : lesson.id)}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookmark(lesson.id);
                        }}
                        className="shrink-0 p-0.5 transition-colors"
                      >
                        <Star
                          className={`w-4 h-4 transition-colors ${
                            isBookmarked
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground hover:text-yellow-400"
                          }`}
                        />
                      </button>

                      <span
                        className={`text-sm flex-1 truncate ${
                          hasNote ? "text-foreground font-medium" : "text-muted-foreground"
                        }`}
                      >
                        {lesson.title}
                      </span>

                      {isDirty && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      )}
                      {isSaving && (
                        <Loader2 className="w-3 h-3 animate-spin text-primary shrink-0" />
                      )}
                    </div>

                    {isExpanded && (
                      <div className="px-3 sm:px-4 pb-3">
                        <textarea
                          value={entry?.note || ""}
                          onChange={(e) => handleNoteChange(lesson.id, e.target.value)}
                          placeholder="Write your notes for this lesson..."
                          className="w-full h-32 resize-none bg-muted/30 rounded-xl border border-border p-3 text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <div className="flex items-center justify-between mt-2">
                          <button
                            onClick={() => deleteNote(lesson.id)}
                            disabled={!hasNote}
                            className="text-xs text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            Delete
                          </button>
                          <button
                            onClick={() => saveNote(lesson.id)}
                            disabled={!isDirty || isSaving}
                            className="text-xs font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            <Save className="w-3 h-3" />
                            {isSaving ? "Saving..." : "Save"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
