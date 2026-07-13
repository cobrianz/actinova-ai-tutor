"use client";

import React, { useState, useMemo } from "react";
import {
  BookOpen,
  Clock,
  Layers,
  ArrowRight,
  Search,
  Filter,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { apiClient } from "@/lib/csrfClient";
import planTemplates, {
  planCategories,
  planDifficulties,
} from "@/lib/planTemplates";

const difficultyConfig = {
  beginner: {
    label: "Beginner",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  intermediate: {
    label: "Intermediate",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  advanced: {
    label: "Advanced",
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
};

const typeConfig = {
  lesson: { color: "text-green-500", bg: "bg-green-500/10" },
  practice: { color: "text-orange-500", bg: "bg-orange-500/10" },
  review: { color: "text-purple-500", bg: "bg-purple-500/10" },
  quiz: { color: "text-emerald-500", bg: "bg-emerald-500/10" },
  project: { color: "text-rose-500", bg: "bg-rose-500/10" },
};

export default function PlanTemplates({ onUseTemplate, onBack }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [difficultyFilter, setDifficultyFilter] = useState("All");
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showDifficultyDropdown, setShowDifficultyDropdown] = useState(false);
  const [applying, setApplying] = useState(false);

  const filteredTemplates = useMemo(() => {
    return planTemplates.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory =
        categoryFilter === "All" || t.category === categoryFilter;
      const matchesDifficulty =
        difficultyFilter === "All" || t.difficulty === difficultyFilter;
      return matchesSearch && matchesCategory && matchesDifficulty;
    });
  }, [searchQuery, categoryFilter, difficultyFilter]);

  const totalTasks = (template) =>
    template.weeks.reduce(
      (sum, w) =>
        sum + w.days.reduce((dSum, d) => dSum + d.tasks.length, 0),
      0
    );

  const totalMinutes = (template) =>
    template.weeks.reduce(
      (sum, w) =>
        sum +
        w.days.reduce(
          (dSum, d) =>
            dSum +
            d.tasks.reduce((tSum, t) => tSum + t.estimatedMinutes, 0),
          0
        ),
      0
    );

  const handleUseTemplate = async (template) => {
    setApplying(true);
    try {
      const res = await apiClient.post("/api/study-plan", {
        topic: template.title,
        goal: template.description,
        weeks: template.durationWeeks,
        difficulty: template.difficulty,
        templateData: template,
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(`"${template.title}" plan created!`);
        if (onUseTemplate) {
          onUseTemplate(data.plan, data.planId || data.plan?._id);
        }
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create plan from template");
      }
    } catch {
      toast.error("Failed to create study plan from template");
    } finally {
      setApplying(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2
            className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2.5"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Layers className="w-4.5 h-4.5 text-purple-600 dark:text-purple-400" />
            </div>
            Plan Templates
          </h2>
          <p className="text-sm text-muted-foreground mt-1 ml-[46px]">
            Pre-built study plans you can apply instantly
          </p>
        </div>
        <button
          onClick={onBack}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5 group"
        >
          <span className="group-hover:-translate-x-0.5 transition-transform">
            &larr;
          </span>
          Back to Library
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm text-foreground text-sm placeholder-foreground/30 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/40 transition-all"
          />
        </div>

        {/* Category Filter */}
        <div className="relative">
          <button
            onClick={() => {
              setShowCategoryDropdown(!showCategoryDropdown);
              setShowDifficultyDropdown(false);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border/60 bg-card/80 text-sm text-foreground hover:bg-secondary/50 transition-colors min-w-[140px] justify-between"
          >
            <span className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-muted-foreground" />
              {categoryFilter}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${showCategoryDropdown ? "rotate-180" : ""}`}
            />
          </button>
          <AnimatePresence>
            {showCategoryDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute top-full mt-1 left-0 right-0 z-20 bg-card border border-border rounded-xl shadow-lg overflow-hidden"
              >
                {["All", ...planCategories].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setCategoryFilter(cat);
                      setShowCategoryDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-secondary/50 transition-colors ${
                      categoryFilter === cat
                        ? "text-purple-600 dark:text-purple-400 font-medium"
                        : "text-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Difficulty Filter */}
        <div className="relative">
          <button
            onClick={() => {
              setShowDifficultyDropdown(!showDifficultyDropdown);
              setShowCategoryDropdown(false);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border/60 bg-card/80 text-sm text-foreground hover:bg-secondary/50 transition-colors min-w-[140px] justify-between"
          >
            <span className="flex items-center gap-2">
              <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
              {difficultyFilter === "All"
                ? "All Levels"
                : difficultyConfig[difficultyFilter]?.label}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${showDifficultyDropdown ? "rotate-180" : ""}`}
            />
          </button>
          <AnimatePresence>
            {showDifficultyDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute top-full mt-1 left-0 right-0 z-20 bg-card border border-border rounded-xl shadow-lg overflow-hidden"
              >
                {["All", ...planDifficulties].map((diff) => (
                  <button
                    key={diff}
                    onClick={() => {
                      setDifficultyFilter(diff);
                      setShowDifficultyDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-secondary/50 transition-colors ${
                      difficultyFilter === diff
                        ? "text-purple-600 dark:text-purple-400 font-medium"
                        : "text-foreground"
                    }`}
                  >
                    {diff === "All"
                      ? "All Levels"
                      : difficultyConfig[diff]?.label || diff}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Template Grid / Preview Split */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Grid */}
        <div
          className={`${selectedTemplate ? "lg:w-1/2" : "w-full"} transition-all`}
        >
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-16">
              <Search className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No templates match your filters
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map((template, idx) => {
                const d = difficultyConfig[template.difficulty] || difficultyConfig.beginner;
                const isSelected = selectedTemplate?.id === template.id;
                const tasks = totalTasks(template);
                const hours = Math.round(totalMinutes(template) / 60 * 10) / 10;

                return (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    onClick={() =>
                      setSelectedTemplate(
                        isSelected ? null : template
                      )
                    }
                    className={`group rounded-2xl border overflow-hidden transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "border-purple-500/40 bg-purple-500/5 shadow-md"
                        : "border-border bg-card hover:shadow-md hover:border-purple-500/20"
                    }`}
                  >
                    <div className="p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0 text-xl border border-purple-500/15">
                          {template.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-foreground text-sm line-clamp-1">
                            {template.title}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {template.description}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full ${d.bg} ${d.color} border ${d.border}`}
                        >
                          {d.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {template.durationWeeks}w
                        </span>
                        <span className="flex items-center gap-1">
                          <Layers className="w-3 h-3" />
                          {tasks} tasks
                        </span>
                        <span className="text-muted-foreground/60">
                          ~{hours}h
                        </span>
                        <span className="ml-auto text-[10px] text-muted-foreground/50 font-medium uppercase tracking-wider">
                          {template.category}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Preview Panel */}
        <AnimatePresence>
          {selectedTemplate && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="lg:w-1/2"
            >
              <div className="sticky top-4 rounded-2xl border border-border bg-card overflow-hidden">
                {/* Preview Header */}
                <div className="p-5 border-b border-border/60">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-2xl border border-purple-500/15">
                      {selectedTemplate.icon}
                    </div>
                    <div className="flex-1">
                      <h3
                        className="font-bold text-foreground"
                        style={{
                          fontFamily:
                            "'Playfair Display', Georgia, serif",
                        }}
                      >
                        {selectedTemplate.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {selectedTemplate.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {selectedTemplate.durationWeeks} weeks
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      {totalTasks(selectedTemplate)} tasks
                    </span>
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      {selectedTemplate.category}
                    </span>
                  </div>
                </div>

                {/* Week Preview */}
                <div className="p-5 max-h-[420px] overflow-y-auto space-y-4">
                  {selectedTemplate.weeks.map((week, wi) => (
                    <div key={wi}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-lg bg-purple-500/10 flex items-center justify-center text-[10px] font-bold text-purple-600 dark:text-purple-400">
                          {wi + 1}
                        </div>
                        <h4 className="text-sm font-semibold text-foreground">
                          {week.title}
                        </h4>
                      </div>
                      {week.days.map((day, di) => (
                        <div key={di} className="ml-8 mb-2">
                          <p className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wider mb-1">
                            {day.label}
                          </p>
                          <div className="space-y-1">
                            {day.tasks.map((task, ti) => {
                              const tc =
                                typeConfig[task.type] || typeConfig.lesson;
                              return (
                                <div
                                  key={ti}
                                  className="flex items-center gap-2 text-xs"
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${tc.bg.replace("/10", "")}`}
                                    style={{
                                      backgroundColor:
                                        task.type === "lesson"
                                          ? "#22c55e"
                                          : task.type === "practice"
                                            ? "#f97316"
                                            : task.type === "review"
                                              ? "#a855f7"
                                              : task.type === "quiz"
                                                ? "#10b981"
                                                : "#f43f5e",
                                    }}
                                  />
                                  <span className="text-foreground truncate">
                                    {task.title}
                                  </span>
                                  <span className="text-muted-foreground/50 ml-auto shrink-0">
                                    {task.estimatedMinutes}m
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Use Template Button */}
                <div className="p-5 border-t border-border/60">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUseTemplate(selectedTemplate);
                    }}
                    disabled={applying}
                    className="w-full flex items-center justify-center gap-2.5 py-3 px-5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all shadow-lg shadow-purple-500/25 hover:shadow-purple-500/35 active:scale-[0.98]"
                  >
                    {applying ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Creating Plan...
                      </>
                    ) : (
                      <>
                        Use This Template
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
