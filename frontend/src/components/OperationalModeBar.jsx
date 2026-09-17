import React from 'react';
import { useTelemetryStore } from '../store/telemetryStore';
import { 
  ShieldCheck, 
  Cpu, 
  Wrench, 
  Bot, 
  PlayCircle, 
  HelpCircle, 
  AlertTriangle, 
  TrendingUp,
  Activity
} from 'lucide-react';

export const OperationalModeBar = () => {
  const { 
    operationalMode, 
    setOperationalMode,
    openWhatChangedModal,
    openWhatShouldIDoModal,
    openCanICompleteMissionModal,
    openWhatIfModal,
    intelligenceState,
    twinState
  } = useTelemetryStore();

  const state = intelligenceState || twinState || {};
  const primaryFault = state.diagnosis?.primary_fault || 'Healthy';
  const overallHealth = state.health?.overall || 92;
  const isDegraded = primaryFault !== 'Healthy';

  const modes = [
    {
      id: 'OPERATOR',
      label: 'OPERATOR "ONE-GLANCE"',
      icon: ShieldCheck,
      color: 'text-emerald-400',
      activeBg: 'bg-emerald-500/20 border-emerald-500/60 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]',
      desc: 'High-level vital operational status, mission risk & go/no-go recommendations.'
    },
    {
      id: 'ENGINEER',
      label: 'ENGINEER DEEP-DIVE',
      icon: Cpu,
      color: 'text-cyan-400',
      activeBg: 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]',
      desc: 'Physics state residuals, EKF Kalman filter, multi-model consensus & causal graphs.'
    },
    {
      id: 'MAINTENANCE',
      label: 'MAINTENANCE & THREAD',
      icon: Wrench,
      color: 'text-amber-400',
      activeBg: 'bg-amber-500/20 border-amber-500/60 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]',
      desc: 'Digital thread work orders, component failure horizons & maintenance economics.'
    },
    {
      id: 'COPILOT',
      label: 'AI COPILOT (GROK)',
      icon: Bot,
      color: 'text-purple-400',
      activeBg: 'bg-purple-500/20 border-purple-500/60 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]',
      desc: 'Deterministic tool-executing NLP copilot with RAG aerospace citations.'
    }
  ];

  return (
    <div className="w-full bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-xl p-3 mb-6 shadow-xl">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Left: View Modes Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 mr-2">
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isDegraded ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isDegraded ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
            </span>
            <span className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">
              OPERATIONAL VIEW:
            </span>
          </div>

          <div className="flex bg-slate-950/80 p-1 rounded-lg border border-slate-800">
            {modes.map((mode) => {
              const Icon = mode.icon;
              const isActive = operationalMode === mode.id;
              return (
                <button
                  key={mode.id}
                  onClick={() => setOperationalMode(mode.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-mono font-semibold transition-all duration-200 border ${
                    isActive 
                      ? mode.activeBg 
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                  title={mode.desc}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? mode.color : 'text-slate-500'}`} />
                  {mode.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Universal Decision Support Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={openWhatChangedModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors shadow-sm"
          >
            <Activity className="w-3.5 h-3.5" />
            <span>WHAT CHANGED?</span>
          </button>

          <button
            onClick={() => openWhatIfModal()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-mono text-indigo-400 hover:text-indigo-300 transition-colors shadow-sm"
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>WHAT IF?</span>
          </button>

          <button
            onClick={openWhatShouldIDoModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-xs font-mono text-amber-400 hover:text-amber-300 transition-colors shadow-sm"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>WHAT SHOULD I DO?</span>
          </button>

          <button
            onClick={openCanICompleteMissionModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 text-xs font-mono text-emerald-400 hover:text-emerald-300 font-bold transition-all shadow-sm"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>CAN I COMPLETE MISSION?</span>
          </button>
        </div>
      </div>
    </div>
  );
};
