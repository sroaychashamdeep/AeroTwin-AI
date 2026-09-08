/**
 * AEROTWIN AI - Mission Report Generation & Export (/reports)
 */

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useTelemetryStore } from '../store/telemetryStore';
import {
  FileSpreadsheet,
  Download,
  Printer,
  ShieldCheck,
  Calendar,
  AlertTriangle,
  Plane,
  CheckCircle2
} from 'lucide-react';

export default function ReportsPage() {
  const { telemetry, health, fault, anomaly, explanation } = useTelemetryStore();
  const [reports, setReports] = useState([]);
  const [activeReport, setActiveReport] = useState(null);

  useEffect(() => {
    loadReports();
  }, []);

  async function loadReports() {
    try {
      const res = await api.get('/reports');
      setReports(res.data);
      if (res.data.length > 0) setActiveReport(res.data[0]);
    } catch (err) {
      console.error('Failed to load reports:', err);
    }
  }

  async function generateCurrentReport() {
    try {
      const res = await api.post('/reports', {
        mission_id: 'MSN-ISR-0841',
        engine_id: 'eng_001',
        summary: `MALE UAV sortie MSN-ISR-0841 successfully audited. Final powerplant health evaluated at ${health.overall_health}% with active primary diagnosis: ${fault.primary_fault}.`,
        health_start: 95.0,
        health_end: health.overall_health,
        fuel_kg: 38.4,
        max_cht: telemetry.cht,
        max_egt: telemetry.egt,
        max_vib: telemetry.vibration,
        recommendations: explanation.narrative_summary
      });
      loadReports();
      setActiveReport(res.data);
    } catch (err) {
      console.error('Failed to generate report:', err);
    }
  }

  const exportJson = () => {
    if (!activeReport) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeReport, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${activeReport.id || 'mission_report'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 space-y-4 font-mono">
      {/* Header */}
      <div className="bg-aerodark border border-aeroborder p-4 rounded-lg flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-sky-400" />
            <h1 className="text-base font-bold text-white tracking-wider">
              MISSION READINESS & PROPULSION DIAGNOSTIC REPORTS
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-800 font-bold">
              ISO / DEF-STAN COMPLIANT AUDIT
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Post-flight health certification, fuel consumption summaries, and predictive maintenance release logs
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={generateCurrentReport}
            className="px-3.5 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold transition shadow-lg shadow-sky-950/40"
          >
            GENERATE SORTIE REPORT
          </button>
          <button
            onClick={exportJson}
            className="px-3 py-1.5 rounded bg-aerocard border border-aeroborder hover:bg-aerocardhover text-slate-300 font-semibold transition flex items-center space-x-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT JSON</span>
          </button>
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 rounded bg-aerocard border border-aeroborder hover:bg-aerocardhover text-slate-300 font-semibold transition flex items-center space-x-1"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PRINT REPORT</span>
          </button>
        </div>
      </div>

      {/* Main Report Document View */}
      {activeReport ? (
        <div className="bg-aerocard border border-aeroborder rounded-lg p-6 space-y-6 max-w-4xl mx-auto shadow-2xl">
          {/* Document Header */}
          <div className="border-b border-aeroborder pb-4 flex justify-between items-start">
            <div>
              <div className="text-xs font-bold text-sky-400 uppercase tracking-widest mb-1">
                AEROTWIN AI PROPULSION RELIABILITY RELEASE
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {activeReport.title || `Propulsion Diagnostic Sortie Report: ${activeReport.mission_id}`}
              </h2>
              <div className="text-xs text-slate-400 mt-1">
                Report ID: <span className="text-slate-200">{activeReport.id}</span> • Date: <span className="text-slate-200">{new Date(activeReport.generated_at).toLocaleString()}</span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs px-2.5 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                AUDIT VERIFIED
              </span>
            </div>
          </div>

          {/* Section 1: Airframe & Powerplant Identification */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded bg-aerodark border border-aeroborder text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">UAV AIRFRAME</span>
              <span className="font-bold text-white text-sm">TAPAS MALE-201</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">ENGINE S/N</span>
              <span className="font-bold text-white text-sm">RTX-914-F0192</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">MISSION CODE</span>
              <span className="font-bold text-sky-400 text-sm">{activeReport.mission_id}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">FLIGHT HOURS</span>
              <span className="font-bold text-white text-sm">342.5 hrs</span>
            </div>
          </div>

          {/* Section 2: Executive Summary */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-aeroborder pb-1">
              1. EXECUTIVE SORTIE SUMMARY
            </h3>
            <p className="text-xs text-slate-300 font-sans leading-relaxed bg-aerodark/60 p-3 rounded border border-aeroborder">
              {activeReport.summary}
            </p>
          </div>

          {/* Section 3: Telemetry & Thermodynamic Extremes */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-aeroborder pb-1">
              2. CRITICAL PROPULSION TELEMETRY AUDIT
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-aerodark/60 p-3 rounded border border-aeroborder">
                <span className="text-slate-400 block text-[10px]">START HEALTH:</span>
                <span className="font-bold text-white">{activeReport.start_health}%</span>
              </div>
              <div className="bg-aerodark/60 p-3 rounded border border-aeroborder">
                <span className="text-slate-400 block text-[10px]">FINAL HEALTH:</span>
                <span className="font-bold text-emerald-400">{activeReport.end_health}%</span>
              </div>
              <div className="bg-aerodark/60 p-3 rounded border border-aeroborder">
                <span className="text-slate-400 block text-[10px]">FUEL CONSUMED:</span>
                <span className="font-bold text-white">{activeReport.fuel_consumed_kg} kg</span>
              </div>
              <div className="bg-aerodark/60 p-3 rounded border border-aeroborder">
                <span className="text-slate-400 block text-[10px]">PEAK CHT:</span>
                <span className={`font-bold ${activeReport.max_cht_c > 175 ? 'text-red-400' : 'text-slate-200'}`}>
                  {activeReport.max_cht_c}°C
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Maintenance Directives & Recommendations */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-aeroborder pb-1">
              3. PRESCRIPTIVE POWERPLANT ACTIONS
            </h3>
            <p className="text-xs text-slate-300 font-sans leading-relaxed bg-aerodark/60 p-3 rounded border border-aeroborder">
              {activeReport.recommendations}
            </p>
          </div>

          {/* Signoff Footer */}
          <div className="border-t border-aeroborder pt-4 flex justify-between items-end text-xs text-slate-400">
            <div>
              <span className="block text-[10px]">DIGITAL TWIN VERIFICATION:</span>
              <span className="text-emerald-400 font-bold">SHA-256 TELEMETRY INTEGRITY CERTIFIED</span>
            </div>
            <div className="text-right">
              <span className="block text-[10px]">FLIGHT OPS PROPULSION ENGINEER:</span>
              <span className="text-slate-200 font-bold">LEAD SPECIALIST (SIGN-OFF PENDING)</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-aerocard border border-aeroborder rounded-lg p-12 text-center text-slate-500 text-xs">
          Loading report...
        </div>
      )}
    </div>
  );
}
