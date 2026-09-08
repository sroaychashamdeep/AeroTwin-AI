/**
 * AEROTWIN AI - AI Diagnostics & Explainable AI (XAI) Page (/ai-diagnostics)
 */

import React from 'react';
import { useTelemetryStore } from '../store/telemetryStore';
import {
  BrainCircuit,
  ShieldAlert,
  HelpCircle,
  TrendingUp,
  Cpu,
  Layers,
  Radio,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell
} from 'recharts';

export default function DiagnosticsPage({ onOpenFaultModal }) {
  const { anomaly, fault, explanation, sensorDiagnostics } = useTelemetryStore();

  // Format fault probabilities for chart
  const faultData = Object.entries(fault.class_probabilities || {}).map(([name, prob]) => ({
    name,
    probability: Math.round(prob * 100),
    isTop: name === fault.primary_fault
  })).sort((a, b) => b.probability - a.probability);

  const residuals = Object.entries(sensorDiagnostics?.sensor_residuals || {});

  return (
    <div className="p-4 space-y-4 font-mono">
      {/* Page Header */}
      <div className="bg-aerodark border border-aeroborder p-4 rounded-lg flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <BrainCircuit className="w-5 h-5 text-indigo-400" />
            <h1 className="text-base font-bold text-white tracking-wider">
              AI/ML DIAGNOSTIC PIPELINE & EXPLAINABLE AI (XAI)
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800 font-bold">
              PYTORCH + SCIKIT ENSEMBLE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Autoencoder reconstruction error, Isolation Forest distance, Bidirectional GRU fault classification, and Kalman sensor fusion
          </p>
        </div>

        <button
          onClick={onOpenFaultModal}
          className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-900/30 transition flex items-center space-x-1.5"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>INJECT FAULT TO TEST</span>
        </button>
      </div>

      {/* Top Diagnostics Triad */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Anomaly Detection Ensemble */}
        <div className="bg-aerocard border border-aeroborder rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-aeroborder pb-2">
            <span className="text-xs font-bold text-slate-200">ANOMALY ENSEMBLE SCORE</span>
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
              anomaly.anomaly_score > 0.6 ? 'bg-red-950/80 border-red-700 text-red-400' :
              anomaly.anomaly_score > 0.3 ? 'bg-amber-950/80 border-amber-700 text-amber-400' :
              'bg-emerald-950/80 border-emerald-700 text-emerald-400'
            }`}>
              {anomaly.classification}
            </span>
          </div>

          <div className="flex items-baseline justify-between my-2">
            <span className="text-3xl font-bold text-white tracking-tight">{anomaly.anomaly_score}</span>
            <span className="text-xs text-slate-400">THRESHOLD: {anomaly.threshold}</span>
          </div>

          {/* Dual Component Breakdown */}
          <div className="space-y-2 pt-2 border-t border-aeroborder text-xs">
            <div>
              <div className="flex justify-between text-[11px] mb-0.5">
                <span className="text-slate-400">Scikit-Learn Isolation Forest:</span>
                <span className="text-sky-400 font-bold">{anomaly.isolation_forest_score}</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-sky-500 h-full" style={{ width: `${anomaly.isolation_forest_score * 100}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[11px] mb-0.5">
                <span className="text-slate-400">PyTorch Deep Autoencoder MSE:</span>
                <span className="text-indigo-400 font-bold">{anomaly.autoencoder_score}</span>
              </div>
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full" style={{ width: `${anomaly.autoencoder_score * 100}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Temporal Deep Learning Fault Prediction */}
        <div className="bg-aerocard border border-aeroborder rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-aeroborder pb-2">
            <span className="text-xs font-bold text-slate-200">FAULT CLASSIFICATION</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold border border-slate-700">
              PYTORCH GRU
            </span>
          </div>

          <div className="my-1">
            <div className="text-xs text-slate-400 uppercase">PRIMARY IDENTIFIED FAULT:</div>
            <div className={`text-lg font-bold mt-1 ${fault.primary_fault === 'Healthy' ? 'text-emerald-400' : 'text-red-400'}`}>
              {fault.primary_fault}
            </div>
            <div className="text-xs text-slate-300 mt-1">
              Confidence Probability: <span className="text-white font-bold">{(fault.probability * 100).toFixed(1)}%</span>
            </div>
          </div>

          <div className="pt-2 border-t border-aeroborder flex items-center justify-between text-xs">
            <span className="text-slate-400">Assigned Severity:</span>
            <span className={`px-2 py-0.5 rounded font-bold border ${
              fault.severity === 'CRITICAL' ? 'bg-red-950 border-red-700 text-red-400' :
              fault.severity === 'HIGH' ? 'bg-amber-950 border-amber-700 text-amber-400' :
              'bg-emerald-950 border-emerald-700 text-emerald-400'
            }`}>
              {fault.severity}
            </span>
          </div>
        </div>

        {/* 3. Kalman Sensor Fusion & Confidence */}
        <div className="bg-aerocard border border-aeroborder rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-aeroborder pb-2">
            <span className="text-xs font-bold text-slate-200">SENSOR FUSION SYSTEM</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-bold border border-emerald-700">
              KALMAN ACTIVE
            </span>
          </div>

          <div className="flex items-baseline justify-between my-2">
            <span className="text-3xl font-bold text-white tracking-tight">
              {sensorDiagnostics?.system_confidence || 97.5}%
            </span>
            <span className="text-xs text-slate-400">FUSION INTEGRITY</span>
          </div>

          <div className="pt-2 border-t border-aeroborder text-xs text-slate-300 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Monitored Channels:</span>
              <span className="font-bold text-white">7 State Variables</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Faulty / Drifting Sensors:</span>
              <span className={`font-bold ${sensorDiagnostics?.faulty_sensors?.length > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                {sensorDiagnostics?.faulty_sensors?.length || 0} Detected
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Deep Learning Fault Probability Distribution Chart */}
      <div className="bg-aerocard border border-aeroborder rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-aeroborder pb-2">
          <span className="text-xs font-bold text-white">
            10-CLASS TEMPORAL SEQUENCE PROBABILITY DISTRIBUTION (BIDIRECTIONAL GRU)
          </span>
          <span className="text-xs text-slate-400">Sliding Sequence Window: 15 Frames</span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={faultData} layout="vertical" margin={{ left: 160, right: 30, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 10 }} unit="%" />
              <YAxis dataKey="name" type="category" stroke="#94a3b8" tick={{ fontSize: 10 }} width={150} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }}
                formatter={(val) => [`${val}%`, 'Confidence Probability']}
              />
              <Bar dataKey="probability" radius={[0, 4, 4, 0]}>
                {faultData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.name === 'Healthy' ? '#10b981' : (entry.isTop ? '#ef4444' : '#0ea5e9')}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Explainable AI (XAI) Attribution & Sensor Residual Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: XAI Feature Attribution & Narrative */}
        <div className="bg-aerocard border border-aeroborder rounded-lg p-4 space-y-3">
          <div className="flex items-center space-x-2 border-b border-aeroborder pb-2">
            <HelpCircle className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-bold text-white uppercase">EXPLAINABLE AI (XAI) FEATURE ATTRIBUTION</span>
          </div>

          <div className="bg-aerodark/80 p-3 rounded border border-aeroborder text-xs space-y-2">
            <div className="text-[11px] text-slate-400 font-bold uppercase">PHYSICAL ROOT CAUSE SUMMARY:</div>
            <p className="text-slate-200 font-sans leading-relaxed">{explanation.narrative_summary}</p>
            <div className="text-[10px] text-sky-400">
              Historical Trend: <span className="text-white font-bold">{explanation.historical_trend}</span>
            </div>
          </div>

          {/* Ranked Contributing Factors */}
          <div className="space-y-2 pt-2">
            <span className="text-[11px] font-bold text-slate-300 uppercase block">
              TOP CONTRIBUTING SENSOR DEVIATIONS (VS NOMINAL CRUISE)
            </span>
            {explanation.main_contributing_factors?.length > 0 ? (
              explanation.main_contributing_factors.map((factor, idx) => (
                <div key={idx} className="bg-aerodark/60 p-2 rounded border border-aeroborder flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-100">{factor.parameter_label}</span>
                    <span className="text-[10px] text-slate-400 block">{factor.subsystem}</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-bold ${factor.deviation_pct.startsWith('+') ? 'text-red-400' : 'text-sky-400'}`}>
                      {factor.deviation_pct}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Actual: {factor.actual_value} (Base: {factor.baseline_value})
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 p-3 text-center">
                All parameters conform closely to nominal cruise baselines. No significant deviations detected.
              </div>
            )}
          </div>
        </div>

        {/* Right: Sensor Residual Verification (Physics vs Measured) */}
        <div className="bg-aerocard border border-aeroborder rounded-lg p-4 space-y-3">
          <div className="flex items-center space-x-2 border-b border-aeroborder pb-2">
            <Radio className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white uppercase">SENSOR RESIDUAL DIAGNOSTICS (KALMAN ESTIMATION)</span>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-80 pr-1">
            {residuals.length > 0 ? (
              residuals.map(([sensorName, diag]) => (
                <div key={sensorName} className="bg-aerodark/60 p-2.5 rounded border border-aeroborder flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-200 uppercase">{sensorName.replace('_', ' ')}</span>
                    <div className="text-[10px] text-slate-400">
                      Measured: <span className="text-white font-semibold">{diag.measured}</span> | Expected: <span className="text-sky-300">{diag.physics_expected}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold border ${
                      diag.is_faulty ? 'bg-red-950 border-red-700 text-red-400' : 'bg-slate-800 border-slate-700 text-emerald-400'
                    }`}>
                      {diag.status}
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Conf: <span className="text-slate-200 font-bold">{diag.confidence_score}%</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-xs text-slate-500 p-4 text-center">
                Sensor residuals updating in real-time.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
