/**
 * AEROTWIN AI - Multi-UAV Fleet Management & Analytics (/fleet)
 */

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Layers,
  Plane,
  Gauge,
  Hourglass,
  Activity,
  AlertTriangle,
  ArrowUpDown,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FleetPage() {
  const navigate = useNavigate();
  const [fleet, setFleet] = useState([]);
  const [sortBy, setSortBy] = useState('health'); // 'health', 'rul', 'risk'

  useEffect(() => {
    async function loadFleet() {
      try {
        const [engRes, uavRes] = await Promise.all([
          api.get('/engines'),
          api.get('/uavs')
        ]);
        setFleet(engRes.data);
      } catch (err) {
        console.error('Failed to load fleet data:', err);
      }
    }
    loadFleet();
  }, []);

  // Sort logic
  const sortedFleet = [...fleet].sort((a, b) => {
    if (sortBy === 'health') return b.health - a.health;
    if (sortBy === 'rul') return b.rul - a.rul;
    if (sortBy === 'risk') return a.health - b.health;
    return 0;
  });

  // Fleet Analytics Summary
  const avgHealth = fleet.length > 0 ? (fleet.reduce((acc, e) => acc + e.health, 0) / fleet.length).toFixed(1) : 82.6;
  const readyCount = fleet.filter(e => e.health >= 85).length;
  const warnCount = fleet.filter(e => e.health < 85 && e.health >= 70).length;
  const critCount = fleet.filter(e => e.health < 70).length;

  return (
    <div className="p-4 space-y-4 font-mono">
      {/* Header */}
      <div className="bg-aerodark border border-aeroborder p-4 rounded-lg flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-sky-400" />
            <h1 className="text-base font-bold text-white tracking-wider">
              MALE UAV SQUADRON FLEET MANAGEMENT & PROPULSION ANALYTICS
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-800 font-bold">
              4 AIRFRAMES ENROLLED
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Fleet-wide readiness auditing, degradation sorting, and preventive dispatch management
          </p>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-400 flex items-center space-x-1">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>SORT FLEET BY:</span>
          </span>
          <button
            onClick={() => setSortBy('health')}
            className={`px-2.5 py-1 rounded font-semibold transition ${sortBy === 'health' ? 'bg-sky-600 text-white' : 'bg-aerocard text-slate-400 hover:text-white border border-aeroborder'}`}
          >
            HEALTH INDEX
          </button>
          <button
            onClick={() => setSortBy('rul')}
            className={`px-2.5 py-1 rounded font-semibold transition ${sortBy === 'rul' ? 'bg-sky-600 text-white' : 'bg-aerocard text-slate-400 hover:text-white border border-aeroborder'}`}
          >
            RUL REMAINING
          </button>
          <button
            onClick={() => setSortBy('risk')}
            className={`px-2.5 py-1 rounded font-semibold transition ${sortBy === 'risk' ? 'bg-sky-600 text-white' : 'bg-aerocard text-slate-400 hover:text-white border border-aeroborder'}`}
          >
            DEGRADATION RISK
          </button>
        </div>
      </div>

      {/* Fleet Analytics Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-aerocard border border-aeroborder rounded-lg p-4">
          <span className="text-xs text-slate-400 uppercase block mb-1">FLEET AVERAGE HEALTH</span>
          <div className="text-3xl font-bold text-sky-400">{avgHealth}%</div>
          <span className="text-[10px] text-slate-500 block mt-1">Weighted Propulsion Index</span>
        </div>

        <div className="bg-aerocard border border-aeroborder rounded-lg p-4">
          <span className="text-xs text-slate-400 uppercase block mb-1">SORTIE READY (&gt;85%)</span>
          <div className="text-3xl font-bold text-emerald-400">{readyCount} Airframes</div>
          <span className="text-[10px] text-emerald-500/80 block mt-1">Immediate Dispatch Cleared</span>
        </div>

        <div className="bg-aerocard border border-aeroborder rounded-lg p-4">
          <span className="text-xs text-slate-400 uppercase block mb-1">ATTENTION REQUIRED</span>
          <div className="text-3xl font-bold text-amber-400">{warnCount} Airframes</div>
          <span className="text-[10px] text-amber-500/80 block mt-1">Monitoring Thermal/Vibration</span>
        </div>

        <div className="bg-aerocard border border-aeroborder rounded-lg p-4">
          <span className="text-xs text-slate-400 uppercase block mb-1">GROUNDED / CRITICAL</span>
          <div className="text-3xl font-bold text-red-400">{critCount} Airframes</div>
          <span className="text-[10px] text-red-500/80 block mt-1">Maintenance Overhaul Required</span>
        </div>
      </div>

      {/* Fleet Unit Cards List */}
      <div className="space-y-3">
        {sortedFleet.map((unit) => {
          const isHealthy = unit.health >= 85;
          const isWarning = unit.health < 85 && unit.health >= 70;
          const isCritical = unit.health < 70;

          return (
            <div
              key={unit.id}
              className="bg-aerocard border border-aeroborder rounded-lg p-4 hover:border-slate-700 transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              {/* Unit Identity */}
              <div className="flex items-center space-x-3 min-w-[240px]">
                <div className={`w-10 h-10 rounded flex items-center justify-center font-bold border ${
                  isHealthy ? 'bg-emerald-950/80 border-emerald-700 text-emerald-400' :
                  isWarning ? 'bg-amber-950/80 border-amber-700 text-amber-400' :
                  'bg-red-950/80 border-red-700 text-red-400'
                }`}>
                  <Plane className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-white">{unit.uav_tail}</span>
                    <span className="text-xs text-sky-400">({unit.uav_callsign})</span>
                  </div>
                  <div className="text-xs text-slate-400">{unit.uav_model}</div>
                  <div className="text-[10px] text-slate-500">ENGINE: {unit.serial_number}</div>
                </div>
              </div>

              {/* Health Score Gauge */}
              <div className="text-center min-w-[120px]">
                <span className="text-[10px] text-slate-400 uppercase block">HEALTH INDEX</span>
                <span className={`text-2xl font-bold ${
                  isHealthy ? 'text-emerald-400' : isWarning ? 'text-amber-400' : 'text-red-400'
                }`}>
                  {unit.health}%
                </span>
                <span className="text-[10px] text-slate-500 block">
                  {isHealthy ? 'NOMINAL' : isWarning ? 'ATTENTION' : 'CRITICAL'}
                </span>
              </div>

              {/* RUL Hours */}
              <div className="text-center min-w-[130px]">
                <span className="text-[10px] text-slate-400 uppercase block">REMAINING USEFUL LIFE</span>
                <span className="text-xl font-bold text-white">{unit.rul} <span className="text-xs text-slate-400">HOURS</span></span>
                <span className="text-[10px] text-slate-500 block">
                  Operating: {unit.operating_hours} hrs
                </span>
              </div>

              {/* Active Status & Actions */}
              <div className="flex items-center space-x-3 self-end md:self-auto">
                <span className={`text-xs px-2.5 py-1 rounded font-bold border ${
                  unit.status === 'NOMINAL' ? 'bg-emerald-950 border-emerald-800 text-emerald-400' :
                  unit.status === 'ATTENTION' ? 'bg-amber-950 border-amber-800 text-amber-400' :
                  'bg-red-950 border-red-800 text-red-400'
                }`}>
                  {unit.status}
                </span>

                <button
                  onClick={() => navigate('/dashboard')}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition flex items-center space-x-1"
                >
                  <span>MONITOR GCS</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
