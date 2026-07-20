"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  CalendarCheck,
  Plus,
  Clock,
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
  Trash2,
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [planToDelete, setPlanToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
                doc.text("x", margin + 13, ty + 1.5);
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

  const handleDeleteClick = (plan, e) => {
    e.stopPropagation();
    setPlanToDelete(plan);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!planToDelete) return;
    setDeleteLoading(true);
    try {
      const res = await apiClient.delete(`/api/study-plan/${planToDelete._id}`);
      if (res.ok) {
        setPlans((prev) => prev.filter((p) => p._id !== planToDelete._id));
        toast.success("Study plan deleted");
        setShowDeleteModal(false);
        setPlanToDelete(null);
      } else {
        toast.error("Failed to delete plan");
      }
    } catch {
      toast.error("Failed to delete study plan");
    } finally {
      setDeleteLoading(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2 tracking-tight" style={{ fontFamily: "var(--font-fraunces)" }}>
            <CalendarCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
            Study Plans
          </h1>
          <p className="text-[11px] text-muted-foreground mt-0.5 ml-7">
            Your personalized AI-powered learning schedules
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setView("leaderboard")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-secondary/50 text-[11px] font-medium transition-all"
          >
            <Trophy className="w-3.5 h-3.5 text-yellow-500" />
            Ranks
          </button>
          <button
            onClick={() => setView("generator")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-[11px] font-medium transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            New Plan
          </button>
        </div>
      </div>

      {/* Search */}
      {plans.length > 0 && (
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search study plans..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border/60 bg-card text-foreground text-[11px] placeholder-foreground/30 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500/40 transition-all"
          />
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800" />
                <div className="flex-1">
                  <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-3/4 mb-2" />
                </div>
                <div className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800" />
              </div>
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-1/2 mb-3" />
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex gap-1.5">
                  <div className="h-3 w-12 bg-slate-100 dark:bg-slate-800 rounded" />
                  <div className="h-3 w-14 bg-slate-100 dark:bg-slate-800 rounded" />
                </div>
                <div className="h-3 w-14 bg-slate-100 dark:bg-slate-800 rounded" />
              </div>
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
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-all shadow-lg shadow-green-500/25 hover:shadow-green-500/35 active:scale-[0.98]"
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
                className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 hover:border-green-300 dark:hover:border-green-600 transition-all duration-200 cursor-pointer flex flex-col"
                onClick={() => handleViewPlan(plan._id)}
              >
                {/* Top row: icon + title + delete */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    plan.completed
                      ? "bg-green-500 text-white"
                      : "bg-green-500/10"
                  }`}>
                    {plan.completed
                      ? <Trophy size={16} className={plan.completed ? "text-white" : "text-green-600 dark:text-green-400"} />
                      : <CalendarCheck size={16} className="text-green-600 dark:text-green-400" />}
                  </div>
                  <h3 className="font-semibold text-sm text-slate-700 dark:text-slate-300 line-clamp-1 group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors min-w-0 flex-1">
                    {plan.title}
                  </h3>
                  <button
                    onClick={(e) => handleDeleteClick(plan, e)}
                    className="shrink-0 p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Overview */}
                {plan.overview && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mb-3">
                    {plan.overview}
                  </p>
                )}

                {/* Footer */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    <span className="font-medium">{plan.durationWeeks}w</span>
                    <span>·</span>
                    <span>{totalTasks} tasks</span>
                    <span>·</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleExportPlan(plan, e)}
                      className="text-slate-400 hover:text-green-500 transition-colors"
                      title="Export"
                    >
                      <Download size={12} />
                    </button>
                    <button
                      onClick={(e) => handleSharePlan(plan, e)}
                      className="text-slate-400 hover:text-blue-500 transition-colors"
                      title="Share"
                    >
                      <Share2 size={12} />
                    </button>
                    <span className="font-bold text-green-600 dark:text-green-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Open <ArrowRight size={10} className="-rotate-45" />
                    </span>
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

      {/* Delete Modal */}
      {showDeleteModal && planToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl w-full max-w-sm shadow-2xl border border-border">
            <div className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">Delete Study Plan</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Are you sure you want to delete &quot;{planToDelete.title}&quot;? This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowDeleteModal(false); setPlanToDelete(null); }}
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-muted-foreground bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleteLoading}
                  className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  {deleteLoading ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
