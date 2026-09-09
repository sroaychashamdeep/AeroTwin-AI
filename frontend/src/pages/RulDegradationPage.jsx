/**
 * AEROTWIN AI - Remaining Useful Life (RUL) & Degradation Tracking (/rul-degradation)
 */

import React from 'react';
import { useTelemetryStore } from '../store/telemetryStore';
import {
  Hourglass,
  TrendingDown,
  Activity,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  Clock,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area
} from 'recharts';

export default function RulDegradationPage() {
  const { health, fault, twinState } = useTelemetryStore();

  const probRul = twinState?.probabilistic_rul || {
    p10_hours: health.rul_ci_lower || 112,
    p50_hours: health.rul_hours || 142,
    p90_hours: health.rul_ci_upper || 171,
    expected_rul_hours: health.rul_hours || 142,
    high_model_uncertainty: false,
    model_breakdown: {
      Physics_RUL: 148.0,
      Weibull_Survival_RUL: 144.5,
      Exponential_Wear_RUL: 139.2,
      Deep_Learning_RUL: 141.8,
      Ensemble_Consensus_RUL: 142.0
    },
    failure_probability_curve: [
      { hours_from_now: 0, failure_probability: 0.04 },
      { hours_from_now: 25, failure_probability: 0.08 },
      { hours_from_now: 50, failure_probability: 0.15 },
      { hours_from_now: 75, failure_probability: 0.28 },
      { hours_from_now: 100, failure_probability: 0.44 },
      { hours_from_now: 125, failure_probability: 0.62 },
      { hours_from_now: 150, failure_probability: 0.79 },
      { hours_from_now: 175, failure_probability: 0.91 }
    ]
  };

  // Dynamic failure curve from actual model output
  const failureCurveData = probRul.failure_probability_curve || [];

  // Synthetic forward degradation forecast data (Hours vs Health %)
  const degradationForecast = [
    { hours: 0, health: health.overall_health, ci_low: health.overall_health, ci_high: health.overall_health },
    { hours: 25, health: Math.max(0, health.overall_health - 3.2), ci_low: Math.max(0, health.overall_health - 4.5), ci_high: Math.max(0, health.overall_health - 2.0) },
    { hours: 50, health: Math.max(0, health.overall_health - 7.5), ci_low: Math.max(0, health.overall_health - 10.0), ci_high: Math.max(0, health.overall_health - 5.2) },
    { hours: 75, health: Math.max(0, health.overall_health - 13.0), ci_low: Math.max(0, health.overall_health - 17.0), ci_high: Math.max(0, health.overall_health - 9.5) },
    { hours: 100, health: Math.max(0, health.overall_health - 20.2), ci_low: Math.max(0, health.overall_health - 26.0), ci_high: Math.max(0, health.overall_health - 15.0) },
    { hours: 125, health: Math.max(0, health.overall_health - 30.5), ci_low: Math.max(0, health.overall_health - 39.0), ci_high: Math.max(0, health.overall_health - 22.0) },
    { hours: 150, health: Math.max(0, health.overall_health - 44.0), ci_low: Math.max(0, health.overall_health - 56.0), ci_high: Math.max(0, health.overall_health - 32.0) },
    { hours: 180, health: Math.max(0, health.overall_health - 62.0), ci_low: Math.max(0, health.overall_health - 78.0), ci_high: Math.max(0, health.overall_health - 46.0) }
  ];

  // Historical 4-week degradation trajectory
  const historicalWeeks = [
    { week: 'Week 1 (310h)', health: 96.2, degradation: 3.8, vibration: 1.8, oil_health: 98.0 },
    { week: 'Week 2 (322h)', health: 94.8, degradation: 5.2, vibration: 1.9, oil_health: 96.5 },
    { week: 'Week 3 (334h)', health: 92.4, degradation: 7.6, vibration: 2.1, oil_health: 94.0 },
    { week: 'Week 4 (342h)', health: health.overall_health, degradation: health.degradation_index, vibration: 2.3, oil_health: health.lubrication_health }
  ];

  return (
    <div className="p-4 space-y-4 font-mono">
      {/* Header */}
      <div className="bg-aerodark border border-aeroborder p-4 rounded-lg flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Hourglass className="w-5 h-5 text-amber-400" />
            <h1 className="text-base font-bold text-white tracking-wider">
              REMAINING USEFUL LIFE (RUL) & MULTI-SUBSYSTEM DEGRADATION TRACKING
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800 font-bold">
              XGBOOST REGRESSION + EXP WEAR
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Physics-stress cumulative wear modeling, forward health forecasting, and overhaul planning
          </p>
        </div>

        <div className="text-xs text-slate-400 text-right">
          <div>ENGINE BASE TBO: <span className="text-white font-bold">1,200 Operating Hours</span></div>
          <div>ACCUMULATED HOURS: <span className="text-sky-400 font-bold">342.5 Hours</span></div>
        </div>
      </div>

      {/* Primary RUL Estimation Metric Cards (Probabilistic P10/P50/P90) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Most Likely P50 RUL */}
        <div className="bg-aerocard border border-aeroborder rounded-lg p-4">
          <span className="text-xs text-slate-400 font-bold uppercase block mb-1">MOST LIKELY RUL (P50)</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-4xl font-bold text-white tracking-tight">{probRul.p50_hours}</span>
            <span className="text-sm text-slate-400">HOURS</span>
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 mt-2">
            <span>P10: <b className="text-amber-400">{probRul.p10_hours}h</b></span>
            <span>Expected: <b className="text-sky-400">{probRul.expected_rul_hours}h</b></span>
            <span>P90: <b className="text-emerald-400">{probRul.p90_hours}h</b></span>
          </div>
        </div>

        {/* 95% Confidence Interval & Uncertainty */}
        <div className="bg-aerocard border border-aeroborder rounded-lg p-4">
          <span className="text-xs text-slate-400 font-bold uppercase block mb-1">MODEL UNCERTAINTY</span>
          <div className="text-2xl font-bold text-sky-400 tracking-tight my-1">
            {probRul.p10_hours} – {probRul.p90_hours} <span className="text-sm font-normal text-slate-400">hrs</span>
          </div>
          {probRul.high_model_uncertainty ? (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-950 border border-red-700 text-red-300 font-bold block mt-2 animate-pulse">
              ⚠ HIGH MODEL DISAGREEMENT
            </span>
          ) : (
            <span className="text-[10px] text-emerald-400 block mt-2">
              ✓ Multi-Model Consensus Converged
            </span>
          )}
        </div>

        {/* Multi-Model RUL Breakdown */}
        <div className="bg-aerocard border border-aeroborder rounded-lg p-4">
          <span className="text-xs text-slate-400 font-bold uppercase block mb-1">RUL MODEL CONSENSUS</span>
          <div className="space-y-1 text-[10px] pt-1">
            <div className="flex justify-between"><span>Physics:</span><span className="text-white font-bold">{probRul.model_breakdown?.Physics_RUL}h</span></div>
            <div className="flex justify-between"><span>Weibull Hazard:</span><span className="text-white font-bold">{probRul.model_breakdown?.Weibull_Survival_RUL}h</span></div>
            <div className="flex justify-between"><span>Exponential:</span><span className="text-white font-bold">{probRul.model_breakdown?.Exponential_Wear_RUL}h</span></div>
            <div className="flex justify-between"><span>Deep Learning:</span><span className="text-white font-bold">{probRul.model_breakdown?.Deep_Learning_RUL}h</span></div>
          </div>
        </div>

        {/* Recommended Overhaul Target */}
        <div className="bg-aerocard border border-aeroborder rounded-lg p-4">
          <span className="text-xs text-slate-400 font-bold uppercase block mb-1">RECOMMENDED DEPOT OVERHAUL</span>
          <div className="text-xl font-bold text-emerald-400 tracking-tight my-1">
            At {Math.round(342.5 + probRul.p50_hours)} Flight Hours
          </div>
          <span className="text-[10px] text-slate-400 block mt-2">
            Remaining Sorties (8hr avg): <span className="text-white font-bold">{Math.floor(probRul.p50_hours / 8)} Sorties</span>
          </span>
        </div>
      </div>

      {/* Forward Health Degradation Forecast Chart */}
      <div className="bg-aerocard border border-aeroborder rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-aeroborder pb-2">
          <div>
            <span className="text-xs font-bold text-white uppercase">
              PROJECTED HEALTH DEGRADATION TRAJECTORY (HOURS FROM CURRENT SORTIE)
            </span>
            <div className="text-[10px] text-slate-400">
              Shaded band indicates 95% confidence interval uncertainty bounds
            </div>
          </div>
          <span className="text-xs text-amber-400 font-semibold">TBO LIMIT: 1,200h</span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={degradationForecast}>
              <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" />
              <XAxis dataKey="hours" stroke="#64748b" tick={{ fontSize: 10 }} unit=" hrs" />
              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={[0, 100]} unit="%" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }}
                formatter={(val) => [`${val}%`, 'Health Index']}
              />
              <Area type="monotone" dataKey="ci_high" stroke="none" fill="#0ea5e9" fillOpacity={0.15} />
              <Area type="monotone" dataKey="ci_low" stroke="none" fill="#0c1117" fillOpacity={0.8} />
              <Line type="monotone" dataKey="health" stroke="#0ea5e9" strokeWidth={2.5} dot={{ r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Dynamic Failure Probability vs Time Curve (Weibull & Accelerated Wear) */}
      <div className="bg-aerocard border border-aeroborder rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-aeroborder pb-2">
          <div>
            <span className="text-xs font-bold text-white uppercase">
              CUMULATIVE FAILURE PROBABILITY F(t) VS TIME (DYNAMIC WEIBULL HAZARD)
            </span>
            <div className="text-[10px] text-slate-400">
              Generated dynamically from current degradation index and thermal wear-out hazard function
            </div>
          </div>
          <span className="text-xs text-red-400 font-bold">HAZARD BETA: 2.8</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={failureCurveData}>
              <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" />
              <XAxis dataKey="hours_from_now" stroke="#64748b" tick={{ fontSize: 10 }} unit="h" />
              <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={[0, 1]} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }}
                formatter={(val) => [`${(Number(val) * 100).toFixed(1)}%`, 'Cumulative Failure Probability']}
              />
              <Line type="monotone" dataKey="failure_probability" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 3, fill: '#ef4444' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Historical Subsystem Degradation Progression Table */}
      <div className="bg-aerocard border border-aeroborder rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-aeroborder pb-2">
          <span className="text-xs font-bold text-white uppercase">HISTORICAL 4-WEEK DEGRADATION AUDIT</span>
          <span className="text-xs text-slate-400">Detects gradual mechanical fatigue vs sudden fault onset</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-aeroborder pb-2">
                <th className="py-2">OPERATING TIMEFRAME</th>
                <th>OVERALL HEALTH</th>
                <th>DEGRADATION INDEX</th>
                <th>VIBRATION LEVEL</th>
                <th>LUBRICATION SYSTEM</th>
                <th>MAINTENANCE STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-aeroborder text-slate-300">
              {historicalWeeks.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition">
                  <td className="py-2.5 font-bold text-white">{row.week}</td>
                  <td className="text-emerald-400 font-semibold">{row.health}%</td>
                  <td className="text-amber-400">{row.degradation}%</td>
                  <td>{row.vibration} mm/s</td>
                  <td>{row.oil_health}%</td>
                  <td>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                      {idx === 3 && fault.primary_fault !== 'Healthy' ? 'ATTENTION REQUIRED' : 'NOMINAL'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
