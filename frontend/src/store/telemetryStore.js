/**
 * AEROTWIN AI - Global Telemetry & Digital Twin State Store (Zustand)
 */

import { create } from 'zustand';
import { io } from 'socket.io-client';
import { soundFx } from '../utils/soundFx';

const SOCKET_SERVER_URL = import.meta.env.VITE_WS_URL || window.location.origin;

export const useTelemetryStore = create((set, get) => {
  let socket = null;

  return {
    // Connection state
    connected: false,
    selectedEngineId: 'eng_001',
    isPaused: false,

    // Engine Ignition & Power State ('RUNNING', 'STARTING', 'OFF')
    engineState: 'RUNNING',
    engineMaster: true,
    fuelPump: true,
    magnetos: 'BOTH',

    // Current real-time telemetry snapshot
    telemetry: {
      rpm: 4850,
      cht: 142.4,
      egt: 795.0,
      oil_pressure: 4.2,
      oil_temperature: 92.5,
      fuel_flow: 18.2,
      vibration: 2.15,
      battery_voltage: 28.1,
      alternator_output: 35.0,
      injection_timing: 22.0,
      throttle: 70.0,
      torque: 138.5,
      power: 78.5,
      altitude: 12000,
      ambient_temperature: 24.0,
      humidity: 50.0,
      engine_load: 70.0
    },

    // Rolling telemetry history buffer for charts
    history: [],

    // Diagnostics
    anomaly: {
      anomaly_score: 0.18,
      isolation_forest_score: 0.16,
      autoencoder_score: 0.19,
      classification: 'Normal',
      is_anomaly: false,
      threshold: 0.8
    },

    fault: {
      primary_fault: 'Healthy',
      probability: 0.94,
      severity: 'LOW',
      class_probabilities: {
        'Healthy': 0.94,
        'Misfire': 0.01,
        'Injector Abnormality': 0.01,
        'Lubrication Degradation': 0.01,
        'Sensor Drift': 0.01,
        'Sensor Failure': 0.0,
        'Combustion Instability': 0.01,
        'Overheating': 0.01,
        'Abnormal Vibration': 0.0,
        'Electrical System Degradation': 0.0
      }
    },

    health: {
      overall_health: 94.2,
      thermal_health: 92.5,
      combustion_health: 96.0,
      lubrication_health: 93.8,
      vibration_health: 95.1,
      electrical_health: 98.0,
      fuel_system_health: 94.7,
      degradation_index: 5.8,
      rul_hours: 182.0,
      rul_confidence: 89.5,
      rul_ci_lower: 162.0,
      rul_ci_upper: 202.0,
      failure_probability: 0.04
    },

    explanation: {
      primary_fault: 'Healthy',
      probability: 0.94,
      main_contributing_factors: [],
      subsystem_impacts: {},
      historical_trend: 'Stable within nominal envelope',
      narrative_summary: 'All powerplant parameters operating within certified MALE UAV nominal envelope.'
    },

    twinSync: {
      status: 'SYNCHRONIZED',
      sync_percentage: 99.4,
      latency_ms: 110,
      last_update_sec_ago: 0.5
    },

    // Master Digital Twin State (Single Source of Truth)
    twinState: null,
    missionReliability: null,

    sensorDiagnostics: {
      sensor_residuals: {},
      faulty_sensors: [],
      system_confidence: 97.5
    },

    activeFaults: {
      injector_degradation: 0.0,
      misfire_severity: 0.0,
      lubrication_degradation: 0.0,
      overheating: 0.0,
      vibration_fault: 0.0,
      sensor_drift: 0.0
    },

    flightParams: {
      throttle: 70.0,
      altitude: 12000.0,
      ambient_temp: 24.0
    },

    alerts: [],

    // Actions
    initSocket: () => {
      if (socket) return;
      socket = io(SOCKET_SERVER_URL, {
        reconnectionAttempts: 10,
        reconnectionDelay: 1000
      });

      socket.on('connect', () => {
        set({ connected: true });
        console.log('[Socket] Connected to telemetry gateway');
      });

      socket.on('disconnect', () => {
        set({ connected: false });
        console.log('[Socket] Disconnected from telemetry gateway');
      });

      socket.on('telemetry_stream', (frame) => {
        if (get().isPaused) return;

        const currentEngineState = get().engineState;

        let effectiveTelemetry = frame.telemetry;
        if (currentEngineState === 'OFF') {
          effectiveTelemetry = {
            ...frame.telemetry,
            rpm: 0,
            power: 0,
            torque: 0,
            oil_pressure: 0.1,
            fuel_flow: 0.0,
            vibration: 0.0,
            alternator_output: 0.0,
            battery_voltage: 24.4,
            engine_load: 0.0,
            cht: Math.max(24, ((get().telemetry?.cht || 142) - 0.4)),
            egt: Math.max(24, ((get().telemetry?.egt || 795) - 2.5))
          };
        } else if (currentEngineState === 'STARTING') {
          effectiveTelemetry = {
            ...frame.telemetry,
            rpm: 280,
            power: 2.1,
            torque: 18.0,
            oil_pressure: 0.8,
            fuel_flow: 2.2,
            vibration: 0.6,
            alternator_output: 0.0,
            battery_voltage: 22.8,
            engine_load: 10.0
          };
        }

        // Modulate real-time engine acoustics with physical RPM & vibration
        if (effectiveTelemetry && currentEngineState === 'RUNNING') {
          soundFx.updateEngineTelemetry(
            effectiveTelemetry.rpm,
            effectiveTelemetry.vibration,
            effectiveTelemetry.throttle
          );
        }

        set((state) => {
          const timestamp = new Date().toLocaleTimeString();
          const newHistoryPoint = {
            time: timestamp,
            rpm: effectiveTelemetry.rpm,
            cht: effectiveTelemetry.cht,
            egt: effectiveTelemetry.egt,
            oil_pressure: effectiveTelemetry.oil_pressure,
            oil_temperature: effectiveTelemetry.oil_temperature,
            fuel_flow: effectiveTelemetry.fuel_flow,
            vibration: effectiveTelemetry.vibration,
            anomaly_score: currentEngineState === 'OFF' ? 0.05 : (frame.anomaly?.anomaly_score || 0),
            overall_health: frame.health?.overall_health || 90
          };

          const updatedHistory = [...state.history, newHistoryPoint].slice(-40);

          return {
            telemetry: effectiveTelemetry,
            anomaly: currentEngineState === 'OFF' ? { ...state.anomaly, is_anomaly: false, classification: 'Engine Off' } : (frame.anomaly || state.anomaly),
            fault: currentEngineState === 'OFF' ? { ...state.fault, primary_fault: 'Engine Off' } : (frame.fault || state.fault),
            health: frame.health || state.health,
            explanation: currentEngineState === 'OFF' ? { ...state.explanation, narrative_summary: 'Powerplant is currently shutdown (Cold & Dark). All mechanical and hydraulic systems secured.' } : (frame.explanation || state.explanation),
            twinSync: frame.twin_sync || state.twinSync,
            twinState: frame.twin_state || state.twinState,
            missionReliability: frame.mission_reliability || state.missionReliability,
            sensorDiagnostics: frame.sensor_diagnostics || state.sensorDiagnostics,
            activeFaults: frame.faults_active || state.activeFaults,
            history: updatedHistory
          };
        });
      });

      socket.on('new_alert', (newAlert) => {
        set((state) => ({ alerts: [newAlert, ...state.alerts].slice(0, 30) }));
      });

      socket.on('faults_updated', (faults) => {
        set({ activeFaults: faults });
      });
    },

    injectFault: (faultUpdates) => {
      const merged = { ...get().activeFaults, ...faultUpdates };
      set({ activeFaults: merged });
      if (socket && socket.connected) {
        socket.emit('inject_fault', merged);
      }
    },

    clearAllFaults: () => {
      const cleared = {
        injector_degradation: 0.0,
        misfire_severity: 0.0,
        lubrication_degradation: 0.0,
        overheating: 0.0,
        vibration_fault: 0.0,
        sensor_drift: 0.0
      };
      set({ activeFaults: cleared });
      if (socket && socket.connected) {
        socket.emit('clear_faults');
      }
    },

    setFlightParams: (params) => {
      const merged = { ...get().flightParams, ...params };
      set({ flightParams: merged });
      if (socket && socket.connected) {
        socket.emit('set_flight_parameters', merged);
      }
    },

    togglePause: () => {
      set((state) => ({ isPaused: !state.isPaused }));
    },

    selectEngine: (engineId) => {
      set({ selectedEngineId: engineId });
      if (socket && socket.connected) {
        socket.emit('select_engine', engineId);
      }
    },

    // Engine Ignition & Starter Actions
    startEngine: () => {
      soundFx.playClick('toggle');
      soundFx.playStarterCrank();
      set({
        engineState: 'STARTING',
        engineMaster: true,
        fuelPump: true,
        magnetos: 'BOTH',
        telemetry: {
          ...get().telemetry,
          rpm: 280,
          power: 2.1,
          oil_pressure: 0.8,
          fuel_flow: 2.2,
          vibration: 0.6,
          battery_voltage: 22.8
        }
      });

      // After 2.0 seconds of cranking, engine catches combustion
      setTimeout(() => {
        if (get().engineState === 'STARTING') {
          soundFx.playEngineIgnition();
          soundFx.startEngineSound(1800, 1.2);
          set({
            engineState: 'RUNNING',
            telemetry: {
              ...get().telemetry,
              rpm: 1850,
              power: 18.5,
              torque: 65.0,
              oil_pressure: 3.8,
              fuel_flow: 6.8,
              vibration: 1.4,
              alternator_output: 28.0,
              battery_voltage: 28.1
            }
          });
        }
      }, 2000);
    },

    stopEngine: () => {
      soundFx.playClick('toggle');
      soundFx.playEngineShutdown();
      soundFx.stopEngineSound();
      set({
        engineState: 'OFF',
        engineMaster: false,
        telemetry: {
          ...get().telemetry,
          rpm: 0,
          power: 0,
          torque: 0,
          oil_pressure: 0.1,
          fuel_flow: 0.0,
          vibration: 0.0,
          alternator_output: 0.0,
          battery_voltage: 24.4,
          engine_load: 0.0
        }
      });
    },

    toggleEngine: () => {
      const current = get().engineState;
      if (current === 'RUNNING' || current === 'STARTING') {
        get().stopEngine();
      } else {
        get().startEngine();
      }
    },

    setFuelPump: (pump) => {
      soundFx.playClick('toggle');
      set({ fuelPump: pump });
    },

    setMagnetos: (mag) => {
      soundFx.playClick('toggle');
      set({ magnetos: mag });
      if (mag === 'OFF' && get().engineState === 'RUNNING') {
        get().stopEngine();
      }
    }
  };
});
