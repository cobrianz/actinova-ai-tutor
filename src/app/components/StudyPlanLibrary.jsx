"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  CalendarCheck,
  Plus,
  Clock,
  Trash2,
  BookOpen,
  CheckCircle2,
  Search,
  Sparkles,
  GraduationCap,
  Trophy,
  Zap,
  ArrowRight,
  Download,
  Share2,
  Link,
  Copy,
  Check,
} from "lucide-react";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import { apiClient } from "@/lib/csrfClient";
import { motion, AnimatePresence } from "framer-motion";
import StudyPlanGenerator from "./StudyPlanGenerator";
import StudyPlanViewer from "./StudyPlanViewer";
import StudyPlanLeaderboard from "./StudyPlanLeaderboard";


export default function StudyPlanLibrary({ setActiveContent }) {
  const [view, setView] = useState("library");
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [shareModalPlan, setShareModalPlan] = useState(null);
  const [shareUrl, setShareUrl] = useState("");
  const [shareLoading, setShareLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/api/study-plan/list");
      if (res.ok) {
        const data = await res.json();
        setPlans(data.items || []);
      }
    } catch (error) {
      console.error("Failed to fetch study plans:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view === "library") fetchPlans();
  }, [view, fetchPlans]);

  const handleGenerated = (plan, planId) => {
    setSelectedPlan(plan);
    setSelectedPlanId(planId);
    setView("viewer");
  };



  const handleViewPlan = async (planId) => {
    try {
      const res = await apiClient.get(`/api/study-plan/${planId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedPlan(data.plan);
        setSelectedPlanId(planId);
        setView("viewer");
      }
    } catch {
      toast.error("Failed to load study plan");
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!confirm("Delete this study plan?")) return;
    try {
      const res = await apiClient.delete(`/api/study-plan/${planId}`);
      if (res.ok) {
        toast.success("Study plan deleted");
        setPlans((prev) => prev.filter((p) => p._id !== planId));
        if (selectedPlanId === planId) {
          setView("library");
          setSelectedPlan(null);
          setSelectedPlanId(null);
        }
      }
    } catch {
      toast.error("Failed to delete study plan");
    }
  };

  const handleExportPlan = (plan, e) => {
    e.stopPropagation();
    const doc = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 18;
    const maxW = pageW - margin * 2;
    let y = margin;

    // Color palette
    const C = {
      green: [22, 163, 74],
      greenLight: [240, 253, 244],
      greenDark: [21, 128, 61],
      orange: [249, 115, 22],
      purple: [168, 85, 247],
      emerald: [16, 185, 129],
      rose: [244, 63, 94],
      gray100: [243, 244, 246],
      gray200: [229, 231, 235],
      gray400: [156, 163, 175],
      gray500: [107, 114, 128],
      gray700: [55, 65, 81],
      gray900: [17, 24, 39],
      white: [255, 255, 255],
    };

    const typeColors = {
      lesson: C.green,
      practice: C.orange,
      review: C.purple,
      quiz: C.emerald,
      project: C.rose,
    };

    const checkPage = (needed = 15) => {
      if (y + needed > pageH - margin - 10) {
        // Footer before page break
        drawFooter();
        doc.addPage();
        y = margin;
        drawHeader();
      }
    };

    const drawFooter = () => {
      const footerY = pageH - 8;
      doc.setDrawColor(...C.gray200);
      doc.setLineWidth(0.3);
      doc.line(margin, footerY - 3, pageW - margin, footerY - 3);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...C.gray400);
      doc.text("Actinova AI Tutor", margin, footerY);
      doc.text(`Page ${doc.internal.getCurrentPageInfo().pageNumber}`, pageW - margin, footerY, { align: "right" });
      doc.text(new Date().toLocaleDateString(), pageW / 2, footerY, { align: "center" });
    };

    const drawHeader = () => {
      doc.setFillColor(...C.green);
      doc.rect(0, 0, pageW, 3, "F");
    };

    const wrapText = (text, fontSize, maxWidth) => {
      doc.setFontSize(fontSize);
      return doc.splitTextToSize(text || "", maxWidth);
    };

    // ============= COVER PAGE =============
    // Green top accent bar
    doc.setFillColor(...C.green);
    doc.rect(0, 0, pageW, 4, "F");

    // Subtle side accent
    doc.setFillColor(...C.greenLight);
    doc.rect(0, 0, 4, pageH, "F");

    // Title block
    y = 40;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(32);
    doc.setTextColor(...C.green);
    const titleLines = wrapText(plan.title || "Study Plan", 32, maxW);
    doc.text(titleLines, margin + 6, y);
    y += titleLines.length * 12 + 4;

    // Accent line under title
    doc.setFillColor(...C.green);
    doc.roundedRect(margin + 6, y, 40, 1.5, 0.75, 0.75, "F");
    y += 10;

    // Overview
    if (plan.overview) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(...C.gray500);
      const overviewLines = wrapText(plan.overview, 11, maxW - 10);
      doc.text(overviewLines, margin + 6, y);
      y += overviewLines.length * 5.5 + 12;
    } else {
      y += 8;
    }

    // Stats cards
    const totalTasks = plan.totalTasks || 0;
    const completedTasks = plan.completedTasks || 0;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : plan.progress || 0;
    const totalMinutes = (plan.weeks || []).reduce((sum, w) =>
      sum + (w.days || []).reduce((dSum, d) =>
        dSum + (d.tasks || []).reduce((tSum, t) => tSum + (t.estimatedMinutes || 0), 0), 0), 0);
    const totalHours = Math.round(totalMinutes / 60 * 10) / 10;

    // Count by type
    const typeCounts = {};
    (plan.weeks || []).forEach((w) =>
      (w.days || []).forEach((d) =>
        (d.tasks || []).forEach((t) => {
          typeCounts[t.type] = (typeCounts[t.type] || 0) + 1;
        })
      )
    );

    const statsCards = [
      { label: "Duration", value: `${plan.durationWeeks || "–"} weeks`, color: C.green },
      { label: "Total Tasks", value: `${totalTasks}`, color: C.emerald },
      { label: "Est. Hours", value: `${totalHours}h`, color: C.orange },
      { label: "Progress", value: `${progress}%`, color: progress >= 100 ? C.green : C.purple },
    ];

    const cardW = (maxW - 10) / 4;
    statsCards.forEach((stat, i) => {
      const cx = margin + 6 + i * (cardW + 3.5);
      doc.setFillColor(...C.gray100);
      doc.roundedRect(cx, y, cardW, 22, 2, 2, "F");
      // Top color accent
      doc.setFillColor(...stat.color);
      doc.roundedRect(cx, y, cardW, 2, 1, 1, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(...stat.color);
      doc.text(stat.value, cx + cardW / 2, y + 11, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...C.gray500);
      doc.text(stat.label, cx + cardW / 2, y + 17, { align: "center" });
    });
    y += 30;

    // Progress bar
    doc.setFillColor(...C.gray200);
    doc.roundedRect(margin + 6, y, maxW - 10, 5, 2.5, 2.5, "F");
    if (progress > 0) {
      doc.setFillColor(...C.green);
      doc.roundedRect(margin + 6, y, Math.max(((maxW - 10) * progress) / 100, 5), 5, 2.5, 2.5, "F");
    }
    y += 12;

    // Task type breakdown
    const types = Object.entries(typeCounts).filter(([, c]) => c > 0);
    if (types.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...C.gray700);
      doc.text("TASK BREAKDOWN", margin + 6, y);
      y += 6;

      const barMaxW = maxW - 16;
      const barH = 4;
      types.forEach(([type, count], i) => {
        const barW = (count / totalTasks) * barMaxW;
        const color = typeColors[type] || C.green;
        const by = y + i * 8;

        doc.setFillColor(...C.gray200);
        doc.roundedRect(margin + 6, by, barMaxW, barH, 2, 2, "F");
        if (barW > 0) {
          doc.setFillColor(...color);
          doc.roundedRect(margin + 6, by, Math.max(barW, 4), barH, 2, 2, "F");
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7);
        doc.setTextColor(...C.gray700);
        doc.text(type.charAt(0).toUpperCase() + type.slice(1), margin + 6, by - 1);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(...C.gray500);
        doc.text(`${count} tasks`, margin + 6 + barMaxW, by - 1, { align: "right" });
      });
      y += types.length * 8 + 6;
    }

    // Resources
    if (plan.resources && plan.resources.length > 0) {
      checkPage(20 + plan.resources.length * 5);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...C.gray700);
      doc.text("RECOMMENDED RESOURCES", margin + 6, y);
      y += 6;

      plan.resources.forEach((resource) => {
        checkPage(6);
        doc.setFillColor(...C.greenLight);
        doc.roundedRect(margin + 4, y - 3, maxW - 8, 5, 1, 1, "F");
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...C.greenDark);
        doc.text(`>  ${resource}`, margin + 7, y);
        y += 6;
      });
      y += 4;
    }

    // Goals
    const allGoals = (plan.weeks || []).flatMap((w) => w.goals || []);
    if (allGoals.length > 0) {
      checkPage(15);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...C.gray700);
      doc.text("KEY GOALS", margin + 6, y);
      y += 6;

      allGoals.slice(0, 10).forEach((goal) => {
        checkPage(5);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...C.gray500);
        doc.text(`*  ${goal}`, margin + 7, y);
        y += 5;
      });
      y += 4;
    }

    // ============= WEEK PAGES =============
    if (plan.weeks && Array.isArray(plan.weeks)) {
      plan.weeks.forEach((week, wi) => {
        checkPage(30);

        // Week header bar
        doc.setFillColor(...C.green);
        doc.roundedRect(margin, y - 5, maxW, 12, 2, 2, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(...C.white);
        doc.text(`Week ${wi + 1}`, margin + 4, y + 1.5);
        if (week.title) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.text(`— ${week.title}`, margin + 28, y + 1.5);
        }

        // Week progress
        const weekTasks = (week.days || []).flatMap((d) => d.tasks || []);
        const weekCompleted = weekTasks.filter((t) => t.completed).length;
        const weekPct = weekTasks.length > 0 ? Math.round((weekCompleted / weekTasks.length) * 100) : 0;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text(`${weekPct}%`, pageW - margin - 4, y + 1.5, { align: "right" });
        y += 12;

        // Week mini progress bar
        doc.setFillColor(...C.gray200);
        doc.roundedRect(margin, y, maxW, 2, 1, 1, "F");
        if (weekPct > 0) {
          doc.setFillColor(180, 230, 180);
          doc.roundedRect(margin, y, (maxW * weekPct) / 100, 2, 1, 1, "F");
        }
        y += 5;

        // Week goals
        if (week.goals && week.goals.length > 0) {
          doc.setFont("helvetica", "italic");
          doc.setFontSize(8);
          doc.setTextColor(...C.gray500);
          const goalsText = "Goals: " + week.goals.join(" | ");
          const goalLines = wrapText(goalsText, 8, maxW - 4);
          doc.text(goalLines, margin + 2, y);
          y += goalLines.length * 3.5 + 3;
        }

        // Days
        if (week.days && Array.isArray(week.days)) {
          week.days.forEach((day, di) => {
            const dayLabel = day.label || ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][di] || `Day ${di + 1}`;
            const tasks = day.tasks || [];
            if (tasks.length === 0) return;

            const dayCompleted = tasks.filter((t) => t.completed).length;
            const dayPct = Math.round((dayCompleted / tasks.length) * 100);

            checkPage(10 + tasks.length * 8);

            // Day header
            doc.setFillColor(...C.gray100);
            doc.roundedRect(margin + 2, y - 3.5, maxW - 4, 8, 1.5, 1.5, "F");
            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.setTextColor(...C.gray700);
            doc.text(dayLabel, margin + 6, y + 1);
            doc.setFont("helvetica", "normal");
            doc.setFontSize(7);
            doc.setTextColor(...C.gray500);
            doc.text(`${dayCompleted}/${tasks.length} completed`, margin + 6, y + 5.5);

            // Day progress indicator
            doc.setFillColor(...C.gray200);
            doc.roundedRect(pageW - margin - 30, y + 0.5, 22, 2, 1, 1, "F");
            if (dayPct > 0) {
              doc.setFillColor(...C.green);
              doc.roundedRect(pageW - margin - 30, y + 0.5, Math.max((22 * dayPct) / 100, 2), 2, 1, 1, "F");
            }
            y += 8;

            // Tasks
            tasks.forEach((task) => {
              checkPage(8);
              const ty = y;
              const color = typeColors[task.type] || C.green;

              // Task color dot
              doc.setFillColor(...color);
              doc.circle(margin + 8, ty + 1, 1.5, "F");

              // Checkbox
              if (task.completed) {
                doc.setFillColor(...C.green);
                doc.roundedRect(margin + 12, ty - 1.5, 4, 4, 0.5, 0.5, "F");
                doc.setFont("helvetica", "bold");
                doc.setFontSize(6);
                doc.setTextColor(...C.white);
                doc.text("✓", margin + 13, ty + 1.5);
              } else {
                doc.setDrawColor(...C.gray400);
                doc.setLineWidth(0.3);
                doc.roundedRect(margin + 12, ty - 1.5, 4, 4, 0.5, 0.5, "S");
              }

              // Task title
              doc.setFont("helvetica", task.completed ? "normal" : "bold");
              doc.setFontSize(9);
              doc.setTextColor(task.completed ? C.gray400 : C.gray900);
              const taskTitle = task.title || "Task";
              const maxTitleW = maxW - 70;
              const titleText = wrapText(taskTitle, 9, maxTitleW);
              doc.text(titleText[0], margin + 19, ty + 1.5);

              // Estimated time
              if (task.estimatedMinutes) {
                doc.setFont("helvetica", "normal");
                doc.setFontSize(7);
                doc.setTextColor(...C.gray400);
                doc.text(`${task.estimatedMinutes} min`, pageW - margin - 2, ty + 1.5, { align: "right" });
              }

              // Type badge
              const typeName = task.type ? task.type.charAt(0).toUpperCase() + task.type.slice(1) : "";
              if (typeName) {
                doc.setFont("helvetica", "normal");
                doc.setFontSize(6);
                doc.setTextColor(...color);
                const badgeW = doc.getTextWidth(typeName) + 4;
                doc.setFillColor(...(color.map((c) => Math.min(c + 180, 255))));
                doc.roundedRect(pageW - margin - 22 - badgeW, ty - 0.5, badgeW, 3.5, 1, 1, "F");
                doc.setTextColor(...color);
                doc.text(typeName, pageW - margin - 22 - badgeW / 2 + badgeW / 2, ty + 1.8, { align: "center" });
              }

              y += 5;

              // Description
              if (task.description) {
                doc.setFont("helvetica", "normal");
                doc.setFontSize(7);
                doc.setTextColor(...C.gray500);
                const descLines = wrapText(task.description, 7, maxW - 28);
                doc.text(descLines.slice(0, 2), margin + 19, y);
                y += descLines.slice(0, 2).length * 3;
              }

              // Resources
              if (task.resources && task.resources.length > 0) {
                doc.setFont("helvetica", "normal");
                doc.setFontSize(6);
                doc.setTextColor(...C.green);
                const resText = Array.isArray(task.resources) ? task.resources.join(", ") : task.resources;
                doc.text(`Resources: ${resText}`.slice(0, 80), margin + 19, y);
                y += 3;
              }

              // Strikethrough for completed
              if (task.completed && titleText[0]) {
                doc.setDrawColor(...C.gray400);
                doc.setLineWidth(0.2);
                const tw = doc.getTextWidth(titleText[0]);
                doc.line(margin + 19, ty + 1, margin + 19 + tw, ty + 1);
              }

              y += 3;
            });

            y += 4;
          });
        }

        y += 4;
      });
    }

    // ============= FINAL PAGE: Summary =============
    checkPage(50);
    y += 10;

    // Completion summary box
    doc.setFillColor(...C.greenLight);
    doc.roundedRect(margin, y - 5, maxW, 40, 3, 3, "F");
    doc.setFillColor(...C.green);
    doc.roundedRect(margin, y - 5, maxW, 3, 1.5, 1.5, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...C.green);
    doc.text("PLAN SUMMARY", margin + 6, y + 4);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...C.gray700);
    doc.text(`Completion: ${progress}%`, margin + 6, y + 12);
    doc.text(`Tasks Completed: ${completedTasks} / ${totalTasks}`, margin + 6, y + 18);
    doc.text(`Estimated Total Time: ${totalHours} hours`, margin + 6, y + 24);

    if (plan.difficulty) {
      doc.text(`Difficulty Level: ${plan.difficulty.charAt(0).toUpperCase() + plan.difficulty.slice(1)}`, margin + 6, y + 30);
    }

    // Achievement badge
    if (progress >= 100) {
      doc.setFillColor(...C.green);
      doc.circle(pageW - margin - 20, y + 12, 10, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...C.white);
      doc.text("100%", pageW - margin - 20, y + 13.5, { align: "center" });
      doc.setFontSize(6);
      doc.text("COMPLETE", pageW - margin - 20, y + 17, { align: "center" });
    }

    y += 50;

    // Footer branding
    drawFooter();
    doc.setFillColor(...C.green);
    doc.rect(0, pageH - 3, pageW, 3, "F");

    // Save
    const filename = (plan.title || "study-plan").replace(/[^a-z0-9]/gi, "-").toLowerCase() + ".pdf";
    doc.save(filename);
    toast.success("PDF exported");
  };

  const handleSharePlan = async (plan, e) => {
    e.stopPropagation();
    setShareLoading(true);
    setShareModalPlan(plan);
    setShareUrl("");
    setCopied(false);
    try {
      const res = await apiClient.post("/api/study-plan/share", { planId: plan._id });
      const data = await res.json();
      if (res.ok && data.shareUrl) {
        setShareUrl(window.location.origin + data.shareUrl);
      } else {
        toast.error(data.error || "Failed to create share link");
        setShareModalPlan(null);
      }
    } catch {
      toast.error("Failed to share study plan");
      setShareModalPlan(null);
    } finally {
      setShareLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const filteredPlans = plans.filter(
    (p) =>
      p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.topic?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.originalTopic?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Leaderboard View
  if (view === "leaderboard") {
    return (
      <div>
        <div className="mb-6">
          <button
            onClick={() => setView("library")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5 group"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">&larr;</span>
            Back to Library
          </button>
        </div>
        <StudyPlanLeaderboard />
      </div>
    );
  }



  // Generator View
  if (view === "generator") {
    return (
      <div>
        <StudyPlanGenerator onGenerated={handleGenerated} setActiveContent={setActiveContent} />
        <div className="text-center mt-8">
          <button
            onClick={() => setView("library")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1.5 group"
          >
            <span className="group-hover:-translate-x-0.5 transition-transform">&larr;</span>
            Back to Library
          </button>
        </div>
      </div>
    );
  }

  // Viewer View
  if (view === "viewer" && selectedPlan) {
    return (
      <StudyPlanViewer
        plan={selectedPlan}
        studyPlanId={selectedPlanId}
        onBack={() => { setView("library"); setSelectedPlan(null); setSelectedPlanId(null); }}
        onDelete={() => { setPlans((prev) => prev.filter((p) => p._id !== selectedPlanId)); setView("library"); setSelectedPlan(null); setSelectedPlanId(null); }}
        setActiveContent={setActiveContent}
      />
    );
  }

  // Library View
  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3 tracking-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            Study Plans
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 ml-[52px]">
            Your personalized AI-powered learning schedules
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView("leaderboard")}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-border bg-card hover:bg-secondary/50 text-sm font-semibold transition-all hover:shadow-md active:scale-[0.98]"
          >
            <Trophy className="w-4 h-4 text-yellow-500" />
            Leaderboard
          </button>
          <button
            onClick={() => setView("generator")}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-all shadow-lg shadow-green-500/25 hover:shadow-green-500/35 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            New Plan
          </button>
        </div>
      </div>

      {/* Search */}
      {plans.length > 0 && (
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search study plans..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm text-foreground text-sm placeholder-foreground/30 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500/40 transition-all"
          />
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 rounded-2xl border border-border/40 bg-card/50 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-muted" />
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full w-full mt-4" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && plans.length === 0 && (
        <div className="relative text-center py-20 overflow-hidden rounded-3xl border border-border/40">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto mb-5 border border-green-500/15">
              <CalendarCheck className="w-10 h-10 text-green-500/60" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              No study plans yet
            </h3>
            <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
              Create your first AI-powered study plan with a personalized weekly schedule built around your goals
            </p>
            <button
              onClick={() => setView("generator")}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-all shadow-lg shadow-green-500/25 hover:shadow-green-500/35 active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4" />
              Create Your First Plan
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      {!loading && filteredPlans.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredPlans.map((plan, idx) => {
            const totalTasks = plan.totalTasks || 0;
            const completedTasks = plan.completedTasks || 0;
            const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : plan.progress || 0;
            const isInProgress = progress > 0 && progress < 100;
            const diffConfig = {
              beginner: { label: "Beginner", color: "text-emerald-500", bg: "bg-emerald-500/10" },
              intermediate: { label: "Intermediate", color: "text-amber-500", bg: "bg-amber-500/10" },
              advanced: { label: "Advanced", color: "text-red-500", bg: "bg-red-500/10" },
            };
            const d = diffConfig[plan.difficulty] || diffConfig.beginner;

            return (
              <motion.div
                key={plan._id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="group rounded-2xl border border-border bg-card overflow-hidden transition-all duration-200 hover:shadow-md hover:border-green-500/30 cursor-pointer"
                onClick={() => handleViewPlan(plan._id)}
              >
                <div className="p-5">
                  {/* Top row: icon + title + difficulty */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      plan.completed
                        ? "bg-green-500 text-white"
                        : "bg-green-500/10 text-green-600 dark:text-green-400"
                    }`}>
                      {plan.completed ? <Trophy className="w-5 h-5" /> : <CalendarCheck className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-foreground line-clamp-2 text-balance">{plan.title}</h3>
                      {plan.overview && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{plan.overview}</p>
                      )}
                    </div>
                    <span className={`shrink-0 inline-flex items-center px-2 py-0.5 text-[10px] font-semibold rounded-full ${d.bg} ${d.color}`}>
                      {d.label}
                    </span>
                  </div>

                  {/* Meta row */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {plan.durationWeeks}w
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {totalTasks} tasks
                    </span>
                    {plan.selectedCourseNames?.length > 0 && (
                      <span className="flex items-center gap-1">
                        <GraduationCap className="w-3 h-3" />
                        {plan.selectedCourseNames.length} course{plan.selectedCourseNames.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-muted-foreground">
                        {completedTasks} of {totalTasks} completed
                      </span>
                      <span className="text-[11px] font-semibold text-foreground">{progress}%</span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                      <motion.div
                        className={`h-1.5 rounded-full ${plan.completed ? "bg-green-500" : "bg-green-500"}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.6, delay: idx * 0.05 }}
                      />
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2">
                    {plan.completed ? (
                      <button
                        className="flex-1 py-2 px-3 rounded-xl bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-medium border border-green-500/20 flex items-center justify-center gap-2"
                      >
                        <Trophy size={14} />
                        Review Plan
                      </button>
                    ) : isInProgress ? (
                      <button
                        className="flex-1 py-2 px-3 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Zap size={14} />
                        Continue
                      </button>
                    ) : (
                      <button
                        className="flex-1 py-2 px-3 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <BookOpen size={14} />
                        Start Plan
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeletePlan(plan._id); }}
                      className="p-2 rounded-xl border border-border text-muted-foreground hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      onClick={(e) => handleExportPlan(plan, e)}
                      className="p-2 rounded-xl border border-border text-muted-foreground hover:bg-green-500/10 hover:text-green-600 hover:border-green-500/30 transition-colors"
                      title="Export study plan"
                    >
                      <Download size={16} />
                    </button>
                    <button
                      onClick={(e) => handleSharePlan(plan, e)}
                      className="p-2 rounded-xl border border-border text-muted-foreground hover:bg-blue-500/10 hover:text-blue-600 hover:border-blue-500/30 transition-colors"
                      title="Share study plan"
                    >
                      <Share2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* No search results */}
      {!loading && plans.length > 0 && filteredPlans.length === 0 && (
        <div className="text-center py-16">
          <Search className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No plans match your search</p>
        </div>
      )}

      {/* Share Modal */}
      <AnimatePresence>
        {shareModalPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setShareModalPlan(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Share2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">Share Study Plan</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1">{shareModalPlan.title}</p>
                </div>
              </div>

              {shareLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                </div>
              ) : shareUrl ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Anyone with this link can view a read-only copy of this study plan.
                  </p>
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary border border-border/60">
                    <Link className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-sm text-foreground truncate flex-1">{shareUrl}</span>
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? "Copied!" : "Copy Link"}
                  </button>
                </div>
              ) : null}

              <button
                onClick={() => setShareModalPlan(null)}
                className="w-full mt-4 py-2 px-4 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
