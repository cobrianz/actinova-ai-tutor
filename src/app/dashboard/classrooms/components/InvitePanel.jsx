"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, X, UserPlus, Link2 } from "lucide-react";

function InvitePanel({ classroom, onClose }) {
  const [copied, setCopied] = useState(false);
  const inviteLink = typeof window !== "undefined"
    ? `${window.location.origin}/dashboard/classrooms?join=${classroom.inviteCode}` : "";
  const handleCopy = (text) => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><UserPlus className="w-4 h-4 text-green-500" /> Invite Students</h3>
        <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"><X className="w-4 h-4" /></button>
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Invite Code</label>
        <div className="flex items-center gap-2">
          <div className="flex-1 px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-lg font-bold text-slate-900 dark:text-white tracking-wider text-center">{classroom.inviteCode}</div>
          <button onClick={() => handleCopy(classroom.inviteCode)} className="p-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 block">Invite Link</label>
        <div className="flex items-center gap-2">
          <input readOnly value={inviteLink} className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-600 dark:text-slate-400 truncate" />
          <button onClick={() => handleCopy(inviteLink)} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
            <Link2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <p className="text-xs text-slate-500 text-center">Share this code or link with students to join <strong>{classroom.name}</strong></p>
    </motion.div>
  );
}

export default InvitePanel;
