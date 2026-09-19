/**
 * AEROTWIN AI - Primary Command Center Dashboard (/dashboard)
 * Ground Control Station Tactical Propulsion Health & Digital Twin Monitor
 */

import React, { useState } from 'react';
import { useTelemetryStore } from '../store/telemetryStore';
import GaugeCard from '../components/GaugeCard';
import HealthScoreRing from '../components/HealthScoreRing';
import MaleUav3D from '../three/MaleUav3D';
import PistonEngine3D from '../three/PistonEngine3D';
import FlightDynamicsBar from '../components/FlightDynamicsBar';
import TacticalGpsMap from '../components/TacticalGpsMap';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { soundFx } from '../utils/soundFx';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis
} from 'recharts';
import {
  Gauge,
  Thermometer,
  Flame,
  Droplet,
  Wind,
  Zap,
  Battery,
  AlertTriangle,
  Plane,
  ShieldCheck,
  Radio,
  Clock,
  CheckCircle2,
  ChevronRight,
  Activity,
  Cpu,
  Target,
  Power
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { OperationalModeBar } from '../components/OperationalModeBar';
import { UniversalActionModals } from '../components/UniversalActionModals';
import { CausalGraphViewer } from '../components/CausalGraphViewer';
import { DemoModeController } from '../components/DemoModeController';

export default function DashboardPage({ onOpenFaultModal }) {
  const navigate = useNavigate();
  const {
    telemetry,
    history,
    anomaly,
    fault,
    health,
    explanation,
    twinSync,
    twinState,
    intelligenceState,
    operationalMode,
    openWhyModal,
    openWhatIfModal,
    openWhatChangedModal,
    openWhatShouldIDoModal,
    openCanICompleteMissionModal,
    missionReliability,
    activeFaults,
    flightParams,
    setFlightParams,
    engineState,
    startEngine,
    stopEngine,
    toggleEngine
  } = useTelemetryStore();

  const [flightMode, setFlightMode] = useState('CRUISE');
  const [dashboard3DMode, setDashboard3DMode] = useState('FULL_UAV'); // 'FULL_UAV' | 'ENGINE_ONLY'
  const [flightTelemetry, setFlightTelemetry] = useState({
    phase: 'CRUISE',
    phaseLabel: 'AIRBORNE CRUISE',
    altitudeM: 1200,
    airspeedKts: 142,
    pitchDeg: 0.8,
    gearState: 'RETRACTED'
  });

  const fidelity = twinState?.fidelity || {
    overall_fidelity: 94.2,
    physics_agreement: 95.0,
    sensor_agreement: 96.0,
    ai_agreement: 92.0,
    temporal_consistency: 94.0
  };

  const healthDnaData = [
    { subject: 'Thermal', val: twinState?.health_dna?.Thermal || 92.5 },
    { subject: 'Combust', val: twinState?.health_dna?.Combustion || 96.0 },
    { subject: 'Lubric', val: twinState?.health_dna?.Lubrication || 93.8 },
    { subject: 'Mechan', val: twinState?.health_dna?.Mechanical || 95.1 },
    { subject: 'Electr', val: twinState?.health_dna?.Electrical || 98.0 },
    { subject: 'Fuel', val: twinState?.health_dna?.Fuel || 94.7 },
    { subject: 'Sensor', val: twinState?.health_dna?.Sensor || 96.5 },
    { subject: 'Effic', val: twinState?.health_dna?.Efficiency || 93.5 }
  ];

  const consensus = twinState?.consensus || fault;

  const diag = intelligenceState?.diagnosis || twinState?.diagnosis || {
    primary_fault: fault?.primary_fault || 'Healthy',
    probability: fault?.probability || 0.94,
    confidence: fault?.probability || 0.89,
    model_agreement: 0.89
  };

  const isFaulted = (fault?.primary_fault && fault.primary_fault !== 'Healthy') || anomaly?.is_anomaly;

  return (
    <div className="space-y-4 p-4 font-mono">
      {/* Top Operational Mode Switcher Bar */}
      <OperationalModeBar />

      {/* Automated Demo Mode 2.0 Controller */}
      <DemoModeController />

      {/* Top Tactical Status Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* 1. UAV Status */}
        <div className="bg-aerocard border border-aeroborder rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded bg-sky-950 border border-sky-800 flex items-center justify-center text-sky-400">
              <Plane className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase">UAV AIRFRAME</div>
              <div className="text-sm font-bold text-white">TAPAS MALE-201</div>
              <div className="text-[10px] text-emerald-400">STATUS: AIRBORNE (ACTIVE)</div>
            </div>
          </div>
          <span className="text-xs px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400 font-bold">
            GARUDA-01
          </span>
        </div>

        {/* 2. Powerplant Model */}
        <div className="bg-aerocard border border-aeroborder rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded bg-indigo-950 border border-indigo-800 flex items-center justify-center text-indigo-400">
              <Gauge className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase">PROPULSION UNIT</div>
              <div className="text-sm font-bold text-white">ROTAX 914 TURBO</div>
              <div className="text-[10px] text-slate-400">S/N: RTX-914-F0192</div>
            </div>
          </div>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold border border-slate-700">
            141 HP
          </span>
        </div>

        {/* 3. Active Mission Status */}
        <div className="bg-aerocard border border-aeroborder rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase">MISSION PROFILE</div>
              <div className="text-sm font-bold text-white">MSN-ISR-0841 (ISR)</div>
              <div className="text-[10px] text-sky-400">LOITER FL120 | 70% PWR</div>
              <button
                onClick={openCanICompleteMissionModal}
                className="text-[9px] font-mono text-emerald-400 hover:text-emerald-300 font-bold underline block mt-0.5"
              >
                [CAN I COMPLETE MISSION?]
              </button>
            </div>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded font-bold border ${
            isFaulted ? 'bg-amber-950/60 border-amber-700 text-amber-400' : 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
          }`}>
            {isFaulted ? 'ELEVATED RISK' : 'LOW RISK'}
          </span>
        </div>

        {/* 4. RUL & Failure Probability */}
        <div className="bg-aerocard border border-aeroborder rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase">ESTIMATED RUL</div>
              <div className="text-base font-bold text-white">{health.rul_hours} <span className="text-xs font-normal text-slate-400">HOURS</span></div>
              <div className="flex items-center gap-1.5 mt-1">
                <button
                  onClick={() => openWhyModal('RUL', 'Probabilistic RUL & Failure Horizon', health)}
                  className="text-[9px] font-bold px-1.5 py-0.5 bg-cyan-950/80 border border-cyan-700 text-cyan-300 rounded hover:bg-cyan-900"
                >
                  WHY?
                </button>
                <button
                  onClick={() => openWhatIfModal()}
                  className="text-[9px] font-bold px-1.5 py-0.5 bg-indigo-950/80 border border-indigo-700 text-indigo-300 rounded hover:bg-indigo-900"
                >
                  WHAT IF?
                </button>
              </div>
            </div>
          </div>
          <span className="text-[10px] text-slate-400 text-right">
            95% CI:<br /><span className="text-slate-200 font-bold">{health.rul_ci_lower}–{health.rul_ci_upper}h</span>
          </span>
        </div>
      </div>

      {/* Active Fault Alert Banner (Visible when anomaly or fault occurs) */}
      {isFaulted && (
        <div className="bg-gradient-to-r from-red-950/80 via-amber-950/50 to-aerocard border border-red-700/80 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-red-300 uppercase tracking-wider flex items-center space-x-2 flex-wrap gap-y-1">
                <span>AI DIAGNOSTIC ALERT: {fault.primary_fault} ({(fault.probability * 100).toFixed(1)}% CONFIDENCE)</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-900 border border-red-700 text-white font-bold">
                  {fault.severity || 'CRITICAL'}
                </span>
                {fault.fault_stage && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-900/80 border border-amber-600 text-amber-300 font-bold">
                    STAGE {fault.fault_stage.stage}: {fault.fault_stage.name} ({fault.fault_stage.early_warning_horizon})
                  </span>
                )}
                {fault.is_unknown_fault && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-900 border border-purple-500 text-purple-200 font-bold animate-bounce">
                    ⚠ UNKNOWN ANOMALY SIGNATURE
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-300 font-sans mt-0.5">{explanation.narrative_summary}</p>
              <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-slate-400">
                <span>Source: Bi-GRU + Physics Residual</span>
                <span>•</span>
                <span>Confidence: {Math.round((diag.confidence || 0.89) * 100)}%</span>
                <span>•</span>
                <span>Data Quality: 98.5%</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={openWhatShouldIDoModal}
              className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-slate-950 font-mono text-xs font-bold transition shadow"
            >
              WHAT SHOULD I DO?
            </button>
            <button
              onClick={() => openWhyModal('FAULT', `Why is ${fault.primary_fault} active?`, fault)}
              className="px-2.5 py-1 rounded bg-cyan-950 border border-cyan-800 text-cyan-300 hover:bg-cyan-900 text-xs font-mono font-bold transition"
            >
              WHY?
            </button>
            <button
              onClick={() => navigate('/ai-copilot')}
              className="px-3 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition flex items-center space-x-1"
            >
              <span>CONSULT COPILOT</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Center Grid: Gauges (Left), 3D Digital Twin View (Center), Health & Diagnostics (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Real-time Telemetry Gauges (5 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 pb-1 border-b border-aeroborder">
            <span>LIVE PROPULSION GAUGES</span>
            <span className="text-[10px] text-slate-400 font-normal">SAMPLING: 1000ms</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <GaugeCard
              title="RPM"
              value={Math.round(telemetry.rpm)}
              unit="RPM"
              min={1200}
              max={6000}
              warnMax={5500}
              critMax={5850}
              icon={Gauge}
            />
            <GaugeCard
              title="CHT (HEAD TEMP)"
              value={telemetry.cht}
              unit="°C"
              min={80}
              max={220}
              warnMax={165}
              critMax={185}
              icon={Thermometer}
            />
            <GaugeCard
              title="EGT (EXHAUST)"
              value={telemetry.egt}
              unit="°C"
              min={500}
              max={950}
              warnMax={840}
              critMax={890}
              icon={Flame}
            />
            <GaugeCard
              title="OIL PRESSURE"
              value={telemetry.oil_pressure}
              unit="bar"
              min={0.5}
              max={6.0}
              critMin={2.0}
              warnMin={3.0}
              icon={Droplet}
            />
            <GaugeCard
              title="OIL TEMP"
              value={telemetry.oil_temperature}
              unit="°C"
              min={50}
              max={140}
              warnMax={105}
              critMax={118}
              icon={Thermometer}
            />
            <GaugeCard
              title="FUEL FLOW"
              value={telemetry.fuel_flow}
              unit="L/h"
              min={2.0}
              max={45.0}
              warnMax={28.0}
              critMax={35.0}
              icon={Droplet}
            />
            <GaugeCard
              title="VIBRATION RMS"
              value={telemetry.vibration}
              unit="mm/s"
              min={0.5}
              max={10.0}
              warnMax={3.8}
              critMax={5.2}
              icon={Wind}
            />
            <GaugeCard
              title="AVIONICS BUS"
              value={telemetry.battery_voltage}
              unit="V DC"
              min={20.0}
              max={32.0}
              critMin={24.0}
              warnMin={26.0}
              icon={Battery}
            />
          </div>

          {/* Quick Engine Flight Control & Ignition Card */}
          <div className="bg-aerocard border border-aeroborder rounded-lg p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                ENGINE MASTER & THROTTLE
              </span>
              <button
                onClick={toggleEngine}
                disabled={engineState === 'STARTING'}
                className={`px-2.5 py-1 rounded text-[10px] font-bold flex items-center space-x-1.5 transition border ${
                  engineState === 'RUNNING'
                    ? 'bg-red-950/80 hover:bg-red-900 border-red-700 text-red-200'
                    : engineState === 'STARTING'
                    ? 'bg-amber-950 border-amber-500 text-amber-300 animate-pulse'
                    : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400 text-white animate-pulse'
                }`}
                title="Turn on or cut engine ignition"
              >
                <Power className={`w-3 h-3 ${engineState === 'STARTING' ? 'animate-spin text-amber-400' : ''}`} />
                <span>
                  {engineState === 'RUNNING' ? 'CUT ENGINE' : (engineState === 'STARTING' ? 'CRANKING...' : 'START ENGINE')}
                </span>
              </button>
            </div>

            <div className="flex justify-between items-center text-[10px] text-slate-400 border-y border-aeroborder/60 py-1">
              <span>STATUS: <strong className={engineState === 'RUNNING' ? 'text-emerald-400' : (engineState === 'STARTING' ? 'text-amber-400' : 'text-slate-500')}>{engineState}</strong></span>
              <span>RPM: <strong className="text-white">{Math.round(telemetry.rpm)}</strong></span>
              <span>OIL: <strong className={telemetry.oil_pressure < 2.5 ? 'text-red-400' : 'text-emerald-400'}>{Number(telemetry.oil_pressure || 4.2).toFixed(2)} bar</strong></span>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] text-slate-400 flex justify-between">
                <span>THROTTLE POSITION</span>
                <span className="text-sky-400 font-bold">{flightParams.throttle}%</span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                disabled={engineState === 'OFF'}
                value={flightParams.throttle}
                onChange={(e) => {
                  soundFx.playClick('normal');
                  setFlightParams({ throttle: e.target.value });
                }}
                className={`w-full accent-sky-500 bg-slate-800 h-1.5 rounded cursor-pointer ${engineState === 'OFF' ? 'opacity-40 cursor-not-allowed' : ''}`}
              />
              <div className="flex justify-between text-[9px] text-slate-400">
                <span>Idle (20%)</span>
                <span>Cruise (70%)</span>
                <span>Takeoff (100%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Column: 3D Digital Twin Viewport (5 cols) */}
        <div className="lg:col-span-5 flex flex-col space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 pb-1 border-b border-aeroborder">
            <div className="flex items-center space-x-2">
              <span>3D DIGITAL TWIN SYNCHRONIZATION</span>
              {/* 3D View Mode — 2 Options */}
              <div className="flex items-center space-x-1 bg-slate-900/90 p-0.5 rounded-lg border border-aeroborder text-[10px]">
                <button
                  onClick={() => {
                    soundFx.playClick('toggle');
                    setDashboard3DMode('FULL_UAV');
                  }}
                  className={`px-2.5 py-1 rounded-md font-bold transition flex items-center space-x-1 ${
                    dashboard3DMode === 'FULL_UAV'
                      ? 'bg-sky-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title="View TAPAS MALE-201 UAV 3D Airframe"
                >
                  <span>🛩️</span><span>MALE UAV</span>
                </button>
                <button
                  onClick={() => {
                    soundFx.playClick('toggle');
                    setDashboard3DMode('ENGINE_ONLY');
                  }}
                  className={`px-2.5 py-1 rounded-md font-bold transition flex items-center space-x-1 ${
                    dashboard3DMode === 'ENGINE_ONLY'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title="View Rotax 912/914 Engine 3D Digital Twin"
                >
                  <span>⚙️</span><span>ENGINE</span>
                </button>
                <button
                  onClick={() => {
                    soundFx.playClick('toggle');
                    setDashboard3DMode('GPS_MAP');
                  }}
                  className={`px-2.5 py-1 rounded-md font-bold transition flex items-center space-x-1 ${
                    dashboard3DMode === 'GPS_MAP'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title="View Tactical GPS Route Map & Last Location"
                >
                  <span>🗺️</span><span>GPS MAP</span>
                </button>
              </div>
            </div>
            <button
              onClick={() => navigate('/digital-twin')}
              className="text-[10px] text-sky-400 hover:text-sky-300 transition flex items-center space-x-1"
            >
              <span>EXPAND 3D VIEW</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* Top Flight Dynamics & Takeoff / Landing Control Bar */}
          <FlightDynamicsBar
            flightMode={flightMode}
            onSetFlightMode={setFlightMode}
            flightTelemetry={flightTelemetry}
            compact={true}
          />

          {/* 3D Canvas Box OR Tactical GPS Route Map */}
          {dashboard3DMode === 'GPS_MAP' ? (
            <TacticalGpsMap height="370px" showControls={true} />
          ) : (
            <div className={`h-[370px] rounded-lg border border-aeroborder relative overflow-hidden flex items-center justify-center ${
              dashboard3DMode === 'ENGINE_ONLY' ? 'bg-[#020617]' : 'bg-aerodark'
            }`}>
              <Canvas
                key={dashboard3DMode}
                camera={{
                  position: dashboard3DMode === 'ENGINE_ONLY' ? [4.5, 3.2, 3.8] : [6.5, 4.5, 6.5],
                  fov: dashboard3DMode === 'ENGINE_ONLY' ? 48 : 45
                }}
                gl={{ antialias: true, alpha: false }}
              >
                {dashboard3DMode === 'ENGINE_ONLY' ? (
                  <>
                    {/* Dark scene + rim lights for wireframe clarity */}
                    <color attach="background" args={['#020617']} />
                    <ambientLight intensity={0.25} />
                    <directionalLight position={[8, 10, 6]} intensity={1.2} color="#e0f2fe" />
                    <directionalLight position={[-8, 2, -4]} intensity={0.6} color="#bfdbfe" />
                    <pointLight position={[0, 4, 0]} intensity={1.5} color="#38bdf8" distance={8} />
                    <pointLight position={[-3, 0, 0]} intensity={0.8} color="#7dd3fc" distance={6} />
                    <pointLight position={[2, -1, 2]} intensity={0.5} color="#0ea5e9" distance={5} />
                    <PistonEngine3D
                      telemetry={telemetry}
                      health={health}
                      fault={fault}
                      activeFaults={activeFaults}
                      isEngineRunning={engineState === 'RUNNING'}
                    />
                  </>
                ) : (
                  <>
                    <ambientLight intensity={0.7} />
                    <directionalLight position={[10, 10, 5]} intensity={1.4} />
                    <directionalLight position={[-8, -4, -5]} intensity={0.5} />
                    <pointLight position={[0, 3, 0]} intensity={1.2} color="#38bdf8" />
                    <MaleUav3D
                      telemetry={telemetry}
                      health={health}
                      fault={fault}
                      activeFaults={activeFaults}
                      viewMode={dashboard3DMode}
                      renderMode="REALISTIC"
                      flightMode={flightMode}
                      onFlightTelemetryUpdate={setFlightTelemetry}
                    />
                  </>
                )}
                <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} autoRotate={false} />
              </Canvas>

              {/* In-canvas Telemetry Overlay */}
              <div className="absolute top-2 left-2 bg-aeroblack/85 backdrop-blur-md border border-aeroborder/80 p-2.5 rounded-lg text-[10px] space-y-1 text-slate-300 pointer-events-none shadow-xl">
                <div className="text-sky-400 font-bold flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>
                    {dashboard3DMode === 'ENGINE_ONLY'
                      ? 'ROTAX 914/915 TURBO POWERPLANT TWIN'
                      : 'TAPAS MALE-201 AIRFRAME & TWIN'}
                  </span>
                </div>
                <div>Crankshaft Speed: <span className="text-white font-bold">{Math.round(telemetry.rpm)} RPM</span></div>
                <div>Thermal Level (CHT): <span className={telemetry.cht > 165 ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold'}>{Number(telemetry.cht || 142).toFixed(1)}°C</span></div>
                <div>Exhaust Temp (EGT): <span className="text-slate-200 font-bold">{Number(telemetry.egt || 795).toFixed(1)}°C</span></div>
                <div>Mechanical Vib: <span className="text-white font-bold">{Number(telemetry.vibration || 2.15).toFixed(2)} mm/s</span></div>
              </div>

              <div className="absolute bottom-2 right-2 bg-aeroblack/80 backdrop-blur-sm border border-aeroborder/80 px-2 py-1 rounded text-[9px] text-slate-400 pointer-events-none">
                Use mouse to Rotate • Scroll to Zoom
              </div>
            </div>
          )}

          {/* Real-time Rolling Telemetry Chart */}
          <div className="bg-aerocard border border-aeroborder rounded-lg p-3 flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300">LIVE TELEMETRY STREAM (ROLLING BUFFER)</span>
              <div className="flex items-center space-x-3 text-[10px]">
                <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-sky-400" /><span>CHT</span></span>
                <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-emerald-400" /><span>OIL PRESS x30</span></span>
                <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-red-400" /><span>VIB x20</span></span>
              </div>
            </div>

            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 9 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 9 }} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }}
                  />
                  <Line type="monotone" dataKey="cht" stroke="#38bdf8" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey={(d) => (d.oil_pressure * 30).toFixed(1)} stroke="#10b981" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey={(d) => (d.vibration * 20).toFixed(1)} stroke="#f87171" strokeWidth={1.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Column: AI Health Index & Predictive Diagnostics (3 cols) */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300 pb-1 border-b border-aeroborder">
            <span>HEALTH & DIAGNOSTICS</span>
            <span className="text-[10px] text-emerald-400 font-normal">ENSEMBLE ACTIVE</span>
          </div>

          {/* Circular Health Ring */}
          <div className="bg-aerocard border border-aeroborder rounded-lg p-4 flex flex-col items-center">
            <HealthScoreRing score={health.overall_health} size={150} />
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => openWhyModal('HEALTH', 'Overall Powerplant Health Breakdown', health)}
                className="text-[10px] font-mono font-bold px-2 py-0.5 bg-cyan-950/80 border border-cyan-800 text-cyan-300 rounded hover:bg-cyan-900 transition"
              >
                WHY?
              </button>
              <button
                onClick={openWhatChangedModal}
                className="text-[10px] font-mono font-bold px-2 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded hover:bg-slate-700 transition"
              >
                WHAT CHANGED?
              </button>
            </div>
            <div className="w-full grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-aeroborder text-center text-xs">
              <div>
                <span className="text-[9px] text-slate-400 block">DEGRADATION</span>
                <span className="font-bold text-amber-400">{health.degradation_index}%</span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block">ANOMALY SCORE</span>
                <span className={`font-bold ${anomaly.anomaly_score > 0.6 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {anomaly.anomaly_score}
                </span>
              </div>
            </div>
          </div>

          {/* Subsystem Health Progress Bars */}
          <div className="bg-aerocard border border-aeroborder rounded-lg p-3 space-y-2">
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
              SUBSYSTEM HEALTH STATUS
            </span>

            {[
              { label: 'Thermal Health', val: health.thermal_health, warn: 75 },
              { label: 'Combustion Health', val: health.combustion_health, warn: 80 },
              { label: 'Lubrication Health', val: health.lubrication_health, warn: 75 },
              { label: 'Vibration / Mechanical', val: health.vibration_health, warn: 70 },
              { label: 'Fuel System', val: health.fuel_system_health, warn: 75 },
              { label: 'Electrical Bus', val: health.electrical_health, warn: 85 }
            ].map((sub, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">{sub.label}</span>
                  <span className={`font-bold ${sub.val < 70 ? 'text-red-400' : (sub.val < 85 ? 'text-amber-400' : 'text-slate-200')}`}>
                    {sub.val}%
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      sub.val < 70 ? 'bg-red-500' : (sub.val < 85 ? 'bg-amber-500' : 'bg-emerald-500')
                    }`}
                    style={{ width: `${sub.val}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Digital Twin Fidelity Score Card */}
          <div className="bg-aerocard border border-aeroborder rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 uppercase tracking-wider">
              <span className="flex items-center space-x-1.5">
                <Cpu className="w-3.5 h-3.5 text-sky-400" />
                <span>TWIN FIDELITY SCORE</span>
              </span>
              <span className="text-sky-400 font-bold">{fidelity.overall_fidelity}%</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-500"
                style={{ width: `${fidelity.overall_fidelity}%` }}
              />
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[9px] pt-1 text-slate-400">
              <div className="flex justify-between"><span>Physics Agmt:</span><span className="text-slate-200 font-bold">{fidelity.physics_agreement}%</span></div>
              <div className="flex justify-between"><span>Sensor Agmt:</span><span className="text-slate-200 font-bold">{fidelity.sensor_agreement}%</span></div>
              <div className="flex justify-between"><span>AI Agmt:</span><span className="text-slate-200 font-bold">{fidelity.ai_agreement}%</span></div>
              <div className="flex justify-between"><span>Temporal Cons:</span><span className="text-slate-200 font-bold">{fidelity.temporal_consistency}%</span></div>
            </div>
          </div>

          {/* Engine Health DNA Radar Chart */}
          <div className="bg-aerocard border border-aeroborder rounded-lg p-3 flex flex-col items-center">
            <div className="w-full flex items-center justify-between text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
              <span className="flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                <span>ENGINE HEALTH DNA</span>
              </span>
              <span className="text-[9px] text-slate-400">8-AXIS FINGERPRINT</span>
            </div>
            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={healthDnaData} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 8 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#334155" tick={false} />
                  <Radar name="Garuda-01" dataKey="val" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.4} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={onOpenFaultModal}
              className="w-full py-2.5 px-3 rounded bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs shadow-lg shadow-red-900/30 transition flex items-center justify-center space-x-2 border border-red-500/50"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>TEST FAULT INJECTION SCENARIOS</span>
            </button>
            <button
              onClick={() => navigate('/mission-simulator')}
              className="w-full py-2 px-3 rounded bg-aerocard border border-aeroborder hover:bg-aerocardhover text-slate-300 text-xs transition flex items-center justify-center space-x-1.5"
            >
              <Plane className="w-3.5 h-3.5 text-sky-400" />
              <span>CONFIGURE MISSION SIMULATOR</span>
            </button>
          </div>
        </div>
      </div>

      {/* Engineer Mode: Interactive Physics Causal Graph */}
      {operationalMode === 'ENGINEER' && (
        <div className="mt-4">
          <CausalGraphViewer />
        </div>
      )}

      {/* Universal Interactive Action Modals (WHY, WHAT IF, WHAT CHANGED, WHAT SHOULD I DO, CAN I COMPLETE MISSION) */}
      <UniversalActionModals />
    </div>
  );
}
