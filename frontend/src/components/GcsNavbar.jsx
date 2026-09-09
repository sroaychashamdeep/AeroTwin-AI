/**
 * AEROTWIN AI - Ground Control Station (GCS) Top Navbar
 */

import React, { useState, useEffect } from 'react';
import { useTelemetryStore } from '../store/telemetryStore';
import { Activity, ShieldAlert, Cpu, Radio, Play, Pause, RefreshCw, Zap, Volume2, VolumeX } from 'lucide-react';
import { soundFx } from '../utils/soundFx';

export default function GcsNavbar({ onOpenFaultModal }) {
  const { connected, isPaused, togglePause, twinSync, health, anomaly, activeFaults, clearAllFaults } = useTelemetryStore();

  const isFaultInjected = Object.values(activeFaults).some(v => v > 0);

  const [isAudioMuted, setIsAudioMuted] = useState(soundFx.isMuted());

  // Listen for faults or anomalies and trigger sound alerts
  useEffect(() => {
    if (anomaly.is_anomaly || (health.overall_health < 70)) {
      soundFx.playEmergencyAlarm();
    } else if (health.overall_health < 85) {
      soundFx.playWarningChime();
    }
  }, [anomaly.is_anomaly, health.overall_health]);

  const handleAudioToggle = () => {
    const muted = soundFx.toggleMute();
    setIsAudioMuted(muted);
    if (!muted) {
      soundFx.playClick('high');
    }
  };

  const handleClearFaults = () => {
    soundFx.playSuccess();
    clearAllFaults();
  };

  const handleTogglePause = () => {
    soundFx.playClick('toggle');
    togglePause();
  };

  const handleOpenFaultModal = () => {
    soundFx.playClick('high');
    onOpenFaultModal();
  };

  return (
    <header className="h-14 bg-aerodark border-b border-aeroborder px-4 flex items-center justify-between select-none z-30 sticky top-0">
      {/* Brand & System Title */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center font-bold text-white shadow-md shadow-sky-500/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-base tracking-wider text-white font-mono">AEROTWIN<span className="text-aeroprimary"> AI</span></span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-800 font-mono">MALE GCS v1.0</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono -mt-0.5">ROTAX 914/915 TURBO DIGITAL TWIN</div>
          </div>
        </div>
      </div>

      {/* Center Operational Badges */}
      <div className="hidden md:flex items-center space-x-4 font-mono text-xs">
        {/* Telemetry Stream Status */}
        <div className="flex items-center space-x-2 px-2.5 py-1 rounded bg-aerocard border border-aeroborder">
          <Radio className={`w-3.5 h-3.5 ${connected ? 'text-emerald-400 animate-pulse' : 'text-red-400'}`} />
          <span className="text-slate-400">TELEMETRY:</span>
          <span className={connected ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
            {connected ? 'LIVE (1 Hz)' : 'DISCONNECTED'}
          </span>
        </div>

        {/* Digital Twin Synchronization Indicator */}
        <div className="flex items-center space-x-2 px-2.5 py-1 rounded bg-aerocard border border-aeroborder">
          <Cpu className="w-3.5 h-3.5 text-sky-400" />
          <span className="text-slate-400">TWIN SYNC:</span>
          <span className="text-sky-300 font-semibold">{twinSync.sync_percentage}%</span>
          <span className="text-[10px] text-slate-500">({twinSync.latency_ms}ms)</span>
        </div>

        {/* Overall Health Status */}
        <div className="flex items-center space-x-2 px-2.5 py-1 rounded bg-aerocard border border-aeroborder">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-400">HEALTH:</span>
          <span className={`font-semibold ${health.overall_health < 70 ? 'text-red-400' : (health.overall_health < 85 ? 'text-amber-400' : 'text-emerald-400')}`}>
            {health.overall_health}%
          </span>
        </div>

        {/* Anomaly Level */}
        <div className="flex items-center space-x-2 px-2.5 py-1 rounded bg-aerocard border border-aeroborder">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400">ANOMALY:</span>
          <span className={`font-semibold ${anomaly.anomaly_score > 0.6 ? 'text-red-400' : (anomaly.anomaly_score > 0.3 ? 'text-amber-400' : 'text-emerald-400')}`}>
            {anomaly.anomaly_score} ({anomaly.classification})
          </span>
        </div>
      </div>

      {/* Right Controls: Stream Pause, Audio Toggle & Fault Injection Launcher */}
      <div className="flex items-center space-x-2.5">
        {/* Audio Tactical Sound Toggle */}
        <button
          onClick={handleAudioToggle}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded border text-xs font-mono transition ${
            !isAudioMuted
              ? 'bg-sky-950/80 border-sky-600 text-sky-300 shadow-md shadow-sky-950/50'
              : 'bg-aerocard border-aeroborder text-slate-400 hover:text-slate-200'
          }`}
          title={isAudioMuted ? 'Turn Sound ON (Tactical Audio & Engine Acoustics)' : 'Mute Tactical Audio'}
        >
          {!isAudioMuted ? <Volume2 className="w-3.5 h-3.5 text-sky-400 animate-pulse" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
          <span className="text-[11px]">{!isAudioMuted ? 'AUDIO ON' : 'AUDIO OFF'}</span>
        </button>

        {isFaultInjected && (
          <button
            onClick={handleClearFaults}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-red-950/60 border border-red-700 text-red-300 hover:bg-red-900/80 text-xs font-mono transition"
            title="Clear all injected perturbations"
          >
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>CLEAR FAULTS</span>
          </button>
        )}

        <button
          onClick={handleTogglePause}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded border text-xs font-mono font-medium transition ${
            isPaused
              ? 'bg-amber-950/50 border-amber-600 text-amber-300 hover:bg-amber-900'
              : 'bg-aerocard border-aeroborder text-slate-300 hover:bg-aerocardhover'
          }`}
        >
          {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          <span>{isPaused ? 'RESUME STREAM' : 'PAUSE'}</span>
        </button>

        <button
          onClick={handleOpenFaultModal}
          className="flex items-center space-x-1.5 px-3 py-1 rounded bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-mono text-xs font-semibold shadow-lg shadow-red-900/30 transition border border-red-500/50"
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>FAULT INJECTOR</span>
        </button>
      </div>
    </header>
  );
}
