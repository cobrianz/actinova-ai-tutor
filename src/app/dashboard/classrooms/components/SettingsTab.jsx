"use client";

import {
  Info, Calendar, GraduationCap, Bookmark, FileText, Globe, Users,
  Link2, Plus, X, Copy, AlertTriangle, Archive,
} from "lucide-react";
import { toast } from "sonner";

/**
 * @param {object} props.classroomState
 * @param {object} props.classroomState.classroom - Classroom object with inviteCode
 * @param {object} props.classroomState.settingsForm
 * @param {Function} props.classroomState.setSettingsForm
 * @param {boolean} props.classroomState.settingsSaving
 * @param {Function} props.classroomState.handleSaveSettings
 * @param {Function} props.classroomState.handleDeleteClassroom
 * @param {Array} props.classroomState.daysOfWeek - ["Mon","Tue",...]
 * @param {string} props.classroomState.inputCls
 * @param {string} props.classroomState.labelCls
 * @param {Function} props.classroomState.toggleCls - (on: boolean) => string
 * @param {Function} props.classroomState.toggleDot - (on: boolean) => string
 */
import { daysOfWeek as DAYS_OF_WEEK } from "./constants";

export default function SettingsTab({ classroomState }) {
  const {
    classroom, settingsForm, setSettingsForm, settingsSaving,
    handleSaveSettings, handleDeleteClassroom, daysOfWeek = DAYS_OF_WEEK,
    inputCls, labelCls, sectionCls, toggleCls, toggleDot,
  } = classroomState;

  return (
    <div className="space-y-4">
      <div className={sectionCls}>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><Info className="w-4 h-4 text-green-500" /> Classroom Info</h3>
        <div><label className={labelCls}>Name</label><input value={settingsForm.name} onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })} className={inputCls} /></div>
        <div><label className={labelCls}>Subject</label><input value={settingsForm.subject} onChange={(e) => setSettingsForm({ ...settingsForm, subject: e.target.value })} className={inputCls} /></div>
        <div><label className={labelCls}>Description</label><textarea value={settingsForm.description} onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })} rows={3} className={inputCls + " resize-none"} /></div>
      </div>
      <div className={sectionCls}>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-500" /> Schedule</h3>
        <div><label className={labelCls}>Days</label><div className="flex gap-1.5">{daysOfWeek.map((day) => <button key={day} onClick={() => { const days = settingsForm.schedule.days || []; const newDays = days.includes(day) ? days.filter((d) => d !== day) : [...days, day]; setSettingsForm({ ...settingsForm, schedule: { ...settingsForm.schedule, days: newDays } }); }} className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${(settingsForm.schedule.days || []).includes(day) ? "bg-green-500 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700"}`}>{day}</button>)}</div></div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className={labelCls}>Start Time</label><input type="time" value={settingsForm.schedule.startTime || ""} onChange={(e) => setSettingsForm({ ...settingsForm, schedule: { ...settingsForm.schedule, startTime: e.target.value } })} className={inputCls} /></div>
          <div><label className={labelCls}>End Time</label><input type="time" value={settingsForm.schedule.endTime || ""} onChange={(e) => setSettingsForm({ ...settingsForm, schedule: { ...settingsForm.schedule, endTime: e.target.value } })} className={inputCls} /></div>
          <div><label className={labelCls}>Location</label><input value={settingsForm.schedule.location || ""} onChange={(e) => setSettingsForm({ ...settingsForm, schedule: { ...settingsForm.schedule, location: e.target.value } })} placeholder="Room / Link" className={inputCls} /></div>
        </div>
      </div>
      <div className={sectionCls}>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><GraduationCap className="w-4 h-4 text-purple-500" /> Academic</h3>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={labelCls}>Semester</label><input value={settingsForm.semester} onChange={(e) => setSettingsForm({ ...settingsForm, semester: e.target.value })} className={inputCls} /></div>
          <div><label className={labelCls}>Academic Level</label><select value={settingsForm.academicLevel} onChange={(e) => setSettingsForm({ ...settingsForm, academicLevel: e.target.value })} className={inputCls + " appearance-none"}><option value="highschool">High School</option><option value="undergraduate">Undergraduate</option><option value="graduate">Graduate</option><option value="phd">PhD</option><option value="professional">Professional</option></select></div>
        </div>
        <div><label className={labelCls}>Grading Scheme</label><select value={settingsForm.gradingScheme} onChange={(e) => setSettingsForm({ ...settingsForm, gradingScheme: e.target.value })} className={inputCls + " appearance-none"}><option value="percentage">Percentage</option><option value="letter">Letter Grades</option><option value="passfail">Pass/Fail</option><option value="gpa">GPA Scale</option></select></div>
        <div><label className={labelCls}>Office Hours</label><input value={settingsForm.officeHours || ""} onChange={(e) => setSettingsForm({ ...settingsForm, officeHours: e.target.value })} placeholder="e.g. Mon/Wed 2-4 PM, Room 305" className={inputCls} /></div>
      </div>
      <div className={sectionCls}>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><Bookmark className="w-4 h-4 text-amber-500" /> Prerequisites</h3>
        <div className="flex gap-2"><input value={settingsForm.newPrereq || ""} onChange={(e) => setSettingsForm({ ...settingsForm, newPrereq: e.target.value })} placeholder="Add prerequisite..." className={inputCls + " flex-1"} onKeyDown={(e) => { if (e.key === "Enter" && settingsForm.newPrereq?.trim()) { setSettingsForm({ ...settingsForm, prerequisites: [...(settingsForm.prerequisites || []), settingsForm.newPrereq.trim()], newPrereq: "" }); } }} /><button onClick={() => { if (settingsForm.newPrereq?.trim()) setSettingsForm({ ...settingsForm, prerequisites: [...(settingsForm.prerequisites || []), settingsForm.newPrereq.trim()], newPrereq: "" }); }} className="px-3 py-2 bg-green-500 text-white rounded-lg text-xs font-semibold hover:bg-green-600 transition-colors"><Plus className="w-4 h-4" /></button></div>
        <div className="flex flex-wrap gap-1.5">{(settingsForm.prerequisites || []).map((prereq, i) => <span key={i} className="flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[11px] font-medium text-slate-700 dark:text-slate-300">{prereq}<button onClick={() => setSettingsForm({ ...settingsForm, prerequisites: settingsForm.prerequisites.filter((_, idx) => idx !== i) })} className="text-slate-400 hover:text-red-500"><X className="w-3 h-3" /></button></span>)}{(!settingsForm.prerequisites || settingsForm.prerequisites.length === 0) && <p className="text-[11px] text-slate-400 italic">No prerequisites</p>}</div>
      </div>
      <div className={sectionCls}>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-500" /> Syllabus</h3>
        <textarea value={settingsForm.syllabus} onChange={(e) => setSettingsForm({ ...settingsForm, syllabus: e.target.value })} rows={8} className={inputCls + " resize-none"} placeholder="Course syllabus..." />
      </div>
      <div className={sectionCls}>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><Globe className="w-4 h-4 text-teal-500" /> Feature Toggles</h3>
        {[{ key: "enableDiscussions", label: "Discussions" }, { key: "enableMaterials", label: "Materials" }].map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</span><button onClick={() => setSettingsForm({ ...settingsForm, settings: { ...settingsForm.settings, [key]: !settingsForm.settings[key] } })} className={toggleCls(settingsForm.settings[key])}><span className={toggleDot(settingsForm.settings[key])} /></button></div>
        ))}
      </div>
      <div className={sectionCls}>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><Users className="w-4 h-4 text-blue-500" /> Student Settings</h3>
        {[{ key: "allowStudentPosts", label: "Allow Student Posts" }, { key: "requireApproval", label: "Require Approval" }, { key: "showGradesToStudents", label: "Show Grades to Students" }, { key: "allowLateSubmissions", label: "Allow Late Submissions" }].map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{label}</span><button onClick={() => setSettingsForm({ ...settingsForm, settings: { ...settingsForm.settings, [key]: !settingsForm.settings[key] } })} className={toggleCls(settingsForm.settings[key])}><span className={toggleDot(settingsForm.settings[key])} /></button></div>
        ))}
        <div><label className={labelCls}>Late Penalty (%)</label><input type="number" min={0} max={100} value={settingsForm.settings.latePenaltyPercent || 0} onChange={(e) => setSettingsForm({ ...settingsForm, settings: { ...settingsForm.settings, latePenaltyPercent: parseInt(e.target.value) || 0 } })} className={inputCls} /></div>
        <div><label className={labelCls}>Max File Size (MB)</label><input type="number" min={1} max={100} value={settingsForm.settings.maxFileSizeMB || 50} onChange={(e) => setSettingsForm({ ...settingsForm, settings: { ...settingsForm.settings, maxFileSizeMB: parseInt(e.target.value) || 50 } })} className={inputCls} /></div>
      </div>
      <div className={sectionCls}>
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><Link2 className="w-4 h-4 text-slate-500" /> Invite Code</h3>
        <div className="flex items-center gap-2"><code className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-sm font-bold tracking-wider">{classroom.inviteCode}</code><button onClick={() => { navigator.clipboard.writeText(classroom.inviteCode); toast.success("Copied!"); }} className="p-2 text-slate-400 hover:text-green-500 transition-colors"><Copy className="w-4 h-4" /></button></div>
      </div>
      <button onClick={handleSaveSettings} disabled={settingsSaving} className="w-full py-2.5 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 disabled:opacity-50 transition-colors">{settingsSaving ? "Saving..." : "Save Settings"}</button>
      <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> Danger Zone</h3>
        <p className="text-xs text-red-500/70">Archiving a classroom will hide it from all users and remove student enrollments.</p>
        <button onClick={handleDeleteClassroom} className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition-colors"><Archive className="w-3.5 h-3.5" /> Archive Classroom</button>
      </div>
    </div>
  );
}

