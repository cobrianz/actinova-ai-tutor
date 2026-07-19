"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, ArrowLeft, X, Clock, Loader2,
  Sparkles, MessageSquare, Pin, Unlock, Send,
  CornerDownRight, ChevronDown, ChevronUp,
} from "lucide-react";
import { apiClient } from "@/lib/csrfClient";

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

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

const AVATAR_COLORS = [
  "bg-blue-500", "bg-emerald-500", "bg-violet-500",
  "bg-rose-500", "bg-amber-500", "bg-cyan-500", "bg-fuchsia-500",
];

function avatarColor(name) {
  let h = 0;
  for (let i = 0; i < (name || "").length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function Avatar({ name, size = "md" }) {
  const sz = size === "sm" ? "w-7 h-7 text-[9px]" : size === "lg" ? "w-11 h-11 text-xs" : "w-9 h-9 text-[10px]";
  return (
    <div className={`${sz} ${avatarColor(name)} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {getInitials(name)}
    </div>
  );
}

function Badge({ children, color = "slate" }) {
  const colors = {
    green: "bg-green-500/10 text-green-700 dark:text-green-400",
    amber: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    red: "bg-red-500/10 text-red-600 dark:text-red-400",
    slate: "bg-slate-100 dark:bg-slate-800 text-slate-500",
  };
  return (
    <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${colors[color]}`}>
      {children}
    </span>
  );
}

function renderDescription(text) {
  if (!text) return null;
  // Split on **bold** markers and render bold spans
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-bold text-foreground">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export default function DiscussionsTab({ classroomState }) {
  const {
    classroom, isInstructor, discussions, discussionsLoading,
    selectedDiscussion, setSelectedDiscussion, discussionPosts, postsLoading,
    newDiscTitle, setNewDiscTitle, newDiscDesc, setNewDiscDesc,
    showNewDiscussion, setShowNewDiscussion, replyContent, setReplyContent,
    replyingTo, setReplyingTo, discAiLoading,
    handleCreateDiscussion, handleCreatePost, handleGenerateDiscussionPrompt,
    fetchDiscussions, inputCls, labelCls,
  } = classroomState;

  const canPost = isInstructor || classroom.settings?.allowStudentPosts === true;

  if (selectedDiscussion) {
    return (
      <ThreadView
        discussion={selectedDiscussion}
        setSelectedDiscussion={setSelectedDiscussion}
        posts={discussionPosts}
        postsLoading={postsLoading}
        classroom={classroom}
        isInstructor={isInstructor}
        replyingTo={replyingTo}
        setReplyingTo={setReplyingTo}
        replyContent={replyContent}
        setReplyContent={setReplyContent}
        handleCreatePost={handleCreatePost}
        inputCls={inputCls}
        fetchDiscussions={fetchDiscussions}
      />
    );
  }

  const totalPosts = discussions.reduce((s, d) => s + (d.postCount || 0), 0);
  const openCount = discussions.filter((d) => !d.isClosed).length;

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-foreground" style={{ fontFamily: "var(--font-fraunces)" }}>Discussions</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {discussions.length} topic{discussions.length !== 1 ? "s" : ""} &middot; {totalPosts} post{totalPosts !== 1 ? "s" : ""} &middot; {openCount} open
          </p>
        </div>
        {canPost ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateDiscussionPrompt}
              disabled={discAiLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary/80 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all disabled:opacity-50"
            >
              {discAiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              AI Prompt
            </button>
            <button
              onClick={() => setShowNewDiscussion(!showNewDiscussion)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${showNewDiscussion ? "bg-green-500/10 text-green-700 dark:text-green-400" : "bg-green-500 text-white hover:bg-green-600"}`}
            >
              <Plus className="w-3.5 h-3.5" />
              {showNewDiscussion ? "Cancel" : "New Discussion"}
            </button>
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">
            Discussion posting is disabled for students in this classroom.
          </p>
        )}
      </div>

      {/* New discussion form */}
      <AnimatePresence>
        {showNewDiscussion && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-foreground">New Discussion</h3>
              <div>
                <label className={labelCls}>Title</label>
                <input value={newDiscTitle} onChange={(e) => setNewDiscTitle(e.target.value)} placeholder="What do you want to discuss?" className={inputCls} autoFocus />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className={labelCls}>Prompt / Description</label>
                  <button onClick={handleGenerateDiscussionPrompt} disabled={discAiLoading} className="flex items-center gap-1 text-[10px] font-semibold text-green-600 hover:text-green-700 disabled:opacity-40 transition-colors">
                    {discAiLoading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />} Generate
                  </button>
                </div>
                <textarea value={newDiscDesc} onChange={(e) => setNewDiscDesc(e.target.value)} placeholder="Set the context..." rows={3} className={inputCls + " resize-none"} />
              </div>
              <div className="flex gap-2">
                <button onClick={handleCreateDiscussion} className="px-5 py-2 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 transition-colors">Post</button>
                <button onClick={() => setShowNewDiscussion(false)} className="px-4 py-2 bg-secondary text-muted-foreground rounded-lg text-xs font-semibold hover:bg-secondary/80 transition-colors">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Discussion list */}
      {discussionsLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
              <div className="flex gap-3"><div className="w-9 h-9 rounded-full bg-secondary" /><div className="flex-1 space-y-2"><div className="h-3 bg-secondary rounded w-1/4" /><div className="h-2.5 bg-secondary rounded w-3/4" /></div></div>
            </div>
          ))}
        </div>
      ) : discussions.length === 0 ? (
        <div className="bg-card border-2 border-dashed border-border rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3">
            <MessageSquare className="w-5 h-5 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1">No discussions yet</h3>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            {isInstructor ? "Start a discussion to get students thinking." : "No discussions posted yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {discussions
            .sort((a, b) => { if (a.isPinned && !b.isPinned) return -1; if (!a.isPinned && b.isPinned) return 1; return new Date(b.createdAt || 0) - new Date(a.createdAt || 0); })
            .map((disc, i) => (
              <DiscussionCard key={disc._id || disc.id} disc={disc} onClick={() => setSelectedDiscussion(disc)} index={i} />
            ))}
        </div>
      )}
    </div>
  );
}

function DiscussionCard({ disc, onClick, index }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={onClick}
      className={`w-full text-left bg-card border rounded-xl p-4 hover:border-green-400 dark:hover:border-green-600 hover:shadow-sm transition-all group ${disc.isPinned ? "border-amber-300 dark:border-amber-500/30" : "border-border"}`}
    >
      <div className="flex gap-3 items-start">
        <Avatar name={disc.title} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-semibold text-foreground">{disc.author?.name || "Instructor"}</span>
            {disc.author?.role === "instructor" && <Badge color="green">Instructor</Badge>}
            {disc.isPinned && <Badge color="amber"><Pin className="w-2 h-2 inline mr-0.5" />Pinned</Badge>}
            {disc.isClosed && <Badge color="red">Closed</Badge>}
            <span className="text-[10px] text-muted-foreground ml-auto">{formatTime(disc.createdAt)}</span>
          </div>
          <h3 className="text-sm font-bold text-foreground leading-snug group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors">{disc.title}</h3>
          {disc.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{renderDescription(disc.description)}</p>}
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <MessageSquare className="w-3 h-3" />
              <span className="font-medium">{disc.postCount || 0}</span> posts
            </span>
            {disc.lastActivityAt && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock className="w-3 h-3" /> {formatTime(disc.lastActivityAt)}
              </span>
            )}
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-muted-foreground/40 group-hover:text-green-500 transition-colors flex-shrink-0 -rotate-90 mt-1" />
      </div>
    </motion.button>
  );
}

function ThreadView({ discussion, setSelectedDiscussion, posts, postsLoading, classroom, isInstructor, replyingTo, setReplyingTo, replyContent, setReplyContent, handleCreatePost, inputCls, fetchDiscussions }) {
  const [expandedReplies, setExpandedReplies] = useState({});
  const canPost = isInstructor || classroom.settings?.allowStudentPosts === true;

  const rootPosts = posts.filter((p) => !p.parentPostId);
  const repliesMap = {};
  posts.forEach((p) => {
    if (p.parentPostId) {
      const pid = typeof p.parentPostId === "object" ? p.parentPostId._id : p.parentPostId;
      if (!repliesMap[pid]) repliesMap[pid] = [];
      repliesMap[pid].push(p);
    }
  });

  const toggle = (id) => setExpandedReplies((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className="space-y-4">
      {/* Thread header */}
      <div className="bg-card border border-border rounded-xl p-5">
        <button onClick={() => setSelectedDiscussion(null)} className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft size={13} /> Back to Discussions
        </button>
        <div className="flex items-start gap-3">
          <Avatar name={discussion.title} size="lg" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="text-sm font-bold text-foreground">{discussion.author?.name || "Instructor"}</span>
              {discussion.isPinned && <Badge color="amber"><Pin className="w-2 h-2 inline mr-0.5" />Pinned</Badge>}
              {discussion.isClosed && <Badge color="red">Closed</Badge>}
            </div>
            <h2 className="text-lg font-bold text-foreground leading-snug" style={{ fontFamily: "var(--font-fraunces)" }}>{discussion.title}</h2>
            {discussion.description && <p className="text-sm text-muted-foreground mt-2 leading-relaxed whitespace-pre-wrap">{renderDescription(discussion.description)}</p>}
            <div className="flex items-center gap-3 mt-3 text-[11px] text-muted-foreground">
              <span>{discussion.createdAt && new Date(discussion.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              <span>&middot;</span>
              <span className="font-semibold">{posts.length} post{posts.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
          {isInstructor && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button onClick={async () => { try { await apiClient.patch(`/api/classrooms/${classroom.id}/discussions/${discussion._id || discussion.id}`, { isPinned: !discussion.isPinned }); setSelectedDiscussion({ ...discussion, isPinned: !discussion.isPinned }); fetchDiscussions(); } catch {} }} className="p-2 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-500/10 text-muted-foreground hover:text-amber-500 transition-colors" title={discussion.isPinned ? "Unpin" : "Pin"}>
                <Pin className="w-4 h-4" />
              </button>
              <button onClick={async () => { try { await apiClient.patch(`/api/classrooms/${classroom.id}/discussions/${discussion._id || discussion.id}`, { isClosed: !discussion.isClosed }); setSelectedDiscussion({ ...discussion, isClosed: !discussion.isClosed }); } catch {} }} className="p-2 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title={discussion.isClosed ? "Reopen" : "Close"}>
                {discussion.isClosed ? <Unlock className="w-4 h-4" /> : <X className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Posts */}
      {postsLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse"><div className="flex gap-3"><div className="w-9 h-9 rounded-full bg-secondary" /><div className="flex-1 space-y-2"><div className="h-3 bg-secondary rounded w-1/3" /><div className="h-2 bg-secondary rounded w-full" /></div></div></div>)}
        </div>
      ) : rootPosts.length === 0 ? (
        <div className="bg-card border-2 border-dashed border-border rounded-xl p-8 text-center">
          <MessageSquare className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm font-semibold text-muted-foreground">No posts yet</p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">Be the first to respond below</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rootPosts.map((post, i) => {
            const replies = repliesMap[post._id || post.id] || [];
            const isExpanded = expandedReplies[post._id || post.id];
            const isReplyTarget = replyingTo === (post._id || post.id);
            const authorName = post.authorId?.name || "Unknown";
            const isInstructorPost = post.authorId?.role === "instructor";
            return (
              <motion.div key={post._id || post.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <PostCard
                  post={post} authorName={authorName} isInstructorPost={isInstructorPost}
                  isReplyTarget={isReplyTarget} discussion={discussion}
                  replies={replies} isExpanded={isExpanded} toggle={toggle}
                  setReplyingTo={setReplyingTo} setReplyContent={setReplyContent}
                  replyContent={replyContent} handleCreatePost={handleCreatePost}
                  inputCls={inputCls} repliesMap={repliesMap}
                  replyingTo={replyingTo} canPost={canPost}
                />
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Compose new post — only show when no inline reply is active and user can post */}
      {!discussion.isClosed && !replyingTo && canPost ? (
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-green-500/15 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <textarea
                value={replyContent} onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Share your thoughts..."
                rows={3}
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none resize-none"
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleCreatePost(); }}
              />
              <div className="flex items-center justify-between pt-3 border-t border-border/60 mt-2">
                <span className="text-[10px] text-muted-foreground/50">Ctrl+Enter to post</span>
                <button onClick={handleCreatePost} disabled={!replyContent.trim()} className="flex items-center gap-1.5 px-5 py-2 bg-green-500 text-white rounded-lg text-xs font-bold hover:bg-green-600 disabled:opacity-40 transition-all">
                  <Send className="w-3 h-3" /> Post
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : discussion.isClosed ? (
        <div className="bg-secondary/40 border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground italic">This discussion is closed.</p>
        </div>
      ) : !canPost ? (
        <div className="bg-secondary/40 border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground italic">Posting is disabled for students in this classroom.</p>
        </div>
      ) : null}
    </div>
  );
}

function PostCard({ post, authorName, isInstructorPost, isReplyTarget, discussion, replies, isExpanded, toggle, setReplyingTo, setReplyContent, replyContent, handleCreatePost, inputCls, repliesMap, replyingTo, canPost }) {
  const postId = post._id || post.id;
  return (
    <div className={`bg-card border rounded-xl overflow-hidden ${isInstructorPost ? "border-l-[3px] border-l-green-500 border-border" : "border-border"}`}>
      <div className="flex gap-3 p-4">
        <Avatar name={authorName} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-bold text-foreground">{authorName}</span>
            {isInstructorPost && <Badge color="green">Instructor</Badge>}
            <span className="text-[10px] text-muted-foreground">{formatTime(post.createdAt)}</span>
            {post.isEdited && <span className="text-[10px] text-muted-foreground/60 italic">(edited)</span>}
          </div>
          <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{post.content}</p>
          {!discussion.isClosed && (
            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/50">
              {replies.length > 0 && (
                <button onClick={() => toggle(postId)} className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  {replies.length} {replies.length === 1 ? "reply" : "replies"}
                </button>
              )}
              <button onClick={() => { setReplyingTo(isReplyTarget ? null : postId); setReplyContent(""); }} className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-green-600 dark:hover:text-green-400 transition-colors">
                <CornerDownRight className="w-3.5 h-3.5" /> Reply
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Inline reply box */}
      <AnimatePresence>
        {isReplyTarget && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="border-t border-border/50 bg-secondary/20 overflow-hidden">
            <div className="p-3">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder={`Reply to ${authorName}...`}
                rows={2}
                className={inputCls + " resize-none w-full text-xs"}
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleCreatePost(); }}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-muted-foreground/50">Ctrl+Enter to post</span>
                <div className="flex gap-1">
                  <button onClick={() => { setReplyingTo(null); setReplyContent(""); }} className="px-3 py-1.5 bg-secondary text-muted-foreground rounded-lg text-xs font-semibold hover:bg-secondary/80 transition-colors"><X className="w-3 h-3" /></button>
                  <button onClick={handleCreatePost} disabled={!replyContent.trim()} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-bold disabled:opacity-40 hover:bg-green-600 transition-all"><Send className="w-3 h-3" /> Reply</button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nested replies */}
      <AnimatePresence>
        {isExpanded && replies.map((reply) => {
          const replyId = reply._id || reply.id;
          const isReplyOfReply = replyingTo === replyId;
          const replyAuthor = reply.authorId?.name || "Unknown";
          const isReplyInstructor = reply.authorId?.role === "instructor";
          return (
            <motion.div key={replyId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="border-t border-border/40 ml-10 bg-secondary/10">
              <div className="flex gap-3 px-4 py-3">
                <Avatar name={replyAuthor} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-xs font-bold text-foreground">{replyAuthor}</span>
                    {isReplyInstructor && <Badge color="green">Instructor</Badge>}
                    <span className="text-[10px] text-muted-foreground">{formatTime(reply.createdAt)}</span>
                  </div>
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">{reply.content}</p>
          {!discussion.isClosed && canPost && (
                    <button onClick={() => { setReplyingTo(isReplyOfReply ? null : replyId); setReplyContent(""); }} className="flex items-center gap-1 mt-2 text-[11px] font-semibold text-muted-foreground hover:text-green-600 dark:hover:text-green-400 transition-colors">
                      <CornerDownRight className="w-3 h-3" /> Reply
                    </button>
                  )}
                </div>
              </div>
              <AnimatePresence>
                {isReplyOfReply && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="border-t border-border/40 bg-secondary/20 overflow-hidden">
                    <div className="p-3">
                      <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder={`Reply to ${replyAuthor}...`}
                        rows={2}
                        className={inputCls + " resize-none w-full text-xs"}
                        autoFocus
                        onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleCreatePost(); }}
                      />
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-muted-foreground/50">Ctrl+Enter to post</span>
                        <div className="flex gap-1">
                          <button onClick={() => { setReplyingTo(null); setReplyContent(""); }} className="px-3 py-1.5 bg-secondary text-muted-foreground rounded-lg text-xs font-semibold hover:bg-secondary/80 transition-colors"><X className="w-3 h-3" /></button>
                          <button onClick={handleCreatePost} disabled={!replyContent.trim()} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 text-white rounded-lg text-xs font-bold disabled:opacity-40 hover:bg-green-600 transition-all"><Send className="w-3 h-3" /> Reply</button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
