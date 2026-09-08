/**
 * AEROTWIN AI - Fault Injection Engine & Demo Scenarios Controller
 */

import React from 'react';
import { useTelemetryStore } from '../store/telemetryStore';
import { X, AlertTriangle, RefreshCw, CheckCircle2, Flame, Droplet, Zap, Wind, Radio } from 'lucide-react';

const PREDEFINED_SCENARIOS = [
  {
    id: 'healthy',
    title: '1. Healthy Engine',
    desc: 'All powerplant parameters balanced at nominal cruise envelope (Health > 94%).',
    faults: { injector_degradation: 0, misfire_severity: 0, lubrication_degradation: 0, overheating: 0, vibration_fault: 0, sensor_drift: 0 },
    icon: CheckCircle2,
    color: 'emerald'
  },
  {
    id: 'injector',
    title: '2. Injector Degradation',
    desc: 'Clogged electro-injector nozzle causing fuel flow surge, EGT rise, and CHT imbalance.',
    faults: { injector_degradation: 0.75, misfire_severity: 0, lubrication_degradation: 0, overheating: 0, vibration_fault: 0, sensor_drift: 0 },
    icon: Droplet,
    color: 'amber'
  },
  {
    id: 'misfire',
    title: '3. Severe Cylinder Misfire',
    desc: 'Loss of spark on Cylinder 2 causing massive torque loss, power drop, and vibration spike.',
    faults: { injector_degradation: 0, misfire_severity: 0.80, lubrication_degradation: 0, overheating: 0, vibration_fault: 0, sensor_drift: 0 },
    icon: Zap,
    color: 'red'
  },
  {
    id: 'lubrication',
    title: '4. Lubrication Failure',
    desc: 'Oil pressure decay (<2.0 bar) and oil temp runaway due to journal bearing friction.',
    faults: { injector_degradation: 0, misfire_severity: 0, lubrication_degradation: 0.85, overheating: 0, vibration_fault: 0.3, sensor_drift: 0 },
    icon: Droplet,
    color: 'red'
  },
  {
    id: 'overheating',
    title: '5. Thermal Overheating',
    desc: 'Loss of coolant airflow, CHT climbing above 190°C thermal threshold.',
    faults: { injector_degradation: 0, misfire_severity: 0, lubrication_degradation: 0, overheating: 0.85, vibration_fault: 0, sensor_drift: 0 },
    icon: Flame,
    color: 'red'
  },
  {
    id: 'vibration',
    title: '6. Vibration Anomaly',
    desc: 'Mechanical unbalance on propeller drive shaft; high 1X rotational vibration harmonics.',
    faults: { injector_degradation: 0, misfire_severity: 0, lubrication_degradation: 0, overheating: 0, vibration_fault: 0.80, sensor_drift: 0 },
    icon: Wind,
    color: 'amber'
  },
  {
    id: 'sensor',
    title: '7. Sensor Drift / Failure',
    desc: 'CHT sensor reading drifts by -60°C below physical expectation; Kalman residual flags sensor fault.',
    faults: { injector_degradation: 0, misfire_severity: 0, lubrication_degradation: 0, overheating: 0, vibration_fault: 0, sensor_drift: 0.90 },
    icon: Radio,
    color: 'amber'
  },
  {
    id: 'multifault',
    title: '8. Multi-Fault Scenario',
    desc: 'Compound failure: Injector failure triggering thermal overheating and high vibration.',
    faults: { injector_degradation: 0.65, misfire_severity: 0.40, lubrication_degradation: 0.45, overheating: 0.70, vibration_fault: 0.50, sensor_drift: 0 },
    icon: AlertTriangle,
    color: 'red'
  }
];

export default function FaultInjectorModal({ isOpen, onClose }) {
  const { activeFaults, injectFault, clearAllFaults } = useTelemetryStore();

  if (!isOpen) return null;

  const handleSliderChange = (param, value) => {
    injectFault({ [param]: parseFloat(value) });
  };

  const applyScenario = (scenario) => {
    injectFault(scenario.faults);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-aerocard border border-aeroborder w-full max-w-4xl rounded-lg shadow-2xl overflow-hidden font-mono flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-aerodark px-6 py-4 border-b border-aeroborder flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-red-950/80 border border-red-700 flex items-center justify-center text-red-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wider text-white">FAULT INJECTION CONTROLLER & DEMO BENCHMARK</h2>
              <p className="text-[11px] text-slate-400">Real-Time Sensor Perturbation & Evaluator Demonstration Scenarios</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={clearAllFaults}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition border border-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>RESET TO HEALTHY</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Preset Demo Scenarios */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-sky-400 mb-3 flex items-center space-x-2">
              <span>PREDEFINED DEMO EVALUATION SCENARIOS</span>
              <span className="text-[10px] text-slate-500 font-normal">(Click any scenario to inject into digital twin)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {PREDEFINED_SCENARIOS.map((sc) => {
                const Icon = sc.icon;
                const isSelected = Object.keys(sc.faults).every(
                  (k) => Math.abs(activeFaults[k] - sc.faults[k]) < 0.1
                );
                return (
                  <button
                    key={sc.id}
                    onClick={() => applyScenario(sc)}
                    className={`p-3 rounded border text-left transition flex flex-col justify-between h-28 ${
                      isSelected
                        ? 'bg-sky-950/60 border-sky-500 ring-1 ring-sky-500 shadow-md shadow-sky-900/40'
                        : 'bg-aerodark/70 border-aeroborder hover:border-slate-600 hover:bg-aerodark'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-100">{sc.title}</span>
                        <Icon className={`w-3.5 h-3.5 ${sc.color === 'emerald' ? 'text-emerald-400' : sc.color === 'amber' ? 'text-amber-400' : 'text-red-400'}`} />
                      </div>
                      <p className="text-[10px] text-slate-400 leading-tight line-clamp-3">{sc.desc}</p>
                    </div>
                    <div className="text-[9px] text-slate-500 uppercase font-bold">
                      {isSelected ? 'ACTIVE SCENARIO' : 'APPLY SCENARIO'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Manual Fault Perturbation Sliders */}
          <div className="bg-aerodark/50 border border-aeroborder p-4 rounded-lg">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-4 flex items-center justify-between">
              <span>MANUAL FAULT PERTURBATION SLIDERS (0–100%)</span>
              <span className="text-[11px] text-amber-400 font-normal">Physical correlations update dynamically</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* 1. Injector Degradation */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Injector Degradation:</span>
                  <span className="text-sky-400 font-bold">{Math.round(activeFaults.injector_degradation * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={activeFaults.injector_degradation}
                  onChange={(e) => handleSliderChange('injector_degradation', e.target.value)}
                  className="w-full accent-sky-500 bg-slate-800 h-2 rounded cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                  <span>Nominal Spray</span>
                  <span>Severe Nozzle Clog (+Fuel/+EGT)</span>
                </div>
              </div>

              {/* 2. Misfire Severity */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Cylinder Misfire Severity:</span>
                  <span className="text-red-400 font-bold">{Math.round(activeFaults.misfire_severity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={activeFaults.misfire_severity}
                  onChange={(e) => handleSliderChange('misfire_severity', e.target.value)}
                  className="w-full accent-red-500 bg-slate-800 h-2 rounded cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                  <span>Continuous Spark</span>
                  <span>Intermittent Mis-fire (+Vibration/-Power)</span>
                </div>
              </div>

              {/* 3. Lubrication Degradation */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Lubrication Degradation:</span>
                  <span className="text-amber-400 font-bold">{Math.round(activeFaults.lubrication_degradation * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={activeFaults.lubrication_degradation}
                  onChange={(e) => handleSliderChange('lubrication_degradation', e.target.value)}
                  className="w-full accent-amber-500 bg-slate-800 h-2 rounded cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                  <span>4.2 bar Nominal</span>
                  <span>Bearing Scuffing (-Oil Press/+Oil Temp)</span>
                </div>
              </div>

              {/* 4. Thermal Overheating */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Thermal Overheating:</span>
                  <span className="text-red-400 font-bold">{Math.round(activeFaults.overheating * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={activeFaults.overheating}
                  onChange={(e) => handleSliderChange('overheating', e.target.value)}
                  className="w-full accent-red-500 bg-slate-800 h-2 rounded cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                  <span>Adequate Airflow</span>
                  <span>Coolant Boiling (CHT &gt; 195°C)</span>
                </div>
              </div>

              {/* 5. Vibration Anomaly */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Vibration Fault (Mechanical Unbalance):</span>
                  <span className="text-amber-400 font-bold">{Math.round(activeFaults.vibration_fault * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={activeFaults.vibration_fault}
                  onChange={(e) => handleSliderChange('vibration_fault', e.target.value)}
                  className="w-full accent-amber-500 bg-slate-800 h-2 rounded cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                  <span>2.0 mm/s RMS</span>
                  <span>Prop/Shaft Unbalance (&gt;7.0 mm/s)</span>
                </div>
              </div>

              {/* 6. Sensor Drift */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300">Sensor Drift / Bias:</span>
                  <span className="text-purple-400 font-bold">{Math.round(activeFaults.sensor_drift * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={activeFaults.sensor_drift}
                  onChange={(e) => handleSliderChange('sensor_drift', e.target.value)}
                  className="w-full accent-purple-500 bg-slate-800 h-2 rounded cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-slate-500 mt-0.5">
                  <span>Calibrated Residual</span>
                  <span>Large Kalman Discrepancy</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-aerodark px-6 py-3 border-t border-aeroborder flex justify-between items-center text-xs text-slate-400">
          <div>
            Active Perturbations:{' '}
            <span className="text-sky-300 font-semibold">
              {Object.values(activeFaults).filter(v => v > 0).length} active fault components
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-semibold transition"
          >
            CONFIRM & CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
