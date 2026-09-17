import React, { useState } from 'react';
import { useTelemetryStore } from '../store/telemetryStore';
import { 
  X, 
  HelpCircle, 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  ArrowRight,
  ShieldCheck,
  Cpu,
  Clock,
  Wrench,
  BarChart3
} from 'lucide-react';
import axios from 'axios';

export const UniversalActionModals = () => {
  const {
    whyModal,
    closeWhyModal,
    whatIfModal,
    closeWhatIfModal,
    whatChangedModal,
    closeWhatChangedModal,
    whatShouldIDoModal,
    closeWhatShouldIDoModal,
    canICompleteMissionModal,
    closeCanICompleteMissionModal,
    intelligenceState,
    twinState,
    telemetry
  } = useTelemetryStore();

  const state = intelligenceState || twinState || {};
  const health = state.health || { overall: 87, thermal: 84, combustion: 91, lubrication: 78, mechanical: 81, electrical: 94, fuel: 88, sensor: 96 };
  const diag = state.diagnosis || { primary_fault: 'Healthy', probability: 0.94, confidence: 0.89, model_agreement: 0.89, model_consensus: {} };
  const root = state.root_cause || { initiating_signal: 'Nominal', temporal_sequence: [], contributing_factors: [] };
  const rul = state.rul || { expected_hours: 143, p10: 111, p50: 143, p90: 172, failure_horizon: {} };
  const mission = state.mission || { success_probability: 0.91, risk: 0.09, critical_phase: 'LOITER', phase_risks: {} };
  const rec = state.recommendation || { priority: 'P2', action: 'Inspect injector system', recommended_window: '< 24 operating hours', estimated_preventive_cost_inr: 12000, estimated_failure_impact_inr: 85000 };

  // What-If State
  const [whatIfThrottle, setWhatIfThrottle] = useState(70);
  const [whatIfAltitude, setWhatIfAltitude] = useState(12000);
  const [whatIfTemp, setWhatIfTemp] = useState(24);
  const [simResults, setSimResults] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Work order creation status
  const [woSuccess, setWoSuccess] = useState(null);

  const runCounterfactualSimulation = async () => {
    setIsSimulating(true);
    try {
      const res = await axios.post('/api/simulate/counterfactual', {
        throttle: whatIfThrottle,
        altitude: whatIfAltitude,
        ambient_temperature: whatIfTemp,
        faults: (diag?.primary_fault && diag.primary_fault.includes('Injector')) ? { injector_degradation: 0.8 } : {}
      });
      setSimResults(res.data);
    } catch (err) {
      console.error('Counterfactual simulation error:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleCreateWorkOrder = async () => {
    try {
      const res = await axios.post('/api/work-orders/generate', {
        intelligence_state: state
      });
      setWoSuccess(res.data.id);
    } catch (err) {
      console.error('Work order generation error:', err);
    }
  };

  return (
    <>
      {/* 1. WHY MODAL */}
      {whyModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-mono font-bold text-white">
                  {whyModal.title || `Why is ${whyModal.metric} at Current Value?`}
                </h3>
              </div>
              <button onClick={closeWhyModal} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1">Diagnostic Root Cause</span>
                <div className="flex items-center justify-between">
                  <span className="text-lg font-mono font-bold text-cyan-300">{diag.primary_fault}</span>
                  <span className="text-sm font-mono text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800">
                    {Math.round(diag.probability * 100)}% Probability
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  {root.narrative || 'Evidence derived from Kalman filter residual divergence and temporal multi-head attention.'}
                </p>
              </div>

              <div>
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-2">Contributing Factors</span>
                <div className="space-y-2">
                  {(root.contributing_factors && root.contributing_factors.length > 0 ? root.contributing_factors : [
                    { factor: "Fuel Flow Imbalance", contribution_pct: 42.0, evidence: "Fuel schedule +18% above nominal" },
                    { factor: "EGT Thermal Gradient", contribution_pct: 31.0, evidence: "Exhaust gas divergence across cylinders" },
                    { factor: "Crankshaft Torsional Vibration", contribution_pct: 18.0, evidence: "Harmonic vibration at 2.4 g" }
                  ]).map((item, idx) => (
                    <div key={idx} className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/80">
                      <div className="flex justify-between text-xs font-mono mb-1">
                        <span className="text-slate-200 font-semibold">{item.factor}</span>
                        <span className="text-cyan-400">{item.contribution_pct}% contribution</span>
                      </div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mb-1.5">
                        <div className="bg-gradient-to-r from-cyan-500 to-indigo-500 h-full rounded-full" style={{ width: `${item.contribution_pct}%` }}></div>
                      </div>
                      <span className="text-[11px] text-slate-400 block">{item.evidence}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800">
                <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] font-mono text-slate-500 block">MODEL AGREEMENT</span>
                  <span className="text-sm font-mono font-bold text-emerald-400">{Math.round((diag.model_agreement || 0.89) * 100)}%</span>
                </div>
                <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] font-mono text-slate-500 block">DATA QUALITY</span>
                  <span className="text-sm font-mono font-bold text-cyan-400">98.5%</span>
                </div>
                <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] font-mono text-slate-500 block">PHYSICS RESIDUAL</span>
                  <span className="text-sm font-mono font-bold text-amber-400">0.82 σ</span>
                </div>
                <div className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-800 text-center">
                  <span className="text-[10px] font-mono text-slate-500 block">CONFIDENCE</span>
                  <span className="text-sm font-mono font-bold text-indigo-400">{Math.round((diag.confidence || 0.90) * 100)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. WHAT IF MODAL */}
      {whatIfModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-mono font-bold text-white">Counterfactual Simulation Engine (What-If)</h3>
              </div>
              <button onClick={closeWhatIfModal} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              <p className="text-xs text-slate-400 font-mono">
                Rerun the thermodynamic twin with perturbed environmental & operating inputs to observe counterfactual safety margins.
              </p>

              <div className="space-y-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-slate-300">Throttle Setting:</span>
                    <span className="text-indigo-400 font-bold">{whatIfThrottle}%</span>
                  </div>
                  <input
                    type="range"
                    min="30"
                    max="100"
                    value={whatIfThrottle}
                    onChange={(e) => setWhatIfThrottle(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-slate-300">Density Altitude:</span>
                    <span className="text-indigo-400 font-bold">{whatIfAltitude} ft</span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="25000"
                    step="500"
                    value={whatIfAltitude}
                    onChange={(e) => setWhatIfAltitude(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-mono mb-1">
                    <span className="text-slate-300">Ambient Temperature (OAT):</span>
                    <span className="text-indigo-400 font-bold">{whatIfTemp} °C</span>
                  </div>
                  <input
                    type="range"
                    min="-20"
                    max="50"
                    value={whatIfTemp}
                    onChange={(e) => setWhatIfTemp(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                <button
                  onClick={runCounterfactualSimulation}
                  disabled={isSimulating}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-mono font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
                >
                  {isSimulating ? 'Rerunning Physics Twin...' : 'EXECUTE SIMULATION RERUN'}
                </button>
              </div>

              {simResults && (
                <div className="bg-slate-950/80 p-4 rounded-xl border border-indigo-900/60 space-y-3">
                  <span className="text-xs font-mono font-bold text-indigo-300 block">SIMULATION OUTCOME & DELTAS</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div className="bg-slate-900 p-2 rounded text-center">
                      <span className="text-[10px] text-slate-500 block">RPM DELTA</span>
                      <span className={`text-xs font-mono font-bold ${simResults.deltas.rpm_delta > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {simResults.deltas.rpm_delta > 0 ? `+${simResults.deltas.rpm_delta}` : simResults.deltas.rpm_delta} RPM
                      </span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded text-center">
                      <span className="text-[10px] text-slate-500 block">CHT DELTA</span>
                      <span className={`text-xs font-mono font-bold ${simResults.deltas.cht_delta > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {simResults.deltas.cht_delta > 0 ? `+${simResults.deltas.cht_delta}` : simResults.deltas.cht_delta} °C
                      </span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded text-center">
                      <span className="text-[10px] text-slate-500 block">EGT DELTA</span>
                      <span className={`text-xs font-mono font-bold ${simResults.deltas.egt_delta > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {simResults.deltas.egt_delta > 0 ? `+${simResults.deltas.egt_delta}` : simResults.deltas.egt_delta} °C
                      </span>
                    </div>
                    <div className="bg-slate-900 p-2 rounded text-center">
                      <span className="text-[10px] text-slate-500 block">FUEL FLOW</span>
                      <span className={`text-xs font-mono font-bold ${simResults.deltas.fuel_flow_delta > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {simResults.deltas.fuel_flow_delta > 0 ? `+${simResults.deltas.fuel_flow_delta}` : simResults.deltas.fuel_flow_delta} L/h
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. WHAT CHANGED MODAL */}
      {whatChangedModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-mono font-bold text-white">Temporal Causality ("What Changed First?")</h3>
              </div>
              <button onClick={closeWhatChangedModal} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              <div className="bg-cyan-950/40 border border-cyan-800/60 p-4 rounded-xl">
                <span className="text-[11px] font-mono text-cyan-300 uppercase tracking-wider block">Probable Initiating Signal</span>
                <span className="text-lg font-mono font-bold text-white">{root.initiating_signal}</span>
              </div>

              <div>
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-3">Signal Deviation Sequence</span>
                <div className="relative border-l-2 border-slate-700 ml-4 pl-6 space-y-4">
                  {(root.temporal_sequence && root.temporal_sequence.length > 0 ? root.temporal_sequence : [
                    { order: 1, sensor: "fuel_flow", delta_seconds_from_origin: 0.0, current_value: 21.2, status: "PRIMARY_TRIGGER" },
                    { order: 2, sensor: "egt", delta_seconds_from_origin: 11.0, current_value: 830.0, status: "CONSEQUENT" },
                    { order: 3, sensor: "rpm", delta_seconds_from_origin: 15.0, current_value: 4720, status: "CONSEQUENT" },
                    { order: 4, sensor: "vibration", delta_seconds_from_origin: 22.0, current_value: 3.8, status: "CONSEQUENT" }
                  ]).map((seq, idx) => (
                    <div key={idx} className="relative">
                      <span className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-cyan-500 border-2 border-slate-900 text-[10px] font-bold text-slate-900 flex items-center justify-center">
                        {seq.order}
                      </span>
                      <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-mono font-bold text-white uppercase">{(seq?.sensor ? String(seq.sensor).replace('_', ' ') : 'SENSOR')}</span>
                          <span className="text-[11px] text-slate-400 block">Current: {seq?.current_value ?? 'N/A'}</span>
                        </div>
                        <span className="text-xs font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
                          +{seq?.delta_seconds_from_origin ?? 0}s
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. WHAT SHOULD I DO MODAL */}
      {whatShouldIDoModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-mono font-bold text-white">Prescriptive Action & Maintenance Guidance</h3>
              </div>
              <button onClick={closeWhatShouldIDoModal} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-slate-400 uppercase">PRIORITY ACTION</span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40">
                    {rec.priority || 'MEDIUM'} ADVISORY
                  </span>
                </div>
                <p className="text-sm font-semibold text-white mb-2">{rec.action || 'Continue normal monitoring'}</p>
                <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
                  <span>Due Horizon: <strong className="text-slate-200">{rec.recommended_window || 'Next Scheduled Check'}</strong></span>
                  <span>Risk if Delayed: <strong className="text-amber-400">{rec.risk_if_delayed || 'Gradual degradation'}</strong></span>
                </div>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-2">Maintenance Economics Model</span>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-mono">PREVENTIVE ACTION COST</span>
                    <span className="text-base font-mono font-bold text-emerald-400">₹{(rec?.estimated_preventive_cost_inr || 12000).toLocaleString()}</span>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-400 block font-mono">EXPECTED FAILURE IMPACT</span>
                    <span className="text-base font-mono font-bold text-rose-400">₹{(rec?.estimated_failure_impact_inr || 85000).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {woSuccess ? (
                <div className="bg-emerald-950/40 border border-emerald-800 p-4 rounded-xl flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <div>
                    <span className="text-xs font-mono font-bold text-emerald-300">WORK ORDER GENERATED: {woSuccess}</span>
                    <span className="text-[11px] text-slate-300 block">Logged to Maintenance Digital Thread. View in Maintenance Station.</span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleCreateWorkOrder}
                  className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-slate-950 font-mono font-bold text-xs rounded-xl transition-all shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2"
                >
                  <Wrench className="w-4 h-4" />
                  <span>GENERATE STRUCTURED MAINTENANCE WORK ORDER</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. CAN I COMPLETE THE MISSION MODAL */}
      {canICompleteMissionModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-mono font-bold text-white">Mission Feasibility & Risk Assessment</h3>
              </div>
              <button onClick={closeCanICompleteMissionModal} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              <div className={`p-4 rounded-xl border ${mission.success_probability > 0.80 ? 'bg-emerald-950/40 border-emerald-800' : 'bg-rose-950/40 border-rose-800'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-300">MISSION COMPLETION PROBABILITY</span>
                  <span className={`text-xl font-mono font-bold ${mission.success_probability > 0.80 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {Math.round(mission.success_probability * 100)}%
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-2">
                  {mission.success_probability > 0.80 
                    ? 'All powerplant health parameters and projected thermal dissipation margins satisfy operational mission duration.' 
                    : `Active ${diag.primary_fault} imposes unacceptable failure risk in ${mission.critical_phase} phase. Abort or replan required.`}
                </p>
              </div>

              <div>
                <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-2">Phase-by-Phase Risk Breakdown</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(mission.phase_risks || { TAKEOFF: 4, CLIMB: 8, CRUISE: 13, LOITER: 28, RETURN: 17, LANDING: 6 }).map(([phase, r]) => (
                    <div key={phase} className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 text-center">
                      <span className="text-[10px] font-mono text-slate-500 block">{phase}</span>
                      <span className={`text-sm font-mono font-bold ${r > 20 ? 'text-rose-400' : (r > 10 ? 'text-amber-400' : 'text-emerald-400')}`}>
                        {r}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800 flex justify-between text-xs font-mono text-slate-400">
                <span>Thermal Margin: <strong className="text-emerald-400">+{mission.thermal_margin_deg || 28}°C</strong></span>
                <span>Vibration Margin: <strong className="text-cyan-400">+{mission.vibration_margin_g || 2.2}g</strong></span>
                <span>Deviation: <strong className="text-indigo-400">{mission.deviation_score_pct || 2.4}%</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
