import React, { useState } from 'react';
import { useTelemetryStore } from '../store/telemetryStore';
import { ArrowRight, Activity, AlertTriangle, CheckCircle, Info } from 'lucide-react';

export const CausalGraphViewer = () => {
  const { intelligenceState, twinState } = useTelemetryStore();
  const state = intelligenceState || twinState || {};
  const root = state.root_cause || {};
  const diag = state.diagnosis || {};

  const defaultNodes = [
    { id: "injector", label: "Fuel Injection System", type: "subsystem", status: diag.primary_fault?.includes("Injector") ? "WARNING" : "HEALTHY", evidence: "Nozzle delivery balance & solenoid response" },
    { id: "fuel_flow", label: "Fuel Flow Delivery", type: "metric", status: diag.primary_fault?.includes("Injector") ? "DEVIATED" : "NOMINAL", evidence: "Fuel schedule +18% above nominal MAP curve" },
    { id: "combustion", label: "Combustion Stoichiometry", type: "process", status: diag.primary_fault?.includes("Injector") ? "DEGRADED" : "NOMINAL", evidence: "Uneven cylinder chamber flame propagation" },
    { id: "egt", label: "Exhaust Gas Thermal State", type: "metric", status: diag.primary_fault?.includes("Injector") ? "ELEVATED" : "NOMINAL", evidence: "Peak EGT divergence exceeding 45°C inter-cylinder limit" },
    { id: "torsion", label: "Crankshaft Torsional Balance", type: "process", status: diag.primary_fault?.includes("Injector") ? "UNBALANCED" : "NOMINAL", evidence: "Cyclic torque pulsations detected by EKF estimator" },
    { id: "vibration", label: "Airframe Harmonic Coupling", type: "metric", status: diag.primary_fault?.includes("Injector") ? "ELEVATED" : "NOMINAL", evidence: "Radial harmonic vibration elevated to 2.4 g RMS" },
    { id: "health", label: "Powerplant RUL Impact", type: "outcome", status: diag.primary_fault !== "Healthy" ? "IMPACTED" : "NOMINAL", evidence: "Cumulative thermal & mechanical fatigue accumulation" }
  ];

  const nodes = root.causal_nodes && root.causal_nodes.length > 0 ? root.causal_nodes : defaultNodes;
  const [selectedNode, setSelectedNode] = useState(nodes[0]);

  const getNodeColor = (status) => {
    switch (status) {
      case 'WARNING':
      case 'DEVIATED':
      case 'DEGRADED':
      case 'ELEVATED':
      case 'UNBALANCED':
      case 'IMPACTED':
        return 'border-amber-500/70 bg-amber-500/10 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]';
      case 'CRITICAL':
        return 'border-rose-500/70 bg-rose-500/10 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.2)]';
      default:
        return 'border-slate-700/80 bg-slate-900/80 text-slate-300';
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h4 className="text-xs font-mono font-bold tracking-wider text-slate-200 uppercase">
            PHYSICS-INFORMED CAUSAL GRAPH (ROOT CAUSE PROPAGATION)
          </h4>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          Initiator: <strong className="text-cyan-400">{root.initiating_signal || 'Fuel System'}</strong>
        </span>
      </div>

      {/* Interactive Causal Flow Nodes */}
      <div className="flex flex-wrap items-center justify-center gap-2 py-2">
        {nodes.map((node, index) => {
          const isSelected = selectedNode?.id === node.id;
          return (
            <React.Fragment key={node.id}>
              <button
                onClick={() => setSelectedNode(node)}
                className={`px-3 py-2 rounded-lg border text-xs font-mono font-semibold transition-all duration-150 cursor-pointer ${getNodeColor(node.status)} ${isSelected ? 'ring-2 ring-cyan-400' : 'hover:scale-[1.02]'}`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-current opacity-80"></span>
                  <span>{node.label}</span>
                </div>
              </button>
              {index < nodes.length - 1 && (
                <ArrowRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Selected Node Evidence Inspector */}
      {selectedNode && (
        <div className="mt-4 p-3 bg-slate-950/80 rounded-lg border border-slate-800 flex items-start gap-3">
          <Info className="w-4 h-4 text-cyan-400 mt-0.5 flex-shrink-0" />
          <div className="text-xs font-mono">
            <span className="font-bold text-white uppercase">{selectedNode.label}</span>
            <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${selectedNode.status === 'HEALTHY' || selectedNode.status === 'NOMINAL' ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'}`}>
              STATUS: {selectedNode.status}
            </span>
            <p className="text-slate-400 mt-1">
              {selectedNode.evidence || selectedNode.value || 'Channel monitored under nominal covariance constraints in EKF filter.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
