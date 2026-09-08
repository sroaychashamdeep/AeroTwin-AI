/**
 * AEROTWIN AI - Multi-Channel Live Telemetry Streaming Page (/live-telemetry)
 */

import React, { useState } from 'react';
import { useTelemetryStore } from '../store/telemetryStore';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { Activity, Play, Pause, RefreshCw, Filter, Layers } from 'lucide-react';

const CHANNELS = [
  { key: 'rpm', name: 'RPM (Crankshaft Speed)', unit: 'RPM', color: '#0ea5e9' },
  { key: 'cht', name: 'CHT (Cylinder Head Temp)', unit: '°C', color: '#f59e0b' },
  { key: 'egt', name: 'EGT (Exhaust Gas Temp)', unit: '°C', color: '#ef4444' },
  { key: 'oil_pressure', name: 'Oil Pressure', unit: 'bar', color: '#10b981' },
  { key: 'oil_temperature', name: 'Oil Temperature', unit: '°C', color: '#a855f7' },
  { key: 'fuel_flow', name: 'Fuel Flow Rate', unit: 'L/h', color: '#38bdf8' },
  { key: 'vibration', name: 'Vibration RMS', unit: 'mm/s', color: '#f97316' }
];

export default function LiveTelemetryPage() {
  const { telemetry, history, isPaused, togglePause } = useTelemetryStore();
  const [selectedChannels, setSelectedChannels] = useState(['rpm', 'cht', 'egt', 'oil_pressure', 'vibration']);
  const [activeTab, setActiveTab] = useState('grid'); // 'grid' or 'overlay'

  const toggleChannel = (key) => {
    if (selectedChannels.includes(key)) {
      if (selectedChannels.length > 1) setSelectedChannels(selectedChannels.filter(k => k !== key));
    } else {
      setSelectedChannels([...selectedChannels, key]);
    }
  };

  return (
    <div className="p-4 space-y-4 font-mono">
      {/* Header and Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-aerodark border border-aeroborder p-4 rounded-lg">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-sky-400" />
            <h1 className="text-base font-bold text-white tracking-wider">LIVE HIGH-SPEED TELEMETRY RECORDER</h1>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800 font-bold">
              1000ms SAMPLING
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">Continuous telemetry acquisition and multi-channel rolling analysis</p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          {/* View Mode */}
          <div className="flex items-center space-x-1 bg-aerocard p-1 rounded border border-aeroborder">
            <button
              onClick={() => setActiveTab('grid')}
              className={`px-3 py-1 rounded font-semibold transition ${activeTab === 'grid' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              MULTI-GRID
            </button>
            <button
              onClick={() => setActiveTab('overlay')}
              className={`px-3 py-1 rounded font-semibold transition ${activeTab === 'overlay' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              COMBINED OVERLAY
            </button>
          </div>

          <button
            onClick={togglePause}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded font-bold border transition ${
              isPaused ? 'bg-amber-600 text-white border-amber-500' : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'RESUME STREAM' : 'FREEZE BUFFER'}</span>
          </button>
        </div>
      </div>

      {/* Channel Selector Pills */}
      <div className="flex flex-wrap items-center gap-2 bg-aerocard border border-aeroborder p-3 rounded-lg text-xs">
        <span className="text-slate-400 mr-2 flex items-center space-x-1">
          <Filter className="w-3.5 h-3.5" />
          <span>ACTIVE CHANNELS:</span>
        </span>
        {CHANNELS.map((ch) => {
          const isSelected = selectedChannels.includes(ch.key);
          return (
            <button
              key={ch.key}
              onClick={() => toggleChannel(ch.key)}
              className={`px-2.5 py-1 rounded border transition flex items-center space-x-2 text-[11px] ${
                isSelected
                  ? 'bg-sky-950/80 border-sky-500 text-white font-bold'
                  : 'bg-aerodark border-aeroborder text-slate-400 hover:text-slate-300'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ch.color }} />
              <span>{ch.name}</span>
              <span className="text-[10px] text-slate-400">({telemetry[ch.key]} {ch.unit})</span>
            </button>
          );
        })}
      </div>

      {/* View 1: Multi-Grid Separate Channel Cards */}
      {activeTab === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {CHANNELS.filter(ch => selectedChannels.includes(ch.key)).map((ch) => (
            <div key={ch.key} className="bg-aerocard border border-aeroborder rounded-lg p-3 space-y-2 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">{ch.name}</span>
                  <div className="text-xl font-bold text-white mt-0.5">
                    {telemetry[ch.key]} <span className="text-xs font-normal text-slate-400">{ch.unit}</span>
                  </div>
                </div>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ch.color }} />
              </div>

              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" />
                    <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 9 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 9 }} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }}
                    />
                    <Line
                      type="monotone"
                      dataKey={ch.key}
                      stroke={ch.color}
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View 2: Combined Multi-Parameter Overlay Chart */}
      {activeTab === 'overlay' && (
        <div className="bg-aerocard border border-aeroborder rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-aeroborder pb-2">
            <span className="text-sm font-bold text-white">NORMALIZED MULTI-PARAMETER SENSOR OVERLAY</span>
            <span className="text-xs text-slate-400">Comparing Parameter Synchronicity & Divergence</span>
          </div>
          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                {CHANNELS.filter(ch => selectedChannels.includes(ch.key)).map((ch) => (
                  <Line
                    key={ch.key}
                    type="monotone"
                    dataKey={ch.key}
                    name={`${ch.name} (${ch.unit})`}
                    stroke={ch.color}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
