"use client";

import { useEffect, useState, useRef } from "react";
import { Clock, Target, ChevronDown } from "lucide-react";

const GOAL_OPTIONS = [1, 2, 5, 10, 15, 20];
const STORAGE_KEY = "study_goal_hours";

export default function StudyGoals() {
  const [goalHours, setGoalHours] = useState(5);
  const [studiedMinutes, setStudiedMinutes] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setGoalHours(Number(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(goalHours));
  }, [goalHours]);

  useEffect(() => {
    async function fetchStudyTime() {
      try {
        const res = await fetch("/api/study-plan/list");
        if (!res.ok) return;
        const json = await res.json();
        if (!json.success) return;
        const totalMinutes = (json.items || []).reduce(
          (sum, plan) => sum + (plan.completedEstimatedMinutes || 0),
          0
        );
        setStudiedMinutes(totalMinutes);
      } catch {
        // ignore
      }
    }
    fetchStudyTime();
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const studiedHours = Math.round((studiedMinutes / 60) * 10) / 10;
  const goalMins = goalHours * 60;
  const progress = goalMins > 0 ? Math.min(studiedMinutes / goalMins, 1) : 0;
  const percentage = Math.round(progress * 100);

  const circumference = 2 * Math.PI * 42;
  const offset = circumference - progress * circumference;

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Target className="w-4 h-4 text-green-500" />
          Study Goals
        </h3>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-lg transition-colors"
          >
            <Clock className="w-3 h-3" />
            {goalHours}h / week
            <ChevronDown className="w-3 h-3" />
          </button>
          {showDropdown && (
            <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-50 py-1 min-w-[120px]">
              {GOAL_OPTIONS.map((h) => (
                <button
                  key={h}
                  onClick={() => {
                    setGoalHours(h);
                    setShowDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-secondary transition-colors ${
                    h === goalHours ? "text-primary font-semibold bg-primary/5" : "text-foreground"
                  }`}
                >
                  {h} hour{h !== 1 ? "s" : ""} / week
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-5">
        {/* Progress Ring */}
        <div className="relative flex-shrink-0">
          <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
            <circle
              cx="48"
              cy="48"
              r="42"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-secondary"
            />
            <circle
              cx="48"
              cy="48"
              r="42"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="text-green-500 transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-foreground">{percentage}%</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-2">
          <p className="text-sm text-foreground">
            <span className="font-semibold">{studiedHours}h</span>
            <span className="text-muted-foreground"> of {goalHours}h goal</span>
          </p>
          <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
            <div
              className="h-2 rounded-full bg-green-500 transition-all duration-700 ease-out"
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            {percentage >= 100
              ? "Goal reached! Great work!"
              : `${Math.max(0, goalHours * 60 - studiedMinutes)} min remaining`}
          </p>
        </div>
      </div>
    </div>
  );
}
