"use client";

import React from 'react';

export default function LessonTable({ headers, rows, title, className = "" }) {
  if (!headers || !rows) return null;

  return (
    <div className={`w-full overflow-hidden my-10 ${className}`} style={{ backgroundColor: '#ffffff' }}>
      {title && (
        <div className="px-6 py-4" style={{ borderBottom: '1px solid #f1f5f9' }}>
          <h4 className="text-lg font-bold tracking-tight" style={{ color: '#0f172a' }}>{title}</h4>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr style={{ borderBottom: '2px solid #0f172a' }}>
              {headers.map((header, i) => (
                <th 
                  key={i} 
                  className="px-6 py-4 text-sm font-bold uppercase tracking-wider font-serif"
                  style={{ color: '#0f172a', textAlign: 'left' }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="italic">
            {rows.map((row, i) => (
              <tr key={i} className="transition-colors" style={{ borderBottom: '1px solid #f1f5f9' }}>
                {row.map((cell, j) => (
                  <td 
                    key={j} 
                    className={`px-6 py-4 text-sm font-medium ${j === 0 ? 'font-bold' : ''}`}
                    style={{ color: '#334155' }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
