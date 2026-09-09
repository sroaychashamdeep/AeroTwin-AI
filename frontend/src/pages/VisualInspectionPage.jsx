/**
 * AEROTWIN AI - Computer Vision Component Defect Inspection Page (/inspection)
 * Experimental Optical & Thermal Anomaly Detection Demonstrator for Aero Piston Engines
 */

import React, { useState } from 'react';
import {
  Camera,
  Eye,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Upload,
  RefreshCw,
  Sparkles,
  Info,
  Maximize2
} from 'lucide-react';
import api from '../services/api';
import { soundFx } from '../utils/soundFx';

const SAMPLE_COMPONENTS = [
  {
    id: 'exhaust_manifold',
    name: 'Exhaust Manifold (Bank 1 & 2)',
    scenario: 'thermal_stress',
    imagePlaceholder: 'EXHAUST_MANIFOLD_THERMAL_SCAN',
    desc: 'Nickel-alloy exhaust manifold subjected to peak 890°C EGT thermal cycling.'
  },
  {
    id: 'crankcase_seal',
    name: 'Crankcase Radial Oil Seal',
    scenario: 'oil_leak',
    imagePlaceholder: 'CRANKCASE_OIL_SEAL_OPTICAL',
    desc: 'Front propeller hub crankshaft viton seal under hydrodynamic pressure.'
  },
  {
    id: 'cylinder_head',
    name: 'Cylinder Head No. 2',
    scenario: 'nominal',
    imagePlaceholder: 'CYLINDER_HEAD_BORESCOPE',
    desc: 'Aluminum alloy cylinder head cooling fins and spark plug boss.'
  }
];

export default function VisualInspectionPage() {
  const [selectedSample, setSelectedSample] = useState(SAMPLE_COMPONENTS[0]);
  const [isInspecting, setIsInspecting] = useState(false);
  const [inspectionResult, setInspectionResult] = useState(null);

  const runInspection = async (sample) => {
    soundFx.playClick('toggle');
    setIsInspecting(true);
    try {
      const res = await api.post('/vision/inspect', {
        component: sample.name,
        scenario: sample.scenario
      });
      setInspectionResult(res.data);
      if (res.data.is_defect_detected) {
        soundFx.playWarningChime();
      } else {
        soundFx.playSuccess();
      }
    } catch (err) {
      console.error('Vision inspection error:', err);
    } finally {
      setIsInspecting(false);
    }
  };

  return (
    <div className="p-4 space-y-4 font-mono">
      {/* Header */}
      <div className="bg-aerodark border border-aeroborder p-4 rounded-lg flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Eye className="w-5 h-5 text-cyan-400" />
            <h1 className="text-base font-bold text-white tracking-wider">
              COMPUTER VISION VISUAL DEFECT INSPECTION AI
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800 font-bold">
              EXPERIMENTAL DEMONSTRATOR
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Borescope optical surface defect classification, micro-fissure detection, and thermal discoloration analysis
          </p>
        </div>

        <span className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700">
          MODEL: AeroTwin-ResNet-Defect-v1.2
        </span>
      </div>

      {/* Main Grid: Sample Selector & Image Viewport (Left) vs AI Diagnostic Output (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Component Picker & Vision Frame (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Sample Component Buttons */}
          <div className="bg-aerocard border border-aeroborder rounded-lg p-3 space-y-2">
            <span className="text-xs font-bold text-slate-300 uppercase block">
              SELECT ENGINE COMPONENT INSPECTION TARGET
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {SAMPLE_COMPONENTS.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => {
                    setSelectedSample(sample);
                    runInspection(sample);
                  }}
                  className={`p-2.5 rounded border text-left text-xs transition ${
                    selectedSample.id === sample.id
                      ? 'bg-sky-950/80 border-sky-500 text-sky-300 ring-1 ring-sky-500'
                      : 'bg-aerodark border-aeroborder text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="font-bold block">{sample.name}</span>
                  <span className="text-[10px] text-slate-500 block mt-1 line-clamp-2">{sample.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Synthetic Optical / Thermal Scan Viewport */}
          <div className="bg-aerodark border border-aeroborder rounded-lg p-4 h-80 relative overflow-hidden flex flex-col items-center justify-center">
            {/* Scan Reticle HUD */}
            <div className="absolute inset-4 border border-dashed border-sky-500/30 rounded pointer-events-none flex flex-col justify-between p-2">
              <div className="flex justify-between text-[10px] text-sky-400 font-mono">
                <span>[CAM-01: BORESCOPE 1080P]</span>
                <span>MAG: 4.5X</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>TARGET: {selectedSample.name}</span>
                <span>FOV: 65°</span>
              </div>
            </div>

            {/* Synthetic Defect Bounding Box if detected */}
            {inspectionResult && inspectionResult.is_defect_detected && (
              <div className="relative border-2 border-red-500 bg-red-500/20 w-48 h-36 rounded flex flex-col justify-between p-2 animate-pulse">
                <span className="text-[10px] bg-red-950 text-red-300 border border-red-700 px-1 font-bold w-fit">
                  DEFECT ROI: {inspectionResult.severity}
                </span>
                <span className="text-[9px] text-red-200">
                  CONF: {inspectionResult.confidence_pct}%
                </span>
              </div>
            )}

            {/* Nominal Crosshair */}
            {(!inspectionResult || !inspectionResult.is_defect_detected) && (
              <div className="text-center space-y-2 text-slate-400">
                <Camera className="w-12 h-12 text-slate-600 mx-auto" />
                <div className="text-xs font-semibold text-slate-300">{selectedSample.imagePlaceholder}</div>
                <div className="text-[10px] text-slate-500">Optical sensor ready. Click Inspect below.</div>
              </div>
            )}

            {/* Action Trigger */}
            <button
              onClick={() => runInspection(selectedSample)}
              disabled={isInspecting}
              className="absolute bottom-4 right-4 px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 text-white font-bold text-xs shadow-md transition flex items-center space-x-1.5"
            >
              {isInspecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{isInspecting ? 'ANALYZING PIXELS...' : 'RUN AI INSPECTION'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Defect Classification Breakdown (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-aerocard border border-aeroborder rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-aeroborder pb-2">
              <span className="text-xs font-bold text-slate-200">AI DEFECT DIAGNOSTIC REPORT</span>
              <span className="text-[10px] text-slate-500">DECISION SUPPORT ONLY</span>
            </div>

            {inspectionResult ? (
              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">INSPECTED COMPONENT:</span>
                  <span className="text-base font-bold text-white">{inspectionResult.component}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded bg-aerodark border border-aeroborder">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block">CLASSIFICATION:</span>
                    <span className={`font-bold text-sm ${inspectionResult.is_defect_detected ? 'text-red-400' : 'text-emerald-400'}`}>
                      {inspectionResult.visual_anomaly}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded font-bold border ${
                    inspectionResult.is_defect_detected ? 'bg-red-950 border-red-700 text-red-300' : 'bg-emerald-950 border-emerald-700 text-emerald-300'
                  }`}>
                    {inspectionResult.severity}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-aerodark p-2 rounded border border-aeroborder">
                    <span className="text-slate-400 block text-[9px]">DETECTION CONFIDENCE</span>
                    <span className="text-base font-bold text-sky-400">{inspectionResult.confidence_pct}%</span>
                  </div>
                  <div className="bg-aerodark p-2 rounded border border-aeroborder">
                    <span className="text-slate-400 block text-[9px]">REQUIRES HUMAN SIGN-OFF</span>
                    <span className={`text-base font-bold ${inspectionResult.requires_human_inspection ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {inspectionResult.requires_human_inspection ? 'YES (CRITICAL)' : 'NO'}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded bg-aerodark/80 border border-aeroborder space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">
                    PRESCRIPTIVE MAINTENANCE DIRECTIVE:
                  </span>
                  <p className="text-slate-200 font-sans text-xs leading-relaxed">
                    {inspectionResult.recommendation}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center p-8 text-slate-500 text-xs">
                Select a component and execute inspection to view AI vision defect breakdown.
              </div>
            )}
          </div>

          <div className="bg-aerocard border border-aeroborder rounded-lg p-3 text-[11px] text-slate-400 space-y-1">
            <span className="font-bold text-slate-300 block">Aerospace Safety Notice:</span>
            <p className="font-sans leading-relaxed">
              This Computer Vision demonstrator identifies potential surface anomalies for decision support. Certified aircraft dispatch requires qualified NDT/visual maintenance personnel sign-off.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
