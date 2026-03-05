import React, { useState, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    FileText, Sparkles, CheckCircle, AlertCircle, TrendingUp,
    BrainCircuit, ChevronRight, Loader2, ArrowRight, Target,
    Clock, Trash2, X, Download, Copy, Check, Edit2, AlignLeft,
    GraduationCap, Star, UserCircle, Briefcase,
    // New reference design icons
    User, Mail, Phone, MapPin, Globe, Linkedin, Github,
    Award, FolderOpen, Languages, Heart, Users, Wrench,
    Plus, ChevronDown, ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/csrfClient";

// ─── Initial Form Data ──────────────────────────────────────────
const initialFormData = {
    personalInfo: { fullName: "", jobTitle: "", email: "", phone: "", location: "", website: "", linkedin: "", github: "", summary: "" },
    experience: [], education: [], skills: [], projects: [],
    certifications: [], languages: [], volunteer: [], references: [],
};

function getCompletionScore(data) {
    let score = 0, total = 0;
    ["fullName", "jobTitle", "email", "phone", "location", "summary"].forEach(f => { total += 1; if (data.personalInfo[f]?.trim()) score += 1; });
    total += 4;
    if (data.experience.length > 0) score += 1;
    if (data.education.length > 0) score += 1;
    if (data.skills.length >= 3) score += 1;
    if (data.projects.length > 0 || data.certifications.length > 0) score += 1;
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

function CompletionBar({ score }) {
    const color = score >= 80 ? "bg-emerald-500" : score >= 50 ? "bg-amber-500" : "bg-red-500";
    const label = score >= 80 ? "Looking great!" : score >= 50 ? "Getting there" : "Just getting started";
    return (
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center gap-3">
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{label}</span>
                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{score}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ease-out ${color}`} style={{ width: `${score}%` }} />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Live Resume Preview ────────────────────────────────────────
function FormResumePreview({ data }) {
    const { personalInfo, experience, education, skills, projects, certifications, languages, volunteer, references } = data;
    const hasContent = personalInfo.fullName || personalInfo.summary || experience.length > 0 || education.length > 0 || skills.length > 0;

    if (!hasContent) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-5 text-center p-12 min-h-[600px]">
                <div className="w-20 h-20 rounded-2xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
                    <FileText className="w-10 h-10 text-violet-400" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-2">Your resume preview</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed mx-auto">Start filling in your information and watch your professional resume come to life in real time.</p>
                </div>
            </div>
        );
    }

    const contactItems = [
        { icon: Mail, value: personalInfo.email }, { icon: Phone, value: personalInfo.phone },
        { icon: MapPin, value: personalInfo.location }, { icon: Globe, value: personalInfo.website },
        { icon: Linkedin, value: personalInfo.linkedin }, { icon: Github, value: personalInfo.github },
    ].filter(c => c.value);

    const SectionTitle = ({ children }) => (
        <h2 className="text-[11px] font-bold mb-3 pb-1" style={{ color: "#3a5ba0", borderBottom: "1.5px solid #e0e4eb", letterSpacing: "0.05em" }}>{children}</h2>
    );

    return (
        <div className="p-8 md:p-10 font-sans" style={{ color: "#1a1a2e" }}>
            <header className="mb-6 pb-4" style={{ borderBottom: "2px solid #1a1a2e" }}>
                {personalInfo.fullName && <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#1a1a2e" }}>{personalInfo.fullName}</h1>}
                {personalInfo.jobTitle && <p className="text-xs font-bold mt-1" style={{ color: "#3a5ba0", letterSpacing: "0.05em" }}>{personalInfo.jobTitle}</p>}
                {contactItems.length > 0 && (
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2.5">
                        {contactItems.map((item, i) => (
                            <span key={i} className="flex items-center gap-1.5 text-xs" style={{ color: "#555" }}>
                                <item.icon className="w-3 h-3" style={{ color: "#3a5ba0" }} />{item.value}
                            </span>
                        ))}
                    </div>
                )}
            </header>

            {personalInfo.summary && (
                <section className="mb-5">
                    <SectionTitle>Professional Summary</SectionTitle>
                    <p className="text-[12px] leading-relaxed" style={{ color: "#444" }}>{personalInfo.summary}</p>
                </section>
            )}

            {experience.length > 0 && (
                <section className="mb-5">
                    <SectionTitle>Professional Experience</SectionTitle>
                    <div className="flex flex-col gap-4">
                        {experience.map((exp, i) => (
                            <div key={i}>
                                <div className="flex flex-wrap items-baseline justify-between gap-2">
                                    <h3 className="text-sm font-bold" style={{ color: "#1a1a2e" }}>{exp.title || "Position"}</h3>
                                    {(exp.startDate || exp.endDate) && <span className="text-xs font-medium" style={{ color: "#888" }}>{exp.startDate}{exp.startDate && exp.endDate ? " — " : ""}{exp.endDate}</span>}
                                </div>
                                {exp.company && <p className="text-xs font-semibold mt-0.5" style={{ color: "#3a5ba0" }}>{exp.company}{exp.location ? ` · ${exp.location}` : ""}</p>}
                                {exp.description && (
                                    <ul className="mt-1.5 flex flex-col gap-0.5">
                                        {exp.description.split("\n").filter(Boolean).map((line, j) => (
                                            <li key={j} className="text-[12px] leading-relaxed flex gap-2" style={{ color: "#444" }}>
                                                <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ background: "#3a5ba0" }} />
                                                <span>{line.replace(new RegExp("^[-•]\\s*"), "")}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {projects.length > 0 && (
                <section className="mb-5">
                    <SectionTitle>Projects</SectionTitle>
                    <div className="flex flex-col gap-3">
                        {projects.map((proj, i) => (
                            <div key={i}>
                                <div className="flex flex-wrap items-baseline justify-between gap-2">
                                    <h3 className="text-sm font-bold" style={{ color: "#1a1a2e" }}>{proj.name || "Project"}</h3>
                                    {proj.url && <span className="text-xs" style={{ color: "#3a5ba0" }}>{proj.url}</span>}
                                </div>
                                {proj.technologies && <p className="text-xs mt-0.5 font-medium" style={{ color: "#888" }}>{proj.technologies}</p>}
                                {proj.description && <p className="text-[12px] leading-relaxed mt-1" style={{ color: "#444" }}>{proj.description}</p>}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {education.length > 0 && (
                <section className="mb-5">
                    <SectionTitle>Education</SectionTitle>
                    <div className="flex flex-col gap-3">
                        {education.map((edu, i) => (
                            <div key={i}>
                                <div className="flex flex-wrap items-baseline justify-between gap-2">
                                    <h3 className="text-sm font-bold" style={{ color: "#1a1a2e" }}>{edu.degree || "Degree"}</h3>
                                    {(edu.startDate || edu.endDate) && <span className="text-xs font-medium" style={{ color: "#888" }}>{edu.startDate}{edu.startDate && edu.endDate ? " — " : ""}{edu.endDate}</span>}
                                </div>
                                {edu.school && <p className="text-xs font-semibold mt-0.5" style={{ color: "#3a5ba0" }}>{edu.school}{edu.location ? ` · ${edu.location}` : ""}</p>}
                                {edu.gpa && <p className="text-xs mt-0.5" style={{ color: "#666" }}>GPA: {edu.gpa}</p>}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {skills.length > 0 && (
                <section className="mb-5">
                    <SectionTitle>Technical Skills</SectionTitle>
                    <div className="flex flex-wrap gap-1.5">
                        {skills.map((skill, i) => (
                            <span key={i} className="px-2.5 py-0.5 text-[11px] font-semibold rounded" style={{ background: "#eef1f8", color: "#3a5ba0", border: "1px solid #d5dbe8" }}>{skill}</span>
                        ))}
                    </div>
                </section>
            )}

            {certifications.length > 0 && (
                <section className="mb-5">
                    <SectionTitle>Certifications</SectionTitle>
                    <div className="flex flex-col gap-2">
                        {certifications.map((cert, i) => (
                            <div key={i} className="flex items-start gap-2">
                                <Award className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "#3a5ba0" }} />
                                <div>
                                    <p className="text-sm font-semibold" style={{ color: "#1a1a2e" }}>{cert.name}</p>
                                    {(cert.issuer || cert.date) && <p className="text-xs" style={{ color: "#888" }}>{cert.issuer}{cert.issuer && cert.date ? " · " : ""}{cert.date}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {languages.length > 0 && (
                <section className="mb-5">
                    <SectionTitle>Languages</SectionTitle>
                    <div className="flex flex-wrap gap-x-5 gap-y-1">
                        {languages.map((lang, i) => (
                            <span key={i} className="text-[12px]" style={{ color: "#444" }}>
                                <span className="font-semibold" style={{ color: "#1a1a2e" }}>{lang.name}</span>
                                {lang.proficiency && <span> — {lang.proficiency}</span>}
                            </span>
                        ))}
                    </div>
                </section>
            )}

            {volunteer.length > 0 && (
                <section className="mb-5">
                    <SectionTitle>Volunteer & Activities</SectionTitle>
                    <div className="flex flex-col gap-2.5">
                        {volunteer.map((vol, i) => (
                            <div key={i}>
                                <div className="flex flex-wrap items-baseline justify-between gap-2">
                                    <h3 className="text-sm font-bold" style={{ color: "#1a1a2e" }}>{vol.role || "Role"}</h3>
                                    {vol.date && <span className="text-xs" style={{ color: "#888" }}>{vol.date}</span>}
                                </div>
                                {vol.organization && <p className="text-xs font-semibold mt-0.5" style={{ color: "#3a5ba0" }}>{vol.organization}</p>}
                                {vol.description && <p className="text-[12px] leading-relaxed mt-1" style={{ color: "#444" }}>{vol.description}</p>}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {references.length > 0 && (
                <section>
                    <SectionTitle>References</SectionTitle>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {references.map((ref, i) => (
                            <div key={i} className="p-3 rounded-lg" style={{ background: "#f8f9fc", border: "1px solid #e0e4eb" }}>
                                <p className="text-sm font-semibold" style={{ color: "#1a1a2e" }}>{ref.name}</p>
                                {ref.title && <p className="text-xs" style={{ color: "#3a5ba0" }}>{ref.title}</p>}
                                {ref.company && <p className="text-xs" style={{ color: "#888" }}>{ref.company}</p>}
                                {(ref.email || ref.phone) && <p className="text-xs mt-1" style={{ color: "#666" }}>{ref.email}{ref.email && ref.phone ? " · " : ""}{ref.phone}</p>}
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

const ResumeBuilder = () => {
    const searchParams = useSearchParams();
    const mode = searchParams.get("mode") || "both";
    const initialRole = searchParams.get("role") || "";

    const [resumeText, setResumeText] = useState("");
    const [jobDescription, setJobDescription] = useState(initialRole);
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [editorTab, setEditorTab] = React.useState("editor"); // "editor" or "insights"
    const [history, setHistory] = React.useState([]);
    const [activeSection, setActiveSection] = useState("personal");
    const [previewMode, setPreviewMode] = useState("split");
    const [error, setError] = useState(null);
    const [generatedResume, setGeneratedResume] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [coverLetter, setCoverLetter] = useState("");
    const [portfolioPrompts, setPortfolioPrompts] = useState([]);
    const [isGeneratingCL, setIsGeneratingCL] = useState(false);
    const [isGeneratingPP, setIsGeneratingPP] = useState(false);

    // Structured form state (reference design)
    const [formData, setFormData] = useState(initialFormData);
    const [skillInput, setSkillInput] = useState("");
    const completionScore = useMemo(() => getCompletionScore(formData), [formData]);

    const updatePersonalInfo = useCallback((field, value) => {
        setFormData(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, [field]: value } }));
    }, []);
    const addItem = useCallback((section, template) => {
        setFormData(prev => ({ ...prev, [section]: [...prev[section], template] }));
    }, []);
    const updateItem = useCallback((section, index, field, value) => {
        setFormData(prev => ({ ...prev, [section]: prev[section].map((item, i) => i === index ? { ...item, [field]: value } : item) }));
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

    // Fetch history from DB
    React.useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const response = await apiClient.get("/api/career/history?type=resume");
            if (response.ok) {
                const data = await response.json();
                setHistory(data);
            }
        } catch (error) {
            console.error("Failed to fetch history:", error);
        }
    };

    // Auto-generate if requested via URL
    React.useEffect(() => {
        const autoGenerate = searchParams.get("autoGenerate") === "true";
        if (autoGenerate && jobDescription && !isGenerating && !generatedResume) {
            handleGenerate();
        }
    }, [searchParams, jobDescription, isGenerating, generatedResume]);

    const loadHistoryItem = (item) => {
        if (item.type === "resume") {
            setGeneratedResume(item.data);
            setFeedback(null);
            setIsEditing(false);
        } else {
            setResumeText(item.metadata?.resumeText || "");
            setJobDescription(item.metadata?.jobDescription || "");
            setFeedback(item.data);
            setGeneratedResume(null);
        }
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
        if (!resumeText.trim()) {
            toast.error("Please provide your resume text");
            setError("Resume text is required");
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const response = await apiClient.post("/api/career/resume/optimize", {
                resumeText,
                jobDescription: jobDescription || undefined
            });

            if (response.ok) {
                const data = await response.json();
                setFeedback(data);
                // If the optimizer didn't return a structured resume, we'll use the original text
                // in a structured format so the user can still edit and preview it.
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
                fetchHistory(); // Refresh history from DB
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
                toast.success("Portfolio prompts ready!", { id: toastId });
            } else {
                throw new Error("Failed to generate portfolio prompts");
            }
        } catch (error) {
            toast.error(error.message, { id: toastId });
        } finally {
            setIsGeneratingPP(false);
        }
    };

    const handleGenerateCoverLetter = async () => {
        setIsGeneratingCL(true);
        const toastId = toast.loading("Drafting cover letter...");
        try {
            const response = await apiClient.post("/api/career/cover-letter/generate", {
                resume: generatedResume,
                role: jobDescription
            });
            if (response.ok) {
                const data = await response.json();
                setCoverLetter(data.content || "");
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
                setGeneratedResume(data);
                fetchHistory(); // Refresh history from DB
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

    const exportToPDF = () => {
        if (!generatedResume) return;

        const doc = new jsPDF({
            unit: 'mm',
            format: 'a4'
        });

        const { personalInfo, summary, experience, education, skills } = generatedResume;

        // LaTeX style settings
        const margin = 17; // 1.7cm as requested
        const pageWidth = 210;
        let currentY = 16; // 1.6cm top margin

        const addSectionHeader = (title) => {
            currentY += 8;
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12); // large
            doc.text(title, margin, currentY);
            currentY += 2;
            doc.setLineWidth(0.3);
            doc.line(margin, currentY, pageWidth - margin, currentY); // titlerule
            currentY += 5;
        };

        // Header - Centered Name
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        const nameText = personalInfo.name;
        doc.text(nameText, (pageWidth - doc.getTextWidth(nameText)) / 2, currentY);
        currentY += 6;

        // Header - Subtitle / Contact
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const contactLine = `${personalInfo.email} | ${personalInfo.phone || ''} | ${personalInfo.location || ''}`;
        doc.text(contactLine, (pageWidth - doc.getTextWidth(contactLine)) / 2, currentY);
        currentY += 6;

        // Professional Summary
        addSectionHeader("Professional Summary");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
        const splitSummary = doc.splitTextToSize(summary, pageWidth - (2 * margin));
        doc.text(splitSummary, margin, currentY);
        currentY += (splitSummary.length * 5) + 2;

        // Experience
        addSectionHeader("Experience");
        experience.forEach(exp => {
            // Company and Duration
            doc.setFont("helvetica", "bold");
            doc.setFontSize(11);
            doc.text(exp.company, margin, currentY);
            const durationText = exp.duration;
            doc.text(durationText, pageWidth - margin - doc.getTextWidth(durationText), currentY);
            currentY += 5;

            // Position
            doc.setFont("helvetica", "italic");
            doc.text(exp.position, margin, currentY);
            currentY += 5;

            // Highlights (Tight list with bullet)
            doc.setFont("helvetica", "normal");
            exp.highlights.forEach(highlight => {
                doc.text("•", margin + 2, currentY);
                const splitHighlight = doc.splitTextToSize(highlight, pageWidth - (2 * margin) - 6);
                doc.text(splitHighlight, margin + 6, currentY);
                currentY += (splitHighlight.length * 4.5);
            });
            currentY += 2;
        });

        // Education
        addSectionHeader("Education");
        education.forEach(edu => {
            doc.setFont("helvetica", "bold");
            doc.text(edu.school, margin, currentY);
            const eduYearWidth = doc.getTextWidth(edu.year);
            doc.text(edu.year, pageWidth - margin - eduYearWidth, currentY);
            currentY += 5;
            doc.setFont("helvetica", "normal");
            doc.text(edu.degree, margin, currentY);
            currentY += 6;
        });

        // Skills
        addSectionHeader("Skills");
        doc.setFont("helvetica", "normal");
        const skillText = skills.join(", ");
        const splitSkills = doc.splitTextToSize(skillText, pageWidth - (2 * margin));
        doc.text(splitSkills, margin, currentY);

        doc.save(`${personalInfo.name.replace(/\s+/g, '_')}_Resume.pdf`);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    return (
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-10 space-y-6 sm:space-y-8 md:space-y-10 bg-gradient-to-br from-violet-50/50 via-indigo-50/50 to-purple-50/50 dark:from-slate-950 dark:via-indigo-950/50 dark:to-violet-950/50 min-h-screen">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2 sm:space-y-3"
            >
                <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tighter text-slate-900 dark:text-white leading-tight">
                            Resume Optimizer
                        </h1>
                        <p className="text-xs sm:text-sm md:text-base text-slate-500 dark:text-slate-400 mt-0.5 sm:mt-1">
                            AI-powered ATS optimization and professional enhancement
                        </p>
                    </div>
                </div>
            </motion.header>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-start gap-3"
                >
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-red-900 dark:text-red-200">Error</p>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                    </div>
                    <button
                        onClick={() => setError(null)}
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </motion.div>
            )}

            {generatedResume && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col lg:grid lg:grid-cols-12 gap-6 min-h-[85vh]"
                >
                    {/* Left Panel: Modular Editor & AI Insights */}
                    <div className="lg:col-span-4 flex flex-col gap-6">
                        <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl flex flex-col h-full">
                            {/* Editor Header */}
                            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center">
                                        <Edit2 className="w-5 h-5 text-white" />
                                    </div>
                                    <h3 className="font-black text-slate-900 dark:text-white tracking-tight">
                                        {feedback ? "Resume Optimizer" : "Resume Builder"}
                                    </h3>
                                </div>
                                <div className="flex gap-2">
                                    {feedback && (
                                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mr-2">
                                            {[
                                                { id: 'insights', label: 'Insights', icon: Sparkles },
                                                { id: 'editor', label: 'Editor', icon: Edit2 }
                                            ].map(tab => (
                                                <button
                                                    key={tab.id}
                                                    onClick={() => setEditorTab(tab.id)}
                                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${editorTab === tab.id
                                                        ? "bg-white dark:bg-slate-700 text-violet-600 dark:text-white shadow-sm"
                                                        : "text-slate-400 hover:text-slate-600"
                                                        }`}
                                                >
                                                    <tab.icon size={12} />
                                                    {tab.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={exportToPDF}
                                        className="rounded-xl border-slate-200 dark:border-slate-700 font-bold"
                                    >
                                        <Download className="w-4 h-4 mr-2" /> PDF
                                    </Button>
                                </div>
                            </div>

                            {/* Tab Content Wrapper */}
                            <div className="flex-1 overflow-hidden flex flex-col">
                                {editorTab === "editor" ? (
                                    <>
                                        {/* Section Navigation */}
                                        <div className="flex p-2 gap-1 overflow-x-auto no-scrollbar bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                            {[
                                                { id: 'personal', icon: UserCircle, label: 'Profile' },
                                                { id: 'summary', icon: AlignLeft, label: 'Summary' },
                                                { id: 'experience', icon: Briefcase, label: 'Work' },
                                                { id: 'education', icon: GraduationCap, label: 'Edu' },
                                                { id: 'skills', icon: Star, label: 'Skills' }
                                            ].map(section => (
                                                <button
                                                    key={section.id}
                                                    onClick={() => setActiveSection(section.id)}
                                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${activeSection === section.id
                                                        ? "bg-white dark:bg-slate-700 text-violet-600 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-600"
                                                        : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
                                                        }`}
                                                >
                                                    <section.icon size={14} />
                                                    {section.label}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Editor Content Area */}
                                        <div className="flex-1 p-6 overflow-y-auto max-h-[60vh] lg:max-h-[70vh]">
                                            <AnimatePresence mode="wait">
                                                {activeSection === 'personal' && (
                                                    <motion.div
                                                        key="personal"
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: 10 }}
                                                        className="space-y-4"
                                                    >
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-slate-400">Full Name</label>
                                                            <input
                                                                type="text"
                                                                value={generatedResume.personalInfo.name}
                                                                onChange={(e) => setGeneratedResume({ ...generatedResume, personalInfo: { ...generatedResume.personalInfo, name: e.target.value } })}
                                                                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:border-violet-500 transition-all font-bold"
                                                            />
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-black text-slate-400">Email</label>
                                                                <input
                                                                    type="email"
                                                                    value={generatedResume.personalInfo.email}
                                                                    onChange={(e) => setGeneratedResume({ ...generatedResume, personalInfo: { ...generatedResume.personalInfo, email: e.target.value } })}
                                                                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:border-violet-500 transition-all font-medium text-sm"
                                                                />
                                                            </div>
                                                            <div className="space-y-2">
                                                                <label className="text-[10px] font-black text-slate-400">Phone</label>
                                                                <input
                                                                    type="text"
                                                                    value={generatedResume.personalInfo.phone}
                                                                    onChange={(e) => setGeneratedResume({ ...generatedResume, personalInfo: { ...generatedResume.personalInfo, phone: e.target.value } })}
                                                                    className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:border-violet-500 transition-all font-medium text-sm"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-slate-400">Location</label>
                                                            <input
                                                                type="text"
                                                                value={generatedResume.personalInfo.location}
                                                                onChange={(e) => setGeneratedResume({ ...generatedResume, personalInfo: { ...generatedResume.personalInfo, location: e.target.value } })}
                                                                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:border-violet-500 transition-all font-medium text-sm"
                                                            />
                                                        </div>
                                                    </motion.div>
                                                )}

                                                {activeSection === 'summary' && (
                                                    <motion.div
                                                        key="summary"
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        className="space-y-4"
                                                    >
                                                        <label className="text-[10px] font-black text-slate-400">Professional Summary</label>
                                                        <textarea
                                                            value={generatedResume.summary}
                                                            onChange={(e) => setGeneratedResume({ ...generatedResume, summary: e.target.value })}
                                                            className="w-full h-80 p-5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:border-violet-500 transition-all font-medium text-sm leading-relaxed resize-none"
                                                        />
                                                    </motion.div>
                                                )}

                                                {activeSection === 'experience' && (
                                                    <motion.div
                                                        key="experience"
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        className="space-y-6"
                                                    >
                                                        {generatedResume.experience.map((exp, i) => (
                                                            <div key={i} className="p-6 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 rounded-3xl space-y-4 relative group">
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <input
                                                                        type="text"
                                                                        value={exp.company}
                                                                        onChange={(e) => {
                                                                            const newExp = [...generatedResume.experience];
                                                                            newExp[i].company = e.target.value;
                                                                            setGeneratedResume({ ...generatedResume, experience: newExp });
                                                                        }}
                                                                        placeholder="Company"
                                                                        className="p-2 bg-transparent border-b-2 border-slate-200 dark:border-slate-700 outline-none focus:border-violet-500 font-black text-lg"
                                                                    />
                                                                    <input
                                                                        type="text"
                                                                        value={exp.duration}
                                                                        onChange={(e) => {
                                                                            const newExp = [...generatedResume.experience];
                                                                            newExp[i].duration = e.target.value;
                                                                            setGeneratedResume({ ...generatedResume, experience: newExp });
                                                                        }}
                                                                        placeholder="Duration"
                                                                        className="p-2 bg-transparent border-b-2 border-slate-200 dark:border-slate-700 outline-none focus:border-violet-500 text-sm text-slate-500 font-bold"
                                                                    />
                                                                </div>
                                                                <input
                                                                    type="text"
                                                                    value={exp.position}
                                                                    onChange={(e) => {
                                                                        const newExp = [...generatedResume.experience];
                                                                        newExp[i].position = e.target.value;
                                                                        setGeneratedResume({ ...generatedResume, experience: newExp });
                                                                    }}
                                                                    placeholder="Position"
                                                                    className="w-full p-2 bg-transparent border-b-2 border-slate-200 dark:border-slate-700 outline-none focus:border-violet-500 italic text-sm font-semibold"
                                                                />
                                                                <div className="space-y-3">
                                                                    <label className="text-[10px] font-black text-slate-400">Key Highlights</label>
                                                                    {exp.highlights.map((h, hi) => (
                                                                        <div key={hi} className="flex gap-2 group/h">
                                                                            <span className="text-violet-500 mt-3 font-black">•</span>
                                                                            <textarea
                                                                                value={h}
                                                                                onChange={(e) => {
                                                                                    const newExp = [...generatedResume.experience];
                                                                                    newExp[i].highlights[hi] = e.target.value;
                                                                                    setGeneratedResume({ ...generatedResume, experience: newExp });
                                                                                }}
                                                                                className="flex-1 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-violet-500 text-xs font-medium leading-relaxed resize-none h-20"
                                                                            />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </motion.div>
                                                )}

                                                {activeSection === 'education' && (
                                                    <motion.div
                                                        key="education"
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        className="space-y-6"
                                                    >
                                                        {generatedResume.education.map((edu, i) => (
                                                            <div key={i} className="p-6 bg-slate-50 dark:bg-slate-800/50 border-2 border-slate-100 dark:border-slate-700 rounded-3xl space-y-4">
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                    <input
                                                                        type="text"
                                                                        value={edu.school}
                                                                        onChange={(e) => {
                                                                            const newEdu = [...generatedResume.education];
                                                                            newEdu[i].school = e.target.value;
                                                                            setGeneratedResume({ ...generatedResume, education: newEdu });
                                                                        }}
                                                                        placeholder="School"
                                                                        className="p-2 bg-transparent border-b-2 border-slate-200 dark:border-slate-700 outline-none focus:border-violet-500 font-bold"
                                                                    />
                                                                    <input
                                                                        type="text"
                                                                        value={edu.year}
                                                                        onChange={(e) => {
                                                                            const newEdu = [...generatedResume.education];
                                                                            newEdu[i].year = e.target.value;
                                                                            setGeneratedResume({ ...generatedResume, education: newEdu });
                                                                        }}
                                                                        placeholder="Year"
                                                                        className="p-2 bg-transparent border-b-2 border-slate-200 dark:border-slate-700 outline-none focus:border-violet-500 text-sm"
                                                                    />
                                                                </div>
                                                                <input
                                                                    type="text"
                                                                    value={edu.degree}
                                                                    onChange={(e) => {
                                                                        const newEdu = [...generatedResume.education];
                                                                        newEdu[i].degree = e.target.value;
                                                                        setGeneratedResume({ ...generatedResume, education: newEdu });
                                                                    }}
                                                                    placeholder="Degree"
                                                                    className="w-full p-2 bg-transparent border-b-2 border-slate-200 dark:border-slate-700 outline-none focus:border-violet-500 text-sm italic"
                                                                />
                                                            </div>
                                                        ))}
                                                    </motion.div>
                                                )}

                                                {activeSection === 'skills' && (
                                                    <motion.div
                                                        key="skills"
                                                        initial={{ opacity: 0, x: -10 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        className="space-y-4"
                                                    >
                                                        <div className="flex flex-col gap-4">
                                                            <label className="text-[10px] font-black text-slate-400">Core Expertise (Comma separated)</label>
                                                            <textarea
                                                                value={generatedResume.skills.join(", ")}
                                                                onChange={(e) => setGeneratedResume({ ...generatedResume, skills: e.target.value.split(",").map(s => s.trim()) })}
                                                                className="w-full h-80 p-6 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-3xl outline-none focus:border-violet-500 transition-all font-black text-sm tracking-tight leading-relaxed resize-none"
                                                            />
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* Section Footer Actions */}
                                        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between gap-4">
                                            <Button
                                                variant="ghost"
                                                onClick={() => setGeneratedResume(null)}
                                                className="rounded-xl text-slate-500 hover:text-red-500 font-bold"
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" /> Discard
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    const sections = ['personal', 'summary', 'experience', 'education', 'skills'];
                                                    const nextIdx = sections.indexOf(activeSection) + 1;
                                                    if (nextIdx < sections.length) {
                                                        setActiveSection(sections[nextIdx]);
                                                    } else {
                                                        toast.success("Ready for export!");
                                                    }
                                                }}
                                                className="rounded-2xl bg-slate-900 dark:bg-slate-700 text-white hover:bg-black dark:hover:bg-slate-600 px-8 font-black text-xs"
                                            >
                                                Next Section <ChevronRight className="w-4 h-4 ml-2" />
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    /* Insights Tab Content */
                                    <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                                        {/* Score Section */}
                                        <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-3xl p-6 text-white shadow-lg shadow-violet-500/20 flex items-center justify-between">
                                            <div>
                                                <div className="text-[10px] font-black text-violet-200 mb-1">Ats Score</div>
                                                <div className="text-5xl font-black">{feedback?.score || 0}%</div>
                                            </div>
                                            <div className="w-16 h-16 rounded-full border-4 border-white/20 flex items-center justify-center font-black text-xs">
                                                {feedback?.score >= 80 ? 'Good' : 'Needs Fix'}
                                            </div>
                                        </div>

                                        {/* Insight Panels */}
                                        <div className="space-y-4">
                                            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 rounded-2xl">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <CheckCircle size={14} className="text-emerald-500" />
                                                    <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">Key Strengths</span>
                                                </div>
                                                <ul className="space-y-1.5">
                                                    {(feedback?.strengths || []).slice(0, 3).map((s, i) => (
                                                        <li key={i} className="text-xs text-slate-600 dark:text-slate-400 pl-4 relative">
                                                            <span className="absolute left-0 top-1.5 w-1.5 h-1.5 rounded-full bg-emerald-300" />
                                                            {s}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            <div className="p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-800/30 rounded-2xl">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <AlertCircle size={14} className="text-rose-500" />
                                                    <span className="text-xs font-black text-rose-700 dark:text-rose-400">Improvement Gaps</span>
                                                </div>
                                                <ul className="space-y-1.5">
                                                    {(feedback?.weaknesses || []).slice(0, 3).map((w, i) => (
                                                        <li key={i} className="text-xs text-slate-600 dark:text-slate-400 pl-4 relative">
                                                            <span className="absolute left-0 top-1.5 w-1.5 h-1.5 rounded-full bg-rose-300" />
                                                            {w}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>

                                        {/* Keywords */}
                                        <div className="space-y-3">
                                            <span className="text-xs font-black text-slate-500 dark:text-slate-400">Keywords & Skills</span>
                                            <div className="flex flex-wrap gap-1.5">
                                                {(feedback?.atsKeywords?.found || []).map((k, i) => (
                                                    <span key={i} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold rounded-lg border border-slate-200 dark:border-slate-700">
                                                        {k}
                                                    </span>
                                                ))}
                                                {(feedback?.atsKeywords?.missing || []).map((k, i) => (
                                                    <span key={i} className="px-2 py-1 bg-rose-50 dark:bg-rose-900/10 text-rose-500 text-[10px] font-bold rounded-lg border border-rose-100 dark:border-rose-700/30">
                                                        +{k}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {editorTab === 'cover-letter' && (
                                    <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-black text-slate-900 dark:text-white">AI Cover Letter</h3>
                                            <Sparkles className="text-violet-500 w-4 h-4" />
                                        </div>
                                        <div className="p-4 bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-800/30 rounded-2xl">
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                                Generated based on your current resume and the target role: <span className="font-bold text-violet-600">{jobDescription}</span>
                                            </p>
                                        </div>
                                        <textarea
                                            value={coverLetter}
                                            onChange={(e) => setCoverLetter(e.target.value)}
                                            className="w-full h-[400px] p-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl outline-none focus:border-violet-500 text-xs font-medium leading-relaxed resize-none"
                                            placeholder="Your tailored cover letter will appear here..."
                                        />
                                        <Button
                                            onClick={handleGenerateCoverLetter}
                                            disabled={isGeneratingCL}
                                            className="w-full rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold h-10 shadow-lg shadow-violet-500/20 transition-all active:scale-[0.98]"
                                        >
                                            {isGeneratingCL ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <BrainCircuit className="w-4 h-4 mr-2" />}
                                            {coverLetter ? "Regenerate Cover Letter" : "Generate Cover Letter"}
                                        </Button>
                                    </div>
                                )}

                                {editorTab === 'portfolio' && (
                                    <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-black text-slate-900 dark:text-white">Portfolio Prompts</h3>
                                            <FolderOpen className="text-indigo-500 w-4 h-4" />
                                        </div>
                                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 rounded-2xl">
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                                Strategic ideas to showcase your projects and skills in a personal portfolio.
                                            </p>
                                        </div>
                                        <div className="space-y-4">
                                            {portfolioPrompts.length > 0 ? (
                                                portfolioPrompts.map((prompt, i) => (
                                                    <div key={i} className="p-4 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl group flex items-start gap-3 transition-all hover:border-indigo-300">
                                                        <div className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                                                            <span className="text-[10px] font-black text-indigo-600">{i + 1}</span>
                                                        </div>
                                                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{prompt}</p>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-12">
                                                    <Wrench className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                                                    <p className="text-xs text-slate-400 font-bold">No prompts generated yet.</p>
                                                </div>
                                            )}
                                        </div>
                                        <Button
                                            onClick={handleGeneratePortfolio}
                                            disabled={isGeneratingPP}
                                            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-10 shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]"
                                        >
                                            {isGeneratingPP ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                            {portfolioPrompts.length > 0 ? "Regenerate Portfolio Ideas" : "Generate Portfolio Ideas"}
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {/* Panel Footer */}
                            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                                <Button
                                    onClick={() => {
                                        if (editorTab !== "editor") {
                                            setEditorTab("editor");
                                        } else {
                                            const sections = ['personal', 'summary', 'experience', 'education', 'skills'];
                                            const nextIdx = sections.indexOf(activeSection) + 1;
                                            if (nextIdx < sections.length) {
                                                setActiveSection(sections[nextIdx]);
                                            } else {
                                                toast.success("Ready for export!");
                                            }
                                        }
                                    }}
                                    className="w-full rounded-2xl bg-slate-900 dark:bg-slate-700 text-white hover:bg-black dark:hover:bg-slate-600 h-10 font-bold text-xs"
                                >
                                    {editorTab !== "editor" ? "Back to Editor" : "Next Section"} <ChevronRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </div>
                    </div>
                    {/* Right Panel: Live Document Preview */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-[10px] font-black text-slate-400">Live Document Preview</h4>
                            <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl w-full">
                                {(generatedResume ? ['insights', 'editor', 'cover-letter', 'portfolio'] : ['insights', 'editor']).map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setEditorTab(tab)}
                                        className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-black tracking-tight transition-all capitalize ${editorTab === tab
                                            ? "bg-white dark:bg-slate-700 shadow-sm text-violet-600 dark:text-violet-400"
                                            : "text-slate-500 hover:bg-white/50 dark:hover:bg-slate-700/50"
                                            }`}
                                    >
                                        {tab.replace('-', ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="bg-slate-100 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-800 rounded-[40px] p-4 sm:p-8 md:p-12 lg:p-16 overflow-y-auto max-h-[85vh] shadow-2xl shadow-slate-200/50 dark:shadow-none no-scrollbar backdrop-blur-xl">
                            {/* The Resume Document - Pure LaTeX Style Design */}
                            <div className="bg-white text-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.1)] mx-auto min-h-[1050px] w-full max-w-[850px] p-[2cm] flex flex-col gap-[0.4ex] relative ring-1 ring-slate-200">
                                {/* Watermark */}
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] rotate-[-45deg]">
                                    <span className="text-8xl font-black opacity-10">Draft</span>
                                </div>

                                {/* Header */}
                                <div className="text-center mb-6">
                                    <h1 className="text-3xl font-bold tracking-tight mb-2">
                                        {generatedResume.personalInfo.name}
                                    </h1>
                                    <div className="text-[11pt] flex items-center justify-center gap-2 text-slate-600">
                                        <span>{generatedResume.personalInfo.email}</span>
                                        <span>•</span>
                                        <span>{generatedResume.personalInfo.phone}</span>
                                        <span>•</span>
                                        <span>{generatedResume.personalInfo.location}</span>
                                    </div>
                                </div>

                                {/* Sections */}
                                <div className="space-y-6">
                                    {/* Summary */}
                                    <section>
                                        <h2 className="text-[12pt] font-bold border-b border-slate-900 pb-[0.3ex] mb-3">Professional Summary</h2>
                                        <p className="text-[11pt] leading-normal text-justify">
                                            {generatedResume.summary}
                                        </p>
                                    </section>

                                    {/* Experience */}
                                    <section>
                                        <h2 className="text-[12pt] font-bold border-b border-slate-900 pb-[0.3ex] mb-4">Experience</h2>
                                        <div className="space-y-6">
                                            {generatedResume.experience.map((exp, i) => (
                                                <div key={i}>
                                                    <div className="flex justify-between items-baseline mb-1">
                                                        <span className="text-[11pt] font-bold">{exp.company}</span>
                                                        <span className="text-[11pt] font-medium italic">{exp.duration}</span>
                                                    </div>
                                                    <div className="text-[11pt] italic mb-2">{exp.position}</div>
                                                    <ul className="list-disc ml-6 space-y-1">
                                                        {exp.highlights.map((h, hi) => (
                                                            <li key={hi} className="text-[11pt] text-justify leading-tight pl-2">
                                                                {h}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    {/* Education */}
                                    <section>
                                        <h2 className="text-[12pt] font-bold border-b border-slate-900 pb-[0.3ex] mb-4">Education</h2>
                                        <div className="space-y-3">
                                            {generatedResume.education.map((edu, i) => (
                                                <div key={i} className="flex justify-between items-baseline">
                                                    <div>
                                                        <span className="text-[11pt] font-bold block">{edu.school}</span>
                                                        <span className="text-[11pt] italic">{edu.degree}</span>
                                                    </div>
                                                    <span className="text-[11pt] font-medium">{edu.year}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    {/* Skills */}
                                    <section>
                                        <h2 className="text-[12pt] font-bold border-b border-slate-900 pb-[0.3ex] mb-3">Skills</h2>
                                        <p className="text-[11pt] leading-relaxed">
                                            {generatedResume.skills.join(", ")}
                                        </p>
                                    </section>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {!feedback && !generatedResume ? (
                <React.Fragment>
                    {/* Rich Structured Builder - Split Pane */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col lg:flex-row gap-0 min-h-[80vh] rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900"
                    >
                        {/* LEFT: Structured Form */}
                        <aside className="w-full lg:w-[460px] flex flex-col border-r border-slate-100 dark:border-slate-800 overflow-y-auto" style={{ maxHeight: "min(85vh, 900px)" }}>
                            <CompletionBar score={completionScore} />
                            <div className="p-5 flex flex-col gap-7 flex-1 overflow-y-auto">
                                {/* Personal Information */}
                                <section>
                                    <SectionHeader icon={User} title="Personal Information" description="Your basic contact details" />
                                    <div className="flex flex-col gap-3">
                                        <InputField label="Full Name" value={formData.personalInfo.fullName} onChange={e => updatePersonalInfo("fullName", e.target.value)} placeholder="John Doe" icon={User} required />
                                        <InputField label="Job Title" value={formData.personalInfo.jobTitle} onChange={e => updatePersonalInfo("jobTitle", e.target.value)} placeholder="Senior Software Engineer" icon={Briefcase} required />
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <InputField label="Email" value={formData.personalInfo.email} onChange={e => updatePersonalInfo("email", e.target.value)} placeholder="john@example.com" icon={Mail} type="email" required />
                                            <InputField label="Phone" value={formData.personalInfo.phone} onChange={e => updatePersonalInfo("phone", e.target.value)} placeholder="+1 (555) 000-0000" icon={Phone} required />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <InputField label="Location" value={formData.personalInfo.location} onChange={e => updatePersonalInfo("location", e.target.value)} placeholder="San Francisco, CA" icon={MapPin} required />
                                            <InputField label="Website" value={formData.personalInfo.website} onChange={e => updatePersonalInfo("website", e.target.value)} placeholder="johndoe.com" icon={Globe} />
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <InputField label="LinkedIn" value={formData.personalInfo.linkedin} onChange={e => updatePersonalInfo("linkedin", e.target.value)} placeholder="linkedin.com/in/johndoe" icon={Linkedin} />
                                            <InputField label="GitHub" value={formData.personalInfo.github} onChange={e => updatePersonalInfo("github", e.target.value)} placeholder="github.com/johndoe" icon={Github} />
                                        </div>
                                        <InputField label="Professional Summary" value={formData.personalInfo.summary} onChange={e => updatePersonalInfo("summary", e.target.value)} placeholder="Results-driven professional with 5+ years of experience..." rows={4} required />
                                    </div>
                                </section>

                                {/* Experience */}
                                <section>
                                    <SectionHeader icon={Briefcase} title="Experience" count={formData.experience.length} description="Your work history" />
                                    <div className="flex flex-col gap-3">
                                        {formData.experience.map((exp, index) => (
                                            <CollapsibleCard key={index} index={index} title={exp.title || "New Position"} subtitle={exp.company} onRemove={() => removeItem("experience", index)} defaultOpen={index === formData.experience.length - 1}>
                                                <InputField label="Job Title" value={exp.title} onChange={e => updateItem("experience", index, "title", e.target.value)} placeholder="Senior Software Engineer" />
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <InputField label="Company" value={exp.company} onChange={e => updateItem("experience", index, "company", e.target.value)} placeholder="Acme Corp" />
                                                    <InputField label="Location" value={exp.location} onChange={e => updateItem("experience", index, "location", e.target.value)} placeholder="Remote" />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <InputField label="Start Date" value={exp.startDate} onChange={e => updateItem("experience", index, "startDate", e.target.value)} placeholder="Jan 2022" />
                                                    <InputField label="End Date" value={exp.endDate} onChange={e => updateItem("experience", index, "endDate", e.target.value)} placeholder="Present" />
                                                </div>
                                                <InputField label="Description (one bullet per line)" value={exp.description} onChange={e => updateItem("experience", index, "description", e.target.value)} placeholder={"Led team of 8 engineers...\nReduced API response time by 40%"} rows={4} />
                                            </CollapsibleCard>
                                        ))}
                                        <AddButton onClick={() => addItem("experience", { title: "", company: "", location: "", startDate: "", endDate: "", description: "" })} label="Add Experience" />
                                    </div>
                                </section>

                                {/* Projects */}
                                <section>
                                    <SectionHeader icon={FolderOpen} title="Projects" count={formData.projects.length} description="Notable projects and contributions" />
                                    <div className="flex flex-col gap-3">
                                        {formData.projects.map((proj, index) => (
                                            <CollapsibleCard key={index} index={index} title={proj.name || "New Project"} subtitle={proj.technologies} onRemove={() => removeItem("projects", index)} defaultOpen={index === formData.projects.length - 1}>
                                                <InputField label="Project Name" value={proj.name} onChange={e => updateItem("projects", index, "name", e.target.value)} placeholder="E-Commerce Platform" />
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <InputField label="Technologies" value={proj.technologies} onChange={e => updateItem("projects", index, "technologies", e.target.value)} placeholder="React, Node.js, PostgreSQL" />
                                                    <InputField label="URL" value={proj.url} onChange={e => updateItem("projects", index, "url", e.target.value)} placeholder="github.com/user/project" />
                                                </div>
                                                <InputField label="Description" value={proj.description} onChange={e => updateItem("projects", index, "description", e.target.value)} placeholder="Built a full-stack platform with real-time updates..." rows={3} />
                                            </CollapsibleCard>
                                        ))}
                                        <AddButton onClick={() => addItem("projects", { name: "", technologies: "", url: "", description: "" })} label="Add Project" />
                                    </div>
                                </section>

                                {/* Education */}
                                <section>
                                    <SectionHeader icon={GraduationCap} title="Education" count={formData.education.length} description="Academic qualifications" />
                                    <div className="flex flex-col gap-3">
                                        {formData.education.map((edu, index) => (
                                            <CollapsibleCard key={index} index={index} title={edu.degree || "New Degree"} subtitle={edu.school} onRemove={() => removeItem("education", index)} defaultOpen={index === formData.education.length - 1}>
                                                <InputField label="Degree" value={edu.degree} onChange={e => updateItem("education", index, "degree", e.target.value)} placeholder="B.S. Computer Science" />
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <InputField label="School" value={edu.school} onChange={e => updateItem("education", index, "school", e.target.value)} placeholder="Stanford University" />
                                                    <InputField label="Location" value={edu.location} onChange={e => updateItem("education", index, "location", e.target.value)} placeholder="Stanford, CA" />
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                    <InputField label="Start Date" value={edu.startDate} onChange={e => updateItem("education", index, "startDate", e.target.value)} placeholder="Sep 2018" />
                                                    <InputField label="End Date" value={edu.endDate} onChange={e => updateItem("education", index, "endDate", e.target.value)} placeholder="Jun 2022" />
                                                    <InputField label="GPA" value={edu.gpa} onChange={e => updateItem("education", index, "gpa", e.target.value)} placeholder="3.8 / 4.0" />
                                                </div>
                                            </CollapsibleCard>
                                        ))}
                                        <AddButton onClick={() => addItem("education", { degree: "", school: "", location: "", startDate: "", endDate: "", gpa: "" })} label="Add Education" />
                                    </div>
                                </section>

                                {/* Skills */}
                                <section>
                                    <SectionHeader icon={Wrench} title="Skills" count={formData.skills.length} description="Technical and professional skills" />
                                    <form onSubmit={addSkill} className="flex gap-2 mb-3">
                                        <input value={skillInput} onChange={e => setSkillInput(e.target.value)} placeholder="Type a skill and press Enter..."
                                            className="flex-1 px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all"
                                            onKeyDown={e => { if (e.key === "," || e.key === "Tab") { e.preventDefault(); addSkill(e); } }} />
                                        <button type="submit" className="px-3 py-2.5 text-white bg-violet-600 hover:bg-violet-700 rounded-xl transition-colors active:scale-95">
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </form>
                                    {formData.skills.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {formData.skills.map((skill, i) => (
                                                <span key={i} className="group flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                                                    {skill}
                                                    <button onClick={() => removeItem("skills", i)} className="opacity-50 hover:opacity-100 transition-opacity"><X className="w-3 h-3" /></button>
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </section>

                                {/* Certifications */}
                                <section>
                                    <SectionHeader icon={Award} title="Certifications" count={formData.certifications.length} description="Professional certifications" />
                                    <div className="flex flex-col gap-3">
                                        {formData.certifications.map((cert, index) => (
                                            <CollapsibleCard key={index} index={index} title={cert.name || "New Certification"} subtitle={cert.issuer} onRemove={() => removeItem("certifications", index)} defaultOpen={index === formData.certifications.length - 1}>
                                                <InputField label="Certification Name" value={cert.name} onChange={e => updateItem("certifications", index, "name", e.target.value)} placeholder="AWS Solutions Architect" />
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <InputField label="Issuer" value={cert.issuer} onChange={e => updateItem("certifications", index, "issuer", e.target.value)} placeholder="Amazon Web Services" />
                                                    <InputField label="Date" value={cert.date} onChange={e => updateItem("certifications", index, "date", e.target.value)} placeholder="Mar 2023" />
                                                </div>
                                            </CollapsibleCard>
                                        ))}
                                        <AddButton onClick={() => addItem("certifications", { name: "", issuer: "", date: "" })} label="Add Certification" />
                                    </div>
                                </section>

                                {/* Languages */}
                                <section>
                                    <SectionHeader icon={Languages} title="Languages" count={formData.languages.length} description="Languages you speak" />
                                    <div className="flex flex-col gap-3">
                                        {formData.languages.map((lang, index) => (
                                            <div key={index} className="flex items-end gap-3 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                                                <div className="flex-1"><InputField label="Language" value={lang.name} onChange={e => updateItem("languages", index, "name", e.target.value)} placeholder="English" /></div>
                                                <div className="flex-1"><InputField label="Proficiency" value={lang.proficiency} onChange={e => updateItem("languages", index, "proficiency", e.target.value)} placeholder="Native" /></div>
                                                <button onClick={() => removeItem("languages", index)} className="p-2 mb-0.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                            </div>
                                        ))}
                                        <AddButton onClick={() => addItem("languages", { name: "", proficiency: "" })} label="Add Language" />
                                    </div>
                                </section>

                                {/* Volunteer */}
                                <section>
                                    <SectionHeader icon={Heart} title="Volunteer & Activities" count={formData.volunteer.length} description="Community involvement" />
                                    <div className="flex flex-col gap-3">
                                        {formData.volunteer.map((vol, index) => (
                                            <CollapsibleCard key={index} index={index} title={vol.role || "New Activity"} subtitle={vol.organization} onRemove={() => removeItem("volunteer", index)} defaultOpen={index === formData.volunteer.length - 1}>
                                                <InputField label="Role" value={vol.role} onChange={e => updateItem("volunteer", index, "role", e.target.value)} placeholder="Lead Organizer" />
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <InputField label="Organization" value={vol.organization} onChange={e => updateItem("volunteer", index, "organization", e.target.value)} placeholder="Code for Good" />
                                                    <InputField label="Date" value={vol.date} onChange={e => updateItem("volunteer", index, "date", e.target.value)} placeholder="2021 - Present" />
                                                </div>
                                                <InputField label="Description" value={vol.description} onChange={e => updateItem("volunteer", index, "description", e.target.value)} placeholder="Organized weekly workshops..." rows={2} />
                                            </CollapsibleCard>
                                        ))}
                                        <AddButton onClick={() => addItem("volunteer", { role: "", organization: "", date: "", description: "" })} label="Add Activity" />
                                    </div>
                                </section>

                                {/* References */}
                                <section>
                                    <SectionHeader icon={Users} title="References" count={formData.references.length} description="Professional references" />
                                    <div className="flex flex-col gap-3">
                                        {formData.references.map((ref, index) => (
                                            <CollapsibleCard key={index} index={index} title={ref.name || "New Reference"} subtitle={ref.company} onRemove={() => removeItem("references", index)} defaultOpen={index === formData.references.length - 1}>
                                                <InputField label="Name" value={ref.name} onChange={e => updateItem("references", index, "name", e.target.value)} placeholder="Jane Smith" />
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <InputField label="Title" value={ref.title} onChange={e => updateItem("references", index, "title", e.target.value)} placeholder="Engineering Manager" />
                                                    <InputField label="Company" value={ref.company} onChange={e => updateItem("references", index, "company", e.target.value)} placeholder="Acme Corp" />
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    <InputField label="Email" value={ref.email} onChange={e => updateItem("references", index, "email", e.target.value)} placeholder="jane@acme.com" type="email" />
                                                    <InputField label="Phone" value={ref.phone} onChange={e => updateItem("references", index, "phone", e.target.value)} placeholder="+1 (555) 123-4567" />
                                                </div>
                                            </CollapsibleCard>
                                        ))}
                                        <AddButton onClick={() => addItem("references", { name: "", title: "", company: "", email: "", phone: "" })} label="Add Reference" />
                                    </div>
                                </section>

                                {/* AI Generate / Optimize Actions */}
                                <section className="border-t border-slate-100 dark:border-slate-800 pt-6">
                                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 mb-3">AI-Powered Actions</p>
                                    <div className="flex flex-col gap-3">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Target Role</label>
                                            <input value={jobDescription} onChange={e => { setJobDescription(e.target.value); setError(null); }}
                                                placeholder="e.g. Senior Software Engineer, Data Scientist..."
                                                className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all" />
                                        </div>
                                        <Button onClick={handleGenerate} disabled={isGenerating || !jobDescription.trim()}
                                            className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold shadow-lg shadow-violet-500/25 disabled:opacity-50">
                                            {isGenerating ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Generating...</> : <><BrainCircuit className="w-4 h-4 mr-2" />AI Generate Full Resume</>}
                                        </Button>
                                        {mode !== "build" && (
                                            <>
                                                <div className="flex flex-col gap-1.5">
                                                    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Paste existing resume to optimize</label>
                                                    <textarea value={resumeText} onChange={e => { setResumeText(e.target.value); setError(null); }} placeholder="Paste your raw resume text here..." rows={4}
                                                        className="w-full px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all resize-none" />
                                                </div>
                                                <Button onClick={handleOptimize} disabled={loading || !resumeText.trim()}
                                                    className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-bold shadow-lg shadow-indigo-500/25 disabled:opacity-50">
                                                    {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Optimizing...</> : <><Sparkles className="w-4 h-4 mr-2" />Optimize Existing Resume</>}
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </section>
                            </div>
                        </aside>

                        {/* RIGHT: Live Preview */}
                        <main className="flex-1 overflow-y-auto" style={{ maxHeight: "min(85vh, 900px)", background: "#e8eaef" }}>
                            <div className="p-4 md:p-8 flex justify-center min-h-full">
                                <div className="w-full max-w-[820px] bg-white shadow-xl rounded-xl overflow-hidden" style={{ minHeight: 900 }}>
                                    <FormResumePreview data={formData} />
                                </div>
                            </div>
                        </main>
                    </motion.div>

                    {/* History Section */}
                    {history.length > 0 && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pt-10 border-t border-slate-200 dark:border-slate-700/50 mt-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                    <Clock size={16} className="text-slate-500 dark:text-slate-400" />
                                </div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white">Recent Work</h3>
                                <span className="ml-auto text-sm font-semibold text-slate-500">{history.length} {history.length === 1 ? "item" : "items"}</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {history.map((item) => (
                                    <motion.div key={item._id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                        onClick={() => loadHistoryItem(item)}
                                        className="bg-white dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-800 rounded-2xl p-6 cursor-pointer hover:border-violet-400 dark:hover:border-violet-600 hover:shadow-lg transition-all group relative overflow-hidden flex flex-col">
                                        <div className="absolute top-0 right-0 w-20 h-20 bg-violet-500/5 rounded-full -mr-10 -mt-10 blur-2xl group-hover:bg-violet-500/10 transition-colors" />
                                        <div className="flex justify-between items-start mb-4 relative z-10">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
                                                    <Target size={14} className="text-violet-600 dark:text-violet-400" />
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{item.metadata?.resumeText ? "Optimizer" : "Builder"}</span>
                                            </div>
                                            <button onClick={e => deleteHistoryItem(e, item._id)} className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors opacity-0 group-hover:opacity-100">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 line-clamp-1 border-b border-slate-100 dark:border-slate-700/50 pb-3 relative z-10">{item.title || "Resume Work"}</h4>
                                        <div className="flex-1 relative z-10 text-xs text-slate-500 dark:text-slate-400">
                                            {item.metadata?.resumeText ? (
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-violet-600">ATS Score:</span>
                                                    <span className="font-black text-xl text-violet-600">{item.data?.score || "N/A"}</span>
                                                </div>
                                            ) : (
                                                <p className="line-clamp-2">{item.data?.summary?.substring(0, 100)}...</p>
                                            )}
                                        </div>
                                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/50 flex justify-between items-center text-xs text-slate-400 font-medium relative z-10">
                                            <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                                            <span className="text-violet-500 font-bold text-[10px] flex items-center gap-1 group-hover:translate-x-1 transition-transform">Open <ArrowRight size={10} /></span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </React.Fragment>
            ) : null}
        </div>
    );
};

export default ResumeBuilder;
