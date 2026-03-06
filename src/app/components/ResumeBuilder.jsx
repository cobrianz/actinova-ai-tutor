import React, { useState, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import "jspdf-autotable";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    FileText, Sparkles, CheckCircle, AlertCircle, TrendingUp,
    BrainCircuit, ChevronRight, Loader2, ArrowRight, Target,
    Clock, Trash2, X, Download, Copy, Check, Edit2, AlignLeft,
    GraduationCap, Star, UserCircle, Briefcase,
    User, Mail, Phone, MapPin, Globe, Linkedin, Github,
    Award, FolderOpen, Languages, Heart, Users, Wrench,
    Plus, ChevronDown, ChevronUp, ChevronLeft, Flower2, Save
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/csrfClient";
import { useAuth } from "./AuthProvider";

// ─── Initial Form Data ──────────────────────────────────────────
const initialFormData = {
    personalInfo: { fullName: "", jobTitle: "", email: "", phone: "", location: "", website: "", linkedin: "", github: "", summary: "" },
    experience: [], education: [], skills: [], projects: [],
    certifications: [], awards: [], languages: [],
    customSections: [],
};

function getCompletionScore(data) {
    if (!data || !data.personalInfo) return 0;
    let score = 0, total = 0;
    ["fullName", "jobTitle", "email", "phone", "location", "summary"].forEach(f => {
        total += 1;
        if (data.personalInfo[f]?.trim()) score += 1;
    });
    total += 5; // Added 1 for customSections
    if (data.experience?.length > 0) score += 1;
    if (data.education?.length > 0) score += 1;
    if (data.skills?.length >= 3) score += 1;
    if (data.projects?.length > 0) score += 1;
    if (data.customSections?.length > 0) score += 1;
    return Math.round((score / total) * 100);
}

// ─── UI Helper Components ───────────────────────────────────────
function SectionHeader({ icon: Icon, title, count, description }) {
    return (
        <div className="pb-3 mb-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                    <Icon className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200">{title}</h2>
                    {description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{description}</p>}
                </div>
                {count !== undefined && count > 0 && (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400">{count}</span>
                )}
            </div>
        </div>
    );
}

function InputField({ label, value, onChange, placeholder, icon: Icon, type = "text", rows, required }) {
    const baseClass = "w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all";
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {label}{required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            <div className="relative group">
                {Icon && <Icon className="absolute w-4 h-4 text-slate-400 left-3 top-1/2 -translate-y-1/2 group-focus-within:text-violet-500 transition-colors" />}
                {rows ? (
                    <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} className={`${baseClass} resize-none ${Icon ? "pl-10" : ""}`} />
                ) : (
                    <input type={type} value={value} onChange={onChange} placeholder={placeholder} className={`${baseClass} ${Icon ? "pl-10" : ""}`} />
                )}
            </div>
        </div>
    );
}

function CollapsibleCard({ title, subtitle, onRemove, defaultOpen = true, children, index }) {
    const [open, setOpen] = React.useState(defaultOpen);
    return (
        <div className={`border rounded-xl overflow-hidden transition-all duration-200 ${open ? "border-violet-200 dark:border-violet-800 bg-white dark:bg-slate-900 shadow-sm" : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-violet-200 dark:hover:border-violet-800"}`}>
            <div className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none" onClick={() => setOpen(!open)}>
                <span className="flex items-center justify-center w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400">{(index ?? 0) + 1}</span>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{title || "New Entry"}</p>
                    {subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{subtitle}</p>}
                </div>
                <button onClick={(e) => { e.stopPropagation(); onRemove(); }} className="p-1.5 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
                {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </div>
            <div className={`overflow-hidden transition-all duration-300 ${open ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"}`}>
                <div className="px-4 pb-4 flex flex-col gap-3 border-t border-slate-100 dark:border-slate-800 pt-3">{children}</div>
            </div>
        </div>
    );
}

function AddButton({ onClick, label }) {
    return (
        <button onClick={onClick} className="flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-xl hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/10 transition-all duration-200 active:scale-[0.98]">
            <Plus className="w-4 h-4" />{label}
        </button>
    );
}

// ─── Live Resume Preview ────────────────────────────────────────
function FormResumePreview({ data, onUpdate }) {
    const [selectedText, setSelectedText] = useState("");
    const [tooltipPos, setTooltipPos] = useState(null);
    const containerRef = useRef(null);

    if (!data) return null;
    const { personalInfo, experience = [], education = [], skills = [], projects = [], customSections = [] } = data;

    const displayName = personalInfo.fullName || personalInfo.name;
    const hasContent = displayName || personalInfo.summary || data.summary || experience.length > 0 || education.length > 0 || skills.length > 0;

    const contactItems = [
        { icon: Mail, value: personalInfo.email, field: 'email', label: 'Email' },
        { icon: Phone, value: personalInfo.phone, field: 'phone', label: 'Phone' },
        { icon: MapPin, value: personalInfo.location, field: 'location', label: 'Location' },
        { icon: Globe, value: personalInfo.website, field: 'website', label: 'Website' },
        { icon: Linkedin, value: personalInfo.linkedin, field: 'linkedin', label: 'LinkedIn' },
        { icon: Github, value: personalInfo.github, field: 'github', label: 'GitHub' },
    ];

    const handleBlur = (section, field, value, index = null) => {
        if (!onUpdate) return;
        if (index !== null) {
            onUpdate(section, index, field, value);
        } else {
            onUpdate(section, field, value);
        }
    };

    const handleSelection = () => {
        const selection = window.getSelection();
        const text = selection.toString().trim();
        if (text && containerRef.current?.contains(selection.anchorNode)) {
            const range = selection.getRangeAt(0);
            const rect = range.getBoundingClientRect();
            const containerRect = containerRef.current.getBoundingClientRect();
            setSelectedText(text);
            setTooltipPos({
                top: rect.top - containerRect.top - 40,
                left: rect.left - containerRect.left + (rect.width / 2)
            });
        } else {
            setSelectedText("");
            setTooltipPos(null);
        }
    };

    const SectionTitle = ({ children, onRemove }) => (
        <div className="flex items-center gap-4 mb-4 mt-8 first:mt-0 group/sec relative">
            <div className="h-[1px] flex-1 bg-slate-200"></div>
            <div className="flex items-center gap-2">
                <h3 className="text-[12px] font-black tracking-[0.1em] text-slate-500 px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-full">{children}</h3>
                <button onClick={() => handleRefineText('refine', children.toString().toLowerCase())} className="p-1 px-2 rounded-full bg-violet-50 text-violet-500 opacity-0 group-hover/sec:opacity-100 transition-opacity hover:bg-violet-100" title="Refine this section with AI">
                    <Sparkles size={10} />
                </button>
                {onRemove && (
                    <button onClick={onRemove} className="p-1 px-2 rounded-full bg-rose-50 text-rose-500 opacity-0 group-hover/sec:opacity-100 transition-opacity hover:bg-rose-100" title="Remove section">
                        <Trash2 size={10} />
                    </button>
                )}
            </div>
            <div className="h-[1px] flex-1 bg-slate-200"></div>
        </div>
    );

    const handleRefineText = async (type, sectionContext = null) => {
        const textToRefine = selectedText.trim() || Object.values(data[sectionContext] || {}).join(" ") || JSON.stringify(data[sectionContext] || "");
        if (!textToRefine || textToRefine === '""' || textToRefine === "{}") {
            toast.error("Please select text or add content to this section first to refine.", { id: "refine-empty" });
            return;
        }
        const toastId = toast.loading(type === 'refine' ? 'Refining...' : 'Elaborating...');
        try {
            const response = await apiClient.post('/api/career/ai/edit', {
                text: textToRefine,
                instruction: type === 'refine'
                    ? 'Make this more concise, impactful, and professional for a resume.'
                    : 'Expand this with more detail and specifics while keeping it professional.',
            });
            if (response.ok) {
                const dataFromAi = await response.json();
                if (dataFromAi.content) {
                    if (selectedText) {
                        document.execCommand('insertText', false, dataFromAi.content);
                        setTooltipPos(null);
                    } else if (sectionContext) {
                        toast.success(`AI suggestion for ${sectionContext} copied! Paste it where you need it!`, { id: toastId, duration: 6000 });
                        navigator.clipboard.writeText(dataFromAi.content);
                        return;
                    }
                    toast.success('Text updated!', { id: toastId });
                } else {
                    throw new Error('No content returned');
                }
            } else {
                throw new Error('Failed to refine');
            }
        } catch (error) {
            toast.error('Failed to update text', { id: toastId });
        }
    };

    const addSectionType = (type) => {
        const templates = {
            experience: { title: "New Role", company: "Company", location: "Location", startDate: "Date", endDate: "Present", description: "Describe your key responsibilities and achievements..." },
            education: { school: "University", degree: "Degree", location: "Location", startDate: "Date", endDate: "Date", description: "" },
            skills: "New Skill",
            projects: { name: "Project Name", description: "Describe the project and its impact", technologies: "React, Node.js" },
            certifications: { name: "Certification Name", issuer: "Issuing Organization", date: "Date", url: "" },
            awards: { title: "Award Title", org: "Organization", date: "Date", description: "" },
            languages: { language: "Language", level: "Proficient" },
        };
        if (!templates[type]) return;
        onUpdate(type, 'add', templates[type]);
    };

    return (
        <div id="resume-preview" ref={containerRef} onMouseUp={handleSelection} className="p-8 md:p-12 bg-white min-h-[1000px] relative text-[#1a1a2e] font-serif">
            {tooltipPos && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                    style={{ position: 'absolute', top: tooltipPos.top, left: tooltipPos.left, transform: 'translateX(-50%)' }}
                    className="z-[999] flex items-center gap-1 p-1 bg-slate-900 text-white rounded-xl shadow-2xl border border-white/10"
                >
                    <button onClick={() => handleRefineText('refine')} className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-white/10 rounded-lg text-xs font-bold transition-colors">
                        <Sparkles size={12} className="text-violet-400" /> Refine
                    </button>
                    <div className="w-[1px] h-4 bg-white/20" />
                    <button onClick={() => handleRefineText('elaborate')} className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-white/10 rounded-lg text-xs font-bold transition-colors">
                        <BrainCircuit size={12} className="text-emerald-400" /> Elaborate
                    </button>
                </motion.div>
            )}

            <header className="flex flex-col items-center text-center space-y-1 mb-8">
                <h1
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => handleBlur('personalInfo', 'fullName', e.target.innerText)}
                    className="text-3xl font-bold tracking-tight mb-2 outline-none focus:bg-slate-50 rounded px-2"
                    style={{ letterSpacing: "0.02em" }}
                >
                    {displayName || "Your Name"}
                </h1>

                <p
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) => handleBlur('personalInfo', 'jobTitle', e.target.innerText)}
                    className="text-lg font-medium text-slate-600 tracking-wide italic outline-none focus:bg-slate-50 rounded px-2"
                    style={{ fontSize: "14px" }}
                >
                    {personalInfo.jobTitle || "Job Title"}
                </p>

                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3 max-w-2xl">
                    {contactItems.map((item, i) => (
                        <div key={i} className={`flex items-center gap-1.5 text-[11px] text-slate-500 ${!item.value ? "opacity-30 hover:opacity-100 transition-opacity" : ""}`}>
                            <item.icon size={10} className="text-slate-400" />
                            <span
                                contentEditable
                                suppressContentEditableWarning
                                onBlur={(e) => handleBlur('personalInfo', item.field, e.target.innerText)}
                                className="outline-none focus:bg-slate-50 rounded px-1 min-w-[20px]"
                            >
                                {item.value || item.label}
                            </span>
                        </div>
                    ))}
                </div>
            </header>

            {(personalInfo.summary || data.summary) && (
                <section className="mb-6 group/sec relative">
                    <SectionTitle onRemove={() => handleBlur('personalInfo', 'summary', "")}>Summary</SectionTitle>
                    <p
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => handleBlur('personalInfo', 'summary', e.target.innerText)}
                        className="text-[14px] leading-relaxed text-justify px-2 italic outline-none focus:bg-slate-50 rounded"
                        style={{ color: "#333" }}
                    >
                        {personalInfo.summary || data.summary}
                    </p>
                </section>
            )}

            {experience.length > 0 && (
                <section className="mb-6">
                    <SectionTitle onRemove={() => onUpdate('experience', 'remove', null, null)}>Experience</SectionTitle>
                    <div className="space-y-6 px-2">
                        {experience.map((exp, i) => (
                            <div key={i} className="group transition-all relative">
                                <button onClick={() => onUpdate('experience', 'remove', i)} className="absolute -left-6 top-1 p-1 rounded-full text-rose-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 size={12} />
                                </button>
                                <div className="flex justify-between items-baseline mb-1">
                                    <div className="flex items-baseline gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-violet-400 group-hover:scale-125 transition-transform" />
                                        <h4
                                            contentEditable
                                            suppressContentEditableWarning
                                            onBlur={(e) => handleBlur('experience', 'title', e.target.innerText, i)}
                                            className="text-[15px] font-bold text-slate-900 leading-none outline-none focus:bg-slate-50 rounded px-1"
                                        >
                                            {exp.title}
                                        </h4>
                                        <span className="text-slate-200 font-light">|</span>
                                        <span
                                            contentEditable
                                            suppressContentEditableWarning
                                            onBlur={(e) => handleBlur('experience', 'company', e.target.innerText, i)}
                                            className="text-[13px] font-semibold text-slate-600 leading-none outline-none focus:bg-slate-50 rounded px-1"
                                        >
                                            {exp.company}
                                        </span>
                                    </div>
                                    <span
                                        contentEditable
                                        suppressContentEditableWarning
                                        onBlur={(e) => handleBlur('experience', 'dateRange', e.target.innerText, i)}
                                        className="text-[11px] font-bold text-slate-500 uppercase tracking-wider outline-none focus:bg-slate-50 rounded px-1"
                                    >
                                        {exp.startDate} – {exp.endDate}
                                    </span>
                                </div>
                                <p
                                    contentEditable
                                    suppressContentEditableWarning
                                    onBlur={(e) => handleBlur('experience', 'description', e.target.innerText, i)}
                                    className="text-[14px] leading-relaxed text-slate-600 whitespace-pre-line border-l-2 border-slate-50 pl-4 ml-0.5 outline-none focus:bg-slate-50 rounded"
                                >
                                    {exp.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {education.length > 0 && (
                <section className="mb-6">
                    <SectionTitle onRemove={() => onUpdate('education', 'remove', null, null)}>Education</SectionTitle>
                    <div className="space-y-4 px-2">
                        {education.map((edu, i) => (
                            <div key={i} className="flex justify-between items-baseline group relative">
                                <button onClick={() => onUpdate('education', 'remove', i)} className="absolute -left-6 top-1 p-1 rounded-full text-rose-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 size={12} />
                                </button>
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <GraduationCap size={12} className="text-slate-400" />
                                        <h4
                                            contentEditable
                                            suppressContentEditableWarning
                                            onBlur={(e) => handleBlur('education', 'degree', e.target.innerText, i)}
                                            className="text-[15px] font-bold text-slate-900 leading-none outline-none focus:bg-slate-50 rounded px-1"
                                        >
                                            {edu.degree}
                                        </h4>
                                    </div>
                                    <p
                                        contentEditable
                                        suppressContentEditableWarning
                                        onBlur={(e) => handleBlur('education', 'school', e.target.innerText, i)}
                                        className="text-[13px] font-medium text-slate-500 pl-5 leading-none outline-none focus:bg-slate-50 rounded px-1"
                                    >
                                        {edu.school}, {edu.location}
                                    </p>
                                </div>
                                <span
                                    contentEditable
                                    suppressContentEditableWarning
                                    onBlur={(e) => handleBlur('education', 'dateRange', e.target.innerText, i)}
                                    className="text-[11px] font-bold text-slate-400 uppercase tracking-widest leading-none outline-none focus:bg-slate-50 rounded px-1"
                                >
                                    {edu.startDate} – {edu.endDate}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            )}


            {(data.projects || []).length > 0 && (
                <section className="mb-6">
                    <SectionTitle onRemove={() => onUpdate('projects', 'remove', null, null)}>Projects</SectionTitle>
                    <div className="space-y-4 px-2">
                        {(data.projects || []).map((project, i) => (
                            <div key={i} className="group relative">
                                <button onClick={() => onUpdate('projects', i, 'remove')} className="absolute -left-6 top-1 p-1 rounded-full text-rose-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 size={12} />
                                </button>
                                <div className="flex justify-between items-baseline mb-1">
                                    <div className="flex items-baseline gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 group-hover:scale-125 transition-transform" />
                                        <h4
                                            contentEditable
                                            suppressContentEditableWarning
                                            onBlur={(e) => handleBlur('projects', 'name', e.target.innerText, i)}
                                            className="text-[15px] font-bold text-slate-900 leading-none outline-none focus:bg-slate-50 rounded px-1"
                                        >
                                            {project.name}
                                        </h4>
                                    </div>
                                    <span
                                        contentEditable
                                        suppressContentEditableWarning
                                        onBlur={(e) => handleBlur('projects', 'technologies', e.target.innerText, i)}
                                        className="text-[11px] font-bold text-slate-400 uppercase tracking-widest outline-none focus:bg-slate-50 rounded px-1"
                                    >
                                        {project.technologies}
                                    </span>
                                </div>
                                <p
                                    contentEditable
                                    suppressContentEditableWarning
                                    onBlur={(e) => handleBlur('projects', 'description', e.target.innerText, i)}
                                    className="text-[14px] leading-relaxed text-slate-600 border-l-2 border-slate-50 pl-4 ml-0.5 outline-none focus:bg-slate-50 rounded"
                                >
                                    {project.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {(data.certifications || []).length > 0 && (
                <section className="mb-6">
                    <SectionTitle onRemove={() => onUpdate('certifications', 'remove', null, null)}>Certifications</SectionTitle>
                    <div className="space-y-2 px-2">
                        {(data.certifications || []).map((cert, i) => (
                            <div key={i} className="group relative flex justify-between items-start">
                                <button onClick={() => onUpdate('certifications', i, 'remove')} className="absolute -left-5 p-1 text-rose-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={10} /></button>
                                <div>
                                    <span contentEditable suppressContentEditableWarning onBlur={(e) => onUpdate('certifications', i, 'name', e.target.innerText)} className="text-[13px] font-bold text-slate-800 outline-none">{cert.name}</span>
                                    <span className="mx-2 text-slate-300">·</span>
                                    <span contentEditable suppressContentEditableWarning onBlur={(e) => onUpdate('certifications', i, 'issuer', e.target.innerText)} className="text-[12px] text-slate-500 outline-none">{cert.issuer}</span>
                                </div>
                                <span contentEditable suppressContentEditableWarning onBlur={(e) => onUpdate('certifications', i, 'date', e.target.innerText)} className="text-[11px] font-semibold text-slate-400 outline-none whitespace-nowrap ml-2">{cert.date}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {(data.awards || []).length > 0 && (
                <section className="mb-6">
                    <SectionTitle onRemove={() => onUpdate('awards', 'remove', null, null)}>Awards</SectionTitle>
                    <div className="space-y-2 px-2">
                        {(data.awards || []).map((award, i) => (
                            <div key={i} className="group relative flex justify-between items-start">
                                <button onClick={() => onUpdate('awards', i, 'remove')} className="absolute -left-5 p-1 text-rose-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={10} /></button>
                                <div>
                                    <span contentEditable suppressContentEditableWarning onBlur={(e) => onUpdate('awards', i, 'title', e.target.innerText)} className="text-[13px] font-bold text-slate-800 outline-none">{award.title}</span>
                                    <span className="mx-2 text-slate-300">·</span>
                                    <span contentEditable suppressContentEditableWarning onBlur={(e) => onUpdate('awards', i, 'org', e.target.innerText)} className="text-[12px] text-slate-500 outline-none">{award.org}</span>
                                </div>
                                <span contentEditable suppressContentEditableWarning onBlur={(e) => onUpdate('awards', i, 'date', e.target.innerText)} className="text-[11px] font-semibold text-slate-400 outline-none whitespace-nowrap ml-2">{award.date}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {(data.languages || []).length > 0 && (
                <section className="mb-6">
                    <SectionTitle onRemove={() => onUpdate('languages', 'remove', null, null)}>Languages</SectionTitle>
                    <div className="flex flex-wrap gap-x-8 gap-y-2 px-2">
                        {(data.languages || []).map((lang, i) => (
                            <div key={i} className="group relative flex items-center gap-2">
                                <button onClick={() => onUpdate('languages', i, 'remove')} className="absolute -left-5 p-1 text-rose-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={10} /></button>
                                <span contentEditable suppressContentEditableWarning onBlur={(e) => onUpdate('languages', i, 'language', e.target.innerText)} className="text-[13px] font-bold text-slate-800 outline-none">{lang.language}</span>
                                <span className="text-slate-200">|</span>
                                <span contentEditable suppressContentEditableWarning onBlur={(e) => onUpdate('languages', i, 'level', e.target.innerText)} className="text-[12px] text-slate-500 outline-none">{lang.level}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {skills.length > 0 && (
                <section className="mb-6">
                    <SectionTitle onRemove={() => onUpdate('skills', 'remove', null, null)}>Skills</SectionTitle>
                    <div className="grid grid-cols-2 gap-x-12 gap-y-2 px-6">
                        {skills.map((skill, i) => (
                            <div key={i} className="flex items-center justify-between text-[13px] group border-b border-slate-50 pb-1 relative">
                                <button onClick={() => onUpdate('skills', i, 'remove')} className="absolute -left-6 p-1 rounded-full text-rose-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 size={10} />
                                </button>
                                <span
                                    contentEditable
                                    suppressContentEditableWarning
                                    onBlur={(e) => handleBlur('skills', null, e.target.innerText, i)}
                                    className="text-slate-700 font-medium group-hover:text-violet-600 transition-colors outline-none"
                                >
                                    {skill}
                                </span>
                                <div className="flex-1 border-b border-dotted border-slate-200 mx-2 mb-1" />
                                <Sparkles size={8} className="text-slate-200 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <div className="mt-12 flex justify-center flex-wrap gap-2">
                {[
                    { id: 'experience', label: 'Experience' },
                    { id: 'education', label: 'Education' },
                    { id: 'skills', label: 'Skills' },
                    { id: 'projects', label: 'Projects' },
                    { id: 'certifications', label: 'Certifications' },
                    { id: 'awards', label: 'Awards' },
                    { id: 'languages', label: 'Languages' },
                ].map(({ id, label }) => (
                    <Button key={id} variant="outline" onClick={() => addSectionType(id)} className="rounded-full border-dashed border-2 px-5 text-slate-400 hover:text-violet-600 hover:border-violet-300 text-xs bg-white">
                        <Plus size={12} className="mr-1.5" /> {label}
                    </Button>
                ))}
            </div>
        </div>
    );
}

const ResumeBuilder = () => {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const mode = searchParams.get("mode") || "both";
    const initialRole = searchParams.get("role") || "";

    const [resumeText, setResumeText] = useState("");
    const [jobDescription, setJobDescription] = useState(initialRole);
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [editorTab, setEditorTab] = React.useState("editor");
    const [history, setHistory] = React.useState([]);
    const [activeSection, setActiveSection] = useState("personal");
    const [previewMode, setPreviewMode] = useState("split");
    const [error, setError] = useState(null);
    const [generatedResume, setGeneratedResume] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [coverLetter, setCoverLetter] = useState("");
    const [applicationLetter, setApplicationLetter] = useState("");
    const [coverLetterCompany, setCoverLetterCompany] = useState("");
    const [portfolioPrompts, setPortfolioPrompts] = useState([]);
    const [isGeneratingCL, setIsGeneratingCL] = useState(false);
    const [isGeneratingAL, setIsGeneratingAL] = useState(false);
    const [isGeneratingPP, setIsGeneratingPP] = useState(false);
    const [jobMatchDescription, setJobMatchDescription] = useState("");
    const [jobMatchResult, setJobMatchResult] = useState(null);
    const [isMatchingJob, setIsMatchingJob] = useState(false);
    const [savedResumeId, setSavedResumeId] = useState(null);
    const [savedCLId, setSavedCLId] = useState(null);
    const [savedALId, setSavedALId] = useState(null);
    const [savedPPId, setSavedPPId] = useState(null);
    const [showLibraryPicker, setShowLibraryPicker] = useState(false);
    const [libraryCourses, setLibraryCourses] = useState([]);
    const [librarySearch, setLibrarySearch] = useState("");
    const [libraryLoading, setLibraryLoading] = useState(false);
    const libraryPickerOpen = showLibraryPicker;

    const [formData, setFormData] = useState(initialFormData);
    const [skillInput, setSkillInput] = useState("");
    const completionScore = useMemo(() => getCompletionScore(formData), [formData]);

    const updatePersonalInfo = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, [field]: value } }));
    }, []);
    const addItem = useCallback((section, template) => {
        setFormData(prev => ({ ...prev, [section]: [...(prev[section] || []), template] }));
    }, []);
    const updateItem = useCallback((section, index, field, value) => {
        if (index === 'remove' || field === 'remove') {
            setFormData(prev => ({
                ...prev,
                [section]: index === 'remove' ? [] : (prev[section] || []).filter((_, i) => i !== index)
            }));
            return;
        }
        if (index === 'add' || field === 'add') {
            const template = index === 'add' ? field : value;
            setFormData(prev => ({
                ...prev,
                [section]: [...(prev[section] || []), template]
            }));
            return;
        }
        setFormData(prev => ({
            ...prev,
            [section]: (prev[section] || []).map((item, i) => i === index ? (typeof item === 'string' ? field : { ...item, [field]: value }) : item)
        }));
    }, []);
    const removeItem = useCallback((section, index) => {
        setFormData(prev => ({ ...prev, [section]: prev[section].filter((_, i) => i !== index) }));
    }, []);
    const addSkill = useCallback((e) => {
        e.preventDefault();
        const trimmed = skillInput.trim();
        if (trimmed && !formData.skills.includes(trimmed)) {
            setFormData(prev => ({ ...prev, skills: [...prev.skills, trimmed] }));
            setSkillInput("");
        }
    }, [skillInput, formData.skills]);

    React.useEffect(() => {
        if (user) {
            setFormData(prev => {
                const fName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.name || "";
                return {
                    ...prev,
                    personalInfo: {
                        ...prev.personalInfo,
                        fullName: prev.personalInfo.fullName || fName,
                        email: prev.personalInfo.email || user.email || ""
                    }
                };
            });
        }
    }, [user]);

    React.useEffect(() => {
        fetchHistory();
    }, []);

    // DB autosave — debounced, handles Resume, Cover Letter, and Portfolio
    // Changed to save to local storage instead of hitting the database automatically
    React.useEffect(() => {
        const isResume = editorTab === 'both' || editorTab === 'editor';
        const isCL = editorTab === 'cover-letter';
        const isAL = editorTab === 'application-letter';
        const isPP = editorTab === 'portfolio';

        let type = "resume";
        let dataToSave = generatedResume || formData;
        let title = dataToSave.personalInfo?.fullName || dataToSave.personalInfo?.name || "Draft Resume";

        if (isCL) {
            if (!coverLetter) return;
            type = "cover-letter";
            dataToSave = { content: coverLetter, company: coverLetterCompany };
            title = `Cover Letter for ${coverLetterCompany || jobDescription || 'Role'}`;
        } else if (isAL) {
            if (!applicationLetter) return;
            type = "application-letter";
            dataToSave = { content: applicationLetter, company: coverLetterCompany };
            title = `Application Letter for ${coverLetterCompany || jobDescription || 'Role'}`;
        } else if (isPP) {
            if (portfolioPrompts.length === 0) return;
            type = "portfolio";
            dataToSave = { prompts: portfolioPrompts };
            title = `Portfolio Prompts: ${jobDescription || 'Ideas'}`;
        } else {
            const hasContent = dataToSave.personalInfo?.fullName || dataToSave.personalInfo?.jobTitle ||
                (dataToSave.experience || []).length > 0 || (dataToSave.skills || []).length > 0;
            if (!hasContent) return;
        }

        const timer = setTimeout(() => {
            try {
                const draft = { type, title, data: dataToSave, metadata: { jobDescription } };
                localStorage.setItem(`career_draft_${type}`, JSON.stringify(draft));
                // Optional: show a small toast for local save if needed, though it might be too spammy.
            } catch (error) {
                console.error("Local save error:", error);
            }
        }, 1500);
        return () => clearTimeout(timer);
    }, [formData, generatedResume, coverLetter, applicationLetter, portfolioPrompts, editorTab]);

    React.useEffect(() => {
        // Load from local storage on mount
        try {
            const isResume = editorTab === 'both' || editorTab === 'editor';
            const isCL = editorTab === 'cover-letter';
            const isAL = editorTab === 'application-letter';
            const isPP = editorTab === 'portfolio';
            let type = "resume";
            if (isCL) type = "cover-letter";
            if (isAL) type = "application-letter";
            if (isPP) type = "portfolio";

            const saved = localStorage.getItem(`career_draft_${type}`);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (type === "resume") {
                    setFormData(prev => ({ ...prev, ...parsed.data }));
                    setGeneratedResume(parsed.data);
                } else if (type === "cover-letter") {
                    setCoverLetter(parsed.data.content || "");
                    setCoverLetterCompany(parsed.data.company || "");
                } else if (type === "application-letter") {
                    setApplicationLetter(parsed.data.content || "");
                    setCoverLetterCompany(parsed.data.company || "");
                } else if (type === "portfolio") {
                    setPortfolioPrompts(parsed.data.prompts || []);
                }
                if (parsed.metadata?.jobDescription) {
                    setJobDescription(parsed.metadata.jobDescription);
                }
            }
        } catch (e) {
            console.error("Failed to load draft from local storage:", e);
        }
    }, [editorTab]); // Reload local draft when tab changes

    const saveToDatabase = async () => {
        const isResume = editorTab === 'both' || editorTab === 'editor';
        const isCL = editorTab === 'cover-letter';
        const isAL = editorTab === 'application-letter';
        const isPP = editorTab === 'portfolio';

        let type = "resume";
        let documentId = savedResumeId;
        let dataToSave = generatedResume || formData;
        let title = dataToSave.personalInfo?.fullName || dataToSave.personalInfo?.name || "Draft Resume";

        if (isCL) {
            if (!coverLetter) {
                toast.error("Nothing to save for cover letter");
                return;
            }
            type = "cover-letter";
            documentId = savedCLId;
            dataToSave = { content: coverLetter, company: coverLetterCompany };
            title = `Cover Letter for ${coverLetterCompany || jobDescription || 'Role'}`;
        } else if (isAL) {
            if (!applicationLetter) {
                toast.error("Nothing to save for application letter");
                return;
            }
            type = "application-letter";
            documentId = savedALId;
            dataToSave = { content: applicationLetter, company: coverLetterCompany };
            title = `Application Letter for ${coverLetterCompany || jobDescription || 'Role'}`;
        } else if (isPP) {
            if (portfolioPrompts.length === 0) {
                toast.error("Nothing to save for portfolio");
                return;
            }
            type = "portfolio";
            documentId = savedPPId;
            dataToSave = { prompts: portfolioPrompts };
            title = `Portfolio Prompts: ${jobDescription || 'Ideas'}`;
        } else {
            const hasContent = dataToSave.personalInfo?.fullName || dataToSave.personalInfo?.jobTitle ||
                (dataToSave.experience || []).length > 0 || (dataToSave.skills || []).length > 0;
            if (!hasContent) {
                toast.error("Add some content to your resume before saving");
                return;
            }
        }

        const toastId = toast.loading("Saving...");
        try {
            const response = await apiClient.post("/api/career/history", {
                id: documentId,
                type,
                title,
                data: dataToSave,
                metadata: { jobDescription }
            });
            if (response.ok) {
                const saved = await response.json();
                if (type === "resume") setSavedResumeId(saved._id);
                else if (type === "cover-letter") setSavedCLId(saved._id);
                else if (type === "application-letter") setSavedALId(saved._id);
                else if (type === "portfolio") setSavedPPId(saved._id);

                setHistory(prev => {
                    const filtered = prev.filter(item => item._id !== saved._id);
                    return [saved, ...filtered].slice(0, 20);
                });
                toast.success("Saved!", { id: toastId });
            } else {
                throw new Error("Failed response from server");
            }
        } catch (error) {
            console.error("Manual save error:", error);
            toast.error("Failed to save to database", { id: toastId });
        }
    };

    const fetchHistory = async () => {
        try {
            // Fetch all recent career history
            const response = await apiClient.get("/api/career/history");
            if (response.ok) {
                const data = await response.json();
                setHistory(data);
            }
        } catch (error) {
            console.error("Failed to fetch history:", error);
        }
    };

    React.useEffect(() => {
        const autoGenerate = searchParams.get("autoGenerate") === "true";
        if (autoGenerate && jobDescription && !isGenerating && !generatedResume) {
            handleGenerate();
        }
    }, [searchParams, jobDescription, isGenerating, generatedResume]);

    const loadHistoryItem = (item) => {
        if (item.type === "resume") {
            setGeneratedResume(item.data);
            setFormData(prev => ({ ...prev, ...item.data }));
            setEditorTab('editor');
            toast.success("Resume restored!");
        } else if (item.type === "cover-letter") {
            setCoverLetter(item.data.content || "");
            setCoverLetterCompany(item.data.company || "");
            setEditorTab('cover-letter');
            toast.success("Cover letter restored!");
        } else if (item.type === "portfolio") {
            setPortfolioPrompts(item.data.prompts || []);
            setEditorTab('portfolio');
            toast.success("Portfolio ideas restored!");
        }
        setJobDescription(item.metadata?.jobDescription || jobDescription);
        setError(null);
    };

    const deleteHistoryItem = async (e, id) => {
        e.stopPropagation();
        try {
            const response = await apiClient.delete(`/api/career/history?id=${id}`);
            if (response.ok) {
                setHistory(prev => prev.filter(item => item._id !== id));
                toast.success("History item deleted");
            }
        } catch (error) {
            toast.error("Failed to delete history item");
        }
    };

    const handleOptimize = async () => {
        const textToOptimize = resumeText.trim() || JSON.stringify(generatedResume || formData);

        if (!textToOptimize || textToOptimize === "{}" || textToOptimize.length < 50) {
            toast.error("Please add some content to your resume first");
            setError("Resume content is required");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.post("/api/career/resume/optimize", {
                resumeText: textToOptimize,
                jobDescription: jobDescription || undefined
            });
            if (response.ok) {
                const data = await response.json();
                setFeedback(data);
                if (!generatedResume) {
                    setGeneratedResume({
                        personalInfo: { name: "Optimized Resume", email: "", phone: "", location: "" },
                        summary: resumeText,
                        experience: [],
                        education: [],
                        skills: []
                    });
                }
                setEditorTab("insights");
                fetchHistory();
                toast.success("Resume optimized successfully!");
            } else {
                const errorData = await response.json().catch(() => ({}));
                setError(errorData.error || "Failed to optimize resume");
            }
        } catch (error) {
            console.error("Resume optimization error:", error);
            setError(error.message || "An error occurred during optimization.");
        } finally {
            setLoading(false);
        }
    };

    const handleGeneratePortfolio = async () => {
        setIsGeneratingPP(true);
        const toastId = toast.loading("Curating portfolio prompts...");
        try {
            const response = await apiClient.post("/api/career/portfolio/generate", {
                resume: generatedResume,
                role: jobDescription
            });
            if (response.ok) {
                const data = await response.json();
                setPortfolioPrompts(data.prompts || []);
                setEditorTab("portfolio");
                toast.success("Portfolio prompts ready!", { id: toastId });

                try {
                    const saved = await apiClient.post("/api/career/history", {
                        type: "portfolio",
                        title: `Portfolio Prompts: ${jobDescription || 'Ideas'}`,
                        data: { prompts: data.prompts || [] },
                        metadata: { jobDescription, resumeId: savedResumeId || undefined }
                    }).then(r => r.json());

                    setHistory(prev => {
                        const filtered = prev.filter(h => h.type !== "portfolio" || h.title !== `Portfolio Prompts: ${jobDescription || 'Ideas'}`);
                        return [saved, ...filtered].slice(0, 20);
                    });
                } catch (saveErr) {
                    console.error("Failed to auto-save portfolio", saveErr);
                }
            } else {
                throw new Error("Failed to generate portfolio prompts");
            }
        } catch (error) {
            toast.error(error.message, { id: toastId });
        } finally {
            setIsGeneratingPP(false);
        }
    };

    const handleNew = () => {
        if (editorTab === 'editor' || editorTab === 'both') {
            setFormData(initialFormData);
            setGeneratedResume(null);
            setSavedResumeId(null);
            setIsEditing(true);
            setActiveSection("personal");
            toast.success("Started a new resume draft");
        } else if (editorTab === 'cover-letter') {
            setCoverLetter("");
            setSavedCLId(null);
            toast.success("Started a new cover letter");
        } else if (editorTab === 'application-letter') {
            setApplicationLetter("");
            setSavedALId(null);
            toast.success("Started a new application letter");
        } else if (editorTab === 'portfolio') {
            setPortfolioPrompts([]);
            setSavedPPId(null);
            toast.success("Cleared portfolio ideas");
        }
    };

    const handleGenerateCoverLetter = async (isApplication = false) => {
        setIsGeneratingCL(true);
        const toastId = toast.loading(isApplication ? "Drafting application letter..." : "Drafting cover letter...");
        try {
            const response = await apiClient.post("/api/career/cover-letter/generate", {
                resume: generatedResume || formData,
                role: jobDescription,
                company: coverLetterCompany || undefined,
                type: isApplication ? "application-letter" : "cover-letter"
            });
            if (response.ok) {
                const data = await response.json();
                setCoverLetter(data.content || "");
                setEditorTab("cover-letter");
                toast.success("Cover letter generated!", { id: toastId });
            } else {
                throw new Error("Failed to generate cover letter");
            }
        } catch (error) {
            toast.error(error.message, { id: toastId });
        } finally {
            setIsGeneratingCL(false);
        }
    };

    const handleGenerateApplicationLetter = async () => {
        if (!jobDescription || !coverLetterCompany) {
            toast.error("Role and Company are required for an Application Letter");
            return;
        }
        setIsGeneratingAL(true);
        const toastId = toast.loading("Drafting application letter...");
        try {
            const response = await apiClient.post("/api/career/cover-letter/generate", {
                resume: generatedResume || formData,
                role: jobDescription,
                company: coverLetterCompany,
                type: "application-letter"
            });
            if (response.ok) {
                const data = await response.json();
                setApplicationLetter(data.content || "");
                setEditorTab("application-letter");
                toast.success("Application letter generated!", { id: toastId });
            } else {
                throw new Error("Failed to generate application letter");
            }
        } catch (error) {
            toast.error(error.message, { id: toastId });
        } finally {
            setIsGeneratingAL(false);
        }
    };

    const handleGenerate = async () => {
        if (!jobDescription.trim()) {
            toast.error("Please provide a target job role");
            setError("Job role is required");
            return;
        }
        setIsGenerating(true);
        setError(null);
        const toastId = toast.loading("Generating your professional resume...");
        try {
            const response = await apiClient.post("/api/career/resume/generate", {
                role: jobDescription
            });
            if (response.ok) {
                const data = await response.json();
                if (data.personalInfo && data.personalInfo.name && !data.personalInfo.fullName) {
                    data.personalInfo.fullName = data.personalInfo.name;
                }
                setGeneratedResume(data);
                setFormData(prev => ({ ...prev, ...data }));
                fetchHistory();
                toast.success("Resume generated successfully!", { id: toastId });
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to generate resume");
            }
        } catch (error) {
            console.error("Resume generation error:", error);
            setError(error.message);
            toast.error(error.message, { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateProjectAI = async (index) => {
        const project = portfolioPrompts[index];
        const toastId = toast.loading(`Generating full details for ${project.title}...`);
        try {
            const response = await apiClient.post("/api/career/portfolio/refine", {
                projectTitle: project.title,
                description: project.description,
                role: jobDescription
            });
            if (response.ok) {
                const data = await response.json();
                setPortfolioPrompts(prev => prev.map((p, i) => i === index ? { ...p, description: data.content, refined: true } : p));
                toast.success("Project refined with AI!", { id: toastId });
            }
        } catch (error) {
            toast.error("Failed to refine project", { id: toastId });
        }
    };

    const addToResume = (project) => {
        const newProject = {
            name: project.title,
            description: project.description,
            technologies: Array.isArray(project.technologies) ? project.technologies.join(", ") : (project.technologies || "")
        };
        setFormData(prev => ({
            ...prev,
            projects: [...(prev.projects || []), newProject]
        }));
        setGeneratedResume(prev => prev ? {
            ...prev,
            projects: [...(prev.projects || []), newProject]
        } : prev);
        setEditorTab("editor");
        setActiveSection("projects");
        toast.success("Added to resume projects!");
    };

    const handleJobMatch = async () => {
        if (!jobMatchDescription.trim()) {
            toast.error("Please paste a job description first");
            return;
        }
        setIsMatchingJob(true);
        const toastId = toast.loading("Analyzing ATS match...");
        try {
            const response = await apiClient.post("/api/career/resume/match", {
                resume: generatedResume || formData,
                jobDescription: jobMatchDescription
            });
            if (response.ok) {
                const data = await response.json();
                setJobMatchResult(data);
                toast.success("Analysis complete!", { id: toastId });
            } else {
                throw new Error("Failed to analyze");
            }
        } catch (error) {
            toast.error(error.message, { id: toastId });
        } finally {
            setIsMatchingJob(false);
        }
    };

    const [isRefining, setIsRefining] = useState(false);
    const handleRefineResume = async () => {
        if (!jobMatchResult) return;
        setIsRefining(true);
        const toastId = toast.loading("Refining your resume based on match results...");
        try {
            const response = await apiClient.post("/api/career/resume/refine", {
                resume: generatedResume || formData,
                jobDescription: jobMatchDescription,
                matchResult: jobMatchResult
            });
            if (response.ok) {
                const data = await response.json();
                setGeneratedResume(data);
                setFormData(prev => ({ ...prev, ...data }));
                setEditorTab("editor");
                toast.success("Resume refined successfully!", { id: toastId });
            } else {
                throw new Error("Failed to refine resume");
            }
        } catch (error) {
            toast.error(error.message, { id: toastId });
        } finally {
            setIsRefining(false);
        }
    };

    const handleGenerateFromLibrary = async (courseName, courseObj) => {
        const toastId = toast.loading(`Generating resume from "${courseName}" course...`);
        try {
            const response = await apiClient.post("/api/career/resume/from-library", {
                courseName,
                category: courseObj?.category,
                difficulty: courseObj?.difficulty,
                description: courseObj?.description,
            });
            if (response.ok) {
                const data = await response.json();
                if (data.personalInfo && data.personalInfo.name && !data.personalInfo.fullName) {
                    data.personalInfo.fullName = data.personalInfo.name;
                }
                setGeneratedResume(data);
                setFormData(prev => ({ ...prev, ...data }));
                setEditorTab('editor');
                toast.success(`Resume crafted from your ${courseName} course!`, { id: toastId });
            } else {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.error || "Failed to generate from library");
            }
        } catch (error) {
            toast.error(error.message || "Could not find relevant course data", { id: toastId });
        }
    };
    const exportToPDF = async () => {
        const element = document.getElementById('resume-preview');
        if (!element) {
            toast.error("Resume preview not found");
            return;
        }

        const toastId = toast.loading("Preparing your PDF...");
        try {
            // Set exporting attribute to trigger RGB/Hex CSS overrides in globals.css
            element.setAttribute('data-exporting', 'true');

            // Wait a tiny bit for styles to apply if needed, though mostly synchronous
            await new Promise(resolve => setTimeout(resolve, 100));

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff"
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            const name = (generatedResume?.personalInfo?.fullName || "Resume").replace(/\s+/g, '_');
            pdf.save(`${name}.pdf`);

            // Cleanup attribute
            element.removeAttribute('data-exporting');

            toast.success("Downloaded!", { id: toastId });
        } catch (error) {
            console.error("PDF export error:", error);
            // Ensure cleanup on error
            element.removeAttribute('data-exporting');
            toast.error("Failed to export PDF", { id: toastId });
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-10 min-h-screen bg-slate-50 dark:bg-slate-950">
            <motion.header initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
                <h1 className="text-4xl font-black text-slate-900 dark:text-white">Resume Builder</h1>
                <p className="text-slate-500 mt-2">Create, edit, and optimize your professional documents</p>
            </motion.header>

            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-center gap-3">
                    <AlertCircle size={20} />
                    <p>{error}</p>
                </div>
            )}

            <div className="flex flex-col items-center gap-6">
                <nav className="flex bg-white dark:bg-slate-900 p-1 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                    {[
                        { id: 'editor', label: 'Resume', icon: Edit2 },
                        { id: 'cover-letter', label: 'Cover Letter', icon: FileText },
                        { id: 'application-letter', label: 'Application Letter', icon: Target },
                        { id: 'portfolio', label: 'Portfolio Ideas', icon: FolderOpen }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setEditorTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${editorTab === tab.id ? "bg-slate-100 dark:bg-slate-800 text-violet-600" : "text-slate-500 hover:text-slate-900"}`}>
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </nav>

                <div className="w-full max-w-4xl flex flex-col gap-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" onClick={handleNew} className="h-10 px-4 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 transition-all font-bold text-xs">
                            <Plus size={14} className="mr-1.5" /> {
                                editorTab === 'cover-letter' ? 'New Cover Letter' :
                                    editorTab === 'application-letter' ? 'New Application' :
                                        editorTab === 'portfolio' ? 'New Ideas' : 'New Resume'
                            }
                        </Button>
                        <Button onClick={saveToDatabase} className="h-10 px-5 rounded-xl bg-slate-900 hover:bg-black text-white shadow-lg shadow-slate-200 transition-all font-bold text-xs">
                            <Save size={14} className="mr-1.5" /> Save
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setEditorTab('insights')}
                            className="bg-white text-emerald-600 border-emerald-200 hover:bg-emerald-50 font-bold"
                        >
                            <TrendingUp size={16} className="mr-2" /> Match to Job
                        </Button>
                        <Button variant="outline" onClick={exportToPDF} className="bg-white">
                            <Download size={16} className="mr-2" /> Export PDF
                        </Button>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden min-h-[800px]">
                        {editorTab === 'editor' && (
                            <div className="h-full">
                                {!(generatedResume || formData.personalInfo.fullName || formData.personalInfo.jobTitle) ? (
                                    <div className="flex flex-col items-center justify-center min-h-[600px] p-12 text-center">
                                        <div className="w-20 h-20 rounded-3xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center mb-6">
                                            <FileText className="w-10 h-10 text-violet-500" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Your resume preview</h3>
                                        <p className="text-slate-500 max-w-sm mb-8">Start filling in your information and watch your professional resume come to life in real time.</p>
                                        <div className="w-full max-w-md space-y-4">
                                            <InputField
                                                label="Target Job Role"
                                                value={jobDescription}
                                                onChange={e => setJobDescription(e.target.value)}
                                                placeholder="e.g. Senior Fullstack Developer"
                                                icon={Target}
                                            />
                                            <div className="flex gap-3">
                                                <Button onClick={handleGenerate} disabled={isGenerating || !jobDescription} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-6 rounded-2xl">
                                                    {isGenerating ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
                                                    Generate with AI
                                                </Button>
                                                <div className="flex-1 relative">
                                                    <Button variant="outline" onClick={() => {
                                                        const willOpen = !showLibraryPicker;
                                                        setShowLibraryPicker(willOpen);
                                                        if (willOpen) {
                                                            setLibraryCourses([]); setLibrarySearch(''); setLibraryLoading(true);
                                                            apiClient.get('/api/library?type=course&limit=50').then(r => r.json()).then(d => {
                                                                setLibraryCourses(d.items || []);
                                                            }).catch(() => { }).finally(() => setLibraryLoading(false));
                                                        }
                                                    }} className="w-full border-slate-200 py-6 rounded-2xl hover:bg-slate-50">
                                                        <FolderOpen className="mr-2 text-violet-500" /> From Library
                                                    </Button>
                                                    {showLibraryPicker && (
                                                        <div className="absolute top-full left-0 w-80 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[100] flex flex-col overflow-hidden">
                                                            <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                                                                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                                                    <GraduationCap size={14} className="text-slate-400 shrink-0" />
                                                                    <input
                                                                        autoFocus
                                                                        value={librarySearch}
                                                                        onChange={e => {
                                                                            setLibrarySearch(e.target.value);
                                                                            setLibraryLoading(true);
                                                                            clearTimeout(window._libSearchTimer);
                                                                            window._libSearchTimer = setTimeout(() => {
                                                                                apiClient.get(`/api/library?type=course&limit=30&search=${encodeURIComponent(e.target.value)}`).then(r => r.json()).then(d => setLibraryCourses(d.items || [])).catch(() => { }).finally(() => setLibraryLoading(false));
                                                                            }, 350);
                                                                        }}
                                                                        placeholder="Search your courses..."
                                                                        className="flex-1 bg-transparent text-sm outline-none text-slate-700 dark:text-slate-300 placeholder:text-slate-400"
                                                                    />
                                                                    {libraryLoading && <Loader2 size={13} className="animate-spin text-slate-400 shrink-0" />}
                                                                </div>
                                                            </div>
                                                            <div className="overflow-y-auto max-h-60 p-2 space-y-1">
                                                                {libraryLoading && libraryCourses.length === 0 ? (
                                                                    <p className="text-xs text-slate-400 text-center py-6">Loading courses...</p>
                                                                ) : libraryCourses.length === 0 ? (
                                                                    <p className="text-xs text-slate-400 text-center py-6 italic">No courses found</p>
                                                                ) : libraryCourses.map(course => (
                                                                    <button key={course.id}
                                                                        onClick={() => {
                                                                            setShowLibraryPicker(false);
                                                                            handleGenerateFromLibrary(course.title, course);
                                                                        }}
                                                                        className="w-full text-left px-3 py-2.5 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-xl transition-colors group">
                                                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-violet-700 truncate">{course.title}</p>
                                                                        <div className="flex items-center gap-2 mt-0.5">
                                                                            <span className="text-[10px] text-slate-400 capitalize">{course.category}</span>
                                                                            <span className="text-slate-200 dark:text-slate-700">·</span>
                                                                            <span className="text-[10px] text-slate-400 capitalize">{course.difficulty}</span>
                                                                        </div>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                            <div className="p-2 border-t border-slate-100 dark:border-slate-800">
                                                                <button onClick={() => setShowLibraryPicker(false)} className="w-full text-xs text-slate-400 hover:text-slate-600 py-1.5 text-center">Cancel</button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <FormResumePreview
                                        data={generatedResume || formData}
                                        onUpdate={(section, indexOrField, fieldOrValue, value) => {
                                            if (section === 'personalInfo') {
                                                updatePersonalInfo(indexOrField, fieldOrValue);
                                                setGeneratedResume(prev => prev ? { ...prev, personalInfo: { ...prev.personalInfo, [indexOrField]: fieldOrValue } } : prev);
                                            } else if (indexOrField === 'remove') {
                                                // Remove entire section: onUpdate(section, 'remove')
                                                updateItem(section, null, 'remove');
                                                if (generatedResume) {
                                                    setGeneratedResume(prev => ({ ...prev, [section]: [] }));
                                                }
                                            } else if (fieldOrValue === 'remove') {
                                                // Remove specific item: onUpdate(section, index, 'remove')
                                                updateItem(section, indexOrField, 'remove');
                                                if (generatedResume) {
                                                    setGeneratedResume(prev => ({
                                                        ...prev,
                                                        [section]: prev[section]?.filter((_, i) => i !== indexOrField)
                                                    }));
                                                }
                                            } else if (indexOrField === 'add') {
                                                // Add item: onUpdate(section, 'add', template)
                                                addItem(section, fieldOrValue);
                                                if (generatedResume) {
                                                    setGeneratedResume(prev => ({
                                                        ...prev,
                                                        [section]: [...(prev[section] || []), fieldOrValue]
                                                    }));
                                                }
                                            } else if (typeof indexOrField === 'number') {
                                                // Update specific item field: onUpdate(section, index, field, value)
                                                updateItem(section, indexOrField, fieldOrValue, value);
                                                if (generatedResume) {
                                                    setGeneratedResume(prev => ({
                                                        ...prev,
                                                        [section]: prev[section]?.map((item, i) => i === indexOrField ? { ...item, [fieldOrValue]: value } : item)
                                                    }));
                                                }
                                            } else if (section === 'skills') {
                                                // Update skill at index: onUpdate('skills', index, newValue)
                                                setFormData(prev => ({
                                                    ...prev,
                                                    skills: prev.skills.map((s, i) => i === indexOrField ? fieldOrValue : s)
                                                }));
                                                if (generatedResume) {
                                                    setGeneratedResume(prev => ({
                                                        ...prev,
                                                        skills: prev.skills?.map((s, i) => i === indexOrField ? fieldOrValue : s)
                                                    }));
                                                }
                                            }
                                        }}
                                    />
                                )}
                            </div>
                        )}
                        {editorTab === 'cover-letter' && (
                            <div className="flex flex-col w-full min-h-[800px]">
                                {coverLetter ? (
                                    <textarea
                                        value={coverLetter}
                                        onChange={e => setCoverLetter(e.target.value)}
                                        className="w-full min-h-[900px] p-10 md:p-14 bg-white dark:bg-slate-900 border-none resize-none font-serif text-lg leading-relaxed outline-none"
                                    />
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                                        <div className="max-w-md w-full p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-none">
                                            <div className="w-16 h-16 rounded-2xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center mb-6 mx-auto">
                                                <FileText className="w-8 h-8 text-violet-500" />
                                            </div>
                                            <h3 className="text-xl font-bold mb-2">Cover Letter Designer</h3>
                                            <p className="text-sm text-slate-500 mb-8">Craft a compelling narrative for your next role.</p>
                                            <div className="space-y-4 text-left">
                                                <InputField label="Target Role" value={jobDescription} onChange={e => setJobDescription(e.target.value)} placeholder="e.g. Frontend Engineer" />
                                                <InputField label="Company Name (Optional)" value={coverLetterCompany} onChange={e => setCoverLetterCompany(e.target.value)} placeholder="e.g. Google" />
                                            </div>
                                            <div className="flex flex-col gap-3 mt-8">
                                                <Button onClick={() => handleGenerateCoverLetter(false)} disabled={isGeneratingCL || !jobDescription} className="w-full bg-violet-600 hover:bg-violet-700 text-white py-6 rounded-2xl font-bold">
                                                    {isGeneratingCL ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
                                                    Draft using AI
                                                </Button>
                                                <Button variant="outline" onClick={() => handleGenerateCoverLetter(false)} disabled={isGeneratingCL} className="w-full border-2 border-violet-100 text-violet-600 py-6 rounded-2xl font-bold bg-violet-50/50">
                                                    Generate from Resume
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {editorTab === 'application-letter' && (
                            <div className="flex flex-col w-full min-h-[800px]">
                                {applicationLetter ? (
                                    <textarea
                                        value={applicationLetter}
                                        onChange={e => setApplicationLetter(e.target.value)}
                                        className="w-full min-h-[900px] p-10 md:p-14 bg-white dark:bg-slate-900 border-none resize-none font-serif text-lg leading-relaxed outline-none"
                                    />
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                                        <div className="max-w-md w-full p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-none">
                                            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-6 mx-auto">
                                                <Target className="w-8 h-8 text-indigo-500" />
                                            </div>
                                            <h3 className="text-xl font-bold mb-2">Application Letter Designer</h3>
                                            <p className="text-sm text-slate-500 mb-8">Formalize your intent with a professional application letter.</p>
                                            <div className="space-y-4 text-left">
                                                <InputField label="Target Role" value={jobDescription} onChange={e => setJobDescription(e.target.value)} placeholder="e.g. Frontend Engineer" />
                                                <InputField label="Company Name" value={coverLetterCompany} onChange={e => setCoverLetterCompany(e.target.value)} placeholder="e.g. Google" />
                                            </div>
                                            <div className="flex flex-col gap-3 mt-8">
                                                <Button onClick={handleGenerateApplicationLetter} disabled={isGeneratingAL || !jobDescription || !coverLetterCompany} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6 rounded-2xl font-bold">
                                                    {isGeneratingAL ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
                                                    Draft using AI
                                                </Button>
                                                <Button variant="outline" onClick={handleGenerateApplicationLetter} disabled={isGeneratingAL} className="w-full border-2 border-indigo-100 text-indigo-600 py-6 rounded-2xl font-bold bg-indigo-50/50">
                                                    Generate from Resume
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {editorTab === 'portfolio' && (
                            <div className="p-12 min-h-[600px]">
                                <div className="max-w-4xl mx-auto">
                                    <div className="flex flex-col items-center text-center mb-12">
                                        <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-4">
                                            <FolderOpen className="w-8 h-8 text-emerald-500" />
                                        </div>
                                        <h2 className="text-2xl font-bold mb-2">Portfolio Ideas</h2>
                                        <p className="text-slate-500 max-w-md">Get market-ready project suggestions tailored to your career goals.</p>
                                    </div>

                                    {!portfolioPrompts.length ? (
                                        <div className="max-w-md mx-auto p-8 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700">
                                            <InputField
                                                label="What role are you targeting?"
                                                value={jobDescription}
                                                onChange={e => setJobDescription(e.target.value)}
                                                placeholder="e.g. Backend Engineer"
                                            />
                                            <Button
                                                onClick={handleGeneratePortfolio}
                                                disabled={isGeneratingPP || !jobDescription}
                                                className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 text-white py-6 rounded-2xl"
                                            >
                                                {isGeneratingPP ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
                                                Generate Project Ideas
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {portfolioPrompts.map((prompt, i) => (
                                                <div key={i} className="p-6 rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:shadow-xl transition-all group overflow-hidden relative">
                                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                        <BrainCircuit size={40} className="text-emerald-500" />
                                                    </div>
                                                    <h4 className="text-lg font-bold mb-2 flex items-center gap-2 text-slate-800 dark:text-white relative z-20">
                                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                                        {prompt.title}
                                                    </h4>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-3 relative z-20">{prompt.description}</p>
                                                    <div className="flex flex-wrap gap-2 mb-6">
                                                        {prompt.technologies?.map((tech, j) => (
                                                            <span key={j} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg uppercase tracking-wider">{tech}</span>
                                                        ))}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => prompt.refined ? copyToClipboard(prompt.description) : handleGenerateProjectAI(i)}
                                                            className={`flex-1 text-xs py-5 rounded-xl border-emerald-100 hover:bg-emerald-50 text-emerald-600 ${prompt.refined ? 'bg-emerald-50 border-emerald-500' : ''}`}
                                                        >
                                                            {prompt.refined ? <Copy size={14} className="mr-1" /> : <Sparkles size={12} className="mr-1" />}
                                                            {prompt.refined ? 'Copy Prompt' : 'Gen with AI'}
                                                        </Button>
                                                        <Button
                                                            onClick={() => addToResume(prompt)}
                                                            className="flex-1 text-xs py-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
                                                        >
                                                            <Plus size={14} className="mr-1" /> Add to Resume
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {editorTab === 'insights' && (
                            <div className="p-8 min-h-[600px]">
                                {!jobMatchResult ? (
                                    <div className="flex flex-col items-center justify-center h-full min-h-[500px] text-center">
                                        <div className="w-20 h-20 rounded-3xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mb-6">
                                            <TrendingUp className="w-10 h-10 text-emerald-500" />
                                        </div>
                                        <h2 className="text-2xl font-bold mb-2">Job Match Analysis</h2>
                                        <p className="text-slate-500 max-w-md mb-8">Paste a job description below to see how well your resume matches and what keywords you're missing.</p>
                                        <div className="w-full max-w-lg space-y-4">
                                            <textarea
                                                value={jobMatchDescription}
                                                onChange={e => setJobMatchDescription(e.target.value)}
                                                placeholder="Paste the job description here..."
                                                rows={6}
                                                className="w-full p-4 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 focus:border-emerald-400 focus:bg-white outline-none transition-all text-sm resize-none"
                                            />
                                            <Button onClick={handleJobMatch} disabled={isMatchingJob || !jobMatchDescription.trim()} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 rounded-2xl font-bold">
                                                {isMatchingJob ? <><Loader2 className="animate-spin mr-2" /> Analyzing...</> : <><TrendingUp className="mr-2" /> Analyze Match Score</>}
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6 max-w-3xl mx-auto">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h2 className="text-2xl font-bold">ATS Match Report</h2>
                                                <p className="text-slate-500 text-sm mt-1">{jobMatchResult.summary}</p>
                                            </div>
                                            <button onClick={() => setJobMatchResult(null)} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500">
                                                <X size={16} />
                                            </button>
                                        </div>
                                        {/* Score */}
                                        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-3xl p-8 text-white text-center">
                                            <div className="text-7xl font-black mb-2">{jobMatchResult.matchScore}%</div>
                                            <div className="text-emerald-100 font-medium">ATS Match Score</div>
                                            <div className="mt-4 h-3 bg-white/20 rounded-full overflow-hidden">
                                                <div className="h-full bg-white rounded-full transition-all" style={{ width: `${Math.min(jobMatchResult.matchScore, 100)}%` }} />
                                            </div>
                                        </div>
                                        {/* Keywords */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                                                <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-300 mb-3 flex items-center gap-2"><CheckCircle size={16} /> Keywords Found</h4>
                                                <div className="flex flex-wrap gap-2">{(jobMatchResult.keywordsFound || []).map((kw, i) => <span key={i} className="px-3 py-1 bg-emerald-100 dark:bg-emerald-800/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-lg">{kw}</span>)}</div>
                                            </div>
                                            <div className="p-6 bg-rose-50 dark:bg-rose-900/20 rounded-2xl border border-rose-100 dark:border-rose-800">
                                                <h4 className="text-sm font-bold text-rose-700 dark:text-rose-300 mb-3 flex items-center gap-2"><AlertCircle size={16} /> Keywords Missing</h4>
                                                <div className="flex flex-wrap gap-2">{(jobMatchResult.keywordsMissing || []).map((kw, i) => <span key={i} className="px-3 py-1 bg-rose-100 dark:bg-rose-800/50 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-lg">{kw}</span>)}</div>
                                            </div>
                                        </div>
                                        {/* Strengths & Gaps */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                <h4 className="text-sm font-bold mb-3 text-slate-700 dark:text-slate-300">Strengths</h4>
                                                <ul className="space-y-2">{(jobMatchResult.strengths || []).map((s, i) => <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2"><span className="text-emerald-500 mt-0.5">•</span>{s}</li>)}</ul>
                                            </div>
                                            <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                <h4 className="text-sm font-bold mb-3 text-slate-700 dark:text-slate-300">Recommendations</h4>
                                                <ul className="space-y-2">{(jobMatchResult.recommendations || []).map((r, i) => <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2"><span className="text-violet-500 mt-0.5">•</span>{r}</li>)}</ul>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <Button onClick={handleRefineResume} disabled={isRefining} className="w-full bg-violet-600 hover:bg-violet-700 text-white py-6 rounded-2xl font-bold">
                                                {isRefining ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
                                                Refine Resume with AI
                                            </Button>
                                            <Button onClick={() => setJobMatchResult(null)} variant="outline" className="w-full rounded-2xl py-5 border-slate-200">
                                                Run Another Analysis
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {history.length > 0 && (
                    <div className="w-full mt-16 max-w-6xl">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                                <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
                                    <Clock size={20} className="text-violet-600 dark:text-violet-400" />
                                </div>
                                Recent Work
                            </h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {history.map(item => (
                                <div key={item._id} onClick={() => loadHistoryItem(item)}
                                    className="bg-white dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-700 rounded-3xl p-6 cursor-pointer hover:border-violet-400 dark:hover:border-violet-600 hover:shadow-2xl transition-all group relative overflow-hidden flex flex-col min-h-[220px]">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-violet-500/10 transition-colors" />
                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${item.type === 'cover-letter' ? 'bg-indigo-50 dark:bg-indigo-900/20' :
                                                item.type === 'portfolio' ? 'bg-emerald-50 dark:bg-emerald-900/20' :
                                                    'bg-violet-50 dark:bg-violet-900/20'
                                                }`}>
                                                {item.type === 'cover-letter' ? <FileText size={18} className="text-indigo-600 dark:text-indigo-400" /> :
                                                    item.type === 'portfolio' ? <FolderOpen size={18} className="text-emerald-600 dark:text-emerald-400" /> :
                                                        <Target size={18} className="text-violet-600 dark:text-violet-400" />}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-slate-400 capitalize">{item.type || "Document"}</span>
                                                <span className="text-xs font-bold text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                        <button onClick={e => deleteHistoryItem(e, item._id)} className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors opacity-100">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-3 line-clamp-1 border-b border-slate-50 dark:border-slate-800 pb-3 relative z-10">
                                        {item.title || "Untitled Document"}
                                    </h4>
                                    <div className="flex-1 relative z-10">
                                        <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 italic">
                                            {item.type === 'cover-letter' ? `Cover letter for ${item.data?.company || 'Company'}` :
                                                item.type === 'portfolio' ? `${item.data?.prompts?.length || 0} Project Ideas` :
                                                    item.metadata?.jobDescription || item.data?.personalInfo?.jobTitle || "Resume draft..."}
                                        </p>
                                    </div>
                                    <div className="mt-4 pt-4 flex justify-between items-center relative z-10 text-[10px] font-black">
                                        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-500">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            Saved
                                        </div>
                                        <span className="text-violet-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                            Open document <ArrowRight size={12} />
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ResumeBuilder;
