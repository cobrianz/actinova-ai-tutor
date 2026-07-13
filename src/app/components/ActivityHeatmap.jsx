"use client";

import { useEffect, useState, useCallback } from "react";

const CELL_SIZE = 11;
const CELL_GAP = 3;
const WEEK_WIDTH = CELL_SIZE + CELL_GAP;
const DAY_LABEL_WIDTH = 28;

const LEVEL_COLORS = [
  "var(--heatmap-0, #ebedf0)",
  "var(--heatmap-1, #ffcab0)",
  "var(--heatmap-2, #ff9b6a)",
  "var(--heatmap-3, #f07d3a)",
  "var(--heatmap-4, #c45d20)",
];

const DARK_LEVEL_COLORS = [
  "var(--heatmap-0, #161b22)",
  "var(--heatmap-1, #5c2d0e)",
  "var(--heatmap-2, #8b3e10)",
  "var(--heatmap-3, #d4651a)",
  "var(--heatmap-4, #f08c28)",
];

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return `${dayNames[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export default function ActivityHeatmap() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState(null);

  useEffect(() => {
    fetchHeatmap();
  }, []);

  const fetchHeatmap = async () => {
    try {
      const res = await fetch("/api/analytics/activity-heatmap");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Failed to fetch heatmap:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMouseEnter = useCallback((e, day) => {
    if (day.future) return;
    const rect = e.target.getBoundingClientRect();
    setTooltip({
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
      date: day.date,
      count: day.count,
      level: day.level,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTooltip(null);
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-28 bg-secondary/50 rounded-lg" />
      </div>
    );
  }

  if (!data) return null;

  const { activity = {} } = data;
  const today = new Date();

  // Build 52 weeks grid
  const weeks = [];
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 364);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  for (let w = 0; w < 52; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + w * 7 + d);
      const dateStr = date.toISOString().split("T")[0];
      const entry = activity[dateStr];
      const rawCount = entry?.count || 0;
      const future = date > today;

      let level = 0;
      if (!future && rawCount > 0) {
        if (rawCount <= 2) level = 1;
        else if (rawCount <= 5) level = 2;
        else if (rawCount <= 10) level = 3;
        else level = 4;
      }

      week.push({ date: dateStr, level, count: rawCount, future });
    }
    weeks.push(week);
  }

  // Month labels — track which week each month starts
  const monthLabels = [];
  let lastMonth = -1;
  for (let w = 0; w < weeks.length; w++) {
    const firstDay = new Date(weeks[w][0].date);
    const month = firstDay.getMonth();
    if (month !== lastMonth) {
      monthLabels.push({ week: w, label: MONTHS[month] });
      lastMonth = month;
    }
  }

  // Total contributions
  const totalContributions = weeks.reduce((sum, week) => {
    return sum + week.filter((d) => !d.future && d.count > 0).reduce((s, d) => s + d.count, 0);
  }, 0);

  return (
    <div className="w-full overflow-x-auto">
      <div className="inline-block min-w-fit">
        {/* Month labels */}
        <div className="flex" style={{ paddingLeft: `${DAY_LABEL_WIDTH}px`, marginBottom: "4px" }}>
          {monthLabels.map((m, i) => {
            const nextWeek = i < monthLabels.length - 1 ? monthLabels[i + 1].week : 52;
            const width = (nextWeek - m.week) * WEEK_WIDTH;
            return (
              <div
                key={i}
                className="text-[11px] text-muted-foreground leading-none"
                style={{ width: `${width}px` }}
              >
                {m.label}
              </div>
            );
          })}
        </div>

        {/* Grid */}
        <div className="flex">
          <div
            className="flex flex-col shrink-0"
            style={{ width: `${DAY_LABEL_WIDTH}px`, gap: `${CELL_GAP}px` }}
          >
            {DAY_LABELS.map((label, i) => (
              <div
                key={i}
                className="text-[10px] text-muted-foreground leading-none flex items-center"
                style={{ height: `${CELL_SIZE}px` }}
              >
                {label}
              </div>
            ))}
          </div>

          <div className="flex" style={{ gap: `${CELL_GAP}px` }}>
            {weeks.map((week, wIdx) => (
              <div key={wIdx} className="flex flex-col" style={{ gap: `${CELL_GAP}px` }}>
                {week.map((day, dIdx) => (
                  <div
                    key={dIdx}
                    className="rounded-sm cursor-pointer transition-opacity hover:opacity-70"
                    style={{
                      width: `${CELL_SIZE}px`,
                      height: `${CELL_SIZE}px`,
                      backgroundColor: day.future ? "transparent" : LEVEL_COLORS[day.level],
                    }}
                    onMouseEnter={(e) => handleMouseEnter(e, day)}
                    onMouseLeave={handleMouseLeave}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-1 mt-3">
          <span className="text-[10px] text-muted-foreground">Less</span>
          {LEVEL_COLORS.map((color, i) => (
            <div
              key={i}
              className="rounded-sm"
              style={{
                width: `${CELL_SIZE}px`,
                height: `${CELL_SIZE}px`,
                backgroundColor: color,
              }}
            />
          ))}
          <span className="text-[10px] text-muted-foreground">More</span>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-[9999] px-2.5 py-1.5 bg-foreground text-background text-[11px] rounded-lg shadow-lg pointer-events-none"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: "translate(-50%, -100%)",
          }}
        >
          {tooltip.count > 0 ? `${tooltip.count} contribution${tooltip.count !== 1 ? "s" : ""}` : "No contributions"}
          {" on "}
          {formatDate(tooltip.date)}
        </div>
      )}
    </div>
  );
}
