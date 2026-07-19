"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, ArrowLeft, X, Clock, Loader2,
  Sparkles, MessageSquare, Pin, Unlock, Send,
  MoreHorizontal, CornerDownRight, Eye,
} from "lucide-react";
import { apiClient } from "@/lib/csrfClient";

function formatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
}

function hashColor(name) {
  const colors = [
    "from-blue-500 to-indigo-600",
    "from-emerald-500 to-teal-600",
    "from-violet-500 to-purple-600",
    "from-rose-500 to-pink-600",
    "from-amber-500 to-orange-600",
    "from-cyan-500 to-blue-600",
    "from-fuchsia-500 to-pink-600",
  ];
  let h = 0;
  for (let i = 0; i < (name || "").length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

export default function DiscussionsTab({ classroomState }) {
  const {
    classroom, isInstructor, discussions, discussionsLoading,
    selectedDiscussion, setSelectedDiscussion, discussionPosts, postsLoading,
    newDiscTitle, setNewDiscTitle, newDiscDesc, setNewDiscDesc,
    showNewDiscussion, setShowNewDiscussion, replyContent, setReplyContent,
    replyingTo, setReplyingTo, discAiLoading,
    handleCreateDiscussion, handleCreatePost, handleGenerateDiscussionPrompt,
    fetchDiscussions, inputCls, labelCls, sectionCls,
  } = classroomState;

  return (
    <div className="space-y-4">
      {selectedDiscussion ? (
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
          handleCreateDiscussion={handleCreateDiscussion}
          inputCls={inputCls}
          fetchDiscussions={fetchDiscussions}
        />
      ) : (
        <>
          {/* Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-6 text-white">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iLjA1Ij48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wIDhoLTJ2LTRoMnY0ek0yNCAzNGgtMnYtNGgydjR6bTAgOGgtMnYtNGgydjR6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-40" />
            <div className="relative flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <h2 className="text-xl font-bold" style={{ fontFamily: "var(--font-fraunces)" }}>
                    Discussions
                  </h2>
                </div>
                <p className="text-sm text-white/70 max-w-md">
                  Share ideas, ask questions, and explore topics together with your class.
                </p>
              </div>
              <div className="hidden sm:flex gap-6 mt-1">
                {[
                  { label: "Topics", value: discussions.length },
                  { label: "Posts", value: discussions.reduce((s, d) => s + (d.postCount || 0), 0) },
                  { label: "Open", value: discussions.filter((d) => !d.isClosed).length },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <div className="text-2xl font-black">{value}</div>
                    <div className="text-[10px] text-white/60 font-medium uppercase tracking-wider">{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          {isInstructor && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowNewDiscussion(!showNewDiscussion)}
                className={`flex items-center gap-2 flex-1 p-3 border-2 border-dashed rounded-xl text-sm font-medium transition-colors bg-white dark:bg-slate-900 ${
                  showNewDiscussion
                    ? "border-green-400 text-green-600"
                    : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-green-400 hover:text-green-600"
                }`}
              >
                <Plus className="w-4 h-4" />
                {showNewDiscussion ? "Close" : "New Discussion"}
              </button>
              <button
                onClick={handleGenerateDiscussionPrompt}
                disabled={discAiLoading}
                className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-purple-200 dark:border-purple-500/30 rounded-xl text-sm text-purple-600 hover:border-purple-400 transition-colors disabled:opacity-50 bg-white dark:bg-slate-900 font-medium"
              >
                {discAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                AI Prompt
              </button>
            </div>
          )}

          {/* New Discussion Form */}
          <AnimatePresence>
            {showNewDiscussion && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden"
              >
                <div className="h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500" />
                <div className="p-5 space-y-4">
                  <div>
                    <label className={labelCls}>Title</label>
                    <input
                      value={newDiscTitle}
                      onChange={(e) => setNewDiscTitle(e.target.value)}
                      placeholder="What do you want to discuss?"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className={labelCls}>Prompt / Description</label>
                      <button
                        onClick={handleGenerateDiscussionPrompt}
                        disabled={discAiLoading}
                        className="flex items-center gap-1 text-[10px] font-semibold text-purple-600 hover:text-purple-700 disabled:opacity-40 transition-colors"
                      >
                        {discAiLoading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                        Generate
                      </button>
                    </div>
                    <textarea
                      value={newDiscDesc}
                      onChange={(e) => setNewDiscDesc(e.target.value)}
                      placeholder="Set the context for the discussion..."
                      rows={4}
                      className={inputCls + " resize-none"}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCreateDiscussion}
                      className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-xs font-bold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25"
                    >
                      Post Discussion
                    </button>
                    <button
                      onClick={() => setShowNewDiscussion(false)}
                      className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Feed */}
          {discussionsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4" />
                      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : discussions.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-7 h-7 text-indigo-500" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">No discussions yet</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                {isInstructor
                  ? "Start a discussion to get your students thinking."
                  : "No discussions have been posted yet. Check back later!"}
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              {discussions
                .sort((a, b) => {
                  if (a.isPinned && !b.isPinned) return -1;
                  if (!a.isPinned && b.isPinned) return 1;
                  return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                })
                .map((disc, i) => (
                  <DiscussionPost
                    key={disc._id || disc.id}
                    disc={disc}
                    onClick={() => setSelectedDiscussion(disc)}
                    isLast={i === discussions.length - 1}
                  />
                ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function DiscussionPost({ disc, onClick, isLast }) {
  return (
    <motion.div
      whileHover={{ backgroundColor: "rgba(0,0,0,0.01)" }}
      onClick={onClick}
      className={`relative bg-white dark:bg-slate-900 border-x border-t border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
        isLast ? "border-b rounded-b-xl" : ""
      }`}
    >
      {disc.isPinned && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 to-amber-500 rounded-t-xl" />
      )}
      <div className="flex gap-3 p-4">
        {/* Avatar */}
        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${hashColor(disc.title)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md`}>
          {getInitials(disc.title)}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header row */}
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
              {disc.author?.name || "Instructor"}
            </span>
            {disc.author?.role === "instructor" && (
              <span className="text-[8px] font-bold text-green-600 bg-green-50 dark:bg-green-500/10 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                Instructor
              </span>
            )}
            {disc.isPinned && (
              <span className="flex items-center gap-0.5 text-[8px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded-full">
                <Pin className="w-2 h-2" /> Pinned
              </span>
            )}
            <span className="text-slate-400">·</span>
            <span className="text-xs text-slate-400">{formatTime(disc.createdAt)}</span>
            {disc.isClosed && (
              <>
                <span className="text-slate-400">·</span>
                <span className="text-[9px] font-bold text-red-500">Closed</span>
              </>
            )}
          </div>

          {/* Title */}
          <h3 className="text-[15px] font-bold text-slate-900 dark:text-white leading-snug mb-1">
            {disc.title}
          </h3>

          {/* Description */}
          {disc.description && (
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed line-clamp-3 mb-2">
              {disc.description}
            </p>
          )}

          {/* Actions row */}
          <div className="flex items-center gap-6 -ml-2 mt-1">
            <span className="flex items-center gap-1.5 text-slate-400">
              <div className="p-1.5">
                <MessageSquare className="w-4 h-4" />
              </div>
              <span className="text-xs font-medium">{disc.postCount || 0} posts</span>
            </span>
            {disc.lastActivityAt && (
              <span className="flex items-center gap-1.5 text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-xs">{formatTime(disc.lastActivityAt)}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ThreadView({
  discussion, setSelectedDiscussion, posts, postsLoading,
  classroom, isInstructor, replyingTo, setReplyingTo, replyContent,
  setReplyContent, handleCreatePost, inputCls, fetchDiscussions,
}) {
  const [expandedReplies, setExpandedReplies] = useState({});

  const rootPosts = posts.filter((p) => !p.parentPostId);
  const repliesMap = {};
  posts.forEach((p) => {
    if (p.parentPostId) {
      const pid = typeof p.parentPostId === "object" ? p.parentPostId._id : p.parentPostId;
      if (!repliesMap[pid]) repliesMap[pid] = [];
      repliesMap[pid].push(p);
    }
  });

  const toggleReplies = (postId) => {
    setExpandedReplies((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  return (
    <div className="space-y-0">
      {/* Back + Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500" />
        <div className="p-4">
          <button
            onClick={() => setSelectedDiscussion(null)}
            className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xs font-medium transition-colors mb-3"
          >
            <ArrowLeft size={14} /> Back
          </button>

          <div className="flex items-start gap-3">
            <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${hashColor(discussion.title)} flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-lg`}>
              {getInitials(discussion.title)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {discussion.author?.name || "Instructor"}
                </span>
                {discussion.isPinned && (
                  <span className="flex items-center gap-0.5 text-[8px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.5 rounded-full">
                    <Pin className="w-2 h-2" /> Pinned
                  </span>
                )}
                {discussion.isClosed && (
                  <span className="text-[8px] font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded-full">
                    Closed
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                {discussion.title}
              </h3>
              {discussion.description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed whitespace-pre-wrap">
                  {discussion.description}
                </p>
              )}
              <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                <span>{discussion.createdAt && new Date(discussion.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                <span>·</span>
                <span>{posts.length} posts</span>
              </div>
            </div>

            {isInstructor && (
              <div className="flex items-center gap-0.5 flex-shrink-0">
                <button
                  onClick={async () => {
                    try {
                      await apiClient.patch(`/api/classrooms/${classroom.id}/discussions/${discussion._id || discussion.id}`, { isPinned: !discussion.isPinned });
                      setSelectedDiscussion({ ...discussion, isPinned: !discussion.isPinned });
                      fetchDiscussions();
                    } catch {}
                  }}
                  className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-amber-500 transition-colors"
                  title={discussion.isPinned ? "Unpin" : "Pin"}
                >
                  <Pin className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={async () => {
                    try {
                      await apiClient.patch(`/api/classrooms/${classroom.id}/discussions/${discussion._id || discussion.id}`, { isClosed: !discussion.isClosed });
                      setSelectedDiscussion({ ...discussion, isClosed: !discussion.isClosed });
                    } catch {}
                  }}
                  className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500 transition-colors"
                  title={discussion.isClosed ? "Reopen" : "Close"}
                >
                  {discussion.isClosed ? <Unlock className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Posts feed */}
      {postsLoading ? (
        <div className="space-y-0">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-900 border-x border-t border-slate-200 dark:border-slate-700 p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3" />
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-full" />
                  <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : rootPosts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-10 text-center">
          <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-400">No posts yet. Start the conversation!</p>
        </div>
      ) : (
        <div className="space-y-0">
          {rootPosts.map((post, i) => {
            const replies = repliesMap[post._id || post.id] || [];
            const isExpanded = expandedReplies[post._id || post.id];
            const isReplyTarget = replyingTo === (post._id || post.id);

            return (
              <div key={post._id || post.id} className="space-y-0">
                {/* Root post */}
                <div className={`bg-white dark:bg-slate-900 border-x border-t border-slate-200 dark:border-slate-700 ${i === 0 && replies.length === 0 && !isExpanded ? "rounded-t-xl border-b rounded-b-xl" : ""} ${i === 0 ? "rounded-t-xl" : ""}`}>
                  <div className="flex gap-3 p-4">
                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${hashColor(post.authorId?.name)} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 shadow-sm`}>
                      {getInitials(post.authorId?.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {post.authorId?.name || "Unknown"}
                        </span>
                        {post.authorId?.role === "instructor" && (
                          <span className="text-[8px] font-bold text-green-600 bg-green-50 dark:bg-green-500/10 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                            Instructor
                          </span>
                        )}
                        <span className="text-slate-400">·</span>
                        <span className="text-xs text-slate-400">{formatTime(post.createdAt)}</span>
                        {post.isEdited && <span className="text-[10px] text-slate-400 italic">(edited)</span>}
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {post.content}
                      </p>

                      {/* Post actions */}
                      {!discussion.isClosed && (
                        <div className="flex items-center gap-5 -ml-2 mt-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleReplies(post._id || post.id); }}
                            className="flex items-center gap-1.5 text-slate-400 hover:text-green-600 transition-colors group"
                          >
                            <div className="p-1.5 rounded-full group-hover:bg-green-50 dark:group-hover:bg-green-500/10 transition-colors">
                              <MessageSquare className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-medium">{replies.length}</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setReplyingTo(isReplyTarget ? null : (post._id || post.id));
                              setReplyContent("");
                            }}
                            className="flex items-center gap-1.5 text-slate-400 hover:text-blue-500 transition-colors group"
                          >
                            <div className="p-1.5 rounded-full group-hover:bg-blue-50 dark:group-hover:bg-blue-500/10 transition-colors">
                              <CornerDownRight className="w-4 h-4" />
                            </div>
                            <span className="text-xs font-medium">Reply</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Inline reply box */}
                  <AnimatePresence>
                    {isReplyTarget && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 overflow-hidden"
                      >
                        <div className="p-3 flex gap-2 items-end">
                          <CornerDownRight className="w-4 h-4 text-slate-300 flex-shrink-0 mb-2" />
                          <textarea
                            value={replyContent}
                            onChange={(e) => setReplyContent(e.target.value)}
                            placeholder={`Reply to ${post.authorId?.name || "this post"}...`}
                            rows={2}
                            className={inputCls + " resize-none flex-1 text-xs"}
                            autoFocus
                          />
                          <div className="flex flex-col gap-1 flex-shrink-0">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCreatePost(); }}
                              disabled={!replyContent.trim()}
                              className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-40 transition-colors"
                            >
                              <Send className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setReplyingTo(null); setReplyContent(""); }}
                              className="p-2 bg-slate-200 dark:bg-slate-700 text-slate-500 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Replies (thread) */}
                {replies.length > 0 && (
                  <>
                    {isExpanded ? (
                      replies.map((reply, ri) => {
                        const isLastReply = ri === replies.length - 1;
                        const isReplyOfReply = replyingTo === (reply._id || reply.id);
                        return (
                          <div key={reply._id || reply.id} className="space-y-0">
                            <div className={`bg-white dark:bg-slate-900 border-x border-t border-slate-200 dark:border-slate-700 ${isLastReply && !isReplyOfReply ? "border-b rounded-b-xl" : ""}`}>
                              <div className="flex gap-3 p-4 pl-14 relative">
                                {/* Thread line */}
                                <div className="absolute left-[26px] top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700" />
                                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${hashColor(reply.authorId?.name)} flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0 shadow-sm relative z-10`}>
                                  {getInitials(reply.authorId?.name)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                                      {reply.authorId?.name || "Unknown"}
                                    </span>
                                    {reply.authorId?.role === "instructor" && (
                                      <span className="text-[8px] font-bold text-green-600 bg-green-50 dark:bg-green-500/10 px-1.5 py-0.5 rounded-full uppercase tracking-wide">
                                        Instructor
                                      </span>
                                    )}
                                    <span className="text-slate-400">·</span>
                                    <span className="text-xs text-slate-400">{formatTime(reply.createdAt)}</span>
                                    {reply.isEdited && <span className="text-[10px] text-slate-400 italic">(edited)</span>}
                                  </div>
                                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                    {reply.content}
                                  </p>
                                  {!discussion.isClosed && (
                                    <div className="flex items-center gap-5 -ml-2 mt-1.5">
                                      <button
                                        onClick={(e) => { e.stopPropagation(); setReplyingTo(isReplyOfReply ? null : (reply._id || reply.id)); setReplyContent(""); }}
                                        className="flex items-center gap-1.5 text-slate-400 hover:text-green-600 transition-colors group"
                                      >
                                        <div className="p-1.5 rounded-full group-hover:bg-green-50 dark:group-hover:bg-green-500/10 transition-colors">
                                          <CornerDownRight className="w-4 h-4" />
                                        </div>
                                        <span className="text-xs font-medium">Reply</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Reply-to-reply inline box */}
                              <AnimatePresence>
                                {isReplyOfReply && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 overflow-hidden"
                                  >
                                    <div className="p-3 pl-14 flex gap-2 items-end">
                                      <textarea
                                        value={replyContent}
                                        onChange={(e) => setReplyContent(e.target.value)}
                                        placeholder={`Reply to ${reply.authorId?.name || "this post"}...`}
                                        rows={2}
                                        className={inputCls + " resize-none flex-1 text-xs"}
                                        autoFocus
                                      />
                                      <div className="flex flex-col gap-1 flex-shrink-0">
                                        <button
                                          onClick={(e) => { e.stopPropagation(); handleCreatePost(); }}
                                          disabled={!replyContent.trim()}
                                          className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-40 transition-colors"
                                        >
                                          <Send className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={(e) => { e.stopPropagation(); setReplyingTo(null); setReplyContent(""); }}
                                          className="p-2 bg-slate-200 dark:bg-slate-700 text-slate-500 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="bg-white dark:bg-slate-900 border-x border-slate-200 dark:border-slate-700 border-b rounded-b-xl">
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleReplies(post._id || post.id); }}
                          className="w-full flex items-center gap-2 pl-14 pr-4 py-2.5 text-xs font-medium text-green-600 hover:bg-green-50 dark:hover:bg-green-500/5 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Show {replies.length} {replies.length === 1 ? "reply" : "replies"}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Composer */}
      {!discussion.isClosed && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
          <div className="flex gap-3 p-4">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 shadow-sm`}>
              You
            </div>
            <div className="flex-1">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Post your thoughts..."
                rows={3}
                className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none resize-none"
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleCreatePost(); }}
              />
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400">Ctrl+Enter to post</span>
                <button
                  onClick={handleCreatePost}
                  disabled={!replyContent.trim()}
                  className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-xs font-bold hover:from-blue-600 hover:to-indigo-700 disabled:opacity-40 transition-all shadow-lg shadow-blue-500/20"
                >
                  <Send className="w-3.5 h-3.5" /> Post
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {discussion.isClosed && (
        <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center">
          <p className="text-xs text-slate-400 italic">This discussion is closed.</p>
        </div>
      )}
    </div>
  );
}
