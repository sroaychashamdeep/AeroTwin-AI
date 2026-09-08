/**
 * AEROTWIN AI - Home Landing Page
 * Aerospace Ground Station Digital Twin Showcase
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  BrainCircuit,
  Wrench,
  Hourglass,
  PlaneTakeoff,
  ShieldCheck,
  ArrowRight,
  Activity,
  Layers,
  Cpu
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-aeroblack text-white font-sans selection:bg-sky-500 selection:text-white relative overflow-hidden">
      {/* Background Subtle Radar Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0f_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Header */}
      <header className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-aeroborder/50 relative z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center font-bold text-white shadow-lg shadow-sky-500/25">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="font-mono font-bold text-lg tracking-wider">AEROTWIN<span className="text-sky-400"> AI</span></div>
            <div className="text-[10px] font-mono text-slate-400 tracking-wider">MALE UAV PROPULSION GCS</div>
          </div>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-5 py-2.5 rounded bg-sky-600 hover:bg-sky-500 font-mono text-xs font-semibold tracking-wider transition shadow-lg shadow-sky-900/30 flex items-center space-x-2"
        >
          <span>LAUNCH COMMAND CENTER</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center relative z-10">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-sky-950/80 border border-sky-800/80 text-sky-400 font-mono text-xs mb-6">
          <span className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
          <span>REAL-TIME PHYSICS-INFORMED DIGITAL TWIN PLATFORM</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-slate-100 max-w-4xl mx-auto leading-tight font-sans">
          AeroTwin <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-500">AI</span>
        </h1>
        <p className="text-xl md:text-2xl text-slate-300 mt-4 max-w-3xl mx-auto font-light">
          AI-Powered Digital Twin for Predictive Health Management of MALE UAV Piston Engines
        </p>
        <p className="text-sm font-mono text-sky-400 mt-3 tracking-widest uppercase">
          Predict. Simulate. Explain. Prevent.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-8 py-3.5 rounded-lg bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white font-mono text-sm font-bold tracking-wider shadow-xl shadow-sky-900/40 transition flex items-center space-x-3"
          >
            <span>LAUNCH COMMAND CENTER</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/digital-twin')}
            className="px-6 py-3.5 rounded-lg bg-aerocard border border-aeroborder hover:border-slate-600 text-slate-300 font-mono text-sm font-semibold tracking-wider transition flex items-center space-x-2"
          >
            <Box className="w-4 h-4 text-sky-400" />
            <span>INSPECT 3D TWIN</span>
          </button>
        </div>

        {/* 5 Core Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-20 text-left font-mono">
          {/* Pillar 1: Digital Twin */}
          <div className="p-5 rounded-lg bg-aerocard/80 border border-aeroborder hover:border-sky-500/50 transition">
            <div className="w-9 h-9 rounded bg-sky-950 flex items-center justify-center text-sky-400 mb-3 border border-sky-800">
              <Box className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider mb-1">3D Digital Twin</h3>
            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              Interactive procedural Rotax 914/915 iS engine model with RPM-driven pistons and thermal heatmap shaders.
            </p>
          </div>

          {/* Pillar 2: AI Diagnostics */}
          <div className="p-5 rounded-lg bg-aerocard/80 border border-aeroborder hover:border-sky-500/50 transition">
            <div className="w-9 h-9 rounded bg-indigo-950 flex items-center justify-center text-indigo-400 mb-3 border border-indigo-800">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider mb-1">AI Diagnostics</h3>
            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              Dual Autoencoder + Isolation Forest anomaly ensemble with PyTorch 10-class temporal fault classifier.
            </p>
          </div>

          {/* Pillar 3: Predictive Maintenance */}
          <div className="p-5 rounded-lg bg-aerocard/80 border border-aeroborder hover:border-sky-500/50 transition">
            <div className="w-9 h-9 rounded bg-emerald-950 flex items-center justify-center text-emerald-400 mb-3 border border-emerald-800">
              <Wrench className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider mb-1">Predictive Maint</h3>
            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              Prescriptive maintenance work orders triggered by physical wear metrics before in-flight failure.
            </p>
          </div>

          {/* Pillar 4: RUL & Degradation */}
          <div className="p-5 rounded-lg bg-aerocard/80 border border-aeroborder hover:border-sky-500/50 transition">
            <div className="w-9 h-9 rounded bg-amber-950 flex items-center justify-center text-amber-400 mb-3 border border-amber-800">
              <Hourglass className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider mb-1">RUL Prediction</h3>
            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              Remaining Useful Life regression with 95% uncertainty intervals and multi-subsystem degradation tracking.
            </p>
          </div>

          {/* Pillar 5: Mission Intelligence */}
          <div className="p-5 rounded-lg bg-aerocard/80 border border-aeroborder hover:border-sky-500/50 transition">
            <div className="w-9 h-9 rounded bg-cyan-950 flex items-center justify-center text-cyan-400 mb-3 border border-cyan-800">
              <PlaneTakeoff className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider mb-1">Mission Intelligence</h3>
            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              Natural language mission simulation, What-If comparative analysis, and flight timeline telemetry replay.
            </p>
          </div>
        </div>

        {/* Engine Tech Specs Row */}
        <div className="mt-16 p-6 rounded-xl bg-aerodark border border-aeroborder text-left font-mono">
          <div className="flex flex-wrap items-center justify-between border-b border-aeroborder pb-4 mb-4">
            <div>
              <span className="text-xs text-sky-400 font-bold uppercase tracking-wider">Benchmark Platform: </span>
              <span className="text-sm font-semibold text-white">Rotax 914 / 915 iS Turbocharged 4-Stroke Aero Piston Engine</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Target UAVs: TAPAS-BH-201, Hermes 450, Predator XP</span>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block">RATED TAKEOFF POWER:</span>
              <span className="text-slate-200 font-bold text-sm">141 HP (104 kW)</span>
            </div>
            <div>
              <span className="text-slate-500 block">CRITICAL ALTITUDE:</span>
              <span className="text-slate-200 font-bold text-sm">15,000 ft (4,570 m)</span>
            </div>
            <div>
              <span className="text-slate-500 block">BASE TIME BETWEEN OVERHAUL:</span>
              <span className="text-slate-200 font-bold text-sm">1,200 Flight Hours</span>
            </div>
            <div>
              <span className="text-slate-500 block">AI DIAGNOSTICS ENSEMBLE:</span>
              <span className="text-emerald-400 font-bold text-sm">PyTorch Autoencoder + GRU</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
