/**
 * AEROTWIN AI - Tactical GPS Flight Map & Route Navigation Component
 * Shows real-time UAV mission route, waypoints, last known location coordinates,
 * and enables manual lateral flight steering (move plane left / right).
 */

import React, { useState, useEffect } from 'react';
import {
  Compass,
  Navigation,
  MapPin,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Radio,
  Crosshair,
  Shield,
  Layers,
  Clock,
  Eye,
  Plane,
  CornerUpRight,
  Activity
} from 'lucide-react';
import { useTelemetryStore } from '../store/telemetryStore';
import { soundFx } from '../utils/soundFx';

// Tactical Mission Waypoints across Chitradurga Aeronautical Test Range & Bay of Bengal ISR Corridor
const MISSION_WAYPOINTS = [
  { id: 'WP-01', name: 'ATR RUNWAY 09', x: 50, y: 250, lat: '14°12\'15"N', lon: '76°32\'10"E', alt: '640m', status: 'PASSED' },
  { id: 'WP-02', name: 'CLIMB WAYPOINT', x: 130, y: 220, lat: '14°15\'40"N', lon: '76°40\'22"E', alt: '1,800m', status: 'PASSED' },
  { id: 'WP-03', name: 'INGRESS POINT', x: 220, y: 190, lat: '14°20\'10"N', lon: '76°50\'45"E', alt: '3,658m', status: 'PASSED' },
  { id: 'WP-04', name: 'ORBIT ALPHA (ACTIVE)', x: 340, y: 170, lat: '14°25\'30"N', lon: '77°02\'15"E', alt: '3,658m', status: 'ACTIVE' },
  { id: 'WP-05', name: 'SECTOR CHARLIE', x: 440, y: 175, lat: '14°28\'55"N', lon: '77°15\'30"E', alt: '3,658m', status: 'PLANNED' },
  { id: 'WP-06', name: 'EGRESS CORRIDOR', x: 510, y: 215, lat: '14°22\'10"N', lon: '77°10\'05"E', alt: '2,400m', status: 'PLANNED' },
  { id: 'WP-07', name: 'TOUCHDOWN 27', x: 560, y: 255, lat: '14°12\'15"N', lon: '76°32\'10"E', alt: '640m', status: 'PLANNED' }
];

export default function TacticalGpsMap({ height = '370px', showControls = true }) {
  const {
    telemetry,
    manualSteerX = 0,
    manualHeadingOffset = 0,
    gpsData = {},
    steerLeft,
    steerRight,
    resetSteer,
    setManualSteerX,
    flightParams
  } = useTelemetryStore();

  const [mapMode, setMapMode] = useState('RADAR'); // 'RADAR', 'SATELLITE', 'WAYPOINTS'
  const [radarAngle, setRadarAngle] = useState(0);

  // Rotate tactical radar sweep beam continuously
  useEffect(() => {
    const interval = setInterval(() => {
      setRadarAngle((prev) => (prev + 3) % 360);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  // Compute live UAV coordinates based on baseline progress + manual lateral offset
  const baseUavX = 290;
  const baseUavY = 178;

  // Manual lateral shift (left / right in perpendicular axis)
  const lateralShiftPx = manualSteerX * 26; // moves left (-) or right (+)
  const currentUavX = baseUavX;
  const currentUavY = baseUavY + lateralShiftPx;

  // Flown route path (from WP-01 up to current UAV position)
  const flownPathD = `M 50,250 L 130,220 L 220,190 L ${currentUavX},${currentUavY}`;
  // Planned remaining route path (from current UAV position to remaining waypoints)
  const plannedPathD = `M ${currentUavX},${currentUavY} L 340,170 L 440,175 L 510,215 L 560,255`;

  const heading = Math.round((gpsData.headingDeg || 85) + manualHeadingOffset);
  const crossTrackMeters = Math.round(manualSteerX * 45);

  return (
    <div
      style={{ height }}
      className="bg-[#020617] border border-aeroborder rounded-lg relative overflow-hidden flex flex-col font-mono text-white select-none"
    >
      {/* ── Top Tactical Navigation Bar ──────────────────────────────────────── */}
      <div className="bg-slate-900/95 border-b border-aeroborder px-3 py-1.5 flex items-center justify-between z-20">
        <div className="flex items-center space-x-2 text-[10px]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-bold text-sky-400">TACTICAL GPS ROUTE MAP</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300 font-bold">SECTOR 4 (ATR)</span>
          <span className="text-slate-500 hidden sm:inline">|</span>
          <span className="text-slate-400 hidden sm:inline">18 SATS (HDOP: 0.72)</span>
        </div>

        {/* Map View Mode Switcher */}
        <div className="flex items-center space-x-1 bg-slate-950 p-0.5 rounded border border-aeroborder text-[10px]">
          <button
            onClick={() => { soundFx.playClick('toggle'); setMapMode('RADAR'); }}
            className={`px-2 py-0.5 rounded font-bold transition ${mapMode === 'RADAR' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            RADAR HUD
          </button>
          <button
            onClick={() => { soundFx.playClick('toggle'); setMapMode('SATELLITE'); }}
            className={`px-2 py-0.5 rounded font-bold transition ${mapMode === 'SATELLITE' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            HYBRID
          </button>
          <button
            onClick={() => { soundFx.playClick('toggle'); setMapMode('WAYPOINTS'); }}
            className={`px-2 py-0.5 rounded font-bold transition ${mapMode === 'WAYPOINTS' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            LEGS LOG
          </button>
        </div>
      </div>

      {/* ── Main Map Canvas / SVG Viewport ─────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center">
        {mapMode !== 'WAYPOINTS' ? (
          <div className="w-full h-full relative">
            <svg
              className="w-full h-full"
              viewBox="0 0 600 300"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                {/* Tactical grid pattern */}
                <pattern id="tacGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#0f2942" strokeWidth="0.8" />
                  <circle cx="0" cy="0" r="1" fill="#0284c7" opacity="0.4" />
                </pattern>

                {/* Radar Sweep Gradient */}
                <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                </radialGradient>

                {/* Linear gradient for Flown Route Glow */}
                <linearGradient id="routeGlow" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity="0.6" />
                  <stop offset="80%" stopColor="#38bdf8" stopOpacity="1" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="1" />
                </linearGradient>

                {/* Restricted Airspace Stripe Pattern */}
                <pattern id="restrictedPattern" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="0" y2="10" stroke="#ef4444" strokeWidth="1.5" opacity="0.2" />
                </pattern>
              </defs>

              {/* Background Grid */}
              <rect width="600" height="300" fill="#020617" />
              <rect width="600" height="300" fill="url(#tacGrid)" />

              {/* Satellite / Terrain Contours in HYBRID mode */}
              {mapMode === 'SATELLITE' && (
                <g opacity="0.4">
                  <path d="M 0,180 Q 150,140 300,190 T 600,160 L 600,300 L 0,300 Z" fill="#061a2b" />
                  <path d="M 0,220 Q 200,180 400,230 T 600,210 L 600,300 L 0,300 Z" fill="#08253d" />
                  <text x="50" y="270" fill="#0284c7" fontSize="9" opacity="0.5">CHITRADURGA ATR SECTOR 4</text>
                  <text x="440" y="270" fill="#0284c7" fontSize="9" opacity="0.5">BAY OF BENGAL CORRIDOR</text>
                </g>
              )}

              {/* Range Rings Centered on Operational Area */}
              <g opacity="0.35">
                <circle cx="280" cy="150" r="60" fill="none" stroke="#0ea5e9" strokeWidth="0.8" strokeDasharray="3 3" />
                <circle cx="280" cy="150" r="110" fill="none" stroke="#0ea5e9" strokeWidth="0.8" strokeDasharray="4 4" />
                <circle cx="280" cy="150" r="160" fill="none" stroke="#0ea5e9" strokeWidth="0.8" strokeDasharray="4 4" />
                <text x="345" y="146" fill="#38bdf8" fontSize="7" opacity="0.7">10 NM</text>
                <text x="395" y="146" fill="#38bdf8" fontSize="7" opacity="0.7">20 NM</text>
                <text x="445" y="146" fill="#38bdf8" fontSize="7" opacity="0.7">30 NM</text>
              </g>

              {/* Restricted Airspace Danger Zone */}
              <g>
                <polygon points="170,30 250,20 280,70 190,80" fill="url(#restrictedPattern)" stroke="#ef4444" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
                <text x="180" y="55" fill="#ef4444" fontSize="7" fontWeight="bold" opacity="0.8">R-4201 RESTRICTED</text>
              </g>

              {/* Rotating Radar Sweep Beam from UAV */}
              <g transform={`rotate(${radarAngle}, ${currentUavX}, ${currentUavY})`}>
                <line
                  x1={currentUavX}
                  y1={currentUavY}
                  x2={currentUavX + 130}
                  y2={currentUavY}
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  opacity="0.6"
                />
                <circle cx={currentUavX} cy={currentUavY} r="130" fill="url(#radarGlow)" />
              </g>

              {/* ── Flown Mission Flight Path (Solid Glowing Line) ── */}
              <path
                d={flownPathD}
                fill="none"
                stroke="url(#routeGlow)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Flown Breadcrumb Dots */}
              {[
                { x: 60, y: 220 },
                { x: 90, y: 192 },
                { x: 120, y: 165 },
                { x: 165, y: 142 },
                { x: 210, y: 120 },
                { x: 245, y: 117 }
              ].map((pt, i) => (
                <circle key={i} cx={pt.x} cy={pt.y} r="2" fill="#38bdf8" opacity="0.8" />
              ))}

              {/* ── Planned Remaining Flight Path (Dashed Emerald Line) ── */}
              <path
                d={plannedPathD}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.8"
              />

              {/* ── Waypoint Markers & Labels ── */}
              {MISSION_WAYPOINTS.map((wp, idx) => {
                const isPassed = wp.status === 'PASSED';
                const isActive = wp.status === 'ACTIVE';
                const wpColor = isActive ? '#38bdf8' : isPassed ? '#10b981' : '#64748b';

                return (
                  <g key={wp.id}>
                    {/* Outer target ring */}
                    <circle
                      cx={wp.x}
                      cy={wp.y}
                      r={isActive ? "7" : "5"}
                      fill="none"
                      stroke={wpColor}
                      strokeWidth="1.5"
                      strokeDasharray={isActive ? "2 2" : "none"}
                    />
                    {/* Center point */}
                    <circle cx={wp.x} cy={wp.y} r="2.5" fill={wpColor} />

                    {/* Active waypoint pulse */}
                    {isActive && (
                      <circle cx={wp.x} cy={wp.y} r="12" fill="none" stroke="#38bdf8" strokeWidth="1" opacity="0.5" className="animate-ping" />
                    )}

                    {/* Waypoint Label */}
                    <text
                      x={wp.x}
                      y={wp.y - 9}
                      textAnchor="middle"
                      fill={wpColor}
                      fontSize="8"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {wp.id}
                    </text>
                    <text
                      x={wp.x}
                      y={wp.y + 14}
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize="6.5"
                      fontFamily="monospace"
                    >
                      {wp.alt}
                    </text>
                  </g>
                );
              })}

              {/* ── Active UAV Aircraft Marker (Rotates with Heading & Shifts with Manual Steer) ── */}
              <g
                transform={`translate(${currentUavX}, ${currentUavY}) rotate(${heading - 90})`}
                className="transition-transform duration-200"
              >
                {/* Aircraft Silhouette SVG */}
                <g transform="scale(0.85)">
                  {/* Fuselage */}
                  <path d="M 0,-18 L 4,-8 L 4,8 L 1,18 L -1,18 L -4,8 L -4,-8 Z" fill="#ffffff" stroke="#38bdf8" strokeWidth="1.5" />
                  {/* Wings */}
                  <path d="M 0,-4 L 28,0 L 28,4 L 4,2 L -4,2 L -28,4 L -28,0 Z" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.2" />
                  {/* V-Tail */}
                  <path d="M 0,14 L 10,22 L 8,24 L 0,18 L -8,24 L -10,22 Z" fill="#0284c7" stroke="#38bdf8" strokeWidth="1" />
                  {/* Propeller Disk */}
                  <line x1="-8" y1="18" x2="8" y2="18" stroke="#38bdf8" strokeWidth="1.8" opacity="0.7" />
                </g>
              </g>

              {/* Target lock reticle around active UAV */}
              <g transform={`translate(${currentUavX}, ${currentUavY})`}>
                <circle cx="0" cy="0" r="16" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" opacity="0.75" />
                {/* Heading line pointer */}
                <line
                  x1="0"
                  y1="0"
                  x2={Math.cos(((heading - 90) * Math.PI) / 180) * 28}
                  y2={Math.sin(((heading - 90) * Math.PI) / 180) * 28}
                  stroke="#38bdf8"
                  strokeWidth="1.8"
                />
              </g>

              {/* Tactical Callout Box at UAV Position */}
              <g transform={`translate(${currentUavX + 18}, ${currentUavY - 24})`}>
                <rect x="0" y="0" width="112" height="26" rx="4" fill="rgba(2,6,23,0.88)" stroke="#0284c7" strokeWidth="0.8" />
                <text x="5" y="10" fill="#38bdf8" fontSize="7" fontWeight="bold">TAPAS MALE-201</text>
                <text x="5" y="20" fill="#10b981" fontSize="6.5">HDG {heading}° • 142 KTAS • FL120</text>
              </g>

              {/* Lateral Flight Corridor Offset Guide Lines (Shows left/right deviation) */}
              {Math.abs(manualSteerX) > 0.05 && (
                <g>
                  {/* Center nominal track line */}
                  <line x1={baseUavX - 40} y1={baseUavY} x2={baseUavX + 40} y2={baseUavY} stroke="#64748b" strokeWidth="1" strokeDasharray="2 2" opacity="0.5" />
                  {/* Cross-track error displacement vector */}
                  <line x1={currentUavX} y1={baseUavY} x2={currentUavX} y2={currentUavY} stroke="#f59e0b" strokeWidth="1.5" />
                  <text x={currentUavX - 10} y={baseUavY + (currentUavY - baseUavY) / 2} fill="#f59e0b" fontSize="7" fontWeight="bold">
                    {crossTrackMeters > 0 ? `+${crossTrackMeters}m` : `${crossTrackMeters}m`}
                  </text>
                </g>
              )}
            </svg>

            {/* In-Canvas Last Location Floating HUD Pill (Compact non-blocking glass pill) */}
            <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-md border border-aeroborder/80 px-2.5 py-1.5 rounded-lg text-[9.5px] space-y-0.5 z-10 shadow-lg max-w-[210px] pointer-events-none">
              <div className="flex items-center justify-between border-b border-aeroborder/60 pb-0.5">
                <span className="text-sky-400 font-bold flex items-center space-x-1 text-[9px]">
                  <MapPin className="w-2.5 h-2.5 text-red-400" />
                  <span>LAST KNOWN LOCATION:</span>
                </span>
                <span className="text-[8px] text-emerald-400 font-bold">3D GPS FIX</span>
              </div>
              <div className="text-white font-mono text-[10px] font-bold">
                {gpsData.lastLocation || '14°17\'03.3"N 76°34\'53.1"E'}
              </div>
              <div className="grid grid-cols-2 gap-x-2 text-[8.5px] text-slate-400">
                <div>ALT: <strong className="text-white">3,658 m</strong></div>
                <div>SPD: <strong className="text-white">142 KT</strong></div>
                <div>HDG: <strong className="text-sky-400">{heading}°</strong></div>
                <div>ETA: <strong className="text-emerald-400">7m 46s</strong></div>
              </div>
            </div>

            {/* In-Canvas Cross-Track Corridor Gauge */}
            <div className="absolute bottom-2 left-2 bg-slate-950/85 backdrop-blur-md border border-aeroborder px-2 py-1 rounded text-[9px] flex items-center space-x-1.5 text-slate-300 z-10">
              <span className="text-slate-400">CROSS-TRACK:</span>
              <span className={`font-bold ${Math.abs(manualSteerX) <= 0.05 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {Math.abs(crossTrackMeters) <= 2
                  ? 'ON CORRIDOR CENTER'
                  : `${Math.abs(crossTrackMeters)}m ${crossTrackMeters < 0 ? 'PORT (LEFT)' : 'STBD (RIGHT)'}`}
              </span>
            </div>
          </div>
        ) : (
          /* Waypoint Leg Navigation Table Mode */
          <div className="w-full h-full p-3 overflow-y-auto bg-slate-950 text-xs">
            <div className="font-bold text-sky-400 mb-2 flex items-center justify-between border-b border-aeroborder pb-1">
              <span>MISSION FLIGHT PLAN LEGS & WAYPOINTS NAVIGATION LOG</span>
              <span className="text-slate-400 text-[10px]">TOTAL ROUTE: 320 NM</span>
            </div>
            <table className="w-full text-left font-mono text-[10px]">
              <thead className="text-slate-400 border-b border-aeroborder">
                <tr>
                  <th className="py-1">WAYPOINT</th>
                  <th>NAME / FIX</th>
                  <th>LAT / LON</th>
                  <th>ALTITUDE</th>
                  <th>LEG DIST</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-aeroborder/50">
                {MISSION_WAYPOINTS.map((wp) => (
                  <tr key={wp.id} className={wp.status === 'ACTIVE' ? 'bg-sky-950/40 text-sky-300 font-bold' : 'text-slate-300'}>
                    <td className="py-1.5 flex items-center space-x-1">
                      {wp.status === 'ACTIVE' ? <Radio className="w-3 h-3 text-sky-400 animate-pulse" /> : <MapPin className="w-3 h-3 text-slate-500" />}
                      <span>{wp.id}</span>
                    </td>
                    <td>{wp.name}</td>
                    <td>{wp.lat} {wp.lon}</td>
                    <td>{wp.alt}</td>
                    <td>{wp.id === 'WP-01' ? '0 NM' : `${Math.round(28 + parseInt(wp.id.slice(-1)) * 14)} NM`}</td>
                    <td>
                      <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold ${
                        wp.status === 'ACTIVE'
                          ? 'bg-sky-950 text-sky-300 border border-sky-600 animate-pulse'
                          : wp.status === 'PASSED'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {wp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Bottom Interactive Manual Steering Control Bar ────────────────── */}
      {showControls && (
        <div className="bg-slate-900/95 border-t border-aeroborder px-3 py-2 flex flex-wrap items-center justify-between gap-2 z-20">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold text-sky-400 uppercase tracking-wider flex items-center space-x-1">
              <Navigation className="w-3.5 h-3.5" />
              <span>MANUAL FLIGHT STEER:</span>
            </span>

            {/* Steer Left Buttons */}
            <button
              onClick={steerLeft}
              className="px-2.5 py-1 rounded bg-aerocard hover:bg-sky-700 border border-aeroborder text-sky-300 hover:text-white font-bold text-[10px] transition flex items-center space-x-1 shadow-sm active:scale-95"
              title="Bank & Move Left (Press A or Left Arrow)"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>MOVE LEFT</span>
            </button>

            {/* Center / Level Button */}
            <button
              onClick={resetSteer}
              className={`px-2.5 py-1 rounded border font-bold text-[10px] transition active:scale-95 ${
                Math.abs(manualSteerX) <= 0.05
                  ? 'bg-emerald-950 border-emerald-600 text-emerald-300'
                  : 'bg-aerocard border-aeroborder text-slate-300 hover:text-white'
              }`}
              title="Level Wings & Return to Centerline (Press W or C key)"
            >
              LEVEL / CENTER
            </button>

            {/* Steer Right Buttons */}
            <button
              onClick={steerRight}
              className="px-2.5 py-1 rounded bg-aerocard hover:bg-sky-700 border border-aeroborder text-sky-300 hover:text-white font-bold text-[10px] transition flex items-center space-x-1 shadow-sm active:scale-95"
              title="Bank & Move Right (Press D or Right Arrow)"
            >
              <span>MOVE RIGHT</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Direct Slider */}
            <div className="hidden md:flex items-center space-x-1.5 bg-slate-950 px-2 py-0.5 rounded border border-aeroborder text-[9px] text-slate-400">
              <span>PORT</span>
              <input
                type="range"
                min="-1.5"
                max="1.5"
                step="0.1"
                value={manualSteerX}
                onChange={(e) => setManualSteerX(parseFloat(e.target.value))}
                className="w-20 accent-sky-500 cursor-pointer"
                title="Continuous Lateral Steering Trim Slider"
              />
              <span>STBD</span>
            </div>
          </div>

          {/* Keyboard Shortcut Hint */}
          <div className="text-[9px] text-slate-400 flex items-center space-x-2">
            <span>KEYBOARD:</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-sky-300 font-bold">A / ←</kbd>
            <span>Left</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-sky-300 font-bold">D / →</kbd>
            <span>Right</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-emerald-300 font-bold">W / C</kbd>
            <span>Level</span>
          </div>
        </div>
      )}
    </div>
  );
}
