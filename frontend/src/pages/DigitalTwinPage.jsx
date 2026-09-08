/**
 * AEROTWIN AI - Dedicated 3D Digital Twin Inspection Page (/digital-twin)
 */

import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
import PistonEngine3D from '../three/PistonEngine3D';
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
  RotateCw
} from 'lucide-react';

export default function DigitalTwinPage({ onOpenFaultModal }) {
  const { telemetry, health, fault, activeFaults } = useTelemetryStore();
  const [cameraView, setCameraView] = useState('iso');
  const [selectedPart, setSelectedPart] = useState('cylinders');

  // Camera preset positions
  const cameraPresets = {
    iso: [4.5, 3.5, 4.5],
    front: [0, 1.5, 6.0],
    top: [0, 6.5, 0.1],
    side: [6.0, 1.0, 0]
  };

  const isFaulted = fault.primary_fault !== 'Healthy';

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col font-mono relative overflow-hidden bg-aeroblack">
      {/* Sub-header Toolbar */}
      <div className="h-12 bg-aerodark border-b border-aeroborder px-4 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center space-x-3">
          <Box className="w-5 h-5 text-sky-400" />
          <span className="text-sm font-bold text-white tracking-wider">
            3D DIGITAL TWIN • ROTAX 914/915 TURBOCHAGED PROPULSION ASSEMBLY
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-sky-950 border border-sky-800 text-sky-300">
            FADEC SYNCHRONIZED
          </span>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          {/* Camera View Switcher */}
          <div className="flex items-center space-x-1 bg-aerocard p-1 rounded border border-aeroborder">
            <Camera className="w-3.5 h-3.5 text-slate-400 ml-1 mr-1" />
            {['iso', 'front', 'top', 'side'].map((view) => (
              <button
                key={view}
                onClick={() => setCameraView(view)}
                className={`px-2 py-0.5 rounded uppercase font-semibold transition ${
                  cameraView === view
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {view}
              </button>
            ))}
          </div>

          <button
            onClick={onOpenFaultModal}
            className="px-3 py-1 rounded bg-red-600 hover:bg-red-500 text-white font-semibold transition flex items-center space-x-1"
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
            <ambientLight intensity={0.7} />
            <directionalLight position={[10, 12, 8]} intensity={1.4} castShadow />
            <directionalLight position={[-10, -5, -6]} intensity={0.5} />
            <PistonEngine3D
              telemetry={telemetry}
              health={health}
              fault={fault}
              activeFaults={activeFaults}
            />
            <Grid
              position={[0, -1.5, 0]}
              args={[12, 12]}
              cellSize={0.5}
              cellThickness={0.6}
              cellColor="#1e293b"
              sectionSize={2}
              sectionThickness={1.2}
              sectionColor="#0ea5e9"
              fadeDistance={25}
            />
            <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
          </Canvas>

          {/* Floating Live Telemetry HUD */}
          <div className="absolute top-4 left-4 bg-aerodark/90 backdrop-blur-md border border-aeroborder p-3 rounded-lg text-xs space-y-2 pointer-events-none shadow-xl">
            <div className="text-sky-400 font-bold border-b border-aeroborder pb-1 flex justify-between">
              <span>PHYSICAL TWIN STATUS</span>
              <span className="text-emerald-400">99.4% SYNC</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-300">
              <div>CRANK SPEED: <span className="text-white font-bold">{Math.round(telemetry.rpm)} RPM</span></div>
              <div>POWER OUTPUT: <span className="text-white font-bold">{telemetry.power.toFixed(1)} kW</span></div>
              <div>AVG CHT: <span className={telemetry.cht > 165 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>{telemetry.cht}°C</span></div>
              <div>AVG EGT: <span className="text-white font-bold">{telemetry.egt}°C</span></div>
              <div>OIL PRESSURE: <span className={telemetry.oil_pressure < 2.5 ? 'text-red-400 font-bold' : 'text-white'}>{telemetry.oil_pressure} bar</span></div>
              <div>VIBRATION RMS: <span className="text-white font-bold">{telemetry.vibration} mm/s</span></div>
            </div>
          </div>

          {/* Controls Instruction Overlay */}
          <div className="absolute bottom-4 left-4 bg-aerodark/80 backdrop-blur-sm border border-aeroborder px-3 py-1.5 rounded text-[10px] text-slate-400 pointer-events-none">
            Click + Drag to Orbit • Right-Click to Pan • Scroll Wheel to Zoom
          </div>
        </div>

        {/* Right Inspection & Subsystem Diagnostics Panel (w-80) */}
        <div className="w-80 bg-aerodark border-l border-aeroborder p-4 flex flex-col justify-between shrink-0 overflow-y-auto space-y-4">
          <div className="space-y-4">
            <div>
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block mb-2">
                COMPONENT INSPECTOR
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { id: 'cylinders', label: 'Cylinders & Pistons' },
                  { id: 'crankshaft', label: 'Crankshaft & Hub' },
                  { id: 'fuel_injection', label: 'EFI & Injectors' },
                  { id: 'lubrication', label: 'Lubrication Sump' },
                  { id: 'turbocharger', label: 'Turbo Assembly' },
                  { id: 'sensors', label: 'Sensors & Wiring' }
                ].map((part) => (
                  <button
                    key={part.id}
                    onClick={() => setSelectedPart(part.id)}
                    className={`p-2 rounded border text-left font-semibold transition text-[11px] ${
                      selectedPart === part.id
                        ? 'bg-sky-950/80 border-sky-500 text-sky-300'
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
              <div className="font-bold text-sky-400 uppercase flex items-center justify-between">
                <span>{selectedPart.replace('_', ' ').toUpperCase()} SPECIFICATION</span>
                <span className="text-[10px] text-slate-400">PHYSICS RO</span>
              </div>

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
                TWIN HEALTH STATUS
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
            Rotax 914/915 iS Turbo MALE UAV Configuration. Reduced-Order Physics Model Synchronized with real-time telemetry pipeline.
          </div>
        </div>
      </div>
    </div>
  );
}
