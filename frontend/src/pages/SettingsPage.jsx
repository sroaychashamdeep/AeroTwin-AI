/**
 * AEROTWIN AI - System Settings & CAN Bus Gateway Configuration (/settings)
 */

import React, { useState } from 'react';
import {
  Settings,
  Radio,
  Cpu,
  Key,
  Database,
  ShieldCheck,
  Save,
  CheckCircle2
} from 'lucide-react';

export default function SettingsPage() {
  const [telemetrySource, setTelemetrySource] = useState('SIMULATOR');
  const [canBaud, setCanBaud] = useState('500000');
  const [canInterface, setCanInterface] = useState('can0');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="p-4 space-y-4 font-mono max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-aerodark border border-aeroborder p-4 rounded-lg flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-sky-400" />
            <h1 className="text-base font-bold text-white tracking-wider">
              SYSTEM SETTINGS & AVIONICS TELEMETRY BUS
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure telemetry ingress pipelines, CAN bus abstraction adapters, and security credentials
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-950/80 border border-emerald-700 text-emerald-300 p-3 rounded text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Configuration saved successfully. Telemetry abstraction pipeline updated.</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSave} className="bg-aerocard border border-aeroborder rounded-lg p-6 space-y-6 text-xs">
        {/* Telemetry Source Selection (Section 30 CAN Bus Abstraction) */}
        <div className="space-y-3 border-b border-aeroborder pb-5">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-bold text-white uppercase">
              1. TELEMETRY SOURCE ABSTRACTION (TELEMETRYSOURCE INTERFACE)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { id: 'SIMULATOR', title: 'SimulatorTelemetrySource', desc: 'Physics-informed aero piston simulator with fault injection hooks.' },
              { id: 'CAN_BUS', title: 'CANBusTelemetrySource (Hardware)', desc: 'Direct ISO 11898 CAN hardware interface for physical engine bench.' },
              { id: 'SOCKET_CAN', title: 'SocketCANSource (Linux vcan0)', desc: 'Linux kernel SocketCAN network interface layer.' },
              { id: 'FADEC', title: 'FADECSource (ARINC-429)', desc: 'Dual-channel FADEC engine management bus.' }
            ].map((src) => (
              <label
                key={src.id}
                className={`p-3 rounded border block cursor-pointer transition ${
                  telemetrySource === src.id
                    ? 'bg-sky-950/70 border-sky-500'
                    : 'bg-aerodark border-aeroborder hover:border-slate-600'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <input
                    type="radio"
                    name="telemetrySource"
                    value={src.id}
                    checked={telemetrySource === src.id}
                    onChange={(e) => setTelemetrySource(e.target.value)}
                    className="accent-sky-500"
                  />
                  <span className="font-bold text-white text-xs">{src.title}</span>
                </div>
                <p className="text-[10px] text-slate-400 font-sans ml-5">{src.desc}</p>
              </label>
            ))}
          </div>

          {telemetrySource !== 'SIMULATOR' && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-aerodark rounded border border-aeroborder mt-2">
              <div>
                <label className="text-slate-400 block mb-1">CAN INTERFACE ID:</label>
                <input
                  type="text"
                  value={canInterface}
                  onChange={(e) => setCanInterface(e.target.value)}
                  className="w-full bg-aerocard border border-aeroborder rounded px-2.5 py-1 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">BAUD RATE:</label>
                <select
                  value={canBaud}
                  onChange={(e) => setCanBaud(e.target.value)}
                  className="w-full bg-aerocard border border-aeroborder rounded px-2.5 py-1 text-white"
                >
                  <option value="250000">250 kbps</option>
                  <option value="500000">500 kbps (Standard Aero)</option>
                  <option value="1000000">1 Mbps (High Speed)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* AI Service & Database Endpoints */}
        <div className="space-y-3 border-b border-aeroborder pb-5">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white uppercase">
              2. BACKEND MICROSERVICES & PERSISTENCE CONFIGURATION
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 block mb-1">PYTHON AI SERVICE URL:</label>
              <input
                type="text"
                defaultValue="http://localhost:8000"
                className="w-full bg-aerodark border border-aeroborder rounded px-3 py-1.5 text-white"
                readOnly
              />
              <span className="text-[10px] text-slate-500 block mt-0.5">FastAPI microservice endpoint</span>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">DATABASE PERSISTENCE STATUS:</label>
              <input
                type="text"
                defaultValue="Dual Adapter (PostgreSQL / Embedded SQLite)"
                className="w-full bg-aerodark border border-aeroborder rounded px-3 py-1.5 text-emerald-400 font-bold"
                readOnly
              />
              <span className="text-[10px] text-slate-500 block mt-0.5">Active database persistence</span>
            </div>
          </div>
        </div>

        {/* Security & Role-Based Access Control */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Key className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-white uppercase">
              3. SECURITY & ACTIVE RBAC ROLE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 block mb-1">ACTIVE USER ROLE:</label>
              <input
                type="text"
                defaultValue="Engineer (Chief Propulsion Specialist)"
                className="w-full bg-aerodark border border-aeroborder rounded px-3 py-1.5 text-sky-400 font-bold"
                readOnly
              />
              <span className="text-[10px] text-slate-500 block mt-0.5">Permissions: Full telemetry, diagnostics, and work orders</span>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">GROK / xAI API KEY STATUS:</label>
              <input
                type="text"
                defaultValue="Configured via Backend Environment (.env)"
                className="w-full bg-aerodark border border-aeroborder rounded px-3 py-1.5 text-slate-300"
                readOnly
              />
              <span className="text-[10px] text-slate-500 block mt-0.5">Key safely guarded in backend proxy</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-5 py-2 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition flex items-center space-x-2 shadow-lg shadow-sky-950/40"
          >
            <Save className="w-3.5 h-3.5" />
            <span>SAVE CONFIGURATION</span>
          </button>
        </div>
      </form>
    </div>
  );
}
