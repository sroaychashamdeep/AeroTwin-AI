/**
 * AEROTWIN AI - Ground Control Station Sidebar Navigation
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Box,
  Activity,
  BrainCircuit,
  Hourglass,
  PlaneTakeoff,
  History,
  GitCompare,
  Layers,
  Wrench,
  Bot,
  FileSpreadsheet,
  CheckCircle,
  Settings
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'COMMAND CENTER', icon: LayoutDashboard },
  { path: '/digital-twin', label: 'DIGITAL TWIN', icon: Box },
  { path: '/live-telemetry', label: 'LIVE TELEMETRY', icon: Activity },
  { path: '/ai-diagnostics', label: 'AI DIAGNOSTICS', icon: BrainCircuit },
  { path: '/rul-degradation', label: 'RUL & DEGRADATION', icon: Hourglass },
  { path: '/mission-simulator', label: 'MISSION SIMULATOR', icon: PlaneTakeoff },
  { path: '/mission-replay', label: 'MISSION REPLAY', icon: History },
  { path: '/what-if', label: 'WHAT-IF ANALYSIS', icon: GitCompare },
  { path: '/fleet', label: 'FLEET MANAGEMENT', icon: Layers },
  { path: '/maintenance', label: 'MAINTENANCE CENTER', icon: Wrench },
  { path: '/ai-copilot', label: 'AI COPILOT', icon: Bot, highlight: true },
  { path: '/reports', label: 'REPORTS', icon: FileSpreadsheet },
  { path: '/model-validation', label: 'MODEL VALIDATION', icon: CheckCircle },
  { path: '/settings', label: 'SYSTEM SETTINGS', icon: Settings }
];

export default function GcsSidebar() {
  return (
    <aside className="w-64 bg-aerodark border-r border-aeroborder flex flex-col justify-between select-none shrink-0 min-h-[calc(100vh-3.5rem)]">
      {/* Navigation Links */}
      <div className="py-4 px-2 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-mono tracking-widest text-slate-400 font-semibold uppercase">
          Tactical Operations
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded text-xs font-mono tracking-wide transition ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-400 font-semibold border-l-2 border-sky-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                } ${item.highlight && !location.pathname.includes(item.path) ? 'text-cyan-300 font-medium' : ''}`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
              {item.highlight && (
                <span className="ml-auto text-[9px] px-1.5 py-0.2 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-700">
                  GROK
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Footer / GCS Identification */}
      <div className="p-3 border-t border-aeroborder bg-aeroblack/40 text-[11px] font-mono text-slate-400">
        <div className="flex justify-between items-center mb-1">
          <span className="text-slate-400">STATION ID:</span>
          <span className="text-sky-300">GCS-MALE-ALPHA</span>
        </div>
        <div className="flex justify-between items-center mb-1">
          <span className="text-slate-400">ACTIVE UAV:</span>
          <span className="text-emerald-400 font-semibold">UAV-001 (TAPAS)</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-slate-400">ENGINE:</span>
          <span className="text-slate-300">ROTAX 914-F0192</span>
        </div>
      </div>
    </aside>
  );
}
