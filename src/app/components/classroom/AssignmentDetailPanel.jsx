"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, ListOrdered, CheckCircle2, Check, Play, Edit3, Eye, Send, Loader2, MessageSquare, Save, XCircle, AlertTriangle, Trophy, ArrowRight, CornerDownRight, Clock, Pin } from "lucide-react";
import { TYPE_CONFIG } from "./constants";
import { apiClient } from "@/lib/csrfClient";
import AssignmentEditor from "./AssignmentEditor";

function formatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function DiscussionAssignmentView({ assignment, classroomId, tc, TypeIcon }) {
  const [discussion, setDiscussion] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [posting, setPosting] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState({});
  const discId = assignment.meta?.discussionId;

  const fetchDiscussion = useCallback(async () => {
    if (!discId) return;
    try {
      const res = await apiClient.get(`/api/classrooms/${classroomId}/discussions`);
      const data = await res.json();
      if (data.success) {
        const found = data.discussions.find((d) => (d._id || d.id) === discId);
        if (found) setDiscussion(found);
      }
    } catch (e) { console.error(e); }
  }, [classroomId, discId]);

  const fetchPosts = useCallback(async () => {
    if (!discId) return;
    try {
      const res = await apiClient.get(`/api/classrooms/${classroomId}/discussions/${discId}/posts`);
      const data = await res.json();
      if (data.success) setPosts(data.posts || []);
    } catch (e) { console.error(e); }
  }, [classroomId, discId]);

  useEffect(() => { Promise.all([fetchDiscussion(), fetchPosts()]).finally(() => setLoading(false)); }, [fetchDiscussion, fetchPosts]);

  const handlePost = async () => {
    if (!replyContent.trim()) return;
    setPosting(true);
    try {
      const res = await apiClient.post(`/api/classrooms/${classroomId}/discussions/${discId}/posts`, { content: replyContent, parentPostId: replyingTo || undefined });
      const data = await res.json();
      if (data.success) {
        setPosts((prev) => [...prev, data.post]);
        setReplyContent("");
        setReplyingTo(null);
      }
    } catch (e) { console.error(e); }
    setPosting(false);
  };

  const toggleReplies = (id) => setExpandedReplies((prev) => ({ ...prev, [id]: !prev[id] }));

  const rootPosts = posts.filter((p) => !p.parentPostId);
  const repliesMap = {};
  posts.forEach((p) => {
    if (p.parentPostId) {
      const pid = typeof p.parentPostId === "object" ? p.parentPostId._id : p.parentPostId;
      if (!repliesMap[pid]) repliesMap[pid] = [];
      repliesMap[pid].push(p);
    }
  });

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl ${tc.color} flex items-center justify-center flex-shrink-0`}>
              <TypeIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{assignment.title}</h3>
              {discussion?.title && <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold mt-0.5">{discussion.title}</p>}
              {discussion?.description && <p className="text-xs text-slate-500 mt-1">{discussion.description}</p>}
              {discussion?.isClosed && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full mt-1">Closed</span>}
              {discussion?.isPinned && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full mt-1 ml-1"><Pin className="w-2 h-2" /> Pinned</span>}
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {assignment.instructions && (
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Instructions</h4>
              <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <div className="space-y-1">{renderInstructions(assignment.instructions)}</div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => <div key={i} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 animate-pulse"><div className="flex gap-3"><div className="flex-1 space-y-2"><div className="h-3 bg-secondary rounded w-1/3" /><div className="h-2 bg-secondary rounded w-full" /></div></div></div>)}
            </div>
          ) : rootPosts.length === 0 ? (
            <div className="bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center">
              <MessageSquare className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-400">No posts yet</p>
              <p className="text-[10px] text-slate-400/60 mt-0.5">Be the first to respond below</p>
            </div>
          ) : (
            <div className="space-y-3">
              {rootPosts.map((post, i) => {
                const authorName = post.authorId?.name || "Unknown";
                const isInstructorPost = post.authorId?.role === "instructor";
                const postReplies = repliesMap[post._id || post.id] || [];
                const isExpanded = expandedReplies[post._id || post.id];
                return (
                  <motion.div key={post._id || post.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                    className={`bg-card border rounded-xl overflow-hidden ${isInstructorPost ? "border-l-[3px] border-l-green-500 border-border" : "border-border"}`}>
                    <div className="flex gap-3 p-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-bold text-foreground">{authorName}</span>
                          {isInstructorPost && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">Instructor</span>}
                          <span className="text-[10px] text-muted-foreground">{formatTime(post.createdAt)}</span>
                          {post.isEdited && <span className="text-[10px] text-muted-foreground/60 italic">(edited)</span>}
                        </div>
                        <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{post.content}</p>
                        {!discussion?.isClosed && (
                          <button onClick={() => { setReplyingTo(post._id || post.id); setReplyContent(""); }} className="flex items-center gap-1 mt-2 text-[11px] font-semibold text-muted-foreground hover:text-green-600 transition-colors">
                            <CornerDownRight className="w-3 h-3" /> Reply
                          </button>
                        )}
                      </div>
                    </div>
                    {postReplies.length > 0 && (
                      <div className="px-4 pb-2">
                        <button onClick={() => toggleReplies(post._id || post.id)} className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                          {isExpanded ? "Hide" : "Show"} {postReplies.length} reply{postReplies.length !== 1 ? "ies" : ""}
                        </button>
                      </div>
                    )}
                    <AnimatePresence>
                      {isExpanded && postReplies.map((reply) => {
                        const replyAuthor = reply.authorId?.name || "Unknown";
                        const isReplyInstructor = reply.authorId?.role === "instructor";
                        return (
                          <motion.div key={reply._id || reply.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="border-t border-border/40 ml-10 bg-secondary/10">
                            <div className="flex gap-3 px-4 py-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                  <span className="text-xs font-bold text-foreground">{replyAuthor}</span>
                                  {isReplyInstructor && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">Instructor</span>}
                                  <span className="text-[10px] text-muted-foreground">{formatTime(reply.createdAt)}</span>
                                </div>
                                <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{reply.content}</p>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                    <AnimatePresence>
                      {replyingTo === (post._id || post.id) && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="border-t border-border/50 bg-secondary/20 overflow-hidden">
                          <div className="p-3">
                            <textarea value={replyContent} onChange={(e) => setReplyContent(e.target.value)} placeholder="Write a reply..." rows={2} className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-border rounded-lg text-xs text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:ring-2 focus:ring-green-500/30" autoFocus />
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-[10px] text-muted-foreground/50">Ctrl+Enter to post</span>
                              <div className="flex gap-1">
                                <button onClick={() => { setReplyingTo(null); setReplyContent(""); }} className="px-3 py-1.5 bg-secondary text-muted-foreground rounded-lg text-xs font-semibold hover:bg-secondary/80 transition-colors">Cancel</button>
                                <button onClick={handlePost} disabled={!replyContent.trim() || posting} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-bold disabled:opacity-40 hover:bg-green-600 transition-all">
                                  {posting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} Reply
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}

          {!discussion?.isClosed && (
            <div className="bg-card border border-border rounded-xl p-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <textarea value={replyContent} onChange={(e) => setReplyContent(e.target.value)} placeholder={replyingTo ? "Write a reply..." : "Share your thoughts..."} rows={3} className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none resize-none" onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handlePost(); }} />
                  <div className="flex items-center justify-between pt-3 border-t border-border/60 mt-2">
                    <span className="text-[10px] text-muted-foreground/50">Ctrl+Enter to post</span>
                    <button onClick={handlePost} disabled={!replyContent.trim() || posting} className="flex items-center gap-1.5 px-5 py-2 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 disabled:opacity-40 transition-all">
                      {posting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />} Post
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function parseInlineMarkdown(text) {
  if (!text) return text;
  const parts = [];
  let remaining = text;
  let keyIdx = 0;
  const boldItalicRegex = /\*\*\*(.+?)\*\*\*/g;
  const boldRegex = /\*\*(.+?)\*\*/g;
  const italicRegex = /(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g;
  const combined = text.replace(boldItalicRegex, "<b><i>$1</i></b>").replace(boldRegex, "<b>$1</b>").replace(italicRegex, "<i>$1</i>");
  if (combined !== text) {
    const parts2 = combined.split(/(<b>.*?<\/b>|<i>.*?<\/i>)/g).filter(Boolean);
    return parts2.map((part, idx) => {
      if (part.startsWith("<b>") && part.endsWith("</b>")) {
        const inner = part.slice(3, -4);
        if (inner.startsWith("<i>") && inner.endsWith("</i>")) {
          return <strong key={idx}><em>{inner.slice(3, -4)}</em></strong>;
        }
        return <strong key={idx}>{inner}</strong>;
      }
      if (part.startsWith("<i>") && part.endsWith("</i>")) {
        return <em key={idx}>{part.slice(3, -4)}</em>;
      }
      return part;
    });
  }
  return text;
}

function renderInstructions(text) {
  if (!text) return null;
  const lines = text.split("\n");
  const elements = [];
  let i = 0;

  const isSectionHeader = (line) => {
    const t = line.trim();
    if (!t || t.length > 80) return false;
    return /^(Objectives?|Requirements?|Submission Guidelines?|Grading Criteria?|Important Notes?|Overview|Description|Deliverables?|Summary|Conclusion|Instructions?|Guidelines?|Steps?|Prerequisites?|Resources?|Format|Content|Time Limit|Access|Deadline|Criteria|Expectations|Tasks?|Notes?|Policies?|References?):?\s*$/i.test(t);
  };

  while (i < lines.length) {
    const line = lines[i];

    if (/^#{1,3}\s+/.test(line)) {
      elements.push(<p key={i} className="font-bold text-slate-900 dark:text-white text-sm mt-3 first:mt-0 mb-1">{parseInlineMarkdown(line.replace(/^#{1,3}\s+/, ""))}</p>);
      i++;
    } else if (line.includes("|") && i + 1 < lines.length && /^\|?\s*[-:]+[-|:\s]*$/.test(lines[i + 1].trim())) {
      const headers = line.split("|").map((c) => c.trim()).filter(Boolean);
      i += 2;
      const rows = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim() !== "") {
        rows.push(lines[i].split("|").map((c) => c.trim()).filter(Boolean));
        i++;
      }
      elements.push(
        <div key={`table-${i}`} className="overflow-x-auto my-2">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>{headers.map((h, hi) => <th key={hi} className="px-2 py-1.5 text-left font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">{parseInlineMarkdown(h)}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => (
                <tr key={ri}>{row.map((cell, ci) => <td key={ci} className="px-2 py-1.5 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">{parseInlineMarkdown(cell)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } else if (isSectionHeader(line)) {
      elements.push(<p key={i} className="font-bold text-slate-900 dark:text-white text-sm mt-3 first:mt-0 mb-1">{parseInlineMarkdown(line.replace(/:$/, ""))}</p>);
      i++;
    } else if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*]\s+/, ""));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="list-disc list-outside ml-8 space-y-1 text-sm my-2">
          {items.map((item, j) => <li key={j} className="text-slate-700 dark:text-slate-300">{parseInlineMarkdown(item)}</li>)}
        </ul>
      );
    } else if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s+/, ""));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="list-decimal list-outside ml-8 space-y-1 text-sm my-2">
          {items.map((item, j) => <li key={j} className="text-slate-700 dark:text-slate-300">{parseInlineMarkdown(item)}</li>)}
        </ol>
      );
    } else if (line.trim() === "") {
      i++;
    } else {
      elements.push(<p key={i} className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{parseInlineMarkdown(line)}</p>);
      i++;
    }
  }

  return elements;
}

function QuizQuestion({ question, index, answer, onAnswer }) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-green-300 dark:hover:border-green-600 transition-all">
      <div className="flex items-start gap-3 mb-3">
        <span className="flex items-center justify-center w-7 h-7 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-bold flex-shrink-0">{index + 1}</span>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{question.text}</p>
          <span className="text-[10px] font-bold text-green-600 dark:text-green-400">{question.points} pts</span>
        </div>
      </div>
      {question.type === "multiple-choice" && (
        <div className="space-y-2 ml-10">
          {(question.options || []).map((opt, i) => (
            <label key={i} className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${answer === opt ? "border-green-400 bg-green-50 dark:bg-green-500/10" : "border-slate-200 dark:border-slate-700 hover:border-green-300"}`}>
              <input type="radio" name={`q-${index}`} checked={answer === opt} onChange={() => onAnswer(opt)} className="accent-green-500" />
              <span className="text-xs text-slate-700 dark:text-slate-300">{opt}</span>
            </label>
          ))}
        </div>
      )}
      {question.type === "true-false" && (
        <div className="flex gap-3 ml-10">
          {["True", "False"].map((opt) => (
            <label key={opt} className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${answer === opt ? "border-green-400 bg-green-50 dark:bg-green-500/10" : "border-slate-200 dark:border-slate-700 hover:border-green-300"}`}>
              <input type="radio" name={`q-${index}`} checked={answer === opt} onChange={() => onAnswer(opt)} className="accent-green-500" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{opt}</span>
            </label>
          ))}
        </div>
      )}
      {question.type === "multiple-select" && (
        <div className="space-y-2 ml-10">
          <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mb-1">Select all that apply</p>
          {(question.options || []).map((opt, i) => {
            const isSelected = Array.isArray(answer) && answer.includes(opt);
            return (
              <label key={i} className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${isSelected ? "border-green-400 bg-green-50 dark:bg-green-500/10" : "border-slate-200 dark:border-slate-700 hover:border-green-300"}`}>
                <input type="checkbox" checked={isSelected} onChange={() => {
                  const current = Array.isArray(answer) ? [...answer] : [];
                  onAnswer(current.includes(opt) ? current.filter((x) => x !== opt) : [...current, opt]);
                }} className="accent-green-500" />
                <span className="text-xs text-slate-700 dark:text-slate-300">{opt}</span>
              </label>
            );
          })}
        </div>
      )}
      {question.type === "short-answer" && (
        <div className="ml-10">
          <textarea value={answer || ""} onChange={(e) => onAnswer(e.target.value)} placeholder="Type your answer..." rows={2} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-green-500/30" />
        </div>
      )}
    </div>
  );
}

export default function AssignmentDetailPanel({ assignment, isInstructor, classroomId, onBack, onStart, onComplete, onEdit, onSubmissions, onSubmit, setActiveTab, setFocusedDiscussionId }) {
  const [showRubric, setShowRubric] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [text, setText] = useState("");
  const [instructorComment, setInstructorComment] = useState("");
  const [savingComment, setSavingComment] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(null);
  const [quizTimeLeft, setQuizTimeLeft] = useState(null);
  const [quizTimerActive, setQuizTimerActive] = useState(false);
  const tc = TYPE_CONFIG[assignment.type] || TYPE_CONFIG._default;
  const TypeIcon = tc.icon;

  const due = (() => {
    if (!assignment.dueDate) return null;
    const now = new Date(); const due = new Date(assignment.dueDate); const hoursLeft = (due - now) / (1000 * 60 * 60);
    if (hoursLeft < 0) return { label: "Overdue", color: "text-red-500 bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30" };
    if (hoursLeft < 24) return { label: `${Math.round(hoursLeft)}h left`, color: "text-amber-500 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30" };
    if (hoursLeft < 72) return { label: `${Math.round(hoursLeft / 24)}d left`, color: "text-blue-500 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30" };
    return { label: `${Math.round(hoursLeft / 24)}d left`, color: "text-slate-500 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700" };
  })();

  const progress = assignment.myProgress;
  const isSubmitted = progress?.status === "completed" && progress?.submissionText;
  const totalRubricPoints = (assignment.rubric || []).reduce((sum, r) => sum + (r.maxPoints || 0), 0);

  useEffect(() => {
    if (!quizTimerActive || quizTimeLeft === null || quizSubmitted) return;
    if (quizTimeLeft <= 0) {
      setQuizTimerActive(false);
      handleQuizSubmit();
      return;
    }
    const timer = setInterval(() => setQuizTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [quizTimerActive, quizTimeLeft, quizSubmitted]);

  const handleSubmit = async () => {
    if (!text) return;
    setSubmitting(true);
    try {
      const res = await apiClient.post(`/api/classrooms/${classroomId}/submissions`, {
        assignmentId: assignment.id,
        text,
      });
      const data = await res.json();
      if (data.success) {
        if (onSubmit) onSubmit(data.progress);
        setText("");
      }
    } catch (err) { console.error("AssignmentDetailPanel:handleSubmit", err); } finally {
      setSubmitting(false);
    }
  };

  const handleStartQuiz = async () => {
    setQuizLoading(true);
    try {
      const timeLimit = assignment.meta?.timeLimitMinutes || 30;
      const isTimed = assignment.meta?.isTimed !== false;
      if (assignment.quizQuestions?.length > 0) {
        setQuizQuestions(assignment.quizQuestions);
        if (isTimed) {
          setQuizTimeLeft(timeLimit * 60);
          setQuizTimerActive(true);
        }
        setQuizLoading(false);
        return;
      }
      const res = await apiClient.post(`/api/classrooms/${classroomId}/ai-generate`, {
        task: "quiz_questions",
        name: assignment.title,
        subject: assignment.category,
        content: assignment.instructions,
      });
      const data = await res.json();
      if (data.result?.questions?.length > 0) {
        const questions = data.result.questions.map((q, i) => ({
          id: i,
          text: q.text,
          type: q.type || "multiple-choice",
          points: q.points || 2,
          options: q.options || [],
          correctAnswer: q.correctAnswer,
        }));
        setQuizQuestions(questions);
        if (isTimed) {
          setQuizTimeLeft(timeLimit * 60);
          setQuizTimerActive(true);
        }
        try {
          await apiClient.patch(`/api/classrooms/${classroomId}/assignments/${assignment.id}`, { quizQuestions: questions });
        } catch (e) { console.error("Failed to save quiz questions:", e); }
      }
    } catch (err) { console.error("Quiz generation failed:", err); }
    setQuizLoading(false);
  };

  const handleQuizSubmit = async () => {
    setSubmitting(true);
    let score = 0;
    let total = 0;
    if (quizQuestions) {
      quizQuestions.forEach((q, i) => {
        total += q.points;
        const userAnswer = quizAnswers[q.id ?? i];
        if (q.type === "multiple-select") {
          const correct = Array.isArray(q.correctAnswer) ? q.correctAnswer : [];
          const userArr = Array.isArray(userAnswer) ? userAnswer : [];
          if (correct.length > 0 && userArr.length === correct.length && correct.every((c) => userArr.includes(c))) score += q.points;
        } else if (q.type === "short-answer") {
          if (userAnswer && q.correctAnswer && userAnswer.toLowerCase().trim() === String(q.correctAnswer).toLowerCase().trim()) score += q.points;
        } else {
          if (userAnswer === q.correctAnswer) score += q.points;
        }
      });
    }
    const percentage = total > 0 ? Math.round((score / total) * assignment.maxScore) : 0;
    setQuizScore({ score: percentage, total: assignment.maxScore, rawScore: score, rawTotal: total });
    setQuizSubmitted(true);
    try {
      const res = await apiClient.post(`/api/classrooms/${classroomId}/submissions`, {
        assignmentId: assignment.id,
        text: `Quiz completed. Score: ${score}/${total} (${percentage}/${assignment.maxScore})`,
        score: percentage,
      });
      const data = await res.json();
      if (data.success && onSubmit) onSubmit(data.progress);
    } catch (err) { console.error("Quiz submit failed:", err); }
    setSubmitting(false);
  };

  if (assignment.type === "discussion" && assignment.meta?.discussionId) {
    return <DiscussionAssignmentView assignment={assignment} classroomId={classroomId} tc={tc} TypeIcon={TypeIcon} />;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl ${tc.color} flex items-center justify-center flex-shrink-0`}>
              <TypeIcon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{assignment.title}</h3>
                {due && <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${due.color}`}>{due.label}</span>}
              </div>
              {assignment.description && <p className="text-sm text-slate-500 mt-1">{assignment.description}</p>}
            </div>
          </div>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Type</p>
              <p className="text-xs font-bold text-slate-900 dark:text-white capitalize">{assignment.type}</p>
            </div>
            {assignment.category && (
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Category</p>
                <p className="text-xs font-bold text-slate-900 dark:text-white">{assignment.category}</p>
              </div>
            )}
            {assignment.dueDate && (
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Due Date</p>
                <p className="text-xs font-bold text-slate-900 dark:text-white">{new Date(assignment.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            )}
            {assignment.maxScore > 0 && (
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Max Score</p>
                <p className="text-xs font-bold text-slate-900 dark:text-white">{assignment.maxScore} pts</p>
              </div>
            )}
            {(assignment.type === "quiz" || assignment.type === "exam") && (
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Timing</p>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  {assignment.meta?.isTimed !== false
                    ? `${assignment.meta?.timeLimitMinutes || 30} min`
                    : "Untimed"}
                </p>
              </div>
            )}
          </div>

          {(assignment.availableFrom || assignment.availableUntil) && (
            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg p-3">
              <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">Availability Window</p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {assignment.availableFrom && new Date(assignment.availableFrom).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                {assignment.availableFrom && assignment.availableUntil && " — "}
                {assignment.availableUntil && new Date(assignment.availableUntil).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          )}

          {assignment.instructions && (
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Instructions</h4>
              <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <div className="space-y-1">{renderInstructions(assignment.instructions)}</div>
              </div>
            </div>
          )}

          {assignment.rubric && assignment.rubric.length > 0 && (
            <div>
              <button onClick={() => setShowRubric(!showRubric)} className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                <ListOrdered className="w-3.5 h-3.5" /> Rubric ({totalRubricPoints} pts)
                {showRubric ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              <AnimatePresence>
                {showRubric && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                    <div className="space-y-2">
                      {assignment.rubric.map((r, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                          <div className="w-7 h-7 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-[10px] font-bold text-green-600">{i + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white">{r.criterion}</p>
                            {r.description && <p className="text-[11px] text-slate-500 mt-0.5">{r.description}</p>}
                          </div>
                          <span className="text-[10px] font-bold text-green-600 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded-full flex-shrink-0">{r.maxPoints}pts</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {!isInstructor && (assignment.type === "quiz" || assignment.type === "exam") && (
            <div className="border border-amber-200 dark:border-amber-500/20 rounded-xl overflow-hidden">
              <div className="bg-amber-50 dark:bg-amber-500/10 px-5 py-3 border-b border-amber-200 dark:border-amber-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-amber-600" />
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Quiz</p>
                </div>
                <div className="flex items-center gap-2">
                  {quizTimeLeft !== null && quizTimerActive && !quizSubmitted && (
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${quizTimeLeft <= 60 ? "bg-red-500 text-white animate-pulse" : quizTimeLeft <= 300 ? "bg-amber-500 text-white" : "bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400"}`}>
                      {String(Math.floor(quizTimeLeft / 60)).padStart(2, "0")}:{String(quizTimeLeft % 60).padStart(2, "0")}
                    </span>
                  )}
                  {!quizSubmitted && assignment.meta?.isTimed === false && (
                    <span className="text-[10px] font-semibold text-green-600 bg-green-100 dark:bg-green-500/20 px-2 py-0.5 rounded-full">Untimed</span>
                  )}
                  {assignment.meta?.questionCount && (
                    <span className="text-[10px] font-semibold text-amber-600 bg-amber-100 dark:bg-amber-500/20 px-2 py-0.5 rounded-full">{assignment.quizQuestions?.length || assignment.meta.questionCount} questions</span>
                  )}
                </div>
              </div>
              <div className="p-5">
                {quizSubmitted && quizScore ? (
                  <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl p-6 text-center">
                    <Trophy className="w-10 h-10 text-green-500 mx-auto mb-2" />
                    <p className="text-sm font-bold text-green-700 dark:text-green-400">Quiz Complete!</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-300 mt-1">{quizScore.score}/{quizScore.total}</p>
                    <p className="text-xs text-green-500 mt-1">{quizScore.rawScore}/{quizScore.rawTotal} correct</p>
                  </div>
                ) : quizQuestions ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Questions</p>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <AlertTriangle className="w-3 h-3" />
                        Answer all questions before submitting
                      </div>
                    </div>
                    {quizQuestions.map((q, i) => (
                      <QuizQuestion key={q.id || i} question={q} index={i} answer={quizAnswers[q.id ?? i]} onAnswer={(val) => setQuizAnswers((prev) => ({ ...prev, [q.id ?? i]: val }))} />
                    ))}
                    <button
                      onClick={handleQuizSubmit}
                      disabled={submitting || quizQuestions.some((q, i) => quizAnswers[q.id ?? i] === undefined || quizAnswers[q.id ?? i] === "")}
                      className="flex items-center gap-1.5 px-5 py-2.5 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 disabled:opacity-50 transition-colors"
                    >
                      {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      {submitting ? "Submitting..." : "Submit Quiz"}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleStartQuiz}
                    disabled={quizLoading}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 disabled:opacity-50 transition-colors"
                  >
                    {quizLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    {quizLoading ? "Generating Questions..." : "Start Quiz"}
                  </button>
                )}
              </div>
            </div>
          )}

          {isInstructor && (assignment.type === "quiz" || assignment.type === "exam") && assignment.quizQuestions?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quiz Preview</p>
                <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full">{assignment.quizQuestions.length} questions</span>
              </div>
              <div className="space-y-2">
                {assignment.quizQuestions.map((q, i) => (
                  <div key={i} className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500/10 text-green-600 text-[9px] font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white">{q.text}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-bold text-slate-400 uppercase">{q.type?.replace("-", " ")}</span>
                          <span className="text-[9px] font-bold text-green-600">{q.points}pts</span>
                          {q.correctAnswer && <span className="text-[9px] text-slate-400">Answer: {Array.isArray(q.correctAnswer) ? q.correctAnswer.join(", ") : q.correctAnswer}</span>}
                        </div>
                        {q.type === "multiple-choice" && q.options?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {q.options.map((opt, oi) => (
                              <span key={oi} className={`text-[9px] px-1.5 py-0.5 rounded border ${opt === q.correctAnswer ? "bg-green-50 dark:bg-green-500/10 border-green-300 dark:border-green-500/30 text-green-700 dark:text-green-400" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500"}`}>{opt}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isInstructor && progress && (
            <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-green-700 dark:text-green-400">Your Progress</p>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${progress.status === "completed" ? "bg-green-500 text-white" : progress.status === "in_progress" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>
                  {progress.status === "completed" ? "Completed" : progress.status === "in_progress" ? "In Progress" : "Not Started"}
                </span>
              </div>
              {progress.score != null && (
                <p className="text-sm font-bold text-green-700 dark:text-green-400 mb-1">Score: {progress.score}/{assignment.maxScore}</p>
              )}
              {progress.feedback && (
                <div className="mt-2 p-2 bg-white dark:bg-slate-900 rounded-lg border border-green-200 dark:border-green-500/20">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Instructor Feedback</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300">{progress.feedback}</p>
                </div>
              )}
            </div>
          )}

          {isInstructor && (
            <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-lg p-4">
              <textarea
                value={instructorComment}
                onChange={(e) => setInstructorComment(e.target.value)}
                placeholder="Add a comment for the student to see..."
                rows={3}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-500/30 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
              <button
                onClick={async () => {
                  if (!instructorComment.trim()) return;
                  setSavingComment(true);
                  try {
                    await apiClient.put(`/api/classrooms/${classroomId}/progress`, {
                      assignmentId: assignment.id,
                      studentId: progress?.studentId,
                      feedback: instructorComment,
                    });
                  } catch (err) { console.error(err); }
                  setSavingComment(false);
                }}
                disabled={savingComment || !instructorComment.trim()}
                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-[10px] font-semibold hover:bg-amber-600 disabled:opacity-50 transition-colors"
              >
                {savingComment ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Save Comment
              </button>
            </div>
          )}

          {!isInstructor && isSubmitted && (
            <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Your Submission</p>
              <div className="bg-white dark:bg-slate-900 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{progress.submissionText}</p>
              </div>
              {progress.submittedAt && (
                <p className="text-[10px] text-slate-400 mt-2">Submitted {new Date(progress.submittedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
              )}
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          {!isInstructor ? (
            <div className="space-y-3">
              {progress?.status === "completed" && !isSubmitted ? (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600"><CheckCircle2 className="w-4 h-4" /> Assignment Completed</span>
              ) : !isSubmitted && assignment.type !== "quiz" && assignment.type !== "exam" ? (
                <div className="space-y-3">
                  {assignment.type === "lab" && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg">
                      <p className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider mb-1">Lab Environment</p>
                      <p className="text-xs text-blue-600 dark:text-blue-300">Complete the lab exercises as described in the instructions above, then document your findings and results below.</p>
                    </div>
                  )}
                  <AssignmentEditor
                    value={text}
                    onChange={setText}
                    placeholder={assignment.type === "lab" ? "Document your lab work, observations, and results here..." : "Type your submission here..."}
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !text}
                    className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 disabled:opacity-50 transition-colors"
                  >
                    {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    {submitting ? "Submitting..." : "Submit Assignment"}
                  </button>
                </div>
              ) : isSubmitted ? (
                <button onClick={onComplete} className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors">
                  <Check className="w-4 h-4" /> Mark Complete
                </button>
              ) : null}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button onClick={onEdit} className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"><Edit3 className="w-3.5 h-3.5" /> Edit</button>
              <button onClick={onSubmissions} className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"><Eye className="w-3.5 h-3.5" /> Submissions</button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
