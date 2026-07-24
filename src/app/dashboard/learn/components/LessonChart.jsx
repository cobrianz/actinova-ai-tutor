"use client";

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar, Line, Pie, Doughnut, Scatter } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const defaultOptions = {
  responsive: true,
  maintainAspectRatio: false,
  animation: false,
  animations: {
    enabled: false
  },
  layout: {
    padding: { top: 4, bottom: 4, left: 4, right: 4 },
  },
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
      labels: {
        usePointStyle: true,
        pointStyle: 'rect',
        padding: 14,
        font: { family: "'Inter', sans-serif", size: 11, weight: '500' },
        color: '#64748b',
      },
    },
    tooltip: {
      enabled: false,
    },
  },
  scales: {
    x: {
      grid: { display: false },
      border: { display: false },
      ticks: {
        color: '#94a3b8',
        font: { family: "'Inter', sans-serif", size: 10 },
        maxRotation: 0,
      },
    },
    y: {
      beginAtZero: true,
      grid: { display: true, color: '#f1f5f9', lineWidth: 1 },
      border: { display: false },
      ticks: {
        color: '#94a3b8',
        font: { family: "'Inter', sans-serif", size: 10 },
        padding: 4,
      },
    },
  },
};

export default function LessonChart({ type = 'bar', data, title, className = "" }) {
  if (!data || !data.datasets) return null;

  const isRadial = type === 'pie' || type === 'doughnut';

  const palette = [
    '#6366f1',
    '#2563eb',
    '#06b6d4',
    '#8b5cf6',
    '#a855f7',
    '#ec4899',
    '#14b8a6',
    '#f59e0b',
  ];

  const chartData = {
    labels: data.labels,
    datasets: data.datasets.map((ds, i) => ({
      ...ds,
      backgroundColor: isRadial
        ? (ds.backgroundColor || palette.slice(0, data.labels?.length || 4))
        : (ds.backgroundColor || palette[i % palette.length] + '22'),
      borderColor: isRadial
        ? '#ffffff'
        : (ds.borderColor || palette[i % palette.length]),
      borderWidth: isRadial ? 2 : (type === 'line' || type === 'scatter') ? 2 : 1,
      borderRadius: type === 'bar' ? 6 : 0,
      tension: 0.4,
      showLine: type === 'line',
      pointRadius: (type === 'line' || type === 'scatter') ? 3 : 0,
      pointBackgroundColor: '#fff',
      pointBorderWidth: 2,
      fill: type === 'line' ? { target: 'origin', above: palette[i % palette.length] + '10' } : undefined,
    })),
  };

  const ChartComponent = {
    bar: Bar,
    line: Line,
    pie: Pie,
    doughnut: Doughnut,
    scatter: Scatter,
  }[type] || Bar;

  const chartOptions = {
    ...defaultOptions,
    scales: isRadial ? undefined : defaultOptions.scales,
    plugins: {
      ...defaultOptions.plugins,
      legend: {
        ...defaultOptions.plugins.legend,
        position: isRadial ? 'bottom' : 'bottom',
        labels: {
          ...defaultOptions.plugins.legend.labels,
          color: '#64748b',
        },
      },
    },
  };

  return (
    <div
      className={`max-w-2xl mx-auto my-6 flex flex-col rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-slate-900/60 overflow-hidden transition-all ${className}`}
    >
      {title && (
        <div className="px-4 pt-3 pb-2">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 tracking-tight">{title}</h4>
          <div className="mt-1.5 h-px bg-slate-100 dark:bg-slate-700/50" />
        </div>
      )}
      <div className="px-3 pb-2" style={{ height: '240px' }}>
        <ChartComponent data={chartData} options={chartOptions} />
      </div>
    </div>
  );
}
