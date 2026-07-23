"use client";

import { useRef, useCallback } from "react";
import { Bold, Italic, Underline, List, ListOrdered, AlignLeft, Code } from "lucide-react";

export default function AssignmentEditor({ value, onChange, placeholder = "Type your submission here..." }) {
  const editorRef = useRef(null);

  const execCmd = useCallback((cmd, val) => {
    document.execCommand(cmd, false, val);
    editorRef.current?.focus();
  }, []);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  const isEmpty = !value || value === "<br>" || value === "<p></p>";

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
      <div className="flex items-center gap-0.5 px-2 py-1 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
        <button type="button" onClick={() => execCmd("bold")} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Bold">
          <Bold className="w-3.5 h-3.5 text-slate-500" />
        </button>
        <button type="button" onClick={() => execCmd("italic")} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Italic">
          <Italic className="w-3.5 h-3.5 text-slate-500" />
        </button>
        <button type="button" onClick={() => execCmd("underline")} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Underline">
          <Underline className="w-3.5 h-3.5 text-slate-500" />
        </button>
        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
        <button type="button" onClick={() => execCmd("insertUnorderedList")} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Bullet List">
          <List className="w-3.5 h-3.5 text-slate-500" />
        </button>
        <button type="button" onClick={() => execCmd("insertOrderedList")} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Numbered List">
          <ListOrdered className="w-3.5 h-3.5 text-slate-500" />
        </button>
        <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
        <button type="button" onClick={() => execCmd("justifyLeft")} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Align Left">
          <AlignLeft className="w-3.5 h-3.5 text-slate-500" />
        </button>
        <button type="button" onClick={() => execCmd("formatBlock", "pre")} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" title="Code Block">
          <Code className="w-3.5 h-3.5 text-slate-500" />
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="min-h-[150px] max-h-[400px] overflow-y-auto px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none prose prose-xs dark:prose-invert max-w-none"
        style={{ whiteSpace: "pre-wrap" }}
        suppressContentEditableWarning
        dangerouslySetInnerHTML={{ __html: value || "" }}
      />
      {isEmpty && (
        <div className="absolute top-9 left-3 text-xs text-slate-400 pointer-events-none">{placeholder}</div>
      )}
    </div>
  );
}
