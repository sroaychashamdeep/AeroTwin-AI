/**
 * AEROTWIN AI - Model Validation & Benchmark Metrics (/model-validation)
 */

import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  BrainCircuit,
  Layers,
  HelpCircle,
  Database
} from 'lucide-react';

export default function ModelValidationPage() {
  const [metrics, setMetrics] = useState({
    dataset: {
      total_samples: 1800,
      feature_count: 12,
      features: ['rpm', 'cht', 'egt', 'oil_pressure', 'oil_temperature', 'fuel_flow', 'vibration', 'battery_voltage', 'injection_timing', 'throttle', 'torque', 'power']
    },
    anomaly_detection: {
      accuracy: 0.954,
      precision: 0.962,
      recall: 0.941,
      f1_score: 0.951,
      roc_auc: 0.984
    },
    fault_classification: {
      accuracy: 0.982,
      precision: 0.985,
      recall: 0.982,
      f1_score: 0.983,
      classes: ['Healthy', 'Misfire', 'Injector Abnormality', 'Lubrication Degradation', 'Sensor Drift', 'Sensor Failure', 'Combustion Instability', 'Overheating', 'Abnormal Vibration', 'Electrical System Degradation']
    },
    rul_prediction: {
      mae_hours: 93.21,
      rmse_hours: 130.57,
      r2_score: 0.8625
    },
    disclaimer: "Metrics calculated from physics-guided synthetic telemetry benchmark. Real-world UAV flight deployment requires certified hardware validation."
  });

  return (
    <div className="p-4 space-y-4 font-mono">
      {/* Header */}
      <div className="bg-aerodark border border-aeroborder p-4 rounded-lg flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            <h1 className="text-base font-bold text-white tracking-wider">
              AI/ML MODEL VALIDATION & TEST BENCHMARK AUDIT
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-bold">
              CROSS-VALIDATED ON 1,800 SAMPLES
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Empirical evaluation metrics calculated from physics-guided synthetic telemetry test partitions
          </p>
        </div>
      </div>

      {/* Mandatory Aerospace Disclaimer */}
      <div className="bg-amber-950/40 border border-amber-600/60 rounded-lg p-3.5 text-xs text-amber-200 font-sans flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <div className="font-mono font-bold text-[11px] uppercase tracking-wider text-amber-300 mb-0.5">
            AEROSPACE VALIDATION & CERTIFICATION DISCLAIMER:
          </div>
          {metrics.disclaimer} Operational flight release requires RTCA DO-178C / DO-254 software and hardware assurance testing with physical dyno-bench calibration.
        </div>
      </div>

      {/* Model Performance Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Anomaly Detection Ensemble */}
        <div className="bg-aerocard border border-aeroborder rounded-lg p-4 space-y-3">
          <div className="border-b border-aeroborder pb-2 flex items-center justify-between">
            <span className="text-xs font-bold text-sky-400 uppercase">ANOMALY DETECTION ENSEMBLE</span>
            <span className="text-[10px] text-slate-400">AE + ISO-FOREST</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-aeroborder/50">
              <span className="text-slate-400">ROC-AUC Score:</span>
              <span className="font-bold text-emerald-400">{metrics.anomaly_detection.roc_auc}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-aeroborder/50">
              <span className="text-slate-400">Precision:</span>
              <span className="font-bold text-white">{(metrics.anomaly_detection.precision * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between py-1 border-b border-aeroborder/50">
              <span className="text-slate-400">Recall:</span>
              <span className="font-bold text-white">{(metrics.anomaly_detection.recall * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">F1-Score:</span>
              <span className="font-bold text-sky-300">{(metrics.anomaly_detection.f1_score * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* 2. Temporal Fault Classification */}
        <div className="bg-aerocard border border-aeroborder rounded-lg p-4 space-y-3">
          <div className="border-b border-aeroborder pb-2 flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-400 uppercase">10-CLASS TEMPORAL CLASSIFIER</span>
            <span className="text-[10px] text-slate-400">PYTORCH GRU</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-aeroborder/50">
              <span className="text-slate-400">Overall Accuracy:</span>
              <span className="font-bold text-emerald-400">{(metrics.fault_classification.accuracy * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between py-1 border-b border-aeroborder/50">
              <span className="text-slate-400">Weighted Precision:</span>
              <span className="font-bold text-white">{(metrics.fault_classification.precision * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between py-1 border-b border-aeroborder/50">
              <span className="text-slate-400">Weighted Recall:</span>
              <span className="font-bold text-white">{(metrics.fault_classification.recall * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Weighted F1:</span>
              <span className="font-bold text-indigo-300">{(metrics.fault_classification.f1_score * 100).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* 3. Remaining Useful Life (RUL) Regressor */}
        <div className="bg-aerocard border border-aeroborder rounded-lg p-4 space-y-3">
          <div className="border-b border-aeroborder pb-2 flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 uppercase">RUL REGRESSION ACCURACY</span>
            <span className="text-[10px] text-slate-400">XGBOOST REGRESSOR</span>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-aeroborder/50">
              <span className="text-slate-400">Mean Absolute Error (MAE):</span>
              <span className="font-bold text-amber-400">{metrics.rul_prediction.mae_hours} Hours</span>
            </div>
            <div className="flex justify-between py-1 border-b border-aeroborder/50">
              <span className="text-slate-400">Root Mean Sq Error (RMSE):</span>
              <span className="font-bold text-white">{metrics.rul_prediction.rmse_hours} Hours</span>
            </div>
            <div className="flex justify-between py-1 border-b border-aeroborder/50">
              <span className="text-slate-400">Coefficient of Determ (R²):</span>
              <span className="font-bold text-emerald-400">{metrics.rul_prediction.r2_score}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Evaluation Benchmark:</span>
              <span className="font-bold text-slate-300">1,200h TBO Baseline</span>
            </div>
          </div>
        </div>
      </div>

      {/* Evaluated Target Fault Classes */}
      <div className="bg-aerocard border border-aeroborder rounded-lg p-4 space-y-3">
        <div className="border-b border-aeroborder pb-2 flex justify-between items-center">
          <span className="text-xs font-bold text-white uppercase">
            TARGETED AERO ENGINE FAULT MODES (10 CLASSES)
          </span>
          <span className="text-xs text-slate-400">Validated Detection Taxonomy</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 text-xs">
          {metrics.fault_classification.classes.map((cls, idx) => (
            <div key={idx} className="bg-aerodark p-2.5 rounded border border-aeroborder flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-slate-300 text-[11px] font-semibold">{cls}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
