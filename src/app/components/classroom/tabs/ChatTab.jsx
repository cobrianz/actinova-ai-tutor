"use client";

import { useState, useEffect } from "react";
import { Users, ChevronLeft, GraduationCap } from "lucide-react";
import ClassroomChat from "../ClassroomChat";
import { apiClient } from "@/lib/csrfClient";

function ParticipantAvatar({ name, role, size = "md" }) {
  const initial = name?.charAt(0)?.toUpperCase() || "?";
  const sizeClass = size === "sm" ? "w-7 h-7 text-[11px]" : "w-9 h-9 text-sm";
  return (
    <div className={`${sizeClass} rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
      role === "instructor"
        ? "bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300"
        : "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300"
    }`}>
      {initial}
    </div>
  );
}

function ParticipantsList({ classroom, instructor, students, isInstructor, loading }) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/60">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground">Participants</span>
          <span className="ml-auto text-[10px] font-medium bg-secondary text-muted-foreground px-1.5 py-0.5 rounded-full">
            {students.length + 1}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        {/* Instructor */}
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-1 mb-1.5">
            Instructor
          </p>
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-secondary/60 transition-colors">
            <ParticipantAvatar name={instructor?.name || classroom.instructorName} role="instructor" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground truncate">
                {instructor?.name || classroom.instructorName || "Instructor"}
              </p>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 font-semibold">
                Instructor
              </span>
            </div>
          </div>
        </div>

        {/* Students */}
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-1 mb-1.5">
            Students ({students.length})
          </p>
          {loading ? (
            <div className="space-y-1.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2.5 px-2 py-1.5 animate-pulse">
                  <div className="w-9 h-9 rounded-full bg-secondary" />
                  <div className="flex-1 space-y-1">
                    <div className="h-2.5 bg-secondary rounded w-2/3" />
                    <div className="h-2 bg-secondary rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center px-2">
              <GraduationCap className="w-6 h-6 text-muted-foreground/40 mb-1.5" />
              <p className="text-[10px] text-muted-foreground">No students enrolled yet</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {students.map((s) => (
                <div
                  key={s.id || s._id}
                  className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-secondary/60 transition-colors"
                >
                  <ParticipantAvatar name={s.name} role="student" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate">{s.name}</p>
                    {isInstructor && s.email && (
                      <p className="text-[9px] text-muted-foreground truncate">{s.email}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatTab({ classroomState }) {
  const { classroom, user, isInstructor } = classroomState;
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [participants, setParticipants] = useState([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);

  // Fetch participants list (works for both instructors and students)
  useEffect(() => {
    const fetchParticipants = async () => {
      setParticipantsLoading(true);
      try {
        const res = await apiClient.get(`/api/classrooms/${classroom.id}/participants`);
        const data = await res.json();
        if (data.success) {
          setParticipants(data.students || []);
        }
      } catch {
        // silently fail — sidebar just shows empty
      } finally {
        setParticipantsLoading(false);
      }
    };
    fetchParticipants();
  }, [classroom.id]);

  const loading = participantsLoading;

  return (
    <div className="flex h-[calc(100vh-200px)] min-h-[500px] -mx-3 sm:-mx-6 lg:-mx-8 xl:-mx-12 -mt-6 sm:-mt-8 lg:-mt-12 overflow-hidden rounded-xl border border-border bg-card">
      {/* Participants sidebar */}
      <div
        className={`transition-all duration-300 border-r border-border bg-card/50 flex-shrink-0 ${
          sidebarOpen ? "w-56" : "w-0 overflow-hidden"
        }`}
      >
        <ParticipantsList
          classroom={classroom}
          instructor={classroom.instructor}
          students={participants}
          isInstructor={isInstructor}
          loading={loading}
        />
      </div>

      {/* Chat area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Sub-header with toggle */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-card/80 backdrop-blur-sm">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-1 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            title={sidebarOpen ? "Hide participants" : "Show participants"}
          >
            <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${sidebarOpen ? "" : "rotate-180"}`} />
          </button>
          <span className="text-xs font-semibold text-foreground">{classroom.name} — Chat</span>
          <span className="ml-auto text-[10px] text-muted-foreground flex items-center gap-1">
            <Users className="w-3 h-3" />
            {participants.length + 1}
          </span>
        </div>

        {/* Chat component fills the rest */}
        <div className="flex-1 overflow-hidden">
          <ClassroomChat classroomId={classroom.id} user={user} />
        </div>
      </div>
    </div>
  );
}
