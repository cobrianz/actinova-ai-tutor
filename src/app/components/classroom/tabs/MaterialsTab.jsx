"use client";

import { motion } from "framer-motion";
import { Plus, Layers, FileText, Video, ExternalLink, Presentation, Code, CheckCircle2 } from "lucide-react";

const MATERIAL_TYPES = [
  { value: "document", label: "Document", icon: FileText },
  { value: "video", label: "Video", icon: Video },
  { value: "link", label: "Link", icon: ExternalLink },
  { value: "slides", label: "Slides", icon: Presentation },
  { value: "code", label: "Code", icon: Code },
  { value: "other", label: "Other", icon: Layers },
];

const MATERIAL_ICON_MAP = {
  document: FileText, video: Video, link: ExternalLink,
  slides: Presentation, code: Code, other: Layers,
};

/**
 * @param {object} props.classroomState
 * @param {object} props.classroomState.classroom - Classroom object with durationWeeks
 * @param {boolean} props.classroomState.isInstructor
 * @param {Array} props.classroomState.materials
 * @param {boolean} props.classroomState.materialsLoading
 * @param {boolean} props.classroomState.showNewMaterial
 * @param {Function} props.classroomState.setShowNewMaterial
 * @param {object} props.classroomState.newMat
 * @param {Function} props.classroomState.setNewMat
 * @param {Function} props.classroomState.handleCreateMaterial
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

export default function MaterialsTab({ classroomState }) {
  const {
    classroom, isInstructor, materials, materialsLoading,
    showNewMaterial, setShowNewMaterial, newMat, setNewMat,
    handleCreateMaterial, inputCls, labelCls, sectionCls,
  } = classroomState;

  return (
    <div className="space-y-3">
      {isInstructor && <button onClick={() => setShowNewMaterial(!showNewMaterial)} className="flex items-center gap-2 w-full p-3 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-500 hover:border-green-400 hover:text-green-600 transition-colors bg-white dark:bg-slate-900"><Plus className="w-4 h-4" /> Add Material</button>}
      {showNewMaterial && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className={sectionCls}>
          <div className="grid grid-cols-2 gap-3"><div><label className={labelCls}>Title *</label><input value={newMat.title} onChange={(e) => setNewMat({ ...newMat, title: e.target.value })} placeholder="Material title" className={inputCls} /></div><div><label className={labelCls}>Type</label><select value={newMat.type} onChange={(e) => setNewMat({ ...newMat, type: e.target.value })} className={inputCls + " appearance-none"}>{MATERIAL_TYPES.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}</select></div></div>
          <div><label className={labelCls}>Description</label><textarea value={newMat.description} onChange={(e) => setNewMat({ ...newMat, description: e.target.value })} placeholder="Description..." rows={2} className={inputCls + " resize-none"} /></div>
          <div><label className={labelCls}>URL</label><input value={newMat.url} onChange={(e) => setNewMat({ ...newMat, url: e.target.value })} placeholder="https://..." className={inputCls} /></div>
          <div className="grid grid-cols-3 gap-3"><div><label className={labelCls}>Week #</label><input type="number" min={0} max={classroom.durationWeeks || 52} value={newMat.weekNumber} onChange={(e) => setNewMat({ ...newMat, weekNumber: parseInt(e.target.value) || 0 })} className={inputCls} /></div><div><label className={labelCls}>Category</label><input value={newMat.category} onChange={(e) => setNewMat({ ...newMat, category: e.target.value })} placeholder="e.g. Reading" className={inputCls} /></div><div className="flex items-end pb-1"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={newMat.isRequired} onChange={(e) => setNewMat({ ...newMat, isRequired: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-green-500 focus:ring-green-500" /><span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Required</span></label></div></div>
          <div className="flex gap-2"><button onClick={handleCreateMaterial} className="px-4 py-2 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors">Add Material</button><button onClick={() => setShowNewMaterial(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancel</button></div>
        </motion.div>
      )}
      {materialsLoading ? <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 animate-pulse"><div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-2" /><div className="h-2 bg-slate-200 dark:bg-slate-700 rounded w-1/2" /></div>)}</div>
        : materials.length === 0 ? <EmptyState icon={Layers} title="No materials yet" description="Upload course materials, links, and resources" action="Add Material" onAction={() => setShowNewMaterial(true)} />
        : Object.entries(materials.reduce((acc, mat) => { const wk = mat.weekNumber || 0; if (!acc[wk]) acc[wk] = []; acc[wk].push(mat); return acc; }, {})).sort(([a], [b]) => Number(a) - Number(b)).map(([week, mats]) => (
          <div key={week} className="space-y-2">
            {Number(week) > 0 && <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Week {week}</h4>}
            {mats.map((mat) => { const MIcon = MATERIAL_ICON_MAP[mat.type] || Layers; return (
              <motion.div key={mat._id || mat.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
                <div className="flex items-start gap-3"><div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0"><MIcon className="w-4 h-4 text-slate-500" /></div>
                  <div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-0.5"><h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{mat.title}</h4>{mat.isRequired && <span className="text-[9px] font-bold text-red-500 bg-red-50 dark:bg-red-500/10 px-1.5 py-0.5 rounded-full">Required</span>}{mat.category && <span className="text-[9px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">{mat.category}</span>}</div>
                    {mat.description && <p className="text-[11px] text-slate-500 line-clamp-2 mb-1">{mat.description}</p>}
                    <div className="flex items-center gap-2 mt-1">{mat.url && <a href={mat.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-semibold text-green-600 hover:text-green-700 flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>Open <ExternalLink className="w-3 h-3" /></a>}</div>
                  </div>
                </div>
              </motion.div>
            );})}
          </div>
        ))}
    </div>
  );
}
