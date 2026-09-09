/**
 * AEROTWIN AI - Dedicated 3D Digital Twin Inspection Page (/digital-twin)
 * High-Fidelity MALE UAV Airframe & Turbocharged Engine Twin
 */

import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import MaleUav3D from '../three/MaleUav3D';
import { useTelemetryStore } from '../store/telemetryStore';
import {
  Box,
  Eye,
  Camera,
  Layers,
  Thermometer,
  Flame,
  Activity,
  Droplet,
  Info,
  ShieldAlert,
  Plane,
  RotateCw,
  Sparkles,
  Grid as GridIcon
} from 'lucide-react';
import { soundFx } from '../utils/soundFx';

export default function DigitalTwinPage({ onOpenFaultModal }) {
  const { telemetry, health, fault, activeFaults } = useTelemetryStore();
  const [cameraView, setCameraView] = useState('iso');
  const [viewMode, setViewMode] = useState('XRAY_CUTAWAY'); // 'FULL_UAV', 'XRAY_CUTAWAY', 'ENGINE_ONLY'
  const [selectedPart, setSelectedPart] = useState('airframe');
  const [showTacticalGrid, setShowTacticalGrid] = useState(true);

  // Camera preset positions tailored for full UAV airframe and close engine inspection
  const cameraPresets = {
    iso: viewMode === 'ENGINE_ONLY' ? [4.5, 3.5, 4.5] : [7.5, 5.0, 8.5],
    front: viewMode === 'ENGINE_ONLY' ? [0, 1.5, 6.0] : [0, 2.0, 11.0],
    top: viewMode === 'ENGINE_ONLY' ? [0, 6.5, 0.1] : [0, 13.0, 0.1],
    side: viewMode === 'ENGINE_ONLY' ? [6.0, 1.0, 0] : [11.0, 2.0, 0]
  };

  const isFaulted = fault.primary_fault !== 'Healthy';

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col font-mono relative overflow-hidden bg-aeroblack">
      {/* Sub-header Toolbar */}
      <div className="h-12 bg-aerodark border-b border-aeroborder px-4 flex flex-wrap items-center justify-between z-10 shrink-0 gap-2">
        <div className="flex items-center space-x-3">
          <Plane className="w-5 h-5 text-sky-400" />
          <span className="text-sm font-bold text-white tracking-wider">
            3D DIGITAL TWIN • TAPAS MALE-201 TACTICAL UAV & ROTAX 914/915 TURBO
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-sky-950 border border-sky-800 text-sky-300 font-bold hidden sm:inline-block">
            FADEC REAL-TIME SYNC
          </span>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          {/* View Mode Switcher: Full UAV / Engine Cutaway / Isolated Engine */}
          <div className="flex items-center space-x-1 bg-aerocard p-1 rounded border border-aeroborder">
            {[
              { id: 'FULL_UAV', label: 'FULL AIRFRAME' },
              { id: 'XRAY_CUTAWAY', label: 'ENGINE CUTAWAY' },
              { id: 'ENGINE_ONLY', label: 'ISOLATED ENGINE' }
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => {
                  soundFx.playClick('toggle');
                  setViewMode(mode.id);
                }}
                className={`px-2.5 py-1 rounded font-bold transition text-[11px] ${
                  viewMode === mode.id
                    ? 'bg-sky-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {/* Camera View Switcher */}
          <div className="hidden lg:flex items-center space-x-1 bg-aerocard p-1 rounded border border-aeroborder">
            <Camera className="w-3.5 h-3.5 text-slate-400 ml-1 mr-1" />
            {['iso', 'front', 'top', 'side'].map((view) => (
              <button
                key={view}
                onClick={() => {
                  soundFx.playClick('normal');
                  setCameraView(view);
                }}
                className={`px-2 py-0.5 rounded uppercase font-semibold transition text-[11px] ${
                  cameraView === view
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {view}
              </button>
            ))}
          </div>

          {/* Tactical Grid Toggle Button */}
          <button
            onClick={() => {
              soundFx.playClick('toggle');
              setShowTacticalGrid(!showTacticalGrid);
            }}
            className={`px-2.5 py-1 rounded border text-[11px] font-bold flex items-center space-x-1.5 transition ${
              showTacticalGrid
                ? 'bg-sky-950/80 border-sky-600 text-sky-300'
                : 'bg-aerocard border-aeroborder text-slate-400 hover:text-white'
            }`}
            title="Toggle 3D Tactical Reference Grid"
          >
            <GridIcon className="w-3.5 h-3.5" />
            <span>GRID: {showTacticalGrid ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => {
              soundFx.playClick('high');
              onOpenFaultModal();
            }}
            className="px-3 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-semibold transition flex items-center space-x-1 shadow-md shadow-red-950/40"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>INJECT FAULT</span>
          </button>
        </div>
      </div>

      {/* Main Canvas & Component Inspection Layout */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* 3D WebGL Canvas */}
        <div className="flex-1 h-full relative">
          <Canvas camera={{ position: cameraPresets[cameraView], fov: 42 }}>
            <ambientLight intensity={0.75} />
            <directionalLight position={[10, 14, 10]} intensity={1.5} castShadow />
            <directionalLight position={[-10, -6, -6]} intensity={0.6} />
            <directionalLight position={[0, -10, 0]} intensity={0.3} />

            <MaleUav3D
              telemetry={telemetry}
              health={health}
              fault={fault}
              activeFaults={activeFaults}
              viewMode={viewMode}
              selectedPart={selectedPart}
              showGrid={showTacticalGrid}
            />

            <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
          </Canvas>

          {/* Floating Live Telemetry HUD */}
          <div className="absolute top-4 left-4 bg-aerodark/90 backdrop-blur-md border border-aeroborder p-3 rounded-lg text-xs space-y-2 pointer-events-none shadow-xl max-w-xs">
            <div className="text-sky-400 font-bold border-b border-aeroborder pb-1 flex justify-between">
              <span>UAV & PROPULSION STATUS</span>
              <span className="text-emerald-400 font-mono">99.4% SYNC</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-300 text-[11px]">
              <div>CRANK SPEED: <span className="text-white font-bold">{Math.round(telemetry.rpm)} RPM</span></div>
              <div>POWER: <span className="text-white font-bold">{telemetry.power.toFixed(1)} kW</span></div>
              <div>CYLINDER CHT: <span className={telemetry.cht > 165 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>{telemetry.cht}°C</span></div>
              <div>EXHAUST EGT: <span className="text-white font-bold">{telemetry.egt}°C</span></div>
              <div>OIL PRESS: <span className={telemetry.oil_pressure < 2.5 ? 'text-red-400 font-bold' : 'text-white'}>{telemetry.oil_pressure} bar</span></div>
              <div>VIBRATION: <span className="text-white font-bold">{telemetry.vibration} mm/s</span></div>
              <div>PUSHER PROP: <span className="text-sky-300 font-bold">{Math.round(telemetry.rpm / 2.43)} RPM</span></div>
              <div>AIRSPEED: <span className="text-white font-bold">142 KTAS</span></div>
            </div>
          </div>

          {/* View Mode Tag Indicator */}
          <div className="absolute top-4 right-4 bg-aerodark/90 backdrop-blur-md border border-aeroborder px-3 py-1.5 rounded text-[11px] text-sky-400 pointer-events-none font-bold">
            VIEW: {viewMode === 'FULL_UAV' ? 'TACTICAL AIRFRAME' : (viewMode === 'XRAY_CUTAWAY' ? 'ENGINE CUTAWAY (X-RAY)' : 'ISOLATED POWERPLANT')}
          </div>

          {/* Controls Instruction Overlay */}
          <div className="absolute bottom-4 left-4 bg-aerodark/80 backdrop-blur-sm border border-aeroborder px-3 py-1.5 rounded text-[10px] text-slate-400 pointer-events-none">
            Left-Click + Drag to Orbit • Right-Click to Pan • Scroll Wheel to Zoom
          </div>
        </div>

        {/* Right Inspection & Subsystem Diagnostics Panel (w-80) */}
        <div className="w-80 bg-aerodark border-l border-aeroborder p-4 flex flex-col justify-between shrink-0 overflow-y-auto space-y-4">
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block mb-2">
                UAV & POWERPLANT INSPECTOR
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'airframe', label: 'Airframe & Wings' },
                  { id: 'propeller', label: 'Pusher Propeller' },
                  { id: 'flir_turret', label: 'FLIR EO/IR Turret' },
                  { id: 'engine_bay', label: 'Engine Bay Nacelle' },
                  { id: 'cylinders', label: 'Cylinders & Pistons' },
                  { id: 'crankshaft', label: 'Crankshaft & Hub' },
                  { id: 'fuel_injection', label: 'EFI Fuel Rails' },
                  { id: 'lubrication', label: 'Lubrication Sump' },
                  { id: 'turbocharger', label: 'Turbo & Intercooler' },
                  { id: 'sensors', label: 'Avionics & Sensors' }
                ].map((part) => (
                  <button
                    key={part.id}
                    onClick={() => {
                      soundFx.playClick('normal');
                      setSelectedPart(part.id);
                    }}
                    className={`p-2 rounded border text-left font-semibold transition text-[11px] ${
                      selectedPart === part.id
                        ? 'bg-sky-950/80 border-sky-500 text-sky-300 ring-1 ring-sky-500'
                        : 'bg-aerocard border-aeroborder text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {part.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Component Technical Readout */}
            <div className="bg-aerocard border border-aeroborder rounded-lg p-3 space-y-2 text-xs">
              <div className="font-bold text-sky-400 uppercase flex items-center justify-between border-b border-aeroborder/60 pb-1.5">
                <span>{selectedPart.replace('_', ' ').toUpperCase()} DETAILS</span>
                <span className="text-[10px] text-emerald-400">VERIFIED</span>
              </div>

              {selectedPart === 'airframe' && (
                <div className="space-y-1.5 text-slate-300">
                  <div className="flex justify-between"><span>Airframe Model:</span><span className="font-bold text-white">TAPAS MALE-201 (Rustom-II)</span></div>
                  <div className="flex justify-between"><span>Wingspan:</span><span className="font-bold text-white">20.6 meters (High Aspect Ratio)</span></div>
                  <div className="flex justify-between"><span>Fuselage Length:</span><span className="font-bold text-white">9.5 meters</span></div>
                  <div className="flex justify-between"><span>Max Takeoff Weight:</span><span className="font-bold text-white">1,800 kg (MTOW)</span></div>
                  <div className="flex justify-between"><span>Payload Capacity:</span><span className="font-bold text-sky-400">350 kg (Sensors + Fuel)</span></div>
                  <div className="flex justify-between"><span>Operating Ceiling:</span><span className="font-bold text-white">35,000 ft (10,600 m)</span></div>
                </div>
              )}

              {selectedPart === 'propeller' && (
                <div className="space-y-1.5 text-slate-300">
                  <div className="flex justify-between"><span>Propeller Type:</span><span className="font-bold text-white">3-Blade Constant-Speed Pusher</span></div>
                  <div className="flex justify-between"><span>Blade Material:</span><span className="font-bold text-white">Carbon-Fiber Composite</span></div>
                  <div className="flex justify-between"><span>Prop Speed:</span><span className="font-bold text-sky-300">{Math.round(telemetry.rpm / 2.43)} RPM</span></div>
                  <div className="flex justify-between"><span>Prop Pitch Governor:</span><span className="font-bold text-emerald-400">Hydraulic Dual-Action</span></div>
                  <div className="flex justify-between"><span>Static Thrust:</span><span className="font-bold text-white">2.85 kN (Takeoff)</span></div>
                </div>
              )}

              {selectedPart === 'flir_turret' && (
                <div className="space-y-1.5 text-slate-300">
                  <div className="flex justify-between"><span>Payload:</span><span className="font-bold text-white">Stabilized EO/IR Gimbal</span></div>
                  <div className="flex justify-between"><span>Infrared Sensor:</span><span className="font-bold text-white">MWIR Cooled 1280x1024</span></div>
                  <div className="flex justify-between"><span>Electro-Optical:</span><span className="font-bold text-white">Continuous Optical Zoom HD</span></div>
                  <div className="flex justify-between"><span>Laser Rangefinder:</span><span className="font-bold text-emerald-400">20 km Class 1 Eye-Safe</span></div>
                  <div className="flex justify-between"><span>Azimuth Coverage:</span><span className="font-bold text-white">360° Continuous Rotation</span></div>
                </div>
              )}

              {selectedPart === 'engine_bay' && (
                <div className="space-y-1.5 text-slate-300">
                  <div className="flex justify-between"><span>Powerplant:</span><span className="font-bold text-white">Rotax 914 / 915 iS Turbo</span></div>
                  <div className="flex justify-between"><span>Mounting:</span><span className="font-bold text-white">Aft Dorsal Fuselage Nacelle</span></div>
                  <div className="flex justify-between"><span>Vibration Dampers:</span><span className="font-bold text-emerald-400">Elastomeric Trunnions (4x)</span></div>
                  <div className="flex justify-between"><span>Fire Suppression:</span><span className="font-bold text-emerald-400">Pneumatic Linear Detector</span></div>
                </div>
              )}

              {selectedPart === 'cylinders' && (
                <div className="space-y-1.5 text-slate-300">
                  <div className="flex justify-between"><span>Configuration:</span><span className="font-bold text-white">4-Cyl Horizontally Opposed</span></div>
                  <div className="flex justify-between"><span>Displacement:</span><span className="font-bold text-white">1,352 cc</span></div>
                  <div className="flex justify-between"><span>Cylinder 1/3 CHT:</span><span className="font-bold text-emerald-400">{telemetry.cht}°C</span></div>
                  <div className="flex justify-between"><span>Cylinder 2/4 CHT:</span><span className="font-bold text-emerald-400">{(telemetry.cht - 1.5).toFixed(1)}°C</span></div>
                  <div className="flex justify-between"><span>Firing Order:</span><span className="font-bold text-white">1 - 4 - 3 - 2</span></div>
                </div>
              )}

              {selectedPart === 'crankshaft' && (
                <div className="space-y-1.5 text-slate-300">
                  <div className="flex justify-between"><span>Rotational Speed:</span><span className="font-bold text-white">{Math.round(telemetry.rpm)} RPM</span></div>
                  <div className="flex justify-between"><span>1X Fundamental Freq:</span><span className="font-bold text-white">{(telemetry.rpm / 60).toFixed(1)} Hz</span></div>
                  <div className="flex justify-between"><span>Gearbox Reduction:</span><span className="font-bold text-white">1 : 2.43</span></div>
                  <div className="flex justify-between"><span>Vibration Amplitude:</span><span className="font-bold text-white">{telemetry.vibration} mm/s</span></div>
                </div>
              )}

              {selectedPart === 'fuel_injection' && (
                <div className="space-y-1.5 text-slate-300">
                  <div className="flex justify-between"><span>Injection Type:</span><span className="font-bold text-white">Multipoint Port Injection</span></div>
                  <div className="flex justify-between"><span>Fuel Mass Flow:</span><span className="font-bold text-white">{(telemetry.fuel_flow * 0.74).toFixed(1)} kg/h</span></div>
                  <div className="flex justify-between"><span>Fuel Vol Flow:</span><span className="font-bold text-white">{telemetry.fuel_flow} L/h</span></div>
                  <div className="flex justify-between"><span>Timing BTDC:</span><span className="font-bold text-white">{telemetry.injection_timing}°</span></div>
                </div>
              )}

              {selectedPart === 'lubrication' && (
                <div className="space-y-1.5 text-slate-300">
                  <div className="flex justify-between"><span>System Pressure:</span><span className={`font-bold ${telemetry.oil_pressure < 2.5 ? 'text-red-400' : 'text-emerald-400'}`}>{telemetry.oil_pressure} bar</span></div>
                  <div className="flex justify-between"><span>Oil Temperature:</span><span className="font-bold text-white">{telemetry.oil_temperature}°C</span></div>
                  <div className="flex justify-between"><span>Oil Capacity:</span><span className="font-bold text-white">3.0 Liters</span></div>
                  <div className="flex justify-between"><span>Filter Differential:</span><span className="font-bold text-emerald-400">0.12 bar (Nominal)</span></div>
                </div>
              )}

              {selectedPart === 'turbocharger' && (
                <div className="space-y-1.5 text-slate-300">
                  <div className="flex justify-between"><span>Manifold Air Press:</span><span className="font-bold text-white">39.2 inHg</span></div>
                  <div className="flex justify-between"><span>Wastegate Duty:</span><span className="font-bold text-white">44%</span></div>
                  <div className="flex justify-between"><span>Turbine Temp:</span><span className="font-bold text-white">{telemetry.egt}°C</span></div>
                  <div className="flex justify-between"><span>Intercooler Out:</span><span className="font-bold text-white">{(telemetry.ambient_temperature + 18).toFixed(1)}°C</span></div>
                </div>
              )}

              {selectedPart === 'sensors' && (
                <div className="space-y-1.5 text-slate-300">
                  <div className="flex justify-between"><span>Thermocouple Type:</span><span className="font-bold text-white">Type K (Exhaust/CHT)</span></div>
                  <div className="flex justify-between"><span>Piezo Accelerometer:</span><span className="font-bold text-white">IEPE Triaxial (100 mV/g)</span></div>
                  <div className="flex justify-between"><span>Pressure Transducer:</span><span className="font-bold text-white">Piezoresistive 0-10 bar</span></div>
                  <div className="flex justify-between"><span>Sensor Health Conf:</span><span className="font-bold text-emerald-400">97.5% (Fused)</span></div>
                </div>
              )}
            </div>

            {/* Subsystem Health Ring Indicator */}
            <div className="bg-aerocard border border-aeroborder rounded-lg p-3 space-y-2">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                PROPULSION TWIN HEALTH
              </span>
              <div className="flex items-center justify-between text-xs">
                <span>Overall Propulsion:</span>
                <span className="font-bold text-emerald-400">{health.overall_health}%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>Anomaly Risk:</span>
                <span className={fault.severity === 'CRITICAL' ? 'text-red-400 font-bold' : 'text-slate-300 font-bold'}>
                  {fault.primary_fault}
                </span>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 font-sans border-t border-aeroborder pt-2">
            TAPAS-BH-201 MALE UAV Airframe with Turbocharged Aero Engine. Synchronized with live telemetry pipeline.
          </div>
        </div>
      </div>
    </div>
  );
}
