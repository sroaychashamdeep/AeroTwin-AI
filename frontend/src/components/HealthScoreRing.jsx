/**
 * AEROTWIN AI - Circular Health & Degradation Radial Gauge
 */

import React from 'react';

export default function HealthScoreRing({ score = 94.2, label = "ENGINE HEALTH INDEX", size = 160 }) {
  const radius = (size - 24) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let strokeColor = '#10b981'; // Emerald
  if (score < 70) strokeColor = '#ef4444'; // Red
  else if (score < 85) strokeColor = '#f59e0b'; // Amber

  return (
    <div className="flex flex-col items-center justify-center font-mono">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#1e293b"
            strokeWidth="10"
            fill="transparent"
          />
          {/* Progress Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Display */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold text-white tracking-tight">{score}%</span>
          <span className="text-[10px] text-slate-400 uppercase font-semibold">
            {score >= 85 ? 'NOMINAL' : (score >= 70 ? 'ATTENTION' : 'CRITICAL')}
          </span>
        </div>
      </div>
      <span className="mt-2 text-xs font-semibold text-slate-300 tracking-wider text-center">{label}</span>
    </div>
  );
}
