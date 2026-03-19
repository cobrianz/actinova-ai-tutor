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
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
      labels: {
        usePointStyle: true,
        pointStyle: 'rect',
        padding: 20,
        font: { family: "'Inter', sans-serif", size: 14, weight: '500' },
        color: '#0f172a',
      },
    },
    tooltip: {
      enabled: false, // Tooltips are useless in PDF
    },
  },
  scales: {
    x: {
      grid: { display: false },
      border: { display: true, color: '#f1f5f9' },
      ticks: {
        color: '#64748b',
        font: { family: "'Inter', sans-serif", size: 12 },
      },
    },
    y: {
      beginAtZero: true,
      grid: { display: false },
      border: { display: false },
      ticks: {
        color: '#64748b',
        font: { family: "'Inter', sans-serif", size: 12 },
      },
    },
  },
};

export default function LessonChart({ type = 'bar', data, title, className = "" }) {
  if (!data || !data.datasets) return null;

  const chartData = {
    labels: data.labels,
    datasets: data.datasets.map((ds, i) => ({
      ...ds,
      backgroundColor: ds.backgroundColor || [
        '#2563eb', // Primary Blue
        '#64748b', // Slate 500
        '#94a3b8', // Slate 400
        '#cbd5e1', // Slate 300
      ][i % 4],
      borderColor: (type === 'line' || type === 'scatter') ? '#2563eb' : 'transparent',
      borderWidth: (type === 'line' || type === 'scatter') ? 2 : 0,
      borderRadius: type === 'bar' ? 4 : 0,
      tension: 0.3,
      showLine: type === 'line',
      pointRadius: (type === 'line' || type === 'scatter') ? 4 : 0,
      pointBackgroundColor: '#fff',
      pointBorderWidth: 2,
    })),
  };

  const ChartComponent = {
    bar: Bar,
    line: Line,
    pie: Pie,
    doughnut: Doughnut,
    scatter: Scatter,
  }[type] || Bar;

  return (
    <div 
      className={`w-full my-10 flex flex-col rounded-2xl border border-border p-4 sm:p-6 transition-all ${className}`} 
      style={{ height: '400px', backgroundColor: '#fcfcfd' }}
    >
      {title && (
        <div className="mb-6 px-2">
          <h4 className="text-lg font-bold tracking-tight" style={{ color: '#0f172a' }}>{title}</h4>
          <div className="mt-2" style={{ height: '1px', width: '100%', backgroundColor: '#e2e8f0' }} />
        </div>
      )}
      <div className="flex-1 relative">
        <ChartComponent data={chartData} options={defaultOptions} />
      </div>
    </div>
  );
}
