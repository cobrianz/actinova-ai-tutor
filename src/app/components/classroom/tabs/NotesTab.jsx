"use client";

import { motion } from "framer-motion";
import { Plus, Loader2, Sparkles, StickyNote, Pin } from "lucide-react";

/**
 * @param {object} props.classroomState
 * @param {boolean} props.classroomState.isInstructor
 * @param {Array} props.classroomState.notes
 * @param {boolean} props.classroomState.notesLoading
 * @param {boolean} props.classroomState.showNewNote
 * @param {Function} props.classroomState.setShowNewNote
 * @param {string} props.classroomState.newNoteTitle
 * @param {Function} props.classroomState.setNewNoteTitle
 * @param {string} props.classroomState.newNoteContent
 * @param {Function} props.classroomState.setNewNoteContent
 * @param {string} props.classroomState.newNoteTags
 * @param {Function} props.classroomState.setNewNoteTags
 * @param {boolean} props.classroomState.noteAiLoading
 * @param {string|null} props.classroomState.noteSummaryLoading
 * @param {Function} props.classroomState.handleCreateNote
 * @param {Function} props.classroomState.handleGenerateNote
 * @param {Function} props.classroomState.handleSummarizeNote
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

export default function NotesTab({ classroomState }) {
  const {
    isInstructor, notes, notesLoading, showNewNote, setShowNewNote,
    newNoteTitle, setNewNoteTitle, newNoteContent, setNewNoteContent,
    newNoteTags, setNewNoteTags, noteAiLoading, noteSummaryLoading,
    handleCreateNote, handleGenerateNote, handleSummarizeNote,
    inputCls, labelCls, sectionCls,
  } = classroomState;

  return (
    <div className="space-y-3">
      {isInstructor && <button onClick={() => setShowNewNote(!showNewNote)} className="flex items-center gap-2 w-full p-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-500 hover:border-green-400 hover:text-green-600 transition-colors bg-white dark:bg-slate-900"><Plus className="w-4 h-4" /> New Note</button>}
      {showNewNote && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={sectionCls}>
          <div><label className={labelCls}>Title</label><input value={newNoteTitle} onChange={(e) => setNewNoteTitle(e.target.value)} placeholder="Note title" className={inputCls} /></div>
          <div><div className="flex items-center justify-between mb-1.5"><label className={labelCls}>Content</label><button onClick={handleGenerateNote} disabled={noteAiLoading || !newNoteTitle.trim()} className="flex items-center gap-1 text-[10px] font-semibold text-green-600 hover:text-green-700 disabled:opacity-40 transition-colors">{noteAiLoading ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />} Generate Note with AI</button></div><textarea value={newNoteContent} onChange={(e) => setNewNoteContent(e.target.value)} placeholder="Write your notes..." rows={8} className={inputCls + " resize-none"} /></div>
          <div><label className={labelCls}>Tags (comma-separated)</label><input value={newNoteTags} onChange={(e) => setNewNoteTags(e.target.value)} placeholder="e.g. midterm, chapter-3" className={inputCls} /></div>
          <div className="flex gap-2"><button onClick={handleCreateNote} className="px-4 py-2 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors">Save Note</button><button onClick={() => setShowNewNote(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button></div>
        </motion.div>
      )}
      {notesLoading ? <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 animate-pulse"><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-2" /><div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-2/3" /></div>)}</div>
        : notes.length === 0 ? <EmptyState icon={StickyNote} title="No notes yet" description="Create notes to help organize study material" action="New Note" onAction={() => setShowNewNote(true)} />
        : notes.map((note) => (
          <motion.div key={note._id || note.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2 min-w-0">{note.isPinned && <Pin className="w-3 h-3 text-amber-500 flex-shrink-0" />}<h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{note.title}</h4>{note.isAiGenerated && <span className="text-[9px] font-bold text-purple-500 bg-purple-50 dark:bg-purple-500/10 px-1.5 py-0.5 rounded-full flex-shrink-0">AI</span>}</div>
              <button onClick={() => handleSummarizeNote(note)} disabled={noteSummaryLoading === (note._id || note.id)} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-green-500 transition-colors disabled:opacity-50">{noteSummaryLoading === (note._id || note.id) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}</button>
            </div>
            <div className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap line-clamp-6 mb-2">{note.content}</div>
            <div className="flex items-center justify-between"><div className="flex items-center gap-1.5 flex-wrap">{(note.tags || []).map((tag, i) => <span key={i} className="text-[9px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">#{tag}</span>)}</div><div className="flex items-center gap-2 text-[10px] text-slate-400">{note.authorId?.name && <span>by {note.authorId.name}</span>}<span>{new Date(note.createdAt).toLocaleDateString()}</span></div></div>
          </motion.div>
        ))}
    </div>
  );
}
