/**
 * AEROTWIN AI - Aerospace Sensor Gauge Card
 */

import React from 'react';

export default function GaugeCard({
  title,
  value,
  unit,
  min = 0,
  max = 100,
  warnMin,
  warnMax,
  critMin,
  critMax,
  icon: Icon
}) {
  const numVal = Number(value) || 0;
  const pct = Math.max(0, Math.min(100, ((numVal - min) / (max - min)) * 100));

  // Determine status
  let status = 'NOMINAL';
  let statusColor = 'text-emerald-400';
  let barColor = 'bg-emerald-500';

  if ((critMin !== undefined && numVal <= critMin) || (critMax !== undefined && numVal >= critMax)) {
    status = 'CRITICAL';
    statusColor = 'text-red-400';
    barColor = 'bg-red-500';
  } else if ((warnMin !== undefined && numVal <= warnMin) || (warnMax !== undefined && numVal >= warnMax)) {
    status = 'WARNING';
    statusColor = 'text-amber-400';
    barColor = 'bg-amber-500';
  }

  return (
    <div className="bg-aerocard border border-aeroborder rounded-lg p-3 font-mono relative overflow-hidden flex flex-col justify-between hover:border-slate-700 transition">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center space-x-1.5">
          {Icon && <Icon className="w-3.5 h-3.5 text-slate-400" />}
          <span className="text-[11px] font-semibold text-slate-300 tracking-wider uppercase">{title}</span>
        </div>
        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
          status === 'CRITICAL' ? 'bg-red-950/60 border-red-700 text-red-400' :
          status === 'WARNING' ? 'bg-amber-950/60 border-amber-700 text-amber-400' :
          'bg-slate-800/60 border-slate-700 text-emerald-400'
        }`}>
          {status}
        </span>
      </div>

      {/* Main Numerical Readout */}
      <div className="flex items-baseline space-x-1.5 my-1">
        <span className="text-2xl font-bold text-white tracking-tight">{value}</span>
        <span className="text-xs text-slate-400 font-sans">{unit}</span>
      </div>

      {/* Progress Range Bar */}
      <div className="space-y-1 mt-1">
        <div className="w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full ${barColor} transition-all duration-300`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px] text-slate-400">
          <span>{min}</span>
          <span>{max} {unit}</span>
        </div>
      </div>
    </div>
  );
}
