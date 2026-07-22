"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Send, Inbox, ChevronLeft, Loader2, Megaphone,
  Trash2, Plus, X, Users, Mail, MailOpen, Reply,
} from "lucide-react";
import { apiClient } from "@/lib/csrfClient";
import { toast } from "sonner";

const MAX_BODY = 4000;

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function Avatar({ name, role }) {
  const color = role === "instructor"
    ? "bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300"
    : "bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300";
  return (
    <div className={`w-9 h-9 ${color} rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0`}>
      {(name || "?").charAt(0).toUpperCase()}
    </div>
  );
}

// ── Announcement panel ────────────────────────────────────────────────────────

function AnnouncementPanel({ classroomId, announcements, onAdd, onDelete }) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const handlePost = async () => {
    if (!title.trim() || !content.trim()) { toast.error("Title and content required"); return; }
    setSaving(true);
    try {
      const res = await apiClient.post(`/api/classrooms/${classroomId}/announcements`, { title, content });
      const data = await res.json();
      if (data.success) { onAdd(data.announcement); setTitle(""); setContent(""); setShowForm(false); toast.success("Announcement posted!"); }
      else toast.error(data.error || "Failed to post");
    } catch { toast.error("Failed to post"); } finally { setSaving(false); }
  };

  const handleDelete = async (annId) => {
    setDeletingId(annId);
    try {
      const res = await apiClient.delete(`/api/classrooms/${classroomId}/announcements?announcementId=${annId}`);
      const data = await res.json();
      if (data.success) { onDelete(annId); toast.success("Deleted"); }
      else toast.error(data.error || "Failed");
    } catch { toast.error("Failed to delete"); } finally { setDeletingId(null); }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Megaphone className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-semibold">Announcements</span>
          <span className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded-full">{announcements.length}</span>
        </div>
        <button onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-semibold hover:bg-amber-600 transition-colors">
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {showForm ? "Cancel" : "New Announcement"}
        </button>
      </div>

      {showForm && (
        <div className="px-6 py-4 border-b border-border space-y-3 bg-amber-50/40 dark:bg-amber-500/5">
          <div>
            <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Announcement subject..."
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-amber-400/30" />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Message</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="Write your announcement..." rows={4}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-amber-400/30 resize-none" />
          </div>
          <button onClick={handlePost} disabled={saving || !title.trim() || !content.trim()}
            className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white rounded-lg text-xs font-semibold hover:bg-amber-600 disabled:opacity-50 transition-colors">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Megaphone className="w-3.5 h-3.5" />}
            {saving ? "Posting..." : "Post Announcement"}
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto divide-y divide-border">
        {announcements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Megaphone className="w-10 h-10 text-muted-foreground/20 mb-3" />
            <p className="text-sm text-muted-foreground">No announcements yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Post an announcement to notify all students</p>
          </div>
        ) : (
          [...announcements].reverse().map((ann) => (
            <div key={ann._id} className="px-6 py-4 group hover:bg-secondary/30 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Megaphone className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground leading-tight">{ann.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{formatDate(ann.createdAt)}</p>
                    <p className="text-sm text-foreground/80 mt-2 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                  </div>
                </div>
                <button onClick={() => handleDelete(ann._id)} disabled={deletingId === ann._id}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all flex-shrink-0 disabled:opacity-50">
                  {deletingId === ann._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Single email view ─────────────────────────────────────────────────────────

function EmailView({ msg, myId, onReply, isInstructor }) {
  const mine = (msg.senderId?._id?.toString?.() || msg.senderId?.toString?.() || msg.senderId) === myId;
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Email header */}
      <div className="px-5 py-4 bg-secondary/30 border-b border-border">
        <div className="flex items-start gap-3">
          <Avatar name={msg.senderName} role={msg.senderRole} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">{msg.senderName}</p>
              <span className="text-[10px] text-muted-foreground flex-shrink-0">{formatDate(msg.createdAt)}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {msg.senderRole === "instructor" ? "Instructor" : "Student"}
            </p>
            {msg.subject && (
              <p className="text-xs font-medium text-foreground mt-2">
                <span className="text-muted-foreground">Subject: </span>{msg.subject}
              </p>
            )}
          </div>
        </div>
      </div>
      {/* Email body */}
      <div className="px-5 py-4">
        <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{msg.content}</p>
      </div>
      {/* Actions */}
      {onReply && (
        <div className="px-5 py-3 border-t border-border bg-secondary/20">
          <button onClick={onReply}
            className="flex items-center gap-1.5 text-xs font-semibold text-green-600 dark:text-green-400 hover:text-green-700 transition-colors">
            <Reply className="w-3.5 h-3.5" /> Reply
          </button>
        </div>
      )}
    </div>
  );
}

// ── Compose form ──────────────────────────────────────────────────────────────

function ComposeForm({ onSend, sending, toLabel, replyToSubject, onCancel }) {
  const [subject, setSubject] = useState(replyToSubject ? `Re: ${replyToSubject}` : "");
  const [body, setBody] = useState("");
  const [err, setErr] = useState("");

  const handleSubmit = () => {
    if (!subject.trim()) { setErr("Subject is required"); return; }
    if (!body.trim()) { setErr("Message body is required"); return; }
    setErr("");
    onSend(subject.trim(), body.trim());
  };

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Compose header */}
      <div className="flex items-center justify-between px-5 py-3 bg-secondary/30 border-b border-border">
        <span className="text-sm font-semibold text-foreground">
          {replyToSubject ? "Reply" : "New Message"}
        </span>
        {onCancel && (
          <button onClick={onCancel} className="p-1 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="px-5 py-4 space-y-3">
        {/* To */}
        <div className="flex items-center gap-3 pb-3 border-b border-border/60">
          <span className="text-xs font-semibold text-muted-foreground w-14">To</span>
          <span className="text-sm text-foreground">{toLabel}</span>
        </div>

        {/* Subject */}
        <div className="flex items-center gap-3 pb-3 border-b border-border/60">
          <span className="text-xs font-semibold text-muted-foreground w-14">Subject</span>
          <input value={subject} onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter subject..."
            className="flex-1 text-sm bg-transparent focus:outline-none text-foreground placeholder:text-muted-foreground/50" />
        </div>

        {/* Body */}
        <textarea value={body} onChange={(e) => setBody(e.target.value)}
          placeholder="Write your message..."
          rows={6}
          maxLength={MAX_BODY}
          className="w-full text-sm bg-transparent focus:outline-none text-foreground placeholder:text-muted-foreground/50 resize-none" />

        {err && <p className="text-xs text-red-500">{err}</p>}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-secondary/20">
        <span className="text-[10px] text-muted-foreground">{body.length}/{MAX_BODY}</span>
        <button onClick={handleSubmit} disabled={sending || !subject.trim() || !body.trim()}
          className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 disabled:opacity-50 transition-colors">
          {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          Send
        </button>
      </div>
    </div>
  );
}

// ── Thread view (list of emails in a conversation) ────────────────────────────

function ThreadView({ classroomId, user, isInstructor, studentId, studentName, instructorName, onBack }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replying, setReplying] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);
  const myId = user?._id?.toString?.() || user?._id || user?.id;
  const otherName = isInstructor ? studentName : (instructorName || "Instructor");
  const lastSubject = messages.findLast?.((m) => m.subject)?.subject || "";

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const url = isInstructor
        ? `/api/classrooms/${classroomId}/messages?studentId=${studentId}`
        : `/api/classrooms/${classroomId}/messages`;
      const res = await apiClient.get(url);
      const data = await res.json();
      if (data.success) setMessages(data.messages || []);
    } catch (err) { console.error("ThreadView:fetchMessages", err); } finally { setLoading(false); }
  }, [classroomId, isInstructor, studentId]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { if (!loading) bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const handleSend = async (subject, body) => {
    setSending(true);
    try {
      const payload = isInstructor
        ? { subject, content: body, recipientId: studentId }
        : { subject, content: body };
      const res = await apiClient.post(`/api/classrooms/${classroomId}/messages`, payload);
      const data = await res.json();
      if (data.success) { setMessages((prev) => [...prev, data.message]); setReplying(false); }
      else toast.error(data.error || "Failed to send");
    } catch { toast.error("Failed to send"); } finally { setSending(false); }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Thread toolbar */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-border">
        <button onClick={onBack} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2 min-w-0">
          <Avatar name={otherName} role={isInstructor ? "student" : "instructor"} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{otherName}</p>
            <p className="text-[10px] text-muted-foreground">{isInstructor ? "Student" : "Instructor"}</p>
          </div>
        </div>
        {!replying && (
          <button onClick={() => setReplying(true)}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors">
            <Plus className="w-3.5 h-3.5" />
            {messages.length === 0 ? "Compose" : "Reply"}
          </button>
        )}
      </div>

      {/* Email list */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : messages.length === 0 && !replying ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Mail className="w-10 h-10 text-muted-foreground/20 mb-3" />
            <p className="text-sm text-muted-foreground font-medium">No messages yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              {isInstructor ? `Send a message to ${studentName}` : "Send a message to your instructor"}
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <EmailView key={msg._id || i} msg={msg} myId={myId} isInstructor={isInstructor}
              onReply={i === messages.length - 1 && !replying ? () => setReplying(true) : null} />
          ))
        )}

        {replying && (
          <ComposeForm
            onSend={handleSend}
            sending={sending}
            toLabel={otherName}
            replyToSubject={lastSubject}
            onCancel={() => setReplying(false)}
          />
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

// ── Student view — goes straight to compose/thread with instructor ─────────────

function StudentView({ classroomId, user, classroom }) {
  return (
    <ThreadView
      classroomId={classroomId}
      user={user}
      isInstructor={false}
      studentId={null}
      instructorName={classroom?.instructorName || "Instructor"}
      onBack={() => {}}
    />
  );
}

// ── Instructor inbox list ─────────────────────────────────────────────────────

function InstructorInbox({ classroomId, user, students }) {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (selected) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(`/api/classrooms/${classroomId}/messages`);
        const data = await res.json();
        if (data.success) setThreads(data.threads || []);
      } catch (err) { console.error("InstructorInbox:fetchThreads", err); } finally { setLoading(false); }
    };
    load();
  }, [classroomId, selected]);

  if (selected) {
    return (
      <ThreadView classroomId={classroomId} user={user} isInstructor
        studentId={selected.id} studentName={selected.name}
        onBack={() => setSelected(null)} />
    );
  }

  const studentMap = Object.fromEntries((students || []).map((s) => [s.id, s]));
  const threadMap = Object.fromEntries(threads.map((t) => [t.studentId, t]));
  const allIds = [...new Set([...Object.keys(studentMap), ...Object.keys(threadMap)])];

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-6 py-3 border-b border-border">
        <Inbox className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-semibold">Student Messages</span>
        <span className="ml-auto text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded-full">{allIds.length}</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center flex-1"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
      ) : allIds.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center px-4">
          <Users className="w-10 h-10 text-muted-foreground/20 mb-3" />
          <p className="text-sm text-muted-foreground">No students enrolled yet</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {allIds.map((sid) => {
            const student = studentMap[sid];
            const thread = threadMap[sid];
            const name = student?.name || thread?.lastMessage?.senderName || "Student";
            const preview = thread?.lastMessage?.content;
            const subject = thread?.lastMessage?.subject;
            const unread = thread?.unreadCount || 0;
            const date = thread?.lastMessage?.createdAt;
            return (
              <button key={sid} onClick={() => setSelected({ id: sid, name })}
                className="flex items-center gap-4 w-full px-6 py-4 hover:bg-secondary/40 transition-colors text-left group">
                <Avatar name={name} role="student" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-sm truncate ${unread > 0 ? "font-bold text-foreground" : "font-medium text-foreground"}`}>{name}</p>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">{formatDate(date)}</span>
                  </div>
                  {subject && <p className="text-xs font-medium text-foreground/70 truncate mt-0.5">{subject}</p>}
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {preview || <span className="italic">No messages — click to compose</span>}
                  </p>
                </div>
                {unread > 0 && (
                  <span className="w-5 h-5 rounded-full bg-green-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{unread}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function ClassroomChat({
  classroomId, user, classroom, isInstructor,
  students, announcements, onAnnouncementAdd, onAnnouncementDelete,
}) {
  const [tab, setTab] = useState("messages");

  if (!isInstructor) {
    return (
      <div className="h-[calc(100vh-200px)] min-h-[500px] flex flex-col border border-border rounded-xl overflow-hidden bg-background">
        <StudentView classroomId={classroomId} user={user} classroom={classroom} />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-200px)] min-h-[500px] flex flex-col border border-border rounded-xl overflow-hidden bg-background">
      {/* Tab bar */}
      <div className="flex border-b border-border flex-shrink-0">
        {[
          { id: "messages", label: "Messages", icon: Inbox, accent: "green" },
          { id: "announcements", label: "Announcements", icon: Megaphone, accent: "amber" },
        ].map(({ id, label, icon: Icon, accent }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-5 py-3 text-xs font-semibold border-b-2 transition-colors ${
              tab === id
                ? `border-${accent}-500 text-${accent}-600 dark:text-${accent}-400`
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            <Icon className="w-3.5 h-3.5" />
            {label}
            {id === "announcements" && announcements?.length > 0 && (
              <span className="ml-1 text-[9px] bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded-full font-bold">
                {announcements.length}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {tab === "messages"
          ? <InstructorInbox classroomId={classroomId} user={user} students={students} />
          : <AnnouncementPanel classroomId={classroomId} announcements={announcements || []}
              onAdd={onAnnouncementAdd} onDelete={onAnnouncementDelete} />
        }
      </div>
    </div>
  );
}
