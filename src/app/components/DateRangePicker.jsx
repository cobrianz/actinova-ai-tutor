"use client";
import { useState } from 'react';

const RANGES = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
  { label: 'All time', days: null },
];

export default function DateRangePicker({ value, onChange }) {
  const handleClick = (range) => {
    if (range.days === null) {
      onChange({ start: null, end: null, label: range.label });
    } else {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - range.days);
      onChange({ start, end, label: range.label });
    }
  };

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide">
      {RANGES.map((range) => {
        const isActive = value?.label === range.label;
        return (
          <button
            key={range.label}
            onClick={() => handleClick(range)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              isActive
                ? "bg-green-500 text-white"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {range.label}
          </button>
        );
      })}
    </div>
  );
}
