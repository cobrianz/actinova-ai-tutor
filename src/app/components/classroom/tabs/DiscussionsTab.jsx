"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, ArrowLeft, ArrowRight, X, ChevronRight, Clock, Loader2,
  Sparkles, MessageSquare, Pin, Unlock, Send, CheckCircle2,
} from "lucide-react";
import { apiClient } from "@/lib/csrfClient";

/**
 * @param {object} props.classroomState
 * @param {object} props.classroomState.classroom - Classroom object
 * @param {boolean} props.classroomState.isInstructor
 * @param {Array} props.classroomState.discussions
 * @param {boolean} props.classroomState.discussionsLoading
 * @param {object|null} props.classroomState.selectedDiscussion
 * @param {Function} props.classroomState.setSelectedDiscussion
 * @param {Array} props.classroomState.discussionPosts
 * @param {boolean} props.classroomState.postsLoading
 * @param {string} props.classroomState.newDiscTitle
 * @param {Function} props.classroomState.setNewDiscTitle
 * @param {string} props.classroomState.newDiscDesc
 * @param {Function} props.classroomState.setNewDiscDesc
 * @param {boolean} props.classroomState.showNewDiscussion
 * @param {Function} props.classroomState.setShowNewDiscussion
 * @param {string} props.classroomState.replyContent
 * @param {Function} props.classroomState.setReplyContent
 * @param {string|null} props.classroomState.replyingTo
 * @param {Function} props.classroomState.setReplyingTo
 * @param {boolean} props.classroomState.discAiLoading
 * @param {Function} props.classroomState.handleCreateDiscussion
 * @param {Function} props.classroomState.handleCreatePost
 * @param {Function} props.classroomState.handleGenerateDiscussionPrompt
 * @param {Function} props.classroomState.fetchDiscussions
 * @param {string} props.classroomState.inputCls
 * @param {string} props.classroomState.labelCls
 * @param {string} props.classroomState.sectionCls
 */
function EmptyState({ icon: Icon, title, description, action, onAction }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-green-500/10 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-green-500" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-4">{description}</p>
      {action && (
        <button onClick={onAction} className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 transition-colors">
          {action}
        </button>
      )}
    </div>
  );
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
    <div className="space-y-3">
      {selectedDiscussion ? (
        <div className="space-y-3">
          <button onClick={() => { setSelectedDiscussion(null); }} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-[11px] font-medium transition-colors"><ArrowLeft size={14} /> Back to Discussions</button>
          {/* Discussion header card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500" />
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {selectedDiscussion.isPinned && <span className="flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full"><Pin className="w-2.5 h-2.5" /> Pinned</span>}
                    {selectedDiscussion.isClosed && <span className="text-[9px] font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-2 py-0.5 rounded-full">Closed</span>}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{selectedDiscussion.title}</h3>
                  {selectedDiscussion.description && <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{selectedDiscussion.description}</p>}
                </div>
                {isInstructor && <div className="flex items-center gap-1 ml-3">
                  <button onClick={async () => { try { await apiClient.patch(`/api/classrooms/${classroom.id}/discussions/${selectedDiscussion._id || selectedDiscussion.id}`, { isPinned: !selectedDiscussion.isPinned }); setSelectedDiscussion({ ...selectedDiscussion, isPinned: !selectedDiscussion.isPinned }); fetchDiscussions(); } catch {} }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-amber-500 transition-colors"><Pin className="w-3.5 h-3.5" /></button>
                  <button onClick={async () => { try { await apiClient.patch(`/api/classrooms/${classroom.id}/discussions/${selectedDiscussion._id || selectedDiscussion.id}`, { isClosed: !selectedDiscussion.isClosed }); setSelectedDiscussion({ ...selectedDiscussion, isClosed: !selectedDiscussion.isClosed }); } catch {} }} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500 transition-colors">{selectedDiscussion.isClosed ? <Unlock className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}</button>
                </div>}
              </div>
              <div className="flex items-center gap-4 text-[10px] text-slate-400">
                <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {discussionPosts.length} posts</span>
                {selectedDiscussion.createdAt && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Started {new Date(selectedDiscussion.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
              </div>
            </div>
          </div>
          {/* Posts */}
          {postsLoading ? <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 animate-pulse"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700" /><div className="flex-1 space-y-2"><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/4" /><div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-3/4" /></div></div></div>)}</div>
            : <div className="space-y-2">{discussionPosts.map((post) => (
              <div key={post._id || post.id} className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden ${post.parentPostId ? "ml-8 border-l-2 border-l-green-400" : ""}`}>
                <div className="p-4">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 shadow-sm">{post.authorId?.name?.charAt(0)?.toUpperCase() || "?"}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{post.authorId?.name || "Unknown"}</span>
                        {post.authorId?.role === "instructor" && <span className="text-[8px] font-bold text-green-600 bg-green-50 dark:bg-green-500/10 px-1.5 py-0.5 rounded-full uppercase">Instructor</span>}
                      </div>
                      <span className="text-[10px] text-slate-400">{new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}{post.isEdited && " (edited)"}</span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{post.content}</p>
                </div>
                {!selectedDiscussion.isClosed && (
                  <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                    <button onClick={() => setReplyingTo(replyingTo === (post._id || post.id) ? null : (post._id || post.id))} className="text-[10px] font-semibold text-green-600 hover:text-green-700 transition-colors">
                      {replyingTo === (post._id || post.id) ? "Cancel" : "Reply"}
                    </button>
                  </div>
                )}
                {replyingTo === (post._id || post.id) && (
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex gap-2">
                      <textarea value={replyContent} onChange={(e) => setReplyContent(e.target.value)} placeholder="Write a reply..." rows={2} className={inputCls + " resize-none flex-1"} />
                      <div className="flex flex-col gap-1"><button onClick={handleCreatePost} className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"><Send className="w-3.5 h-3.5" /></button><button onClick={() => { setReplyingTo(null); setReplyContent(""); }} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"><X className="w-3.5 h-3.5" /></button></div>
                    </div>
                  </div>
                )}
              </div>
            ))}{discussionPosts.length === 0 && <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center"><MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" /><p className="text-sm text-slate-400">No posts yet. Start the conversation!</p></div>}</div>}
          {/* Composer */}
          {!selectedDiscussion.isClosed && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
              <textarea value={replyContent} onChange={(e) => setReplyContent(e.target.value)} placeholder="Write a post..." rows={3} className={inputCls + " resize-none mb-3"} onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleCreatePost(); }} />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400">Press Ctrl+Enter to send</span>
                <button onClick={handleCreatePost} disabled={!replyContent.trim()} className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 disabled:opacity-50 transition-colors"><Send className="w-3.5 h-3.5" /> Post</button>
              </div>
            </div>
          )}
          {selectedDiscussion.isClosed && <p className="text-xs text-slate-400 text-center italic py-2">This discussion is closed.</p>}
        </div>
      ) : (<>
        {isInstructor && <div className="flex gap-2">
          <button onClick={() => setShowNewDiscussion(!showNewDiscussion)} className={`flex items-center gap-2 flex-1 p-3 border-2 border-dashed rounded-xl text-sm transition-colors bg-white dark:bg-slate-900 ${showNewDiscussion ? "border-green-400 text-green-600" : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-green-400 hover:text-green-600"}`}><Plus className="w-4 h-4" /> {showNewDiscussion ? "Close" : "New Discussion"}</button>
          <button onClick={handleGenerateDiscussionPrompt} disabled={discAiLoading} className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-green-200 dark:border-green-500/30 rounded-xl text-sm text-green-600 hover:border-green-400 transition-colors disabled:opacity-50 bg-white dark:bg-slate-900">{discAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} AI Prompt</button>
        </div>}
        {showNewDiscussion && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4">
            <div className="h-1.5 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 rounded-t-xl -mt-5 -mx-5 mb-0" />
            <div><label className={labelCls}>Title</label><input value={newDiscTitle} onChange={(e) => setNewDiscTitle(e.target.value)} placeholder="Discussion title" className={inputCls} /></div>
            <div><div className="flex items-center justify-between mb-1.5"><label className={labelCls}>Description</label><button onClick={handleGenerateDiscussionPrompt} disabled={discAiLoading} className="flex items-center gap-1 text-[10px] font-semibold text-green-600 hover:text-green-700 disabled:opacity-40 transition-colors">{discAiLoading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />} Generate Prompt</button></div><textarea value={newDiscDesc} onChange={(e) => setNewDiscDesc(e.target.value)} placeholder="Description or prompt..." rows={4} className={inputCls + " resize-none"} /></div>
            <div className="flex gap-2"><button onClick={handleCreateDiscussion} className="px-4 py-2 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors">Create Discussion</button><button onClick={() => setShowNewDiscussion(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button></div>
          </motion.div>
        )}
        {discussionsLoading ? <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 animate-pulse"><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-2" /><div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-1/2" /></div>)}</div>
          : discussions.length === 0 ? <EmptyState icon={MessageSquare} title="No discussions yet" description={isInstructor ? "Start a discussion for your students" : "No discussions have been posted yet"} action={isInstructor ? "New Discussion" : undefined} onAction={() => setShowNewDiscussion(true)} />
          : (() => {
            const pinned = discussions.filter((d) => d.isPinned);
            const regular = discussions.filter((d) => !d.isPinned);
            return (
              <>
                {pinned.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5 px-1"><Pin className="w-3 h-3" /> Pinned</h4>
                    {pinned.map((disc) => (
                      <motion.div key={disc._id || disc.id} whileHover={{ y: -1 }} onClick={() => setSelectedDiscussion(disc)} className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-500/20 rounded-xl overflow-hidden cursor-pointer hover:border-amber-300 dark:hover:border-amber-500/40 transition-colors">
                        <div className="h-1 bg-gradient-to-r from-amber-400 to-amber-500" />
                        <div className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{disc.title}</h4>
                                {disc.isClosed && <span className="text-[9px] font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded-full">Closed</span>}
                              </div>
                              {disc.description && <p className="text-[11px] text-slate-500 line-clamp-2 mb-2">{disc.description}</p>}
                              <div className="flex items-center gap-3 text-[10px] text-slate-500">
                                <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {disc.postCount || 0} posts</span>
                                {disc.lastActivityAt && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(disc.lastActivityAt).toLocaleDateString()}</span>}
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-1" />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
                <div className="space-y-2">
                  {pinned.length > 0 && regular.length > 0 && <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">All Discussions</h4>}
                  {regular.map((disc) => (
                    <motion.div key={disc._id || disc.id} whileHover={{ y: -1 }} onClick={() => setSelectedDiscussion(disc)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-green-300 dark:hover:border-green-600 transition-colors cursor-pointer">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{disc.title}</h4>
                            {disc.isClosed && <span className="text-[9px] font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded-full">Closed</span>}
                          </div>
                          {disc.description && <p className="text-[11px] text-slate-500 line-clamp-1 mb-2">{disc.description}</p>}
                          <div className="flex items-center gap-3 text-[10px] text-slate-500">
                            <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" /> {disc.postCount || 0} posts</span>
                            {disc.lastActivityAt && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(disc.lastActivityAt).toLocaleDateString()}</span>}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-1" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            );
          })()}
      </>)}
    </div>
  );
}
