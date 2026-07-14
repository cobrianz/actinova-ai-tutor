"use client";

import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
    Sparkles, BrainCircuit, Trash2, Plus,
    Mail, Phone, MapPin, Globe, Linkedin, Github,
} from "lucide-react";

function Editable({ onBlur, className, style, children, tag: Tag = "span" }) {
    return (
        <Tag
            contentEditable
            suppressContentEditableWarning
            onBlur={onBlur}
            className={`outline-none focus:bg-slate-50 dark:focus:bg-slate-800 rounded px-1 ${className || ""}`}
            style={style}
        >
            {children}
        </Tag>
    );
}

function ContactPills({ items, handleBlur }) {
    return (
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3 max-w-2xl">
            {items.map((item, i) => (
                <div key={i} className={`flex items-center gap-1.5 text-[13px] text-slate-500 dark:text-slate-400 ${!item.value ? "opacity-30 hover:opacity-100 transition-opacity" : ""}`}>
                    <item.icon size={10} className="text-slate-400 dark:text-slate-500" />
                    <Editable
                        onBlur={(e) => handleBlur("personalInfo", item.field, e.target.innerText)}
                        className="min-w-[20px]"
                    >
                        {item.value || item.label}
                    </Editable>
                </div>
            ))}
        </div>
    );
}

// ─── Shared Section Title Variants ──────────────────────────────
function PillSectionTitle({ children, accent }) {
    return (
        <div className="flex items-center gap-4 mb-4 mt-8 first:mt-0">
            <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-700" />
            <h3
                className="text-base font-black tracking-[0.1em] text-slate-500 dark:text-slate-300 px-4 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-full"
                style={accent ? { borderColor: accent + "40", color: accent } : {}}
            >
                {children}
            </h3>
            <div className="h-[1px] flex-1 bg-slate-200 dark:bg-slate-700" />
        </div>
    );
}

function LineSectionTitle({ children, accent }) {
    return (
        <h3
            className="text-sm font-bold uppercase tracking-[0.15em] mb-3 mt-7 first:mt-0 pb-1.5 border-b-2"
            style={{ color: accent || "#166534", borderColor: accent || "#166534" }}
        >
            {children}
        </h3>
    );
}

function SideSectionTitle({ children, accent }) {
    return (
        <h3
            className="text-[11px] font-bold uppercase tracking-[0.2em] mb-3 mt-6 first:mt-0"
            style={{ color: accent || "#ffffff" }}
        >
            {children}
        </h3>
    );
}

// ─── Helper: Contact items array ─────────────────────────────────
function getContactItems(pInfo) {
    return [
        { icon: Mail, value: pInfo.email, field: "email", label: "Email" },
        { icon: Phone, value: pInfo.phone, field: "phone", label: "Phone" },
        { icon: MapPin, value: pInfo.location, field: "location", label: "Location" },
        { icon: Globe, value: pInfo.website, field: "website", label: "Website" },
        { icon: Linkedin, value: pInfo.linkedin, field: "linkedin", label: "LinkedIn" },
        { icon: Github, value: pInfo.github, field: "github", label: "GitHub" },
    ];
}

// ─── Template 1: Classic (original) ──────────────────────────────
export function ClassicTemplate({ data, onUpdate, handleBlur, addSectionType }) {
    const { personalInfo, experience = [], education = [], skills = [], projects = [], certifications = [], awards = [], languages = [], customSections = [] } = data;
    const displayName = personalInfo.fullName || personalInfo.name;
    const contactItems = getContactItems(personalInfo);

    return (
        <div className="p-8 md:p-12 bg-white dark:bg-slate-900 min-h-[1000px] relative text-slate-900 dark:text-slate-100 font-serif">
            <header className="flex flex-col items-center text-center space-y-1 mb-8">
                <Editable onBlur={(e) => handleBlur("personalInfo", "fullName", e.target.innerText)} className="text-5xl font-bold tracking-tight mb-2" style={{ letterSpacing: "0.02em" }}>
                    {displayName || "Your Name"}
                </Editable>
                <Editable onBlur={(e) => handleBlur("personalInfo", "jobTitle", e.target.innerText)} className="text-xl font-medium text-slate-600 dark:text-slate-300 tracking-wide italic" style={{ fontSize: "18px" }}>
                    {personalInfo.jobTitle || "Job Title"}
                </Editable>
                <ContactPills items={contactItems} handleBlur={handleBlur} />
            </header>

            {(personalInfo.summary || data.summary) && (
                <section className="mb-6">
                    <PillSectionTitle>Summary</PillSectionTitle>
                    <Editable tag="p" onBlur={(e) => handleBlur("personalInfo", "summary", e.target.innerText)} className="text-base leading-relaxed text-justify px-2 italic text-slate-700 dark:text-slate-300">
                        {personalInfo.summary || data.summary}
                    </Editable>
                </section>
            )}

            {experience.length > 0 && (
                <section className="mb-6">
                    <PillSectionTitle>Experience</PillSectionTitle>
                    <div className="space-y-6 px-2">
                        {experience.map((exp, i) => (
                            <div key={i} className="group transition-all relative">
                                <div className="flex justify-between items-baseline mb-1">
                                    <div className="flex items-baseline gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                                        <Editable onBlur={(e) => handleBlur("experience", "title", e.target.innerText, i)} className="text-[15px] font-bold text-slate-900 dark:text-slate-100 leading-none">
                                            {exp.title}
                                        </Editable>
                                        <span className="text-slate-200 dark:text-slate-700 font-light">|</span>
                                        <Editable onBlur={(e) => handleBlur("experience", "company", e.target.innerText, i)} className="text-[15px] font-semibold text-slate-600 dark:text-slate-300 leading-none">
                                            {exp.company}
                                        </Editable>
                                    </div>
                                    <Editable onBlur={(e) => handleBlur("experience", "dateRange", e.target.innerText, i)} className="text-[13px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        {exp.dateRange || `${exp.startDate || ""}${exp.startDate || exp.endDate ? " – " : ""}${exp.endDate || ""}`}
                                    </Editable>
                                </div>
                                <Editable tag="p" onBlur={(e) => handleBlur("experience", "description", e.target.innerText, i)} className="text-base leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-line border-l-2 border-slate-50 dark:border-slate-800 pl-4 ml-0.5">
                                    {exp.description}
                                </Editable>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {education.length > 0 && (
                <section className="mb-6">
                    <PillSectionTitle>Education</PillSectionTitle>
                    <div className="space-y-4 px-2">
                        {education.map((edu, i) => (
                            <div key={i} className="flex justify-between items-baseline">
                                <div className="space-y-0.5">
                                    <div className="flex items-baseline gap-2">
                                        <Editable onBlur={(e) => handleBlur("education", "degree", e.target.innerText, i)} className="text-[15px] font-bold text-slate-900 dark:text-slate-100">
                                            {edu.degree}
                                        </Editable>
                                        <span className="text-slate-200 dark:text-slate-700">|</span>
                                        <Editable onBlur={(e) => handleBlur("education", "school", e.target.innerText, i)} className="text-[15px] text-slate-600 dark:text-slate-300">
                                            {edu.school}
                                        </Editable>
                                    </div>
                                    {edu.description && (
                                        <Editable tag="p" onBlur={(e) => handleBlur("education", "description", e.target.innerText, i)} className="text-sm text-slate-500 dark:text-slate-400 italic">
                                            {edu.description}
                                        </Editable>
                                    )}
                                </div>
                                <Editable onBlur={(e) => handleBlur("education", "dateRange", e.target.innerText, i)} className="text-[13px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider shrink-0 ml-4">
                                    {edu.dateRange || `${edu.startDate || ""}${edu.startDate || edu.endDate ? " – " : ""}${edu.endDate || ""}`}
                                </Editable>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {skills.length > 0 && (
                <section className="mb-6">
                    <PillSectionTitle>Skills</PillSectionTitle>
                    <div className="flex flex-wrap gap-2 px-2">
                        {skills.map((skill, i) => (
                            <span key={i} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm rounded-full border border-slate-200 dark:border-slate-700">
                                {typeof skill === "string" ? skill : skill.name || skill}
                            </span>
                        ))}
                    </div>
                </section>
            )}

            {projects.length > 0 && (
                <section className="mb-6">
                    <PillSectionTitle>Projects</PillSectionTitle>
                    <div className="space-y-4 px-2">
                        {projects.map((proj, i) => (
                            <div key={i}>
                                <div className="flex justify-between items-baseline mb-1">
                                    <Editable onBlur={(e) => handleBlur("projects", "name", e.target.innerText, i)} className="text-[15px] font-bold text-slate-900 dark:text-slate-100">
                                        {proj.name}
                                    </Editable>
                                    {(proj.startDate || proj.endDate || proj.dateRange) && (
                                        <Editable onBlur={(e) => handleBlur("projects", "dateRange", e.target.innerText, i)} className="text-[13px] font-bold text-slate-500 uppercase tracking-wider">
                                            {proj.dateRange || `${proj.startDate || ""}${proj.startDate || proj.endDate ? " – " : ""}${proj.endDate || ""}`}
                                        </Editable>
                                    )}
                                </div>
                                <Editable tag="p" onBlur={(e) => handleBlur("projects", "description", e.target.innerText, i)} className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                                    {proj.description}
                                </Editable>
                                {proj.technologies && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {(Array.isArray(proj.technologies) ? proj.technologies : proj.technologies.split(",")).map((t, j) => (
                                            <span key={j} className="text-[11px] px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full">{t.trim()}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {certifications.length > 0 && (
                <section className="mb-6">
                    <PillSectionTitle>Certifications</PillSectionTitle>
                    <div className="space-y-2 px-2">
                        {certifications.map((cert, i) => (
                            <div key={i} className="flex justify-between items-baseline">
                                <div className="flex items-baseline gap-2">
                                    <Editable onBlur={(e) => handleBlur("certifications", "name", e.target.innerText, i)} className="text-[14px] font-bold text-slate-900 dark:text-slate-100">{cert.name}</Editable>
                                    <span className="text-slate-300 dark:text-slate-600">—</span>
                                    <Editable onBlur={(e) => handleBlur("certifications", "issuer", e.target.innerText, i)} className="text-[14px] text-slate-600 dark:text-slate-400">{cert.issuer}</Editable>
                                </div>
                                <Editable onBlur={(e) => handleBlur("certifications", "date", e.target.innerText, i)} className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">{cert.date}</Editable>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {awards.length > 0 && (
                <section className="mb-6">
                    <PillSectionTitle>Awards</PillSectionTitle>
                    <div className="space-y-2 px-2">
                        {awards.map((award, i) => (
                            <div key={i} className="flex justify-between items-baseline">
                                <div className="flex items-baseline gap-2">
                                    <Editable onBlur={(e) => handleBlur("awards", "title", e.target.innerText, i)} className="text-[14px] font-bold text-slate-900">{award.title}</Editable>
                                    <span className="text-slate-300">—</span>
                                    <Editable onBlur={(e) => handleBlur("awards", "org", e.target.innerText, i)} className="text-[14px] text-slate-600">{award.org}</Editable>
                                </div>
                                <Editable onBlur={(e) => handleBlur("awards", "date", e.target.innerText, i)} className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">{award.date}</Editable>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {languages.length > 0 && (
                <section className="mb-6">
                    <PillSectionTitle>Languages</PillSectionTitle>
                    <div className="flex flex-wrap gap-3 px-2">
                        {languages.map((lang, i) => (
                            <span key={i} className="text-sm text-slate-700 dark:text-slate-300">
                                <Editable onBlur={(e) => handleBlur("languages", "language", e.target.innerText, i)} className="font-semibold">{lang.language}</Editable>
                                {lang.level && <span className="text-slate-400"> — <Editable onBlur={(e) => handleBlur("languages", "level", e.target.innerText, i)}>{lang.level}</Editable></span>}
                            </span>
                        ))}
                    </div>
                </section>
            )}

            {customSections.map((section, i) => (
                <section key={i} className="mb-6">
                    <PillSectionTitle>{section.title}</PillSectionTitle>
                    <Editable tag="p" onBlur={(e) => handleBlur("customSections", "content", e.target.innerText, i)} className="text-base leading-relaxed text-slate-600 dark:text-slate-300 px-2 whitespace-pre-line">
                        {section.content}
                    </Editable>
                </section>
            ))}

            <AddSectionBar addSectionType={addSectionType} />
        </div>
    );
}

// ─── Template 2: Modern ──────────────────────────────────────────
export function ModernTemplate({ data, onUpdate, handleBlur, addSectionType }) {
    const { personalInfo, experience = [], education = [], skills = [], projects = [], certifications = [], awards = [], languages = [], customSections = [] } = data;
    const displayName = personalInfo.fullName || personalInfo.name;
    const accent = "#059669";

    return (
        <div className="bg-white dark:bg-slate-900 min-h-[1000px] text-slate-900 dark:text-slate-100 font-sans">
            <div className="h-2" style={{ background: accent }} />
            <div className="px-10 py-8">
                <header className="mb-8">
                    <Editable onBlur={(e) => handleBlur("personalInfo", "fullName", e.target.innerText)} className="text-4xl font-black tracking-tight text-slate-900 dark:text-white" style={{ color: accent }}>
                        {displayName || "Your Name"}
                    </Editable>
                    <Editable onBlur={(e) => handleBlur("personalInfo", "jobTitle", e.target.innerText)} className="text-lg text-slate-500 dark:text-slate-400 mt-1 font-medium">
                        {personalInfo.jobTitle || "Job Title"}
                    </Editable>
                    <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-[13px] text-slate-500 dark:text-slate-400">
                        {getContactItems(personalInfo).map((item, i) => (
                            <div key={i} className={`flex items-center gap-1.5 ${!item.value ? "opacity-30" : ""}`}>
                                <item.icon size={12} style={{ color: accent }} />
                                <Editable onBlur={(e) => handleBlur("personalInfo", item.field, e.target.innerText)}>{item.value || item.label}</Editable>
                            </div>
                        ))}
                    </div>
                </header>

                {(personalInfo.summary || data.summary) && (
                    <section className="mb-6">
                        <LineSectionTitle accent={accent}>Summary</LineSectionTitle>
                        <Editable tag="p" onBlur={(e) => handleBlur("personalInfo", "summary", e.target.innerText)} className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                            {personalInfo.summary || data.summary}
                        </Editable>
                    </section>
                )}

                {experience.length > 0 && (
                    <section className="mb-6">
                        <LineSectionTitle accent={accent}>Experience</LineSectionTitle>
                        <div className="space-y-5">
                            {experience.map((exp, i) => (
                                <div key={i}>
                                    <div className="flex justify-between items-baseline">
                                        <Editable onBlur={(e) => handleBlur("experience", "title", e.target.innerText, i)} className="text-[15px] font-bold text-slate-900 dark:text-white">{exp.title}</Editable>
                                        <Editable onBlur={(e) => handleBlur("experience", "dateRange", e.target.innerText, i)} className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">{exp.dateRange || `${exp.startDate || ""} – ${exp.endDate || ""}`}</Editable>
                                    </div>
                                    <div className="flex items-baseline gap-2 text-sm text-slate-500 dark:text-slate-400 mb-1">
                                        <Editable onBlur={(e) => handleBlur("experience", "company", e.target.innerText, i)} className="font-semibold" style={{ color: accent }}>{exp.company}</Editable>
                                        {exp.location && <span>· <Editable onBlur={(e) => handleBlur("experience", "location", e.target.innerText, i)}>{exp.location}</Editable></span>}
                                    </div>
                                    <Editable tag="p" onBlur={(e) => handleBlur("experience", "description", e.target.innerText, i)} className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 whitespace-pre-line">
                                        {exp.description}
                                    </Editable>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {education.length > 0 && (
                    <section className="mb-6">
                        <LineSectionTitle accent={accent}>Education</LineSectionTitle>
                        <div className="space-y-3">
                            {education.map((edu, i) => (
                                <div key={i} className="flex justify-between items-baseline">
                                    <div>
                                        <div className="flex items-baseline gap-2">
                                            <Editable onBlur={(e) => handleBlur("education", "degree", e.target.innerText, i)} className="text-[15px] font-bold text-slate-900 dark:text-white">{edu.degree}</Editable>
                                            <Editable onBlur={(e) => handleBlur("education", "school", e.target.innerText, i)} className="text-sm font-medium" style={{ color: accent }}>{edu.school}</Editable>
                                        </div>
                                        {edu.description && <Editable tag="p" onBlur={(e) => handleBlur("education", "description", e.target.innerText, i)} className="text-xs text-slate-500 mt-0.5 italic">{edu.description}</Editable>}
                                    </div>
                                    <Editable onBlur={(e) => handleBlur("education", "dateRange", e.target.innerText, i)} className="text-[12px] font-bold text-slate-400 uppercase tracking-wider shrink-0">{edu.dateRange || `${edu.startDate || ""} – ${edu.endDate || ""}`}</Editable>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {skills.length > 0 && (
                    <section className="mb-6">
                        <LineSectionTitle accent={accent}>Skills</LineSectionTitle>
                        <div className="flex flex-wrap gap-1.5">
                            {skills.map((skill, i) => (
                                <span key={i} className="px-3 py-1 text-sm rounded-md font-medium" style={{ background: accent + "15", color: accent }}>
                                    {typeof skill === "string" ? skill : skill.name || skill}
                                </span>
                            ))}
                        </div>
                    </section>
                )}

                {projects.length > 0 && (
                    <section className="mb-6">
                        <LineSectionTitle accent={accent}>Projects</LineSectionTitle>
                        <div className="space-y-4">
                            {projects.map((proj, i) => (
                                <div key={i}>
                                    <div className="flex justify-between items-baseline">
                                        <Editable onBlur={(e) => handleBlur("projects", "name", e.target.innerText, i)} className="text-[15px] font-bold text-slate-900 dark:text-white">{proj.name}</Editable>
                                        {(proj.startDate || proj.endDate) && <Editable onBlur={(e) => handleBlur("projects", "dateRange", e.target.innerText, i)} className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">{proj.dateRange || `${proj.startDate || ""} – ${proj.endDate || ""}`}</Editable>}
                                    </div>
                                    <Editable tag="p" onBlur={(e) => handleBlur("projects", "description", e.target.innerText, i)} className="text-sm text-slate-600 dark:text-slate-400 mb-1">{proj.description}</Editable>
                                    {proj.technologies && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {(Array.isArray(proj.technologies) ? proj.technologies : proj.technologies.split(",")).map((t, j) => (
                                                <span key={j} className="text-[11px] px-2 py-0.5 rounded-md font-medium" style={{ background: accent + "10", color: accent }}>{t.trim()}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {certifications.length > 0 && (
                    <section className="mb-6">
                        <LineSectionTitle accent={accent}>Certifications</LineSectionTitle>
                        <div className="space-y-1.5">
                            {certifications.map((cert, i) => (
                                <div key={i} className="flex justify-between items-baseline text-sm">
                                    <span><Editable onBlur={(e) => handleBlur("certifications", "name", e.target.innerText, i)} className="font-bold text-slate-900 dark:text-white">{cert.name}</Editable> <span className="text-slate-400">—</span> <Editable onBlur={(e) => handleBlur("certifications", "issuer", e.target.innerText, i)} className="text-slate-600 dark:text-slate-400">{cert.issuer}</Editable></span>
                                    <Editable onBlur={(e) => handleBlur("certifications", "date", e.target.innerText, i)} className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{cert.date}</Editable>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {awards.length > 0 && (
                    <section className="mb-6">
                        <LineSectionTitle accent={accent}>Awards</LineSectionTitle>
                        <div className="space-y-1.5">
                            {awards.map((award, i) => (
                                <div key={i} className="flex justify-between items-baseline text-sm">
                                    <span><Editable onBlur={(e) => handleBlur("awards", "title", e.target.innerText, i)} className="font-bold text-slate-900">{award.title}</Editable> <span className="text-slate-400">—</span> <Editable onBlur={(e) => handleBlur("awards", "org", e.target.innerText, i)} className="text-slate-600">{award.org}</Editable></span>
                                    <Editable onBlur={(e) => handleBlur("awards", "date", e.target.innerText, i)} className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{award.date}</Editable>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {languages.length > 0 && (
                    <section className="mb-6">
                        <LineSectionTitle accent={accent}>Languages</LineSectionTitle>
                        <div className="flex flex-wrap gap-3 text-sm">
                            {languages.map((lang, i) => (
                                <span key={i} className="text-slate-700 dark:text-slate-300">
                                    <Editable onBlur={(e) => handleBlur("languages", "language", e.target.innerText, i)} className="font-semibold">{lang.language}</Editable>
                                    {lang.level && <span className="text-slate-400"> — <Editable onBlur={(e) => handleBlur("languages", "level", e.target.innerText, i)}>{lang.level}</Editable></span>}
                                </span>
                            ))}
                        </div>
                    </section>
                )}

                {customSections.map((section, i) => (
                    <section key={i} className="mb-6">
                        <LineSectionTitle accent={accent}>{section.title}</LineSectionTitle>
                        <Editable tag="p" onBlur={(e) => handleBlur("customSections", "content", e.target.innerText, i)} className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 whitespace-pre-line">{section.content}</Editable>
                    </section>
                ))}
            </div>
            <AddSectionBar addSectionType={addSectionType} />
        </div>
    );
}

// ─── Template 3: Executive ───────────────────────────────────────
export function ExecutiveTemplate({ data, onUpdate, handleBlur, addSectionType }) {
    const { personalInfo, experience = [], education = [], skills = [], projects = [], certifications = [], awards = [], languages = [], customSections = [] } = data;
    const displayName = personalInfo.fullName || personalInfo.name;

    return (
        <div className="bg-white dark:bg-slate-900 min-h-[1000px] text-slate-900 dark:text-slate-100 font-serif">
            <div className="bg-slate-900 dark:bg-slate-950 text-white px-10 py-8 text-center">
                <Editable onBlur={(e) => handleBlur("personalInfo", "fullName", e.target.innerText)} className="text-4xl font-black tracking-wider uppercase">{displayName || "Your Name"}</Editable>
                <div className="w-16 h-0.5 bg-green-400 mx-auto my-3" />
                <Editable onBlur={(e) => handleBlur("personalInfo", "jobTitle", e.target.innerText)} className="text-lg text-slate-300 font-light tracking-wide">{personalInfo.jobTitle || "Job Title"}</Editable>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-4 text-[12px] text-slate-400">
                    {getContactItems(personalInfo).map((item, i) => (
                        <div key={i} className={`flex items-center gap-1 ${!item.value ? "opacity-30" : ""}`}>
                            <item.icon size={10} />
                            <Editable onBlur={(e) => handleBlur("personalInfo", item.field, e.target.innerText)}>{item.value || item.label}</Editable>
                        </div>
                    ))}
                </div>
            </div>

            <div className="px-10 py-6">
                {(personalInfo.summary || data.summary) && (
                    <section className="mb-6">
                        <LineSectionTitle accent="#166534">Professional Summary</LineSectionTitle>
                        <Editable tag="p" onBlur={(e) => handleBlur("personalInfo", "summary", e.target.innerText)} className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{personalInfo.summary || data.summary}</Editable>
                    </section>
                )}

                {experience.length > 0 && (
                    <section className="mb-6">
                        <LineSectionTitle accent="#166534">Experience</LineSectionTitle>
                        <div className="space-y-5">
                            {experience.map((exp, i) => (
                                <div key={i}>
                                    <div className="flex justify-between items-baseline">
                                        <Editable onBlur={(e) => handleBlur("experience", "title", e.target.innerText, i)} className="text-[15px] font-bold text-slate-900">{exp.title}</Editable>
                                        <Editable onBlur={(e) => handleBlur("experience", "dateRange", e.target.innerText, i)} className="text-[12px] font-bold text-green-700 dark:text-green-400 uppercase tracking-wider">{exp.dateRange || `${exp.startDate || ""} – ${exp.endDate || ""}`}</Editable>
                                    </div>
                                    <div className="text-sm text-slate-500 mb-1">
                                        <Editable onBlur={(e) => handleBlur("experience", "company", e.target.innerText, i)} className="font-semibold text-slate-700 dark:text-slate-300">{exp.company}</Editable>
                                        {exp.location && <span> | <Editable onBlur={(e) => handleBlur("experience", "location", e.target.innerText, i)}>{exp.location}</Editable></span>}
                                    </div>
                                    <Editable tag="p" onBlur={(e) => handleBlur("experience", "description", e.target.innerText, i)} className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 whitespace-pre-line">{exp.description}</Editable>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {education.length > 0 && (
                    <section className="mb-6">
                        <LineSectionTitle accent="#166534">Education</LineSectionTitle>
                        <div className="space-y-3">
                            {education.map((edu, i) => (
                                <div key={i} className="flex justify-between items-baseline">
                                    <div>
                                        <Editable onBlur={(e) => handleBlur("education", "degree", e.target.innerText, i)} className="text-[15px] font-bold text-slate-900">{edu.degree}</Editable>
                                        <span className="text-slate-400 mx-1">—</span>
                                        <Editable onBlur={(e) => handleBlur("education", "school", e.target.innerText, i)} className="text-sm text-green-700 dark:text-green-400 font-medium">{edu.school}</Editable>
                                        {edu.description && <Editable tag="p" onBlur={(e) => handleBlur("education", "description", e.target.innerText, i)} className="text-xs text-slate-500 italic mt-0.5">{edu.description}</Editable>}
                                    </div>
                                    <Editable onBlur={(e) => handleBlur("education", "dateRange", e.target.innerText, i)} className="text-[12px] font-bold text-green-700 uppercase tracking-wider shrink-0">{edu.dateRange || `${edu.startDate || ""} – ${edu.endDate || ""}`}</Editable>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {skills.length > 0 && (
                    <section className="mb-6">
                        <LineSectionTitle accent="#166534">Core Competencies</LineSectionTitle>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                            {skills.map((skill, i) => (
                                <div key={i} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                    <div className="w-1 h-1 rounded-full bg-green-500" />
                                    <Editable>{typeof skill === "string" ? skill : skill.name || skill}</Editable>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {projects.length > 0 && (
                    <section className="mb-6">
                        <LineSectionTitle accent="#166534">Key Projects</LineSectionTitle>
                        <div className="space-y-3">
                            {projects.map((proj, i) => (
                                <div key={i}>
                                    <div className="flex justify-between items-baseline">
                                        <Editable onBlur={(e) => handleBlur("projects", "name", e.target.innerText, i)} className="text-[14px] font-bold text-slate-900">{proj.name}</Editable>
                                        {(proj.startDate || proj.endDate) && <Editable onBlur={(e) => handleBlur("projects", "dateRange", e.target.innerText, i)} className="text-[11px] font-bold text-green-700 uppercase tracking-wider">{proj.dateRange || `${proj.startDate || ""} – ${proj.endDate || ""}`}</Editable>}
                                    </div>
                                    <Editable tag="p" onBlur={(e) => handleBlur("projects", "description", e.target.innerText, i)} className="text-sm text-slate-600 dark:text-slate-400">{proj.description}</Editable>
                                    {proj.technologies && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                            {(Array.isArray(proj.technologies) ? proj.technologies : proj.technologies.split(",")).map((t, j) => (
                                                <span key={j} className="text-[10px] px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded font-medium">{t.trim()}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {certifications.length > 0 && (
                    <section className="mb-6">
                        <LineSectionTitle accent="#166534">Certifications</LineSectionTitle>
                        <div className="space-y-1">
                            {certifications.map((cert, i) => (
                                <div key={i} className="flex justify-between items-baseline text-sm">
                                    <span><Editable onBlur={(e) => handleBlur("certifications", "name", e.target.innerText, i)} className="font-bold text-slate-900">{cert.name}</Editable> — <Editable onBlur={(e) => handleBlur("certifications", "issuer", e.target.innerText, i)} className="text-slate-600">{cert.issuer}</Editable></span>
                                    <Editable onBlur={(e) => handleBlur("certifications", "date", e.target.innerText, i)} className="text-[11px] font-bold text-green-700 uppercase tracking-wider">{cert.date}</Editable>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {awards.length > 0 && (
                    <section className="mb-6">
                        <LineSectionTitle accent="#166534">Awards</LineSectionTitle>
                        <div className="space-y-1">
                            {awards.map((award, i) => (
                                <div key={i} className="flex justify-between items-baseline text-sm">
                                    <span><Editable onBlur={(e) => handleBlur("awards", "title", e.target.innerText, i)} className="font-bold text-slate-900">{award.title}</Editable> — <Editable onBlur={(e) => handleBlur("awards", "org", e.target.innerText, i)} className="text-slate-600">{award.org}</Editable></span>
                                    <Editable onBlur={(e) => handleBlur("awards", "date", e.target.innerText, i)} className="text-[11px] font-bold text-green-700 uppercase tracking-wider">{award.date}</Editable>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {languages.length > 0 && (
                    <section className="mb-6">
                        <LineSectionTitle accent="#166534">Languages</LineSectionTitle>
                        <div className="flex flex-wrap gap-3 text-sm">
                            {languages.map((lang, i) => (
                                <span key={i} className="text-slate-700 dark:text-slate-300">
                                    <Editable onBlur={(e) => handleBlur("languages", "language", e.target.innerText, i)} className="font-semibold">{lang.language}</Editable>
                                    {lang.level && <span className="text-slate-400"> — <Editable onBlur={(e) => handleBlur("languages", "level", e.target.innerText, i)}>{lang.level}</Editable></span>}
                                </span>
                            ))}
                        </div>
                    </section>
                )}

                {customSections.map((section, i) => (
                    <section key={i} className="mb-6">
                        <LineSectionTitle accent="#166534">{section.title}</LineSectionTitle>
                        <Editable tag="p" onBlur={(e) => handleBlur("customSections", "content", e.target.innerText, i)} className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 whitespace-pre-line">{section.content}</Editable>
                    </section>
                ))}
            </div>
            <AddSectionBar addSectionType={addSectionType} />
        </div>
    );
}

// ─── Template 4: Minimal ─────────────────────────────────────────
export function MinimalTemplate({ data, onUpdate, handleBlur, addSectionType }) {
    const { personalInfo, experience = [], education = [], skills = [], projects = [], certifications = [], awards = [], languages = [], customSections = [] } = data;
    const displayName = personalInfo.fullName || personalInfo.name;

    return (
        <div className="bg-white dark:bg-slate-900 min-h-[1000px] text-slate-900 dark:text-slate-100 font-sans px-14 py-10">
            <header className="mb-10">
                <Editable onBlur={(e) => handleBlur("personalInfo", "fullName", e.target.innerText)} className="text-3xl font-light text-slate-900 dark:text-white tracking-wide">{displayName || "Your Name"}</Editable>
                <Editable onBlur={(e) => handleBlur("personalInfo", "jobTitle", e.target.innerText)} className="text-sm text-slate-400 mt-1 tracking-widest uppercase">{personalInfo.jobTitle || "Job Title"}</Editable>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4 text-[12px] text-slate-400">
                    {getContactItems(personalInfo).map((item, i) => (
                        <div key={i} className={`flex items-center gap-1 ${!item.value ? "opacity-30" : ""}`}>
                            <item.icon size={10} />
                            <Editable onBlur={(e) => handleBlur("personalInfo", item.field, e.target.innerText)}>{item.value || item.label}</Editable>
                        </div>
                    ))}
                </div>
            </header>

            {(personalInfo.summary || data.summary) && (
                <section className="mb-8">
                    <Editable tag="p" onBlur={(e) => handleBlur("personalInfo", "summary", e.target.innerText)} className="text-sm leading-relaxed text-slate-500 dark:text-slate-400 italic">{personalInfo.summary || data.summary}</Editable>
                </section>
            )}

            {experience.length > 0 && (
                <section className="mb-8">
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Experience</h3>
                    <div className="space-y-5">
                        {experience.map((exp, i) => (
                            <div key={i}>
                                <div className="flex justify-between items-baseline">
                                    <Editable onBlur={(e) => handleBlur("experience", "title", e.target.innerText, i)} className="text-[14px] font-semibold text-slate-900 dark:text-white">{exp.title}</Editable>
                                    <Editable onBlur={(e) => handleBlur("experience", "dateRange", e.target.innerText, i)} className="text-[11px] text-slate-400 tracking-wider">{exp.dateRange || `${exp.startDate || ""} – ${exp.endDate || ""}`}</Editable>
                                </div>
                                <Editable onBlur={(e) => handleBlur("experience", "company", e.target.innerText, i)} className="text-sm text-slate-500 mb-1">{exp.company}{exp.location ? `, ${exp.location}` : ""}</Editable>
                                <Editable tag="p" onBlur={(e) => handleBlur("experience", "description", e.target.innerText, i)} className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 whitespace-pre-line">{exp.description}</Editable>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {education.length > 0 && (
                <section className="mb-8">
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Education</h3>
                    <div className="space-y-3">
                        {education.map((edu, i) => (
                            <div key={i} className="flex justify-between items-baseline">
                                <div>
                                    <Editable onBlur={(e) => handleBlur("education", "degree", e.target.innerText, i)} className="text-[14px] font-semibold text-slate-900 dark:text-white">{edu.degree}</Editable>
                                    <span className="text-slate-300 mx-2">·</span>
                                    <Editable onBlur={(e) => handleBlur("education", "school", e.target.innerText, i)} className="text-sm text-slate-500">{edu.school}</Editable>
                                    {edu.description && <Editable tag="p" onBlur={(e) => handleBlur("education", "description", e.target.innerText, i)} className="text-xs text-slate-400 italic mt-0.5">{edu.description}</Editable>}
                                </div>
                                <Editable onBlur={(e) => handleBlur("education", "dateRange", e.target.innerText, i)} className="text-[11px] text-slate-400 tracking-wider shrink-0">{edu.dateRange || `${edu.startDate || ""} – ${edu.endDate || ""}`}</Editable>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {skills.length > 0 && (
                <section className="mb-8">
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400 mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">Skills</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                        {skills.map((skill, i) => (
                            <span key={i}>
                                <Editable>{typeof skill === "string" ? skill : skill.name || skill}</Editable>
                                {i < skills.length - 1 && <span className="text-slate-300 mx-2">·</span>}
                            </span>
                        ))}
                    </p>
                </section>
            )}

            {projects.length > 0 && (
                <section className="mb-8">
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400 mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Projects</h3>
                    <div className="space-y-3">
                        {projects.map((proj, i) => (
                            <div key={i}>
                                <div className="flex justify-between items-baseline">
                                    <Editable onBlur={(e) => handleBlur("projects", "name", e.target.innerText, i)} className="text-[14px] font-semibold text-slate-900 dark:text-white">{proj.name}</Editable>
                                    {(proj.startDate || proj.endDate) && <Editable onBlur={(e) => handleBlur("projects", "dateRange", e.target.innerText, i)} className="text-[11px] text-slate-400 tracking-wider">{proj.dateRange || `${proj.startDate || ""} – ${proj.endDate || ""}`}</Editable>}
                                </div>
                                <Editable tag="p" onBlur={(e) => handleBlur("projects", "description", e.target.innerText, i)} className="text-sm text-slate-600 dark:text-slate-400">{proj.description}</Editable>
                                {proj.technologies && <div className="flex flex-wrap gap-1 mt-1">{(Array.isArray(proj.technologies) ? proj.technologies : proj.technologies.split(",")).map((t, j) => <span key={j} className="text-[11px] text-slate-400">{t.trim()}{j < (Array.isArray(proj.technologies) ? proj.technologies.length : proj.technologies.split(",").length) - 1 ? " · " : ""}</span>)}</div>}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {certifications.length > 0 && (
                <section className="mb-8">
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400 mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">Certifications</h3>
                    <div className="space-y-1 text-sm">{certifications.map((cert, i) => <div key={i} className="flex justify-between"><span><Editable onBlur={(e) => handleBlur("certifications", "name", e.target.innerText, i)} className="font-medium text-slate-900">{cert.name}</Editable> — <Editable onBlur={(e) => handleBlur("certifications", "issuer", e.target.innerText, i)} className="text-slate-500">{cert.issuer}</Editable></span><Editable onBlur={(e) => handleBlur("certifications", "date", e.target.innerText, i)} className="text-[11px] text-slate-400">{cert.date}</Editable></div>)}</div>
                </section>
            )}

            {awards.length > 0 && (
                <section className="mb-8">
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400 mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">Awards</h3>
                    <div className="space-y-1 text-sm">{awards.map((a, i) => <div key={i} className="flex justify-between"><span><Editable onBlur={(e) => handleBlur("awards", "title", e.target.innerText, i)} className="font-medium text-slate-900">{a.title}</Editable> — <Editable onBlur={(e) => handleBlur("awards", "org", e.target.innerText, i)} className="text-slate-500">{a.org}</Editable></span><Editable onBlur={(e) => handleBlur("awards", "date", e.target.innerText, i)} className="text-[11px] text-slate-400">{a.date}</Editable></div>)}</div>
                </section>
            )}

            {languages.length > 0 && (
                <section className="mb-8">
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400 mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">Languages</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{languages.map((lang, i) => <span key={i}><Editable onBlur={(e) => handleBlur("languages", "language", e.target.innerText, i)} className="font-medium">{lang.language}</Editable>{lang.level && <span className="text-slate-400"> ({lang.level})</span>}{i < languages.length - 1 ? ", " : ""}</span>)}</p>
                </section>
            )}

            {customSections.map((section, i) => (
                <section key={i} className="mb-8">
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400 mb-3 border-b border-slate-100 dark:border-slate-800 pb-2">{section.title}</h3>
                    <Editable tag="p" onBlur={(e) => handleBlur("customSections", "content", e.target.innerText, i)} className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 whitespace-pre-line">{section.content}</Editable>
                </section>
            ))}

            <AddSectionBar addSectionType={addSectionType} />
        </div>
    );
}

// ─── Template 5: Creative (Sidebar) ──────────────────────────────
export function CreativeTemplate({ data, onUpdate, handleBlur, addSectionType }) {
    const { personalInfo, experience = [], education = [], skills = [], projects = [], certifications = [], awards = [], languages = [], customSections = [] } = data;
    const displayName = personalInfo.fullName || personalInfo.name;
    const accent = "#7c3aed";

    return (
        <div className="w-full">
            <div className="bg-white dark:bg-slate-900 min-h-[1000px] text-slate-900 dark:text-slate-100 flex font-sans">
                <div className="w-64 shrink-0 p-6 text-white" style={{ background: `linear-gradient(135deg, ${accent}, ${accent}dd)` }}>
                <div className="mb-6">
                    <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold mb-3">
                        {(displayName || "YN").charAt(0)}
                    </div>
                    <Editable onBlur={(e) => handleBlur("personalInfo", "fullName", e.target.innerText)} className="text-lg font-bold leading-tight">{displayName || "Your Name"}</Editable>
                    <Editable onBlur={(e) => handleBlur("personalInfo", "jobTitle", e.target.innerText)} className="text-sm text-white/70 mt-1">{personalInfo.jobTitle || "Job Title"}</Editable>
                </div>

                <SideSectionTitle accent="white">Contact</SideSectionTitle>
                <div className="space-y-2 text-[12px] text-white/80">
                    {getContactItems(personalInfo).map((item, i) => (
                        <div key={i} className={`flex items-center gap-2 ${!item.value ? "opacity-30" : ""}`}>
                            <item.icon size={11} />
                            <Editable onBlur={(e) => handleBlur("personalInfo", item.field, e.target.innerText)} className="break-all">{item.value || item.label}</Editable>
                        </div>
                    ))}
                </div>

                {skills.length > 0 && (
                    <>
                        <SideSectionTitle accent="white">Skills</SideSectionTitle>
                        <div className="space-y-1.5">
                            {skills.map((skill, i) => (
                                <div key={i} className="text-[12px] text-white/90 flex items-center gap-1.5">
                                    <div className="w-1 h-1 rounded-full bg-white/50" />
                                    <Editable>{typeof skill === "string" ? skill : skill.name || skill}</Editable>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {languages.length > 0 && (
                    <>
                        <SideSectionTitle accent="white">Languages</SideSectionTitle>
                        <div className="space-y-1 text-[12px] text-white/80">
                            {languages.map((lang, i) => (
                                <div key={i}><Editable onBlur={(e) => handleBlur("languages", "language", e.target.innerText, i)}>{lang.language}</Editable>{lang.level && <span className="text-white/50"> · {lang.level}</span>}</div>
                            ))}
                        </div>
                    </>
                )}

                {certifications.length > 0 && (
                    <>
                        <SideSectionTitle accent="white">Certifications</SideSectionTitle>
                        <div className="space-y-2 text-[11px] text-white/80">
                            {certifications.map((cert, i) => (
                                <div key={i}>
                                    <Editable onBlur={(e) => handleBlur("certifications", "name", e.target.innerText, i)} className="font-semibold text-white">{cert.name}</Editable>
                                    <div className="text-white/60">{cert.issuer} · {cert.date}</div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <div className="flex-1 p-8">
                {(personalInfo.summary || data.summary) && (
                    <section className="mb-6">
                        <h3 className="text-sm font-bold uppercase tracking-wider mb-3 pb-1.5 border-b-2" style={{ color: accent, borderColor: accent }}>About</h3>
                        <Editable tag="p" onBlur={(e) => handleBlur("personalInfo", "summary", e.target.innerText)} className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{personalInfo.summary || data.summary}</Editable>
                    </section>
                )}

                {experience.length > 0 && (
                    <section className="mb-6">
                        <h3 className="text-sm font-bold uppercase tracking-wider mb-3 pb-1.5 border-b-2" style={{ color: accent, borderColor: accent }}>Experience</h3>
                        <div className="space-y-4">
                            {experience.map((exp, i) => (
                                <div key={i}>
                                    <div className="flex justify-between items-baseline">
                                        <Editable onBlur={(e) => handleBlur("experience", "title", e.target.innerText, i)} className="text-[14px] font-bold text-slate-900 dark:text-white">{exp.title}</Editable>
                                        <Editable onBlur={(e) => handleBlur("experience", "dateRange", e.target.innerText, i)} className="text-[11px] font-bold tracking-wider" style={{ color: accent }}>{exp.dateRange || `${exp.startDate || ""} – ${exp.endDate || ""}`}</Editable>
                                    </div>
                                    <Editable onBlur={(e) => handleBlur("experience", "company", e.target.innerText, i)} className="text-sm text-slate-500 font-medium mb-1">{exp.company}{exp.location ? `, ${exp.location}` : ""}</Editable>
                                    <Editable tag="p" onBlur={(e) => handleBlur("experience", "description", e.target.innerText, i)} className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 whitespace-pre-line">{exp.description}</Editable>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {education.length > 0 && (
                    <section className="mb-6">
                        <h3 className="text-sm font-bold uppercase tracking-wider mb-3 pb-1.5 border-b-2" style={{ color: accent, borderColor: accent }}>Education</h3>
                        <div className="space-y-3">
                            {education.map((edu, i) => (
                                <div key={i} className="flex justify-between items-baseline">
                                    <div>
                                        <Editable onBlur={(e) => handleBlur("education", "degree", e.target.innerText, i)} className="text-[14px] font-bold text-slate-900">{edu.degree}</Editable>
                                        <span className="text-slate-300 mx-1">·</span>
                                        <Editable onBlur={(e) => handleBlur("education", "school", e.target.innerText, i)} className="text-sm" style={{ color: accent }}>{edu.school}</Editable>
                                        {edu.description && <Editable tag="p" onBlur={(e) => handleBlur("education", "description", e.target.innerText, i)} className="text-xs text-slate-400 italic mt-0.5">{edu.description}</Editable>}
                                    </div>
                                    <Editable onBlur={(e) => handleBlur("education", "dateRange", e.target.innerText, i)} className="text-[11px] font-bold tracking-wider shrink-0" style={{ color: accent }}>{edu.dateRange || `${edu.startDate || ""} – ${edu.endDate || ""}`}</Editable>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {projects.length > 0 && (
                    <section className="mb-6">
                        <h3 className="text-sm font-bold uppercase tracking-wider mb-3 pb-1.5 border-b-2" style={{ color: accent, borderColor: accent }}>Projects</h3>
                        <div className="space-y-3">
                            {projects.map((proj, i) => (
                                <div key={i}>
                                    <div className="flex justify-between items-baseline">
                                        <Editable onBlur={(e) => handleBlur("projects", "name", e.target.innerText, i)} className="text-[14px] font-bold text-slate-900">{proj.name}</Editable>
                                        {(proj.startDate || proj.endDate) && <Editable onBlur={(e) => handleBlur("projects", "dateRange", e.target.innerText, i)} className="text-[11px] font-bold tracking-wider" style={{ color: accent }}>{proj.dateRange || `${proj.startDate || ""} – ${proj.endDate || ""}`}</Editable>}
                                    </div>
                                    <Editable tag="p" onBlur={(e) => handleBlur("projects", "description", e.target.innerText, i)} className="text-sm text-slate-600 dark:text-slate-400">{proj.description}</Editable>
                                    {proj.technologies && <div className="flex flex-wrap gap-1 mt-1">{(Array.isArray(proj.technologies) ? proj.technologies : proj.technologies.split(",")).map((t, j) => <span key={j} className="text-[10px] px-2 py-0.5 rounded-full font-medium text-white" style={{ background: accent }}>{t.trim()}</span>)}</div>}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {awards.length > 0 && (
                    <section className="mb-6">
                        <h3 className="text-sm font-bold uppercase tracking-wider mb-3 pb-1.5 border-b-2" style={{ color: accent, borderColor: accent }}>Awards</h3>
                        <div className="space-y-1 text-sm">{awards.map((a, i) => <div key={i} className="flex justify-between"><span><Editable onBlur={(e) => handleBlur("awards", "title", e.target.innerText, i)} className="font-bold text-slate-900">{a.title}</Editable> — <Editable onBlur={(e) => handleBlur("awards", "org", e.target.innerText, i)} className="text-slate-500">{a.org}</Editable></span><Editable onBlur={(e) => handleBlur("awards", "date", e.target.innerText, i)} className="text-[11px] tracking-wider" style={{ color: accent }}>{a.date}</Editable></div>)}</div>
                    </section>
                )}

                {customSections.map((section, i) => (
                    <section key={i} className="mb-6">
                        <h3 className="text-sm font-bold uppercase tracking-wider mb-3 pb-1.5 border-b-2" style={{ color: accent, borderColor: accent }}>{section.title}</h3>
                        <Editable tag="p" onBlur={(e) => handleBlur("customSections", "content", e.target.innerText, i)} className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 whitespace-pre-line">{section.content}</Editable>
                    </section>
                ))}
            </div>
            </div>
            <AddSectionBar addSectionType={addSectionType} />
        </div>
    );
}

// ─── Add Section Bar (shared) ────────────────────────────────────
function AddSectionBar({ addSectionType }) {
    return (
        <div className="mt-10 pt-6 pb-12 border-t border-slate-100 dark:border-slate-800">
            <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 font-medium">Add Section</p>
            <div className="flex flex-wrap justify-center gap-1.5">
                {[
                    { id: "experience", label: "Experience" },
                    { id: "education", label: "Education" },
                    { id: "skills", label: "Skills" },
                    { id: "projects", label: "Projects" },
                    { id: "certifications", label: "Certifications" },
                    { id: "awards", label: "Awards" },
                    { id: "languages", label: "Languages" },
                    { id: "customSections", label: "Custom" },
                ].map(({ id, label }) => (
                    <button key={id} onClick={() => addSectionType(id)} className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-[10px] font-medium border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 rounded-md hover:border-green-300 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/10 transition-all">
                        <Plus size={10} /> {label}
                    </button>
                ))}
            </div>
        </div>
    );
}

// ─── Template 6: Technical ───────────────────────────────────────
export function TechnicalTemplate({ data, onUpdate, handleBlur, addSectionType }) {
    const { personalInfo, experience = [], education = [], skills = [], projects = [], certifications = [], awards = [], languages = [], customSections = [] } = data;
    const displayName = personalInfo.fullName || personalInfo.name;
    const accent = "#0891b2";

    return (
        <div className="bg-white dark:bg-slate-900 min-h-[1000px] text-slate-900 dark:text-slate-100 font-mono text-[13px] px-10 py-8">
            <header className="mb-8 border-b-2 pb-4" style={{ borderColor: accent }}>
                <Editable onBlur={(e) => handleBlur("personalInfo", "fullName", e.target.innerText)} className="text-3xl font-bold text-slate-900 dark:text-white font-sans">{displayName || "Your Name"}</Editable>
                <Editable onBlur={(e) => handleBlur("personalInfo", "jobTitle", e.target.innerText)} className="text-sm mt-1 font-sans" style={{ color: accent }}>{personalInfo.jobTitle || "Job Title"}</Editable>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[12px] text-slate-500 font-sans">
                    {getContactItems(personalInfo).map((item, i) => (
                        <div key={i} className={`flex items-center gap-1.5 ${!item.value ? "opacity-30" : ""}`}>
                            <item.icon size={10} style={{ color: accent }} />
                            <Editable onBlur={(e) => handleBlur("personalInfo", item.field, e.target.innerText)}>{item.value || item.label}</Editable>
                        </div>
                    ))}
                </div>
            </header>

            {(personalInfo.summary || data.summary) && (
                <section className="mb-6 font-sans">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest mb-2 font-sans" style={{ color: accent }}>{">"} SUMMARY</h3>
                    <Editable tag="p" onBlur={(e) => handleBlur("personalInfo", "summary", e.target.innerText)} className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">{personalInfo.summary || data.summary}</Editable>
                </section>
            )}

            {skills.length > 0 && (
                <section className="mb-6">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest mb-3 font-sans" style={{ color: accent }}>{">"} TECHNICAL SKILLS</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        {skills.map((skill, i) => (
                            <div key={i} className="px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded text-[12px] text-slate-700 dark:text-slate-300 font-mono">
                                <span style={{ color: accent }}>+</span> <Editable>{typeof skill === "string" ? skill : skill.name || skill}</Editable>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {experience.length > 0 && (
                <section className="mb-6 font-sans">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest mb-3 font-sans" style={{ color: accent }}>{">"} EXPERIENCE</h3>
                    <div className="space-y-4">
                        {experience.map((exp, i) => (
                            <div key={i}>
                                <div className="flex justify-between items-baseline">
                                    <Editable onBlur={(e) => handleBlur("experience", "title", e.target.innerText, i)} className="text-[14px] font-bold text-slate-900 dark:text-white font-sans">{exp.title}</Editable>
                                    <Editable onBlur={(e) => handleBlur("experience", "dateRange", e.target.innerText, i)} className="text-[11px] font-bold tracking-wider font-sans" style={{ color: accent }}>{exp.dateRange || `${exp.startDate || ""} – ${exp.endDate || ""}`}</Editable>
                                </div>
                                <Editable onBlur={(e) => handleBlur("experience", "company", e.target.innerText, i)} className="text-sm font-medium font-sans" style={{ color: accent }}>{exp.company}{exp.location ? ` | ${exp.location}` : ""}</Editable>
                                <Editable tag="p" onBlur={(e) => handleBlur("experience", "description", e.target.innerText, i)} className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-400 whitespace-pre-line mt-1">{exp.description}</Editable>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {projects.length > 0 && (
                <section className="mb-6 font-sans">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest mb-3 font-sans" style={{ color: accent }}>{">"} PROJECTS</h3>
                    <div className="space-y-3">
                        {projects.map((proj, i) => (
                            <div key={i}>
                                <div className="flex justify-between items-baseline">
                                    <Editable onBlur={(e) => handleBlur("projects", "name", e.target.innerText, i)} className="text-[14px] font-bold text-slate-900 font-sans">{proj.name}</Editable>
                                    {(proj.startDate || proj.endDate) && <Editable onBlur={(e) => handleBlur("projects", "dateRange", e.target.innerText, i)} className="text-[11px] font-bold tracking-wider font-sans" style={{ color: accent }}>{proj.dateRange || `${proj.startDate || ""} – ${proj.endDate || ""}`}</Editable>}
                                </div>
                                <Editable tag="p" onBlur={(e) => handleBlur("projects", "description", e.target.innerText, i)} className="text-[13px] text-slate-600 dark:text-slate-400">{proj.description}</Editable>
                                {proj.technologies && <div className="flex flex-wrap gap-1 mt-1">{(Array.isArray(proj.technologies) ? proj.technologies : proj.technologies.split(",")).map((t, j) => <span key={j} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">{t.trim()}</span>)}</div>}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {education.length > 0 && (
                <section className="mb-6 font-sans">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest mb-3 font-sans" style={{ color: accent }}>{">"} EDUCATION</h3>
                    <div className="space-y-2">
                        {education.map((edu, i) => (
                            <div key={i} className="flex justify-between items-baseline">
                                <div><Editable onBlur={(e) => handleBlur("education", "degree", e.target.innerText, i)} className="font-bold text-slate-900 font-sans">{edu.degree}</Editable> <span className="text-slate-300">|</span> <Editable onBlur={(e) => handleBlur("education", "school", e.target.innerText, i)} className="font-sans" style={{ color: accent }}>{edu.school}</Editable></div>
                                <Editable onBlur={(e) => handleBlur("education", "dateRange", e.target.innerText, i)} className="text-[11px] font-bold tracking-wider font-sans" style={{ color: accent }}>{edu.dateRange || `${edu.startDate || ""} – ${edu.endDate || ""}`}</Editable>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {certifications.length > 0 && (
                <section className="mb-6 font-sans">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest mb-2 font-sans" style={{ color: accent }}>{">"} CERTIFICATIONS</h3>
                    <div className="space-y-1">{certifications.map((cert, i) => <div key={i} className="flex justify-between text-[12px]"><span><Editable onBlur={(e) => handleBlur("certifications", "name", e.target.innerText, i)} className="font-bold font-sans">{cert.name}</Editable> — <Editable onBlur={(e) => handleBlur("certifications", "issuer", e.target.innerText, i)} className="font-sans" style={{ color: accent }}>{cert.issuer}</Editable></span><Editable onBlur={(e) => handleBlur("certifications", "date", e.target.innerText, i)} className="font-sans" style={{ color: accent }}>{cert.date}</Editable></div>)}</div>
                </section>
            )}

            {awards.length > 0 && (
                <section className="mb-6 font-sans">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest mb-2 font-sans" style={{ color: accent }}>{">"} AWARDS</h3>
                    <div className="space-y-1">{awards.map((a, i) => <div key={i} className="flex justify-between text-[12px]"><span><Editable onBlur={(e) => handleBlur("awards", "title", e.target.innerText, i)} className="font-bold font-sans">{a.title}</Editable> — <Editable onBlur={(e) => handleBlur("awards", "org", e.target.innerText, i)} className="font-sans" style={{ color: accent }}>{a.org}</Editable></span><Editable onBlur={(e) => handleBlur("awards", "date", e.target.innerText, i)} className="font-sans" style={{ color: accent }}>{a.date}</Editable></div>)}</div>
                </section>
            )}

            {languages.length > 0 && (
                <section className="mb-6 font-sans">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest mb-2 font-sans" style={{ color: accent }}>{">"} LANGUAGES</h3>
                    <p className="text-[12px] font-sans">{languages.map((lang, i) => <span key={i}><Editable onBlur={(e) => handleBlur("languages", "language", e.target.innerText, i)} className="font-semibold">{lang.language}</Editable>{lang.level && <span style={{ color: accent }}> ({lang.level})</span>}{i < languages.length - 1 ? " | " : ""}</span>)}</p>
                </section>
            )}

            {customSections.map((section, i) => (
                <section key={i} className="mb-6 font-sans">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest mb-2 font-sans" style={{ color: accent }}>{">"} {section.title.toUpperCase()}</h3>
                    <Editable tag="p" onBlur={(e) => handleBlur("customSections", "content", e.target.innerText, i)} className="text-[13px] leading-relaxed text-slate-600 dark:text-slate-400 whitespace-pre-line">{section.content}</Editable>
                </section>
            ))}

            <AddSectionBar addSectionType={addSectionType} />
        </div>
    );
}

// ─── Template 7: Elegant ─────────────────────────────────────────
export function ElegantTemplate({ data, onUpdate, handleBlur, addSectionType }) {
    const { personalInfo, experience = [], education = [], skills = [], projects = [], certifications = [], awards = [], languages = [], customSections = [] } = data;
    const displayName = personalInfo.fullName || personalInfo.name;
    const accent = "#92400e";

    return (
        <div className="bg-white dark:bg-slate-900 min-h-[1000px] text-slate-900 dark:text-slate-100 font-serif px-12 py-10">
            <header className="text-center mb-10 border-b border-slate-200 dark:border-slate-700 pb-8">
                <Editable onBlur={(e) => handleBlur("personalInfo", "fullName", e.target.innerText)} className="text-4xl font-bold tracking-wide" style={{ color: accent }}>{displayName || "Your Name"}</Editable>
                <Editable onBlur={(e) => handleBlur("personalInfo", "jobTitle", e.target.innerText)} className="text-base text-slate-500 mt-2 italic">{personalInfo.jobTitle || "Job Title"}</Editable>
                <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 mt-4 text-[12px] text-slate-500">
                    {getContactItems(personalInfo).map((item, i) => (
                        <div key={i} className={`flex items-center gap-1.5 ${!item.value ? "opacity-30" : ""}`}>
                            <item.icon size={10} style={{ color: accent }} />
                            <Editable onBlur={(e) => handleBlur("personalInfo", item.field, e.target.innerText)}>{item.value || item.label}</Editable>
                        </div>
                    ))}
                </div>
            </header>

            {(personalInfo.summary || data.summary) && (
                <section className="mb-8">
                    <LineSectionTitle accent={accent}>Summary</LineSectionTitle>
                    <Editable tag="p" onBlur={(e) => handleBlur("personalInfo", "summary", e.target.innerText)} className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 italic text-center">{personalInfo.summary || data.summary}</Editable>
                </section>
            )}

            {experience.length > 0 && (
                <section className="mb-8">
                    <LineSectionTitle accent={accent}>Professional Experience</LineSectionTitle>
                    <div className="space-y-5">
                        {experience.map((exp, i) => (
                            <div key={i}>
                                <div className="flex justify-between items-baseline">
                                    <Editable onBlur={(e) => handleBlur("experience", "title", e.target.innerText, i)} className="text-[15px] font-bold text-slate-900">{exp.title}</Editable>
                                    <Editable onBlur={(e) => handleBlur("experience", "dateRange", e.target.innerText, i)} className="text-[12px] font-bold tracking-wider" style={{ color: accent }}>{exp.dateRange || `${exp.startDate || ""} – ${exp.endDate || ""}`}</Editable>
                                </div>
                                <Editable onBlur={(e) => handleBlur("experience", "company", e.target.innerText, i)} className="text-sm italic" style={{ color: accent }}>{exp.company}{exp.location ? `, ${exp.location}` : ""}</Editable>
                                <Editable tag="p" onBlur={(e) => handleBlur("experience", "description", e.target.innerText, i)} className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 whitespace-pre-line mt-1">{exp.description}</Editable>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {education.length > 0 && (
                <section className="mb-8">
                    <LineSectionTitle accent={accent}>Education</LineSectionTitle>
                    <div className="space-y-3">
                        {education.map((edu, i) => (
                            <div key={i} className="flex justify-between items-baseline">
                                <div>
                                    <Editable onBlur={(e) => handleBlur("education", "degree", e.target.innerText, i)} className="text-[15px] font-bold text-slate-900">{edu.degree}</Editable>
                                    <span className="text-slate-300 mx-2">—</span>
                                    <Editable onBlur={(e) => handleBlur("education", "school", e.target.innerText, i)} className="text-sm italic" style={{ color: accent }}>{edu.school}</Editable>
                                    {edu.description && <Editable tag="p" onBlur={(e) => handleBlur("education", "description", e.target.innerText, i)} className="text-xs text-slate-400 italic mt-0.5">{edu.description}</Editable>}
                                </div>
                                <Editable onBlur={(e) => handleBlur("education", "dateRange", e.target.innerText, i)} className="text-[12px] font-bold tracking-wider shrink-0" style={{ color: accent }}>{edu.dateRange || `${edu.startDate || ""} – ${edu.endDate || ""}`}</Editable>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {skills.length > 0 && (
                <section className="mb-8">
                    <LineSectionTitle accent={accent}>Skills</LineSectionTitle>
                    <div className="flex flex-wrap gap-2">
                        {skills.map((skill, i) => (
                            <span key={i} className="px-3 py-1 text-sm border rounded-full" style={{ borderColor: accent + "40", color: accent }}>
                                {typeof skill === "string" ? skill : skill.name || skill}
                            </span>
                        ))}
                    </div>
                </section>
            )}

            {projects.length > 0 && (
                <section className="mb-8">
                    <LineSectionTitle accent={accent}>Projects</LineSectionTitle>
                    <div className="space-y-3">
                        {projects.map((proj, i) => (
                            <div key={i}>
                                <div className="flex justify-between items-baseline">
                                    <Editable onBlur={(e) => handleBlur("projects", "name", e.target.innerText, i)} className="text-[14px] font-bold text-slate-900">{proj.name}</Editable>
                                    {(proj.startDate || proj.endDate) && <Editable onBlur={(e) => handleBlur("projects", "dateRange", e.target.innerText, i)} className="text-[11px] font-bold tracking-wider" style={{ color: accent }}>{proj.dateRange || `${proj.startDate || ""} – ${proj.endDate || ""}`}</Editable>}
                                </div>
                                <Editable tag="p" onBlur={(e) => handleBlur("projects", "description", e.target.innerText, i)} className="text-sm text-slate-600 dark:text-slate-400">{proj.description}</Editable>
                                {proj.technologies && <div className="flex flex-wrap gap-1 mt-1">{(Array.isArray(proj.technologies) ? proj.technologies : proj.technologies.split(",")).map((t, j) => <span key={j} className="text-[11px] px-2 py-0.5 border rounded-full" style={{ borderColor: accent + "30", color: accent }}>{t.trim()}</span>)}</div>}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {certifications.length > 0 && (
                <section className="mb-8">
                    <LineSectionTitle accent={accent}>Certifications</LineSectionTitle>
                    <div className="space-y-1.5 text-sm">{certifications.map((cert, i) => <div key={i} className="flex justify-between"><span><Editable onBlur={(e) => handleBlur("certifications", "name", e.target.innerText, i)} className="font-bold text-slate-900">{cert.name}</Editable> — <Editable onBlur={(e) => handleBlur("certifications", "issuer", e.target.innerText, i)} className="italic" style={{ color: accent }}>{cert.issuer}</Editable></span><Editable onBlur={(e) => handleBlur("certifications", "date", e.target.innerText, i)} className="text-[11px] font-bold tracking-wider" style={{ color: accent }}>{cert.date}</Editable></div>)}</div>
                </section>
            )}

            {awards.length > 0 && (
                <section className="mb-8">
                    <LineSectionTitle accent={accent}>Awards</LineSectionTitle>
                    <div className="space-y-1.5 text-sm">{awards.map((a, i) => <div key={i} className="flex justify-between"><span><Editable onBlur={(e) => handleBlur("awards", "title", e.target.innerText, i)} className="font-bold text-slate-900">{a.title}</Editable> — <Editable onBlur={(e) => handleBlur("awards", "org", e.target.innerText, i)} className="italic" style={{ color: accent }}>{a.org}</Editable></span><Editable onBlur={(e) => handleBlur("awards", "date", e.target.innerText, i)} className="text-[11px] font-bold tracking-wider" style={{ color: accent }}>{a.date}</Editable></div>)}</div>
                </section>
            )}

            {languages.length > 0 && (
                <section className="mb-8">
                    <LineSectionTitle accent={accent}>Languages</LineSectionTitle>
                    <p className="text-sm">{languages.map((lang, i) => <span key={i}><Editable onBlur={(e) => handleBlur("languages", "language", e.target.innerText, i)} className="font-semibold">{lang.language}</Editable>{lang.level && <span style={{ color: accent }}> ({lang.level})</span>}{i < languages.length - 1 ? ", " : ""}</span>)}</p>
                </section>
            )}

            {customSections.map((section, i) => (
                <section key={i} className="mb-8">
                    <LineSectionTitle accent={accent}>{section.title}</LineSectionTitle>
                    <Editable tag="p" onBlur={(e) => handleBlur("customSections", "content", e.target.innerText, i)} className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 whitespace-pre-line">{section.content}</Editable>
                </section>
            ))}

            <AddSectionBar addSectionType={addSectionType} />
        </div>
    );
}

// ─── Template 8: Bold ────────────────────────────────────────────
export function BoldTemplate({ data, onUpdate, handleBlur, addSectionType }) {
    const { personalInfo, experience = [], education = [], skills = [], projects = [], certifications = [], awards = [], languages = [], customSections = [] } = data;
    const displayName = personalInfo.fullName || personalInfo.name;
    const accent = "#dc2626";

    return (
        <div className="bg-white dark:bg-slate-900 min-h-[1000px] text-slate-900 dark:text-slate-100 font-sans">
            <div className="px-10 py-8" style={{ background: `linear-gradient(135deg, #1a1a1a, #333)` }}>
                <Editable onBlur={(e) => handleBlur("personalInfo", "fullName", e.target.innerText)} className="text-4xl font-black text-white tracking-tight uppercase">{displayName || "Your Name"}</Editable>
                <Editable onBlur={(e) => handleBlur("personalInfo", "jobTitle", e.target.innerText)} className="text-lg font-light mt-1" style={{ color: accent }}>{personalInfo.jobTitle || "Job Title"}</Editable>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[12px] text-slate-400">
                    {getContactItems(personalInfo).map((item, i) => (
                        <div key={i} className={`flex items-center gap-1.5 ${!item.value ? "opacity-30" : ""}`}>
                            <item.icon size={10} />
                            <Editable onBlur={(e) => handleBlur("personalInfo", item.field, e.target.innerText)}>{item.value || item.label}</Editable>
                        </div>
                    ))}
                </div>
            </div>

            <div className="px-10 py-6">
                {(personalInfo.summary || data.summary) && (
                    <section className="mb-6">
                        <h3 className="text-lg font-black uppercase tracking-wide mb-2 pb-1 border-b-3" style={{ color: accent, borderColor: accent }}>{personalInfo.summary ? "Summary" : "Summary"}</h3>
                        <Editable tag="p" onBlur={(e) => handleBlur("personalInfo", "summary", e.target.innerText)} className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">{personalInfo.summary || data.summary}</Editable>
                    </section>
                )}

                {experience.length > 0 && (
                    <section className="mb-6">
                        <h3 className="text-lg font-black uppercase tracking-wide mb-3 pb-1 border-b-3" style={{ color: accent, borderColor: accent }}>Experience</h3>
                        <div className="space-y-4">
                            {experience.map((exp, i) => (
                                <div key={i}>
                                    <div className="flex justify-between items-baseline">
                                        <Editable onBlur={(e) => handleBlur("experience", "title", e.target.innerText, i)} className="text-[15px] font-black text-slate-900 dark:text-white">{exp.title}</Editable>
                                        <Editable onBlur={(e) => handleBlur("experience", "dateRange", e.target.innerText, i)} className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">{exp.dateRange || `${exp.startDate || ""} – ${exp.endDate || ""}`}</Editable>
                                    </div>
                                    <Editable onBlur={(e) => handleBlur("experience", "company", e.target.innerText, i)} className="text-sm font-bold mb-1" style={{ color: accent }}>{exp.company}{exp.location ? ` | ${exp.location}` : ""}</Editable>
                                    <Editable tag="p" onBlur={(e) => handleBlur("experience", "description", e.target.innerText, i)} className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 whitespace-pre-line">{exp.description}</Editable>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {education.length > 0 && (
                    <section className="mb-6">
                        <h3 className="text-lg font-black uppercase tracking-wide mb-3 pb-1 border-b-3" style={{ color: accent, borderColor: accent }}>Education</h3>
                        <div className="space-y-2">
                            {education.map((edu, i) => (
                                <div key={i} className="flex justify-between items-baseline">
                                    <div><Editable onBlur={(e) => handleBlur("education", "degree", e.target.innerText, i)} className="text-[15px] font-black text-slate-900">{edu.degree}</Editable> <span className="text-slate-300">|</span> <Editable onBlur={(e) => handleBlur("education", "school", e.target.innerText, i)} className="font-bold" style={{ color: accent }}>{edu.school}</Editable></div>
                                    <Editable onBlur={(e) => handleBlur("education", "dateRange", e.target.innerText, i)} className="text-[12px] font-bold text-slate-500 uppercase tracking-wider shrink-0">{edu.dateRange || `${edu.startDate || ""} – ${edu.endDate || ""}`}</Editable>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {skills.length > 0 && (
                    <section className="mb-6">
                        <h3 className="text-lg font-black uppercase tracking-wide mb-3 pb-1 border-b-3" style={{ color: accent, borderColor: accent }}>Skills</h3>
                        <div className="flex flex-wrap gap-2">
                            {skills.map((skill, i) => (
                                <span key={i} className="px-3 py-1 text-sm font-bold rounded" style={{ background: accent + "15", color: accent }}>{typeof skill === "string" ? skill : skill.name || skill}</span>
                            ))}
                        </div>
                    </section>
                )}

                {projects.length > 0 && (
                    <section className="mb-6">
                        <h3 className="text-lg font-black uppercase tracking-wide mb-3 pb-1 border-b-3" style={{ color: accent, borderColor: accent }}>Projects</h3>
                        <div className="space-y-3">
                            {projects.map((proj, i) => (
                                <div key={i}>
                                    <div className="flex justify-between items-baseline">
                                        <Editable onBlur={(e) => handleBlur("projects", "name", e.target.innerText, i)} className="text-[14px] font-black text-slate-900">{proj.name}</Editable>
                                        {(proj.startDate || proj.endDate) && <Editable onBlur={(e) => handleBlur("projects", "dateRange", e.target.innerText, i)} className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{proj.dateRange || `${proj.startDate || ""} – ${proj.endDate || ""}`}</Editable>}
                                    </div>
                                    <Editable tag="p" onBlur={(e) => handleBlur("projects", "description", e.target.innerText, i)} className="text-sm text-slate-600 dark:text-slate-400">{proj.description}</Editable>
                                    {proj.technologies && <div className="flex flex-wrap gap-1 mt-1">{(Array.isArray(proj.technologies) ? proj.technologies : proj.technologies.split(",")).map((t, j) => <span key={j} className="text-[10px] px-2 py-0.5 rounded font-bold" style={{ background: accent + "15", color: accent }}>{t.trim()}</span>)}</div>}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {certifications.length > 0 && (
                    <section className="mb-6">
                        <h3 className="text-lg font-black uppercase tracking-wide mb-2 pb-1 border-b-3" style={{ color: accent, borderColor: accent }}>Certifications</h3>
                        <div className="space-y-1 text-sm">{certifications.map((cert, i) => <div key={i} className="flex justify-between"><span className="font-bold">{cert.name} <span className="text-slate-400 font-normal">—</span> <span style={{ color: accent }}>{cert.issuer}</span></span><span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{cert.date}</span></div>)}</div>
                    </section>
                )}

                {awards.length > 0 && (
                    <section className="mb-6">
                        <h3 className="text-lg font-black uppercase tracking-wide mb-2 pb-1 border-b-3" style={{ color: accent, borderColor: accent }}>Awards</h3>
                        <div className="space-y-1 text-sm">{awards.map((a, i) => <div key={i} className="flex justify-between"><span className="font-bold">{a.title} <span className="text-slate-400 font-normal">—</span> <span style={{ color: accent }}>{a.org}</span></span><span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{a.date}</span></div>)}</div>
                    </section>
                )}

                {languages.length > 0 && (
                    <section className="mb-6">
                        <h3 className="text-lg font-black uppercase tracking-wide mb-2 pb-1 border-b-3" style={{ color: accent, borderColor: accent }}>Languages</h3>
                        <p className="text-sm">{languages.map((lang, i) => <span key={i}><strong>{lang.language}</strong>{lang.level && <span style={{ color: accent }}> ({lang.level})</span>}{i < languages.length - 1 ? ", " : ""}</span>)}</p>
                    </section>
                )}

                {customSections.map((section, i) => (
                    <section key={i} className="mb-6">
                        <h3 className="text-lg font-black uppercase tracking-wide mb-2 pb-1 border-b-3" style={{ color: accent, borderColor: accent }}>{section.title}</h3>
                        <Editable tag="p" onBlur={(e) => handleBlur("customSections", "content", e.target.innerText, i)} className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 whitespace-pre-line">{section.content}</Editable>
                    </section>
                ))}
            </div>
            <AddSectionBar addSectionType={addSectionType} />
        </div>
    );
}

// ─── Template 9: Compact ─────────────────────────────────────────
export function CompactTemplate({ data, onUpdate, handleBlur, addSectionType }) {
    const { personalInfo, experience = [], education = [], skills = [], projects = [], certifications = [], awards = [], languages = [], customSections = [] } = data;
    const displayName = personalInfo.fullName || personalInfo.name;
    const accent = "#475569";

    return (
        <div className="bg-white dark:bg-slate-900 min-h-[1000px] text-slate-900 dark:text-slate-100 font-sans px-8 py-6 text-[13px]">
            <header className="mb-4 pb-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-end">
                <div>
                    <Editable onBlur={(e) => handleBlur("personalInfo", "fullName", e.target.innerText)} className="text-2xl font-bold text-slate-900 dark:text-white">{displayName || "Your Name"}</Editable>
                    <Editable onBlur={(e) => handleBlur("personalInfo", "jobTitle", e.target.innerText)} className="text-sm" style={{ color: accent }}>{personalInfo.jobTitle || "Job Title"}</Editable>
                </div>
                <div className="text-right text-[11px] text-slate-500 space-y-0.5">
                    {getContactItems(personalInfo).filter(c => c.value).map((item, i) => (
                        <div key={i} className="flex items-center justify-end gap-1">
                            <Editable onBlur={(e) => handleBlur("personalInfo", item.field, e.target.innerText)}>{item.value}</Editable>
                        </div>
                    ))}
                </div>
            </header>

            {(personalInfo.summary || data.summary) && (
                <section className="mb-3">
                    <Editable tag="p" onBlur={(e) => handleBlur("personalInfo", "summary", e.target.innerText)} className="text-[12px] leading-relaxed text-slate-600 dark:text-slate-400">{personalInfo.summary || data.summary}</Editable>
                </section>
            )}

            {skills.length > 0 && (
                <section className="mb-3">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: accent }}>Skills</h3>
                    <p className="text-[12px] text-slate-600 dark:text-slate-400">{skills.map((s, i) => <span key={i}><Editable>{typeof s === "string" ? s : s.name || s}</Editable>{i < skills.length - 1 ? " · " : ""}</span>)}</p>
                </section>
            )}

            {experience.length > 0 && (
                <section className="mb-3">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: accent }}>Experience</h3>
                    <div className="space-y-2.5">
                        {experience.map((exp, i) => (
                            <div key={i}>
                                <div className="flex justify-between items-baseline">
                                    <div className="flex items-baseline gap-1.5">
                                        <Editable onBlur={(e) => handleBlur("experience", "title", e.target.innerText, i)} className="font-bold text-slate-900 dark:text-white">{exp.title}</Editable>
                                        <span className="text-slate-300">@</span>
                                        <Editable onBlur={(e) => handleBlur("experience", "company", e.target.innerText, i)} className="font-medium" style={{ color: accent }}>{exp.company}</Editable>
                                    </div>
                                    <Editable onBlur={(e) => handleBlur("experience", "dateRange", e.target.innerText, i)} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">{exp.dateRange || `${exp.startDate || ""} – ${exp.endDate || ""}`}</Editable>
                                </div>
                                <Editable tag="p" onBlur={(e) => handleBlur("experience", "description", e.target.innerText, i)} className="text-[12px] leading-relaxed text-slate-600 dark:text-slate-400 whitespace-pre-line">{exp.description}</Editable>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {education.length > 0 && (
                <section className="mb-3">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: accent }}>Education</h3>
                    <div className="space-y-1.5">
                        {education.map((edu, i) => (
                            <div key={i} className="flex justify-between items-baseline">
                                <div className="flex items-baseline gap-1.5">
                                    <Editable onBlur={(e) => handleBlur("education", "degree", e.target.innerText, i)} className="font-bold text-slate-900">{edu.degree}</Editable>
                                    <span className="text-slate-300">@</span>
                                    <Editable onBlur={(e) => handleBlur("education", "school", e.target.innerText, i)} style={{ color: accent }}>{edu.school}</Editable>
                                </div>
                                <Editable onBlur={(e) => handleBlur("education", "dateRange", e.target.innerText, i)} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">{edu.dateRange || `${edu.startDate || ""} – ${edu.endDate || ""}`}</Editable>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {projects.length > 0 && (
                <section className="mb-3">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color: accent }}>Projects</h3>
                    <div className="space-y-2">
                        {projects.map((proj, i) => (
                            <div key={i}>
                                <div className="flex justify-between items-baseline">
                                    <Editable onBlur={(e) => handleBlur("projects", "name", e.target.innerText, i)} className="font-bold text-slate-900">{proj.name}</Editable>
                                    {(proj.startDate || proj.endDate) && <Editable onBlur={(e) => handleBlur("projects", "dateRange", e.target.innerText, i)} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{proj.dateRange || `${proj.startDate || ""} – ${proj.endDate || ""}`}</Editable>}
                                </div>
                                <Editable tag="p" onBlur={(e) => handleBlur("projects", "description", e.target.innerText, i)} className="text-[12px] text-slate-600 dark:text-slate-400">{proj.description}</Editable>
                                {proj.technologies && <div className="flex flex-wrap gap-0.5 mt-0.5">{(Array.isArray(proj.technologies) ? proj.technologies : proj.technologies.split(",")).map((t, j) => <span key={j} className="text-[9px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded">{t.trim()}</span>)}</div>}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {certifications.length > 0 && (
                <section className="mb-3">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: accent }}>Certifications</h3>
                    <p className="text-[12px] text-slate-600">{certifications.map((c, i) => <span key={i}><Editable className="font-semibold">{c.name}</Editable> ({c.issuer}, {c.date}){i < certifications.length - 1 ? "; " : ""}</span>)}</p>
                </section>
            )}

            {awards.length > 0 && (
                <section className="mb-3">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: accent }}>Awards</h3>
                    <p className="text-[12px] text-slate-600">{awards.map((a, i) => <span key={i}><Editable className="font-semibold">{a.title}</Editable> ({a.org}, {a.date}){i < awards.length - 1 ? "; " : ""}</span>)}</p>
                </section>
            )}

            {languages.length > 0 && (
                <section className="mb-3">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: accent }}>Languages</h3>
                    <p className="text-[12px] text-slate-600">{languages.map((l, i) => <span key={i}><Editable className="font-semibold">{l.language}</Editable>{l.level ? ` (${l.level})` : ""}{i < languages.length - 1 ? ", " : ""}</span>)}</p>
                </section>
            )}

            {customSections.map((section, i) => (
                <section key={i} className="mb-3">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: accent }}>{section.title}</h3>
                    <Editable tag="p" onBlur={(e) => handleBlur("customSections", "content", e.target.innerText, i)} className="text-[12px] leading-relaxed text-slate-600 dark:text-slate-400 whitespace-pre-line">{section.content}</Editable>
                </section>
            ))}

            <AddSectionBar addSectionType={addSectionType} />
        </div>
    );
}

// ─── Template 10: Professional (Two-Column) ──────────────────────
export function ProfessionalTemplate({ data, onUpdate, handleBlur, addSectionType }) {
    const { personalInfo, experience = [], education = [], skills = [], projects = [], certifications = [], awards = [], languages = [], customSections = [] } = data;
    const displayName = personalInfo.fullName || personalInfo.name;
    const accent = "#1d4ed8";

    return (
        <div className="w-full">
            <div className="bg-white dark:bg-slate-900 min-h-[1000px] text-slate-900 dark:text-slate-100 flex font-sans">
                <div className="flex-1 p-8">
                <header className="mb-6">
                    <Editable onBlur={(e) => handleBlur("personalInfo", "fullName", e.target.innerText)} className="text-3xl font-black text-slate-900 dark:text-white" style={{ color: accent }}>{displayName || "Your Name"}</Editable>
                    <Editable onBlur={(e) => handleBlur("personalInfo", "jobTitle", e.target.innerText)} className="text-sm text-slate-500 mt-1">{personalInfo.jobTitle || "Job Title"}</Editable>
                </header>

                {(personalInfo.summary || data.summary) && (
                    <section className="mb-5">
                        <h3 className="text-[11px] font-bold uppercase tracking-widest mb-2 pb-1 border-b-2" style={{ color: accent, borderColor: accent }}>Profile</h3>
                        <Editable tag="p" onBlur={(e) => handleBlur("personalInfo", "summary", e.target.innerText)} className="text-[12px] leading-relaxed text-slate-600 dark:text-slate-400">{personalInfo.summary || data.summary}</Editable>
                    </section>
                )}

                {experience.length > 0 && (
                    <section className="mb-5">
                        <h3 className="text-[11px] font-bold uppercase tracking-widest mb-2 pb-1 border-b-2" style={{ color: accent, borderColor: accent }}>Experience</h3>
                        <div className="space-y-3.5">
                            {experience.map((exp, i) => (
                                <div key={i}>
                                    <div className="flex justify-between items-baseline">
                                        <Editable onBlur={(e) => handleBlur("experience", "title", e.target.innerText, i)} className="text-[14px] font-bold text-slate-900 dark:text-white">{exp.title}</Editable>
                                        <Editable onBlur={(e) => handleBlur("experience", "dateRange", e.target.innerText, i)} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">{exp.dateRange || `${exp.startDate || ""} – ${exp.endDate || ""}`}</Editable>
                                    </div>
                                    <Editable onBlur={(e) => handleBlur("experience", "company", e.target.innerText, i)} className="text-sm font-medium mb-0.5" style={{ color: accent }}>{exp.company}{exp.location ? `, ${exp.location}` : ""}</Editable>
                                    <Editable tag="p" onBlur={(e) => handleBlur("experience", "description", e.target.innerText, i)} className="text-[12px] leading-relaxed text-slate-600 dark:text-slate-400 whitespace-pre-line">{exp.description}</Editable>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {education.length > 0 && (
                    <section className="mb-5">
                        <h3 className="text-[11px] font-bold uppercase tracking-widest mb-2 pb-1 border-b-2" style={{ color: accent, borderColor: accent }}>Education</h3>
                        <div className="space-y-2">
                            {education.map((edu, i) => (
                                <div key={i} className="flex justify-between items-baseline">
                                    <div>
                                        <Editable onBlur={(e) => handleBlur("education", "degree", e.target.innerText, i)} className="text-[14px] font-bold text-slate-900">{edu.degree}</Editable>
                                        <span className="text-slate-300 mx-1">·</span>
                                        <Editable onBlur={(e) => handleBlur("education", "school", e.target.innerText, i)} className="text-sm" style={{ color: accent }}>{edu.school}</Editable>
                                    </div>
                                    <Editable onBlur={(e) => handleBlur("education", "dateRange", e.target.innerText, i)} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">{edu.dateRange || `${edu.startDate || ""} – ${edu.endDate || ""}`}</Editable>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {projects.length > 0 && (
                    <section className="mb-5">
                        <h3 className="text-[11px] font-bold uppercase tracking-widest mb-2 pb-1 border-b-2" style={{ color: accent, borderColor: accent }}>Projects</h3>
                        <div className="space-y-2.5">
                            {projects.map((proj, i) => (
                                <div key={i}>
                                    <div className="flex justify-between items-baseline">
                                        <Editable onBlur={(e) => handleBlur("projects", "name", e.target.innerText, i)} className="text-[13px] font-bold text-slate-900">{proj.name}</Editable>
                                        {(proj.startDate || proj.endDate) && <Editable onBlur={(e) => handleBlur("projects", "dateRange", e.target.innerText, i)} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{proj.dateRange || `${proj.startDate || ""} – ${proj.endDate || ""}`}</Editable>}
                                    </div>
                                    <Editable tag="p" onBlur={(e) => handleBlur("projects", "description", e.target.innerText, i)} className="text-[12px] text-slate-600 dark:text-slate-400">{proj.description}</Editable>
                                    {proj.technologies && <div className="flex flex-wrap gap-1 mt-0.5">{(Array.isArray(proj.technologies) ? proj.technologies : proj.technologies.split(",")).map((t, j) => <span key={j} className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ background: accent + "15", color: accent }}>{t.trim()}</span>)}</div>}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {awards.length > 0 && (
                    <section className="mb-5">
                        <h3 className="text-[11px] font-bold uppercase tracking-widest mb-2 pb-1 border-b-2" style={{ color: accent, borderColor: accent }}>Awards</h3>
                        <div className="space-y-1 text-[12px]">{awards.map((a, i) => <div key={i} className="flex justify-between"><span><strong>{a.title}</strong> — <span style={{ color: accent }}>{a.org}</span></span><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{a.date}</span></div>)}</div>
                    </section>
                )}

                {customSections.map((section, i) => (
                    <section key={i} className="mb-5">
                        <h3 className="text-[11px] font-bold uppercase tracking-widest mb-2 pb-1 border-b-2" style={{ color: accent, borderColor: accent }}>{section.title}</h3>
                        <Editable tag="p" onBlur={(e) => handleBlur("customSections", "content", e.target.innerText, i)} className="text-[12px] leading-relaxed text-slate-600 dark:text-slate-400 whitespace-pre-line">{section.content}</Editable>
                    </section>
                ))}
            </div>

            <div className="w-56 shrink-0 p-5 text-white" style={{ background: `linear-gradient(180deg, ${accent}, ${accent}cc)` }}>
                <SideSectionTitle accent="white">Contact</SideSectionTitle>
                <div className="space-y-2 text-[11px] text-white/80">
                    {getContactItems(personalInfo).map((item, i) => (
                        <div key={i} className={`flex items-center gap-1.5 ${!item.value ? "opacity-30" : ""}`}>
                            <item.icon size={10} />
                            <Editable onBlur={(e) => handleBlur("personalInfo", item.field, e.target.innerText)} className="break-all">{item.value || item.label}</Editable>
                        </div>
                    ))}
                </div>

                {skills.length > 0 && (
                    <>
                        <SideSectionTitle accent="white">Skills</SideSectionTitle>
                        <div className="space-y-1">
                            {skills.map((skill, i) => (
                                <div key={i} className="text-[11px] text-white/90 flex items-center gap-1.5">
                                    <div className="w-1 h-1 rounded-full bg-white/50" />
                                    <Editable>{typeof skill === "string" ? skill : skill.name || skill}</Editable>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {languages.length > 0 && (
                    <>
                        <SideSectionTitle accent="white">Languages</SideSectionTitle>
                        <div className="space-y-1 text-[11px] text-white/80">
                            {languages.map((lang, i) => (
                                <div key={i}><Editable onBlur={(e) => handleBlur("languages", "language", e.target.innerText, i)}>{lang.language}</Editable>{lang.level && <span className="text-white/50"> · {lang.level}</span>}</div>
                            ))}
                        </div>
                    </>
                )}

                {certifications.length > 0 && (
                    <>
                        <SideSectionTitle accent="white">Certifications</SideSectionTitle>
                        <div className="space-y-2 text-[10px] text-white/80">
                            {certifications.map((cert, i) => (
                                <div key={i}>
                                    <Editable onBlur={(e) => handleBlur("certifications", "name", e.target.innerText, i)} className="font-semibold text-white">{cert.name}</Editable>
                                    <div className="text-white/60">{cert.issuer} · {cert.date}</div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
            </div>
            <AddSectionBar addSectionType={addSectionType} />
        </div>
    );
}

// ─── Template Map ────────────────────────────────────────────────
export const TEMPLATE_COMPONENTS = {
    classic: ClassicTemplate,
    modern: ModernTemplate,
    executive: ExecutiveTemplate,
    minimal: MinimalTemplate,
    creative: CreativeTemplate,
    technical: TechnicalTemplate,
    elegant: ElegantTemplate,
    bold: BoldTemplate,
    compact: CompactTemplate,
    professional: ProfessionalTemplate,
};
