/**
 * AEROTWIN AI - Historical Mission Replay & Event Timeline Scrubber (/mission-replay)
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  History,
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  Clock,
  Activity,
  Flame,
  Droplet,
  Wind,
  ShieldAlert,
  ChevronRight,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceDot
} from 'recharts';

// Synthetic recorded historical flight mission data with injected degradation event
const REPLAY_FRAMES = Array.from({ length: 60 }, (_, idx) => {
  const t = idx * 0.15; // 0 to 9 hours
  const isAnom = idx >= 32; // Injected injector degradation event at ~4.8 hours
  const injFault = isAnom ? Math.min(0.75, (idx - 32) * 0.05) : 0;

  const rpm = 4800 + Math.sin(idx * 0.3) * 30;
  const cht = 142 + (isAnom ? injFault * 35 : 0) + Math.sin(idx * 0.2) * 2;
  const egt = 795 + (isAnom ? injFault * 70 : 0) + Math.cos(idx * 0.2) * 4;
  const ff = 18.2 + (isAnom ? injFault * 9 : 0);
  const vib = 2.1 + (isAnom ? injFault * 2.5 : 0);
  const health = Math.max(20, 95 - (idx * 0.1) - (isAnom ? injFault * 30 : 0));
  const rul = Math.max(10, 180 - (idx * 0.8) - (isAnom ? injFault * 70 : 0));

  return {
    index: idx,
    timeHour: Number(t.toFixed(2)),
    rpm: Math.round(rpm),
    cht: Number(cht.toFixed(1)),
    egt: Number(egt.toFixed(1)),
    fuel_flow: Number(ff.toFixed(1)),
    vibration: Number(vib.toFixed(2)),
    oil_pressure: isAnom ? 3.6 : 4.2,
    health: Number(health.toFixed(1)),
    rul_hours: Math.round(rul),
    is_anomaly: isAnom,
    fault: isAnom ? 'Injector Abnormality' : 'Healthy',
    fault_prob: isAnom ? Number((0.55 + injFault * 0.4).toFixed(2)) : 0.95,
    event_marker: idx === 32 ? 'FAULT_ONSET' : (idx === 45 ? 'ANOMALY_ESCALATION' : null),
    explanation: isAnom
      ? `Progressive fuel flow (+${Math.round(injFault * 40)}%) and localized EGT divergence detected on Cylinder 3.`
      : 'Normal cruise telemetry distribution.'
  };
});

export default function MissionReplayPage() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0); // 0.5x, 1x, 2x

  const frame = REPLAY_FRAMES[currentIdx] || REPLAY_FRAMES[0];

  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentIdx((prev) => {
          if (prev >= REPLAY_FRAMES.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed]);

  const togglePlay = () => setIsPlaying(!isPlaying);
  const resetPlayback = () => {
    setIsPlaying(false);
    setCurrentIdx(0);
  };

  return (
    <div className="p-4 space-y-4 font-mono">
      {/* Header */}
      <div className="bg-aerodark border border-aeroborder p-4 rounded-lg flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-sky-400" />
            <h1 className="text-base font-bold text-white tracking-wider">
              HISTORICAL MISSION TELEMETRY REPLAY & TIMELINE SCRUBBER
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-800 font-bold">
              FLIGHT SORTIE: MSN-ISR-0841
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Step through historical flight envelopes with synchronized anomaly markers and XAI explanations
          </p>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={resetPlayback}
            className="p-2 rounded bg-aerocard border border-aeroborder text-slate-300 hover:text-white transition"
            title="Reset to mission start"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlay}
            className="px-4 py-2 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center space-x-2 transition shadow-lg shadow-sky-950/30"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isPlaying ? 'PAUSE REPLAY' : 'PLAY REPLAY'}</span>
          </button>

          {/* Speed Selector */}
          <div className="flex bg-aerocard p-1 rounded border border-aeroborder text-xs">
            {[0.5, 1.0, 2.0].map((spd) => (
              <button
                key={spd}
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-2 py-0.5 rounded font-bold transition ${
                  playbackSpeed === spd ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Timeline Scrubber Bar */}
      <div className="bg-aerocard border border-aeroborder rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-sky-400" />
            <span className="text-slate-300 font-bold">MISSION TIMELINE ELAPSED:</span>
            <span className="text-sky-400 font-bold text-sm">{frame.timeHour} HOURS</span>
          </div>
          <div className="flex items-center space-x-3 text-[11px]">
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-400">Nominal Flight Phase</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="text-red-400 font-bold">Fault Onset Marker (4.8h)</span>
            </span>
          </div>
        </div>

        {/* Scrub Slider */}
        <input
          type="range"
          min="0"
          max={REPLAY_FRAMES.length - 1}
          value={currentIdx}
          onChange={(e) => {
            setIsPlaying(false);
            setCurrentIdx(Number(e.target.value));
          }}
          className="w-full accent-sky-500 bg-slate-800 h-2 rounded cursor-pointer"
        />

        <div className="flex justify-between text-[10px] text-slate-500">
          <span>0.0h (Takeoff)</span>
          <span>2.5h</span>
          <span className="text-red-400 font-bold">4.8h [FAULT DETECTED]</span>
          <span>7.0h</span>
          <span>8.8h (Recovery)</span>
        </div>
      </div>

      {/* Active Replay Frame Snapshot Callout */}
      {frame.is_anomaly && (
        <div className="bg-gradient-to-r from-red-950/80 via-aerocard to-aerocard border border-red-700 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded bg-red-900/80 border border-red-600 flex items-center justify-center text-red-300 font-bold shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-red-300 uppercase tracking-wider">
                TELEMETRY ANOMALY IDENTIFIED AT T+{frame.timeHour} HOURS
              </div>
              <div className="text-sm font-bold text-white mt-0.5">
                {frame.fault} (Confidence: {(frame.fault_prob * 100).toFixed(0)}%)
              </div>
              <p className="text-xs text-slate-300 font-sans mt-0.5">{frame.explanation}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs bg-aerodark/80 p-2.5 rounded border border-red-900/50">
            <div>
              <span className="text-[10px] text-slate-400 block">HEALTH INDEX:</span>
              <span className="font-bold text-amber-400">{frame.health}%</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">PROJECTED RUL:</span>
              <span className="font-bold text-red-400">{frame.rul_hours} Hours</span>
            </div>
          </div>
        </div>
      )}

      {/* Synchronized Replay Charts (Telemetry Stream over Timeline) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Thermal: CHT & EGT */}
        <div className="bg-aerocard border border-aeroborder rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between border-b border-aeroborder pb-1">
            <span className="text-xs font-bold text-slate-200">THERMAL TRAJECTORY (CHT & EGT)</span>
            <span className="text-[10px] text-slate-400">Current: {frame.cht}°C / {frame.egt}°C</span>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={REPLAY_FRAMES}>
                <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" />
                <XAxis dataKey="timeHour" stroke="#64748b" tick={{ fontSize: 9 }} unit="h" />
                <YAxis stroke="#64748b" tick={{ fontSize: 9 }} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                <Line type="monotone" dataKey="cht" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="egt" stroke="#ef4444" strokeWidth={1.5} dot={false} />
                <ReferenceDot x={frame.timeHour} y={frame.cht} r={5} fill="#38bdf8" stroke="#ffffff" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Mechanical: Vibration & Health */}
        <div className="bg-aerocard border border-aeroborder rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between border-b border-aeroborder pb-1">
            <span className="text-xs font-bold text-slate-200">VIBRATION RMS & ENGINE HEALTH DECAY</span>
            <span className="text-[10px] text-slate-400">Vib: {frame.vibration} mm/s | Health: {frame.health}%</span>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={REPLAY_FRAMES}>
                <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" />
                <XAxis dataKey="timeHour" stroke="#64748b" tick={{ fontSize: 9 }} unit="h" />
                <YAxis stroke="#64748b" tick={{ fontSize: 9 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }} />
                <Line type="monotone" dataKey="health" stroke="#10b981" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey={(d) => (d.vibration * 10).toFixed(1)} stroke="#f87171" strokeWidth={1.5} dot={false} />
                <ReferenceDot x={frame.timeHour} y={frame.health} r={5} fill="#10b981" stroke="#ffffff" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
