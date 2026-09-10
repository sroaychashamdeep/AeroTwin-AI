/**
 * AEROTWIN AI - FlightDynamicsBar Component
 * Top-mounted tactical flight controls, engine ignition start/stop, and kinematics HUD.
 * Supports Engine Start/Stop, Takeoff, Landing, Cruise, Ground Taxi, and Continuous Auto-Demo.
 */

import React from 'react';
import {
  Plane,
  RotateCw,
  Play,
  Pause,
  Compass,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Gauge,
  CircleDot,
  Power,
  Zap,
  Flame
} from 'lucide-react';
import { soundFx } from '../utils/soundFx';
import { useTelemetryStore } from '../store/telemetryStore';

export default function FlightDynamicsBar({
  flightMode = 'CRUISE',
  onSetFlightMode,
  flightTelemetry = {},
  compact = false
}) {
  const {
    engineState = 'RUNNING',
    startEngine,
    stopEngine,
    toggleEngine,
    telemetry
  } = useTelemetryStore();

  const {
    phase = 'CRUISE',
    phaseLabel = 'AIRBORNE CRUISE',
    altitudeM = 1200,
    airspeedKts = 142,
    pitchDeg = 0.5,
    gearState = 'RETRACTED'
  } = flightTelemetry;

  const currentRpm = Math.round(telemetry?.rpm !== undefined ? telemetry.rpm : 4850);
  const isEngineRunning = engineState === 'RUNNING';
  const isEngineStarting = engineState === 'STARTING';
  const isEngineOff = engineState === 'OFF';

  const handleModeChange = (newMode) => {
    soundFx.playClick('toggle');
    if (newMode === 'TAKEOFF') {
      soundFx.playTakeoffThrust();
    } else if (newMode === 'LAND') {
      soundFx.playGearActuator();
    }
    if (onSetFlightMode) {
      onSetFlightMode(newMode);
    }
  };

  // Phase badge color styling
  const getPhaseBadge = () => {
    if (isEngineOff) {
      return {
        bg: 'bg-slate-900 border-slate-700 text-slate-400',
        dot: 'bg-slate-500',
        icon: Power
      };
    }
    switch (phase) {
      case 'TAKEOFF_ROLL':
      case 'ROTATING':
      case 'CLIMB':
        return {
          bg: 'bg-amber-950/80 border-amber-600 text-amber-300',
          dot: 'bg-amber-400 animate-ping',
          icon: ArrowUpRight
        };
      case 'DESCENT':
      case 'FLARE':
        return {
          bg: 'bg-cyan-950/80 border-cyan-500 text-cyan-300',
          dot: 'bg-cyan-400 animate-pulse',
          icon: ArrowDownRight
        };
      case 'TOUCHDOWN':
        return {
          bg: 'bg-red-950/90 border-red-500 text-red-300',
          dot: 'bg-red-400 animate-ping',
          icon: CircleDot
        };
      case 'GROUND_HOLD':
      case 'ROLLOUT':
        return {
          bg: 'bg-slate-900 border-slate-700 text-slate-300',
          dot: 'bg-slate-400',
          icon: CircleDot
        };
      case 'CRUISE':
      default:
        return {
          bg: 'bg-emerald-950/80 border-emerald-600 text-emerald-300',
          dot: 'bg-emerald-400 animate-pulse',
          icon: Plane
        };
    }
  };

  const badge = getPhaseBadge();
  const PhaseIcon = badge.icon;

  return (
    <div className="bg-aerodark/95 backdrop-blur-md border border-aeroborder rounded-lg p-2.5 shadow-2xl flex flex-wrap items-center justify-between gap-2.5 z-20">
      {/* Left: Engine Master Ignition & Flight Mode Action Triggers */}
      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
        {/* ========================================================= */}
        {/* ENGINE MASTER START / STOP BUTTON (Highlighted in Cyan/Red) */}
        {/* ========================================================= */}
        <button
          onClick={toggleEngine}
          disabled={isEngineStarting}
          className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center space-x-1.5 shadow-md border ${
            isEngineRunning
              ? 'bg-red-950/90 hover:bg-red-900 border-red-600 text-red-200 shadow-red-950/60 ring-1 ring-red-500/50'
              : isEngineStarting
              ? 'bg-amber-950/90 border-amber-500 text-amber-300 animate-pulse'
              : 'bg-emerald-600 hover:bg-emerald-500 border-emerald-400 text-white shadow-emerald-950/60 ring-1 ring-emerald-400 animate-pulse'
          }`}
          title={
            isEngineRunning
              ? 'Cut Magnetos & Shutdown Engine (0 RPM)'
              : isEngineStarting
              ? 'Starter motor cranking engine...'
              : 'Engage Starter Motor & Ignite Rotax 914/915 Engine'
          }
        >
          <Power className={`w-3.5 h-3.5 ${isEngineRunning ? 'text-red-400' : (isEngineStarting ? 'text-amber-400 animate-spin' : 'text-white')}`} />
          <span>
            {isEngineRunning
              ? 'STOP ENGINE'
              : isEngineStarting
              ? 'CRANKING...'
              : 'START ENGINE'}
          </span>
        </button>

        {/* Engine RPM Pill */}
        <div
          className={`px-2 py-1 rounded border text-[10px] font-bold flex items-center space-x-1 ${
            isEngineRunning
              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
              : isEngineStarting
              ? 'bg-amber-950/60 border-amber-800 text-amber-300'
              : 'bg-slate-900 border-slate-700 text-slate-500'
          }`}
          title="Current Propeller/Engine Crankshaft RPM"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isEngineRunning ? 'bg-emerald-400 animate-pulse' : (isEngineStarting ? 'bg-amber-400 animate-ping' : 'bg-slate-600')
            }`}
          />
          <span>{currentRpm} RPM</span>
        </div>

        <div className="h-4 w-px bg-aeroborder hidden md:block mx-1" />

        {/* Flight Visual Controls */}
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline-block">
          FLIGHT:
        </span>

        {/* TAKEOFF Button */}
        <button
          onClick={() => handleModeChange('TAKEOFF')}
          disabled={isEngineOff}
          className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center space-x-1.5 shadow-sm ${
            isEngineOff
              ? 'opacity-40 cursor-not-allowed bg-aerocard border border-aeroborder text-slate-500'
              : flightMode === 'TAKEOFF'
              ? 'bg-amber-600 text-white ring-1 ring-amber-400 shadow-amber-900/50'
              : 'bg-aerocard border border-aeroborder text-slate-300 hover:text-white hover:border-amber-500/60'
          }`}
          title={isEngineOff ? 'Engine is off. Start engine first!' : 'Simulate UAV runway acceleration, liftoff rotation, and climb-out'}
        >
          <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
          <span>TAKEOFF</span>
        </button>

        {/* LAND Button */}
        <button
          onClick={() => handleModeChange('LAND')}
          className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center space-x-1.5 shadow-sm ${
            flightMode === 'LAND'
              ? 'bg-sky-600 text-white ring-1 ring-sky-400 shadow-sky-900/50'
              : 'bg-aerocard border border-aeroborder text-slate-300 hover:text-white hover:border-sky-500/60'
          }`}
          title="Simulate glide descent, flare, touchdown with tire smoke & rollout"
        >
          <ArrowDownRight className="w-3.5 h-3.5 text-sky-400" />
          <span>LAND</span>
        </button>

        {/* CRUISE Button */}
        <button
          onClick={() => handleModeChange('CRUISE')}
          className={`px-2.5 py-1.5 rounded text-xs font-bold transition flex items-center space-x-1 ${
            flightMode === 'CRUISE'
              ? 'bg-emerald-600 text-white ring-1 ring-emerald-400 shadow-emerald-900/50'
              : 'bg-aerocard border border-aeroborder text-slate-400 hover:text-white hover:border-emerald-500/60'
          }`}
          title="Return to steady airborne cruising state at altitude"
        >
          <Plane className="w-3.5 h-3.5" />
          <span>CRUISE</span>
        </button>

        {/* GROUND TAXI Button */}
        <button
          onClick={() => handleModeChange('GROUND')}
          className={`px-2.5 py-1.5 rounded text-xs font-bold transition flex items-center space-x-1 ${
            flightMode === 'GROUND'
              ? 'bg-slate-700 text-white ring-1 ring-slate-400'
              : 'bg-aerocard border border-aeroborder text-slate-400 hover:text-white'
          }`}
          title="Place aircraft on runway in ground taxi ready state"
        >
          <CircleDot className="w-3.5 h-3.5" />
          <span>GROUND</span>
        </button>

        {/* AUTO DEMO CYCLE Button */}
        <button
          onClick={() => handleModeChange('AUTO_CYCLE')}
          disabled={isEngineOff}
          className={`px-2.5 py-1.5 rounded text-xs font-bold transition flex items-center space-x-1 border ${
            isEngineOff
              ? 'opacity-40 cursor-not-allowed bg-aerocard border-aeroborder text-slate-500'
              : flightMode === 'AUTO_CYCLE'
              ? 'bg-purple-950/80 border-purple-500 text-purple-200 animate-pulse'
              : 'bg-aerocard border-aeroborder text-slate-400 hover:text-purple-300'
          }`}
          title={isEngineOff ? 'Engine is off. Start engine first!' : 'Continuous flight cycle loop: Takeoff -> Cruise -> Land -> Repeat'}
        >
          <RotateCw className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden sm:inline">AUTO CYCLE</span>
        </button>
      </div>

      {/* Right: Live Flight Dynamics Telemetry HUD */}
      <div className="flex items-center space-x-2 text-[11px]">
        {/* Active Phase Badge */}
        <div className={`px-2.5 py-1 rounded border flex items-center space-x-1.5 font-bold ${badge.bg}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
          <PhaseIcon className="w-3 h-3" />
          <span className="tracking-wide">{isEngineOff ? 'POWERPLANT SHUTDOWN' : phaseLabel}</span>
        </div>

        {/* Altitude AGL */}
        <div className="bg-aerocard border border-aeroborder px-2 py-1 rounded flex items-center space-x-1 text-slate-300">
          <span className="text-[9px] text-slate-500">ALT:</span>
          <span className="font-bold text-white">{Math.round(altitudeM)}</span>
          <span className="text-[9px] text-slate-400">m</span>
        </div>

        {/* Airspeed */}
        <div className="bg-aerocard border border-aeroborder px-2 py-1 rounded flex items-center space-x-1 text-slate-300 hidden md:flex">
          <span className="text-[9px] text-slate-500">SPD:</span>
          <span className="font-bold text-sky-400">{isEngineOff ? 0 : Math.round(airspeedKts)}</span>
          <span className="text-[9px] text-slate-400">KTAS</span>
        </div>

        {/* Pitch Attitude */}
        <div className="bg-aerocard border border-aeroborder px-2 py-1 rounded flex items-center space-x-1 text-slate-300 hidden lg:flex">
          <span className="text-[9px] text-slate-500">PITCH:</span>
          <span className={`font-bold ${pitchDeg > 2 ? 'text-amber-400' : (pitchDeg < -2 ? 'text-cyan-400' : 'text-slate-200')}`}>
            {pitchDeg > 0 ? `+${pitchDeg.toFixed(1)}°` : `${pitchDeg.toFixed(1)}°`}
          </span>
        </div>

        {/* Landing Gear Status */}
        <div className="bg-aerocard border border-aeroborder px-2 py-1 rounded flex items-center space-x-1 text-slate-300 hidden xl:flex">
          <span className="text-[9px] text-slate-500">GEAR:</span>
          <span className={`font-bold text-[10px] ${gearState === 'DOWN & LOCKED' ? 'text-emerald-400' : (gearState === 'RETRACTED' ? 'text-slate-400' : 'text-amber-400')}`}>
            {gearState}
          </span>
        </div>
      </div>
    </div>
  );
}
