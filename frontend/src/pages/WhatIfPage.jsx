/**
 * AEROTWIN AI - What-If Comparative Analysis (/what-if)
 * Side-by-side Mission A vs Mission B Propulsion Health Comparison
 */

import React, { useState } from 'react';
import api from '../services/api';
import {
  GitCompare,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Play,
  Sliders,
  CheckCircle2
} from 'lucide-react';

export default function WhatIfPage() {
  // Mission A state
  const [missionA, setMissionA] = useState({
    mission_type: 'ISR',
    altitude_ft: 12000,
    throttle_pct: 65,
    ambient_temp_c: 25,
    duration_hours: 8
  });

  // Mission B state
  const [missionB, setMissionB] = useState({
    mission_type: 'Hot-Weather',
    altitude_ft: 18000,
    throttle_pct: 80,
    ambient_temp_c: 42,
    duration_hours: 10
  });

  const [isRunning, setIsRunning] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);

  const runComparison = async () => {
    setIsRunning(true);
    try {
      const res = await api.post('/mission/what-if', { missionA, missionB });
      setComparisonResult(res.data);
    } catch (err) {
      console.error('What-If comparison error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="p-4 space-y-4 font-mono">
      {/* Header */}
      <div className="bg-aerodark border border-aeroborder p-4 rounded-lg flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <GitCompare className="w-5 h-5 text-sky-400" />
            <h1 className="text-base font-bold text-white tracking-wider">
              WHAT-IF OPERATIONAL TRADE-OFF ANALYSIS
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-800 font-bold">
              SIDE-BY-SIDE EVALUATION
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Compare two alternative mission envelopes and quantify thermal stress, fuel burn, and RUL impact
          </p>
        </div>

        <button
          onClick={runComparison}
          disabled={isRunning}
          className="px-4 py-2 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition flex items-center space-x-2 shadow-lg shadow-sky-950/40"
        >
          {isRunning ? <span className="animate-spin">⏳</span> : <Play className="w-4 h-4" />}
          <span>EXECUTE WHAT-IF COMPARISON</span>
        </button>
      </div>

      {/* Side-by-Side Configuration Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mission A Card */}
        <div className="bg-aerocard border border-sky-800/60 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-sky-800/40 pb-2">
            <span className="text-xs font-bold text-sky-400 uppercase">MISSION A ENVELOPE (BASELINE)</span>
            <span className="text-[10px] text-slate-400">Moderate Loiter</span>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <div className="flex justify-between mb-0.5">
                <span className="text-slate-400">Altitude:</span>
                <span className="font-bold text-white">{missionA.altitude_ft.toLocaleString()} ft</span>
              </div>
              <input
                type="range"
                min="2000"
                max="25000"
                step="1000"
                value={missionA.altitude_ft}
                onChange={(e) => setMissionA({ ...missionA, altitude_ft: Number(e.target.value) })}
                className="w-full accent-sky-500 bg-slate-800 h-1.5 rounded cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-0.5">
                <span className="text-slate-400">Cruise Throttle:</span>
                <span className="font-bold text-white">{missionA.throttle_pct}%</span>
              </div>
              <input
                type="range"
                min="40"
                max="100"
                value={missionA.throttle_pct}
                onChange={(e) => setMissionA({ ...missionA, throttle_pct: Number(e.target.value) })}
                className="w-full accent-sky-500 bg-slate-800 h-1.5 rounded cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-0.5">
                <span className="text-slate-400">Surface Temp:</span>
                <span className="font-bold text-white">{missionA.ambient_temp_c}°C</span>
              </div>
              <input
                type="range"
                min="-10"
                max="50"
                value={missionA.ambient_temp_c}
                onChange={(e) => setMissionA({ ...missionA, ambient_temp_c: Number(e.target.value) })}
                className="w-full accent-sky-500 bg-slate-800 h-1.5 rounded cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-0.5">
                <span className="text-slate-400">Duration:</span>
                <span className="font-bold text-white">{missionA.duration_hours} hrs</span>
              </div>
              <input
                type="range"
                min="2"
                max="24"
                value={missionA.duration_hours}
                onChange={(e) => setMissionA({ ...missionA, duration_hours: Number(e.target.value) })}
                className="w-full accent-sky-500 bg-slate-800 h-1.5 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Mission B Card */}
        <div className="bg-aerocard border border-amber-800/60 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-amber-800/40 pb-2">
            <span className="text-xs font-bold text-amber-400 uppercase">MISSION B ENVELOPE (ALTERNATIVE)</span>
            <span className="text-[10px] text-slate-400">High-Altitude / Hot Stress</span>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <div className="flex justify-between mb-0.5">
                <span className="text-slate-400">Altitude:</span>
                <span className="font-bold text-white">{missionB.altitude_ft.toLocaleString()} ft</span>
              </div>
              <input
                type="range"
                min="2000"
                max="25000"
                step="1000"
                value={missionB.altitude_ft}
                onChange={(e) => setMissionB({ ...missionB, altitude_ft: Number(e.target.value) })}
                className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-0.5">
                <span className="text-slate-400">Cruise Throttle:</span>
                <span className="font-bold text-white">{missionB.throttle_pct}%</span>
              </div>
              <input
                type="range"
                min="40"
                max="100"
                value={missionB.throttle_pct}
                onChange={(e) => setMissionB({ ...missionB, throttle_pct: Number(e.target.value) })}
                className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-0.5">
                <span className="text-slate-400">Surface Temp:</span>
                <span className="font-bold text-white">{missionB.ambient_temp_c}°C</span>
              </div>
              <input
                type="range"
                min="-10"
                max="50"
                value={missionB.ambient_temp_c}
                onChange={(e) => setMissionB({ ...missionB, ambient_temp_c: Number(e.target.value) })}
                className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between mb-0.5">
                <span className="text-slate-400">Duration:</span>
                <span className="font-bold text-white">{missionB.duration_hours} hrs</span>
              </div>
              <input
                type="range"
                min="2"
                max="24"
                value={missionB.duration_hours}
                onChange={(e) => setMissionB({ ...missionB, duration_hours: Number(e.target.value) })}
                className="w-full accent-amber-500 bg-slate-800 h-1.5 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Results Table */}
      {comparisonResult && (
        <div className="bg-aerocard border border-aeroborder rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-aeroborder pb-2">
            <span className="text-xs font-bold text-white uppercase">
              PROPULSION METRICS COMPARISON (MISSION A VS MISSION B)
            </span>
            <span className="text-xs text-sky-400 font-bold">
              RECOMMENDED: {comparisonResult.comparison.safer_mission}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-aeroborder">
                  <th className="py-2">KEY PARAMETER</th>
                  <th>MISSION A</th>
                  <th>MISSION B</th>
                  <th>DELTA (B - A)</th>
                  <th>FAVORABLE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-aeroborder text-slate-300">
                <tr>
                  <td className="py-2.5 font-bold text-white">Total Fuel Consumption</td>
                  <td>{comparisonResult.missionA.total_fuel_consumed_kg} kg</td>
                  <td>{comparisonResult.missionB.total_fuel_consumed_kg} kg</td>
                  <td className={comparisonResult.comparison.delta_fuel_kg > 0 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {comparisonResult.comparison.delta_fuel_kg > 0 ? `+${comparisonResult.comparison.delta_fuel_kg}` : comparisonResult.comparison.delta_fuel_kg} kg
                  </td>
                  <td className="text-emerald-400 font-semibold">Mission A</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-bold text-white">Peak Cylinder Head Temp (CHT)</td>
                  <td>{comparisonResult.missionA.max_cht}°C</td>
                  <td className={comparisonResult.missionB.max_cht > 175 ? 'text-red-400' : ''}>{comparisonResult.missionB.max_cht}°C</td>
                  <td className={comparisonResult.comparison.delta_max_cht_c > 0 ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                    +{comparisonResult.comparison.delta_max_cht_c}°C
                  </td>
                  <td className="text-emerald-400 font-semibold">Mission A</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-bold text-white">Expected Health Post-Sortie</td>
                  <td className="text-emerald-400 font-bold">{comparisonResult.missionA.expected_health}%</td>
                  <td className="text-amber-400 font-bold">{comparisonResult.missionB.expected_health}%</td>
                  <td className="text-amber-400 font-bold">{comparisonResult.comparison.delta_health_pct}%</td>
                  <td className="text-emerald-400 font-semibold">Mission A</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-bold text-white">Estimated RUL Impact</td>
                  <td>{comparisonResult.missionA.rul_impact_hours} hrs consumed</td>
                  <td>{comparisonResult.missionB.rul_impact_hours} hrs consumed</td>
                  <td className="text-red-400 font-bold">+{comparisonResult.comparison.delta_rul_impact_hours} hrs</td>
                  <td className="text-emerald-400 font-semibold">Mission A</td>
                </tr>
                <tr>
                  <td className="py-2.5 font-bold text-white">Operational Risk Category</td>
                  <td>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] font-bold">
                      {comparisonResult.missionA.mission_risk}
                    </span>
                  </td>
                  <td>
                    <span className="px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 text-[10px] font-bold">
                      {comparisonResult.missionB.mission_risk}
                    </span>
                  </td>
                  <td className="text-slate-400">-</td>
                  <td className="text-emerald-400 font-semibold">Mission A</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Automated Engineering Recommendation Box */}
          <div className="bg-sky-950/40 border border-sky-600/60 rounded-lg p-3 text-xs font-sans text-slate-200">
            <span className="font-mono font-bold text-[11px] text-sky-400 uppercase block mb-1">
              AI TRADE-OFF DECISION DIRECTIVE:
            </span>
            {comparisonResult.recommendation}
          </div>
        </div>
      )}
    </div>
  );
}
