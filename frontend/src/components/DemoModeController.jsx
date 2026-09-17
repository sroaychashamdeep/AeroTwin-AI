import React, { useState, useEffect } from 'react';
import { useTelemetryStore } from '../store/telemetryStore';
import { Play, Pause, RotateCcw, CheckCircle2, ChevronRight, Zap } from 'lucide-react';
import axios from 'axios';

export const DemoModeController = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const { openWhyModal, openCanICompleteMissionModal, openWhatShouldIDoModal } = useTelemetryStore();

  const demoSteps = [
    { title: "1. Nominal Baseline", desc: "Engine RUNNING at 4850 RPM. EKF residuals nominal (<0.5σ). Health 94%.", duration: 4000, action: () => axios.post('/api/simulator/faults/clear') },
    { title: "2. Takeoff & Climb Transition", desc: "Throttle up to 88%, climbing to 12,000 ft. Ram-air temperature compensation active.", duration: 5000, action: () => axios.post('/api/simulator/flight-params', { throttle: 85, altitude: 12000 }) },
    { title: "3. Hot-Day Atmospheric Shift", desc: "Ambient temperature climbs to 36°C. Physics twin recalculates air density baseline.", duration: 4000, action: () => axios.post('/api/simulator/flight-params', { ambientTemp: 36 }) },
    { title: "4. Injector Degradation Onset", desc: "Fuel flow fluctuates (+18%). Cylinder 1 & 3 EGT rises. Change-point detector triggers.", duration: 5000, action: () => axios.post('/api/simulator/faults', { injector_degradation: 0.85 }) },
    { title: "5. Autoencoder & IF Detection", desc: "Unsupervised anomaly score spikes to 0.72. Isolation Forest confirms departure.", duration: 4000, action: null },
    { title: "6. Multi-Model Consensus (Bi-GRU + Transformer)", desc: "Deep models confirm Injector Abnormality with 87% consensus agreement.", duration: 4000, action: null },
    { title: "7. Root Cause & Temporal Causality", desc: "Initiating signal isolated to Fuel System (+11s ahead of EGT and Vibration).", duration: 5000, action: () => openWhyModal('FAULT', 'Diagnostic Root Cause Evidence', null) },
    { title: "8. RUL Contraction & Horizon Shift", desc: "RUL contracts from 182h to 118h (P10: 95h). 6-24h failure horizon jumps to 24%.", duration: 4000, action: null },
    { title: "9. Mission Risk Elevation", desc: "Mission completion probability falls to 71%. Loiter phase identified as critical.", duration: 4000, action: () => openCanICompleteMissionModal() },
    { title: "10. Prescriptive Maintenance & Work Order", desc: "Maintenance Priority P2 generated. Structured work order WO-2026 logged to digital thread.", duration: 5000, action: () => openWhatShouldIDoModal() }
  ];

  useEffect(() => {
    let timer = null;
    if (isRunning && currentStep < demoSteps.length) {
      const step = demoSteps[currentStep];
      if (step.action) {
        try { step.action(); } catch (e) {}
      }
      timer = setTimeout(() => {
        if (currentStep < demoSteps.length - 1) {
          setCurrentStep((prev) => prev + 1);
        } else {
          setIsRunning(false);
        }
      }, step.duration);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isRunning, currentStep]);

  const toggleDemo = () => {
    if (!isRunning && currentStep >= demoSteps.length - 1) {
      setCurrentStep(0);
    }
    setIsRunning(!isRunning);
  };

  const resetDemo = () => {
    setIsRunning(false);
    setCurrentStep(0);
    axios.post('/api/simulator/faults/clear');
    axios.post('/api/simulator/flight-params', { throttle: 70, altitude: 12000, ambientTemp: 24 });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 mb-6 shadow-xl">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/40">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                DEMO MODE 2.0 (AUTOMATED ACCEPTANCE LIFECYCLE)
              </span>
              {isRunning && (
                <span className="animate-pulse px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/30 text-indigo-300 border border-indigo-500/50">
                  STEP {currentStep + 1} / {demoSteps.length}
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              {demoSteps[currentStep]?.desc}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={toggleDemo}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              isRunning 
                ? 'bg-amber-600 hover:bg-amber-500 text-slate-950 shadow-lg shadow-amber-600/20' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20'
            }`}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isRunning ? 'PAUSE DEMO' : (currentStep > 0 ? 'RESUME DEMO' : 'START DEMO 2.0')}</span>
          </button>

          <button
            onClick={resetDemo}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
            title="Reset Scenario to Nominal"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Progress timeline bar */}
      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-3 border border-slate-800">
        <div 
          className="h-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-500 transition-all duration-300"
          style={{ width: `${((currentStep + 1) / demoSteps.length) * 100}%` }}
        ></div>
      </div>
    </div>
  );
};
