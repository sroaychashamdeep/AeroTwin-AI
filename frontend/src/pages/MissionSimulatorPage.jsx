/**
 * AEROTWIN AI - Flight Mission Simulator & Natural Language Query Interface (/mission-simulator)
 */

import React, { useState } from 'react';
import api from '../services/api';
import {
  PlaneTakeoff,
  Send,
  Sliders,
  Sparkles,
  Flame,
  Droplet,
  Wind,
  ShieldCheck,
  AlertTriangle,
  Play,
  Layers,
  Clock
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export default function MissionSimulatorPage() {
  const [nlpPrompt, setNlpPrompt] = useState('Simulate a 10 hour ISR mission at 15000 ft with 70% throttle and 35°C ambient temperature.');
  const [isSimulating, setIsSimulating] = useState(false);

  // Simulation parameters
  const [missionType, setMissionType] = useState('ISR');
  const [duration, setDuration] = useState(10.0);
  const [altitude, setAltitude] = useState(15000);
  const [throttle, setThrottle] = useState(70);
  const [ambientTemp, setAmbientTemp] = useState(35);
  const [humidity, setHumidity] = useState(50);
  const [payload, setPayload] = useState(45);
  const [faultScenario, setFaultScenario] = useState('none');

  // Results state
  const [results, setResults] = useState(null);

  const runSimulation = async (params = null) => {
    setIsSimulating(true);
    try {
      const payloadData = params || {
        mission_type: missionType,
        duration_hours: Number(duration),
        altitude_ft: Number(altitude),
        throttle_pct: Number(throttle),
        ambient_temp_c: Number(ambientTemp),
        humidity_pct: Number(humidity),
        payload_weight_kg: Number(payload),
        fault_scenario: faultScenario !== 'none' ? faultScenario : null
      };

      const res = await api.post('/mission/simulate', payloadData);
      setResults(res.data);
    } catch (err) {
      console.error('Simulation failed:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  const handleNlpSubmit = async (e) => {
    e.preventDefault();
    if (!nlpPrompt.trim()) return;

    setIsSimulating(true);
    try {
      const res = await api.post('/mission/query', { prompt: nlpPrompt });
      if (res.data.extracted_parameters) {
        const p = res.data.extracted_parameters;
        if (p.duration_hours) setDuration(p.duration_hours);
        if (p.altitude_ft) setAltitude(p.altitude_ft);
        if (p.throttle_pct) setThrottle(p.throttle_pct);
        if (p.ambient_temp_c) setAmbientTemp(p.ambient_temp_c);
        if (p.mission_type) setMissionType(p.mission_type);
      }
      setResults(res.data.simulation_results);
    } catch (err) {
      console.error('NLP Query failed:', err);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="p-4 space-y-4 font-mono">
      {/* Header */}
      <div className="bg-aerodark border border-aeroborder p-4 rounded-lg flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <PlaneTakeoff className="w-5 h-5 text-sky-400" />
            <h1 className="text-base font-bold text-white tracking-wider">
              UAV MISSION RELIABILITY & OPERATIONAL ENVELOPE SIMULATOR
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-800 font-bold">
              ISA ATMOSPHERE MODEL
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluate thermal stress, cumulative degradation, and fuel consumption prior to flight dispatch
          </p>
        </div>
      </div>

      {/* Natural Language Query Box */}
      <div className="bg-gradient-to-r from-aerocard via-sky-950/20 to-aerocard border border-sky-500/40 rounded-lg p-4 shadow-lg shadow-sky-950/30">
        <div className="flex items-center space-x-2 text-xs font-bold text-sky-400 uppercase tracking-wider mb-2">
          <Sparkles className="w-4 h-4 text-sky-400" />
          <span>NATURAL LANGUAGE MISSION SIMULATION QUERY (NLP)</span>
        </div>
        <form onSubmit={handleNlpSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={nlpPrompt}
            onChange={(e) => setNlpPrompt(e.target.value)}
            placeholder="e.g. Simulate a 12 hour Maritime mission at 18000 ft with 75% throttle and 28°C ambient temperature."
            className="flex-1 bg-aerodark border border-aeroborder rounded px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
          />
          <button
            type="submit"
            disabled={isSimulating}
            className="px-5 py-2 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition flex items-center justify-center space-x-2 shrink-0 disabled:opacity-50 shadow-md"
          >
            {isSimulating ? <span className="animate-spin">⏳</span> : <Send className="w-3.5 h-3.5" />}
            <span>PARSE & RUN NLP QUERY</span>
          </button>
        </form>
      </div>

      {/* Manual Mission Parameter Controls (Left) & Results View (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Configuration Form (5 cols) */}
        <div className="lg:col-span-4 bg-aerocard border border-aeroborder rounded-lg p-4 space-y-4">
          <div className="flex items-center space-x-2 border-b border-aeroborder pb-2">
            <Sliders className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-200 uppercase">MISSION CONFIGURATION</span>
          </div>

          <div className="space-y-3 text-xs">
            {/* Mission Type */}
            <div>
              <label className="text-slate-400 block mb-1">MISSION PROFILE TYPE:</label>
              <select
                value={missionType}
                onChange={(e) => setMissionType(e.target.value)}
                className="w-full bg-aerodark border border-aeroborder rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="ISR">ISR (Intelligence, Surveillance, Reconnaissance)</option>
                <option value="Maritime Surveillance">Maritime Surveillance</option>
                <option value="Communication Relay">Communication Relay</option>
                <option value="Endurance">Max Endurance Loiter</option>
                <option value="Hot-Weather">Hot-Weather Desert Operation</option>
              </select>
            </div>

            {/* Duration */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">FLIGHT DURATION:</span>
                <span className="text-sky-400 font-bold">{duration} HOURS</span>
              </div>
              <input
                type="range"
                min="1"
                max="24"
                step="0.5"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full accent-sky-500 bg-slate-800 h-1.5 rounded cursor-pointer"
              />
            </div>

            {/* Target Altitude */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">LOITER ALTITUDE:</span>
                <span className="text-sky-400 font-bold">{altitude.toLocaleString()} FT</span>
              </div>
              <input
                type="range"
                min="2000"
                max="25000"
                step="500"
                value={altitude}
                onChange={(e) => setAltitude(e.target.value)}
                className="w-full accent-sky-500 bg-slate-800 h-1.5 rounded cursor-pointer"
              />
            </div>

            {/* Throttle % */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">CRUISE THROTTLE:</span>
                <span className="text-sky-400 font-bold">{throttle}%</span>
              </div>
              <input
                type="range"
                min="40"
                max="100"
                value={throttle}
                onChange={(e) => setThrottle(e.target.value)}
                className="w-full accent-sky-500 bg-slate-800 h-1.5 rounded cursor-pointer"
              />
            </div>

            {/* Ambient Temperature */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">AMBIENT SURFACE TEMP:</span>
                <span className={`font-bold ${ambientTemp > 38 ? 'text-red-400' : 'text-slate-200'}`}>
                  {ambientTemp}°C
                </span>
              </div>
              <input
                type="range"
                min="-20"
                max="50"
                value={ambientTemp}
                onChange={(e) => setAmbientTemp(e.target.value)}
                className="w-full accent-sky-500 bg-slate-800 h-1.5 rounded cursor-pointer"
              />
            </div>

            {/* Payload Weight */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">PAYLOAD WEIGHT:</span>
                <span className="text-slate-200 font-bold">{payload} kg</span>
              </div>
              <input
                type="range"
                min="0"
                max="120"
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                className="w-full accent-sky-500 bg-slate-800 h-1.5 rounded cursor-pointer"
              />
            </div>

            {/* Optional Fault Scenario */}
            <div>
              <label className="text-slate-400 block mb-1">PERTURBATION / FAULT INJECTION:</label>
              <select
                value={faultScenario}
                onChange={(e) => setFaultScenario(e.target.value)}
                className="w-full bg-aerodark border border-aeroborder rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="none">None (Nominal Engine)</option>
                <option value="injector_degradation">Injector Degradation</option>
                <option value="lubrication_degradation">Lubrication Degradation</option>
                <option value="overheating">Overheating Condition</option>
                <option value="vibration_anomaly">Vibration Anomaly</option>
              </select>
            </div>
          </div>

          <button
            onClick={() => runSimulation()}
            disabled={isSimulating}
            className="w-full py-2.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition flex items-center justify-center space-x-2 shadow-lg shadow-sky-950/40"
          >
            <Play className="w-4 h-4" />
            <span>RUN FLIGHT SIMULATION</span>
          </button>
        </div>

        {/* Right: Simulation Output & Flight Phase Timeline (7 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {results ? (
            <>
              {/* Key Results Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-aerocard border border-aeroborder rounded p-3">
                  <span className="text-[10px] text-slate-400 block">TOTAL FUEL BURN</span>
                  <span className="text-xl font-bold text-white">{results.total_fuel_consumed_kg} kg</span>
                  <span className="text-[10px] text-slate-500 block mt-1">Avg BSFC: 284 g/kWh</span>
                </div>

                <div className="bg-aerocard border border-aeroborder rounded p-3">
                  <span className="text-[10px] text-slate-400 block">PEAK CHT TEMP</span>
                  <span className={`text-xl font-bold ${results.max_cht > 175 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {results.max_cht}°C
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-1">Thermal Risk: {results.thermal_risk}</span>
                </div>

                <div className="bg-aerocard border border-aeroborder rounded p-3">
                  <span className="text-[10px] text-slate-400 block">EXPECTED HEALTH</span>
                  <span className="text-xl font-bold text-sky-400">{results.expected_health}%</span>
                  <span className="text-[10px] text-amber-400 block mt-1">Degradation: -{results.expected_degradation_pct}%</span>
                </div>

                <div className="bg-aerocard border border-aeroborder rounded p-3">
                  <span className="text-[10px] text-slate-400 block">MISSION RISK</span>
                  <span className={`text-base font-bold ${
                    results.mission_risk === 'HIGH' || results.mission_risk === 'CRITICAL' ? 'text-red-400' :
                    results.mission_risk === 'MEDIUM' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {results.mission_risk}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-1">RUL Impact: {results.rul_impact_hours} hrs</span>
                </div>
              </div>

              {/* Engineering Recommendation Callout */}
              <div className={`p-3 rounded-lg border text-xs font-sans leading-relaxed ${
                results.mission_risk === 'HIGH' || results.mission_risk === 'CRITICAL'
                  ? 'bg-red-950/50 border-red-700 text-red-200'
                  : 'bg-aerocard border-aeroborder text-slate-200'
              }`}>
                <div className="font-bold font-mono text-[11px] uppercase mb-1 text-white flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-sky-400" />
                  <span>OPERATIONAL FLIGHT DISPATCH ASSESSMENT:</span>
                </div>
                {results.recommendation}
              </div>

              {/* Timeline Telemetry Progression Chart */}
              {results.timeline?.length > 0 && (
                <div className="bg-aerocard border border-aeroborder rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between border-b border-aeroborder pb-1">
                    <span className="text-xs font-bold text-slate-200">
                      MISSION TIMELINE PROGRESSION (TAKEOFF • CLIMB • LOITER • DESCENT)
                    </span>
                    <span className="text-[10px] text-slate-400">{results.timeline.length} Simulation Samples</span>
                  </div>

                  <div className="h-56 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={results.timeline}>
                        <CartesianGrid strokeDasharray="2 2" stroke="#1e293b" />
                        <XAxis dataKey="time_hours" stroke="#64748b" tick={{ fontSize: 9 }} unit=" hr" />
                        <YAxis stroke="#64748b" tick={{ fontSize: 9 }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '11px' }}
                        />
                        <Line type="monotone" dataKey="cht" name="CHT (°C)" stroke="#f59e0b" strokeWidth={1.5} dot={false} />
                        <Line type="monotone" dataKey="cumulative_fuel_kg" name="Cum Fuel (kg)" stroke="#0ea5e9" strokeWidth={1.5} dot={false} />
                        <Line type="monotone" dataKey="vibration" name="Vibration (mm/s)" stroke="#ef4444" strokeWidth={1.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-aerocard border border-aeroborder rounded-lg p-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center space-y-2">
              <PlaneTakeoff className="w-8 h-8 text-slate-600 mb-1" />
              <span className="font-semibold text-slate-400">No Simulation Executed Yet</span>
              <p className="max-w-sm text-slate-500 font-sans">
                Submit an NLP query above or adjust the flight parameters on the left and click "Run Flight Simulation".
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
