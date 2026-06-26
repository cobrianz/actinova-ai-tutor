"use client";

import { useState, useEffect, useCallback } from "react";
import { Bookmark, Loader2, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function NotesPanel({
  courseId,
  currentLesson,
  activeLesson,
  courseData,
}) {
  const [notes, setNotes] = useState("");
  const [savedNotes, setSavedNotes] = useState({});
  const [selectedNoteLesson, setSelectedNoteLesson] = useState(null);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesSaving, setNotesSaving] = useState(false);

  const lessonId = currentLesson?.id || `${activeLesson.moduleId}-${activeLesson.lessonIndex}`;

  useEffect(() => {
    const fetchNotes = async () => {
      setNotesLoading(true);
      try {
        const res = await fetch(`/api/notes?courseId=${courseId}`);
        if (res.ok) {
          const data = await res.json();
          const notesMap = {};
          Array.isArray(data.notes) && data.notes.forEach((note) => {
            notesMap[note.lessonId] = note.content;
          });
          setSavedNotes(notesMap);
          if (data.notes?.length > 0 && !selectedNoteLesson) {
            setSelectedNoteLesson(lessonId);
            setNotes(notesMap[lessonId] || "");
          }
        }
      } catch {
        // ignore
      } finally {
        setNotesLoading(false);
      }
    };
    if (courseId) fetchNotes();
  }, [courseId]);

  useEffect(() => {
    if (lessonId && savedNotes[lessonId] !== undefined) {
      setNotes(savedNotes[lessonId]);
    } else {
      setNotes("");
    }
  }, [lessonId, savedNotes]);

  const saveNotes = useCallback(async () => {
    if (!courseId) return;
    setNotesSaving(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          lessonId,
          content: notes,
        }),
      });
      if (res.ok) {
        setSavedNotes((prev) => ({ ...prev, [lessonId]: notes }));
        toast.success("Notes saved");
      } else {
        toast.error("Failed to save notes");
      }
    } catch {
      toast.error("Failed to save notes");
    } finally {
      setNotesSaving(false);
    }
  }, [courseId, lessonId, notes]);

  const deleteNote = useCallback(async (noteLessonId) => {
    if (!courseId) return;
    try {
      const res = await fetch(`/api/notes?courseId=${courseId}&lessonId=${noteLessonId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSavedNotes((prev) => {
          const next = { ...prev };
          delete next[noteLessonId];
          return next;
        });
        if (selectedNoteLesson === noteLessonId) {
          setSelectedNoteLesson(null);
          setNotes("");
        }
        toast.success("Note deleted");
      }
    } catch {
      toast.error("Failed to delete note");
    }
  }, [courseId, selectedNoteLesson]);

  const noteLessonIds = Object.keys(savedNotes);

  return (
    <div className="space-y-4">
      {notesLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {noteLessonIds.length > 0 && (
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                Saved Notes
              </label>
              <div className="space-y-1 max-h-24 overflow-y-auto hide-scrollbar mb-3">
                {noteLessonIds.map((nid) => {
                  const note = savedNotes[nid];
                  const preview = (note || "").substring(0, 40);
                  const isSavingCurrent = notesSaving && lessonId === nid;
                  return (
                    <button
                      key={nid}
                      onClick={() => {
                        setSelectedNoteLesson(nid);
                        setNotes(savedNotes[nid] || "");
                      }}
                      className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-center justify-between ${selectedNoteLesson === nid
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                        }`}
                    >
                      <span className="truncate flex-1">
                        {preview || "Empty note"}
                      </span>
                      {isSavingCurrent && (
                        <Loader2 className="w-3 h-3 animate-spin flex-shrink-0 ml-1" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
              {selectedNoteLesson === lessonId ? "Current Lesson Notes" : "Notes"}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write your notes here..."
              rows={6}
              className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
            />
          </div>

          <div className="flex space-x-2">
            <button
              onClick={saveNotes}
              disabled={notesSaving}
              className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {notesSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
              <span>{notesSaving ? "Saving..." : "Save Notes"}</span>
            </button>
            {selectedNoteLesson && (
              <button
                onClick={() => deleteNote(selectedNoteLesson)}
                className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-all"
                title="Delete note"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {noteLessonIds.length === 0 && (
            <div className="flex items-start space-x-2 p-3 bg-muted/50 rounded-lg">
              <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                No saved notes yet. Write notes for each lesson and save them for later reference.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
