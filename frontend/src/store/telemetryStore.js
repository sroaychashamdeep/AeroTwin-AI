/**
 * AEROTWIN AI - Global Telemetry & Digital Twin State Store (Zustand)
 */

import { create } from 'zustand';
import { io } from 'socket.io-client';
import { soundFx } from '../utils/soundFx';

const getSocketUrl = () => {
  // Explicit override via env (e.g. Render/Vercel deployment)
  if (import.meta.env.VITE_WS_URL) return import.meta.env.VITE_WS_URL;

  if (typeof window !== 'undefined') {
    const { hostname } = window.location;

    // Render.com cloud deployment → dedicated backend service
    if (hostname.includes('onrender.com') && !hostname.includes('backend')) {
      return 'https://aerotwin-backend.onrender.com';
    }

    // ✅ LOCAL + NETWORK IP: Use empty string '' so Socket.IO connects to
    // the *same* origin (Vite dev server on :3000), and Vite's WebSocket
    // proxy forwards /socket.io/* → http://127.0.0.1:5000.
    // This works for both:
    //   - http://localhost:3000  (direct localhost)
    //   - http://192.168.x.x:3000  (LAN / network IP access)
    return '';
  }

  return 'http://localhost:5000';
};

const SOCKET_SERVER_URL = getSocketUrl();

export function computeFaultDiagnostics(faults = {}, baseTelemetry = {}) {
  const f = {
    injector_degradation: Number(faults.injector_degradation) || 0,
    misfire_severity: Number(faults.misfire_severity) || 0,
    lubrication_degradation: Number(faults.lubrication_degradation) || 0,
    overheating: Number(faults.overheating) || 0,
    vibration_fault: Number(faults.vibration_fault) || 0,
    sensor_drift: Number(faults.sensor_drift) || 0
  };

  const maxVal = Math.max(
    f.overheating,
    f.injector_degradation,
    f.misfire_severity,
    f.lubrication_degradation,
    f.vibration_fault,
    f.sensor_drift
  );

  if (maxVal <= 0.1) {
    return {
      isFaulted: false,
      primary_fault: 'Healthy',
      severity: 'LOW',
      probability: 0.95,
      is_anomaly: false,
      anomaly_score: 0.18,
      overall_health: 94.2,
      thermal_health: 92.5,
      combustion_health: 96.0,
      lubrication_health: 93.8,
      vibration_health: 95.1,
      alerts: [],
      explanation: {
        primary_fault: 'Healthy',
        probability: 0.95,
        narrative_summary: 'All powerplant parameters operating within certified MALE UAV nominal envelope.'
      },
      telemetryDeltas: { rpm: 0, cht: 0, egt: 0, oil_pressure: 0, oil_temperature: 0, fuel_flow: 0, vibration: 0 }
    };
  }

  // Determine dominant fault
  let primary_fault = 'Unknown Anomaly';
  let severity = maxVal > 0.6 ? 'CRITICAL' : 'WARNING';
  let narrative = '';
  let component = 'ENGINE';
  let recommendation = '';
  const alerts = [];

  let chtDelta = 0;
  let egtDelta = 0;
  let rpmDelta = 0;
  let oilPDelta = 0;
  let oilTDelta = 0;
  let ffDelta = 0;
  let vibDelta = 0;

  if (f.overheating >= maxVal - 0.01) {
    primary_fault = 'Overheating';
    severity = f.overheating > 0.6 ? 'CRITICAL' : 'WARNING';
    chtDelta = f.overheating * 58;
    egtDelta = f.overheating * 68;
    component = 'CYLINDERS';
    narrative = `Cylinder head temperature soak detected (${(142.4 + chtDelta).toFixed(1)}°C vs 160°C threshold). Severe thermal stress on exhaust valves and piston crowns.`;
    recommendation = 'Reduce throttle to 60%, enrich fuel mixture, initiate cooling descent.';
    alerts.push({
      id: `ALT-HOT-${Date.now() % 10000}`,
      severity,
      title: '🚨 CRITICAL: CYLINDER THERMAL OVERHEATING',
      message: `CHT elevated to ${(142.4 + chtDelta).toFixed(1)}°C. Coolant airflow compromised. Immediate valve seizure hazard.`,
      component: 'CYLINDERS',
      recommendation
    });
  } else if (f.injector_degradation >= maxVal - 0.01) {
    primary_fault = 'Injector Abnormality';
    severity = f.injector_degradation > 0.6 ? 'HIGH' : 'WARNING';
    ffDelta = f.injector_degradation * 13.8;
    egtDelta = f.injector_degradation * 44;
    chtDelta = f.injector_degradation * 18;
    vibDelta = f.injector_degradation * 1.6;
    component = 'FUEL_SYSTEM';
    narrative = `Fuel flow surge (${(18.2 + ffDelta).toFixed(1)} L/h) detected on Cylinder 3 rail. Electro-injector nozzle clogging with localized mixture divergence.`;
    recommendation = 'Switch to auxiliary fuel pump, adjust mixture trim, inspect injector #3.';
    alerts.push({
      id: `ALT-INJ-${Date.now() % 10000}`,
      severity,
      title: '⚠️ MASTER CAUTION: INJECTOR DEGRADATION DETECTED',
      message: `Fuel flow surged to ${(18.2 + ffDelta).toFixed(1)} L/h (+${Math.round(f.injector_degradation * 65)}%). Mixture divergence on Cylinder 3.`,
      component: 'FUEL_SYSTEM',
      recommendation
    });
  } else if (f.misfire_severity >= maxVal - 0.01) {
    primary_fault = 'Misfire';
    severity = f.misfire_severity > 0.6 ? 'HIGH' : 'WARNING';
    rpmDelta = -f.misfire_severity * 480;
    vibDelta = f.misfire_severity * 4.2;
    egtDelta = -f.misfire_severity * 60;
    component = 'SPARK_PLUGS';
    narrative = `Loss of primary spark on Cylinder 2. Power loss ~${Math.round(f.misfire_severity * 28)}%, high harmonic torque pulsation and airframe vibration.`;
    recommendation = 'Verify dual magneto ignition channels, monitor cylinder 2 EGT.';
    alerts.push({
      id: `ALT-MIS-${Date.now() % 10000}`,
      severity,
      title: '⚠️ ENGINE MISFIRE ALERT: CYLINDER 2',
      message: `Intermittent combustion drop on Cylinder 2. Vibration elevated to ${(2.15 + vibDelta).toFixed(2)} mm/s.`,
      component: 'SPARK_PLUGS',
      recommendation
    });
  } else if (f.lubrication_degradation >= maxVal - 0.01) {
    primary_fault = 'Lubrication Degradation';
    severity = 'CRITICAL';
    oilPDelta = -f.lubrication_degradation * 2.6;
    oilTDelta = f.lubrication_degradation * 24;
    component = 'OIL_SYSTEM';
    narrative = `Oil pressure collapse (${Math.max(1.1, 4.2 + oilPDelta).toFixed(2)} bar) and oil temperature rise. Journal bearing hydrodynamic film failure imminent.`;
    recommendation = 'Emergency throttle reduction, prepare for nearest alternate airfield landing.';
    alerts.push({
      id: `ALT-LUB-${Date.now() % 10000}`,
      severity: 'CRITICAL',
      title: '🚨 MASTER WARNING: OIL PRESSURE COLLAPSE',
      message: `Oil pressure dropped to ${Math.max(1.1, 4.2 + oilPDelta).toFixed(2)} bar (Critical min 2.5 bar). Crankshaft bearing seizure hazard.`,
      component: 'OIL_SYSTEM',
      recommendation
    });
  } else if (f.vibration_fault >= maxVal - 0.01) {
    primary_fault = 'Abnormal Vibration';
    severity = f.vibration_fault > 0.6 ? 'HIGH' : 'WARNING';
    vibDelta = f.vibration_fault * 6.2;
    component = 'CRANKSHAFT';
    narrative = `Propeller drive shaft and reduction gearbox 1X mechanical unbalance. Vibration level ${(2.15 + vibDelta).toFixed(2)} mm/s exceeding certified limits.`;
    recommendation = 'Inspect propeller pitch tracking, check engine chromoly mount bolts.';
    alerts.push({
      id: `ALT-VIB-${Date.now() % 10000}`,
      severity,
      title: '⚠️ EXCESSIVE AIRFRAME VIBRATION',
      message: `Rotational vibration spike to ${(2.15 + vibDelta).toFixed(2)} mm/s RMS (Limit: 4.5 mm/s). Mechanical unbalance.`,
      component: 'CRANKSHAFT',
      recommendation
    });
  } else if (f.sensor_drift >= maxVal - 0.01) {
    primary_fault = 'Sensor Drift';
    severity = 'MODERATE';
    chtDelta = -f.sensor_drift * 55;
    component = 'SENSORS';
    narrative = `Thermocouple CHT sensor drifting -55°C below thermodynamic expectations. Kalman residual anomaly detected.`;
    recommendation = 'Cross-check redundant CHT probe channels, perform avionics zero-calibration.';
    alerts.push({
      id: `ALT-SENS-${Date.now() % 10000}`,
      severity: 'WARNING',
      title: '⚠️ SENSOR CALIBRATION DRIFT',
      message: 'Thermocouple reading divergent from Kalman state estimator by >45°C.',
      component: 'SENSORS',
      recommendation
    });
  }

  const overallHealth = Math.max(20, Math.round(94.2 - maxVal * 55));

  return {
    isFaulted: true,
    primary_fault,
    severity,
    probability: Number((0.72 + maxVal * 0.25).toFixed(2)),
    is_anomaly: true,
    anomaly_score: Number((0.65 + maxVal * 0.32).toFixed(2)),
    overall_health: overallHealth,
    thermal_health: f.overheating > 0.2 ? Math.max(15, Math.round(92.5 - f.overheating * 75)) : 92.5,
    combustion_health: f.misfire_severity > 0.2 || f.injector_degradation > 0.2 ? Math.max(20, Math.round(96 - (f.misfire_severity + f.injector_degradation) * 50)) : 96,
    lubrication_health: f.lubrication_degradation > 0.2 ? Math.max(15, Math.round(93.8 - f.lubrication_degradation * 75)) : 93.8,
    vibration_health: f.vibration_fault > 0.2 ? Math.max(15, Math.round(95.1 - f.vibration_fault * 75)) : 95.1,
    alerts,
    explanation: {
      primary_fault,
      probability: Number((0.72 + maxVal * 0.25).toFixed(2)),
      narrative_summary: narrative
    },
    telemetryDeltas: {
      rpm: Math.round(rpmDelta),
      cht: Number(chtDelta.toFixed(1)),
      egt: Number(egtDelta.toFixed(1)),
      oil_pressure: Number(oilPDelta.toFixed(2)),
      oil_temperature: Number(oilTDelta.toFixed(1)),
      fuel_flow: Number(ffDelta.toFixed(1)),
      vibration: Number(vibDelta.toFixed(2))
    }
  };
}

export const useTelemetryStore = create((set, get) => {
  let socket = null;
  let fallbackTimer = null;

  return {
    // Connection state
    connected: false,
    selectedEngineId: 'eng_001',
    isPaused: false,

    // Command Center Operational View Mode ('OPERATOR', 'ENGINEER', 'MAINTENANCE', 'COPILOT')
    operationalMode: 'OPERATOR',
    setOperationalMode: (mode) => set({ operationalMode: mode }),

    // Universal Action Modals
    whyModal: { isOpen: false, metric: 'HEALTH', title: 'Why is Health at 87%?', data: null },
    whatIfModal: { isOpen: false, inputs: { throttle: 70, altitude: 12000, ambientTemp: 24, faults: {} }, results: null },
    whatChangedModal: { isOpen: false },
    whatShouldIDoModal: { isOpen: false },
    canICompleteMissionModal: { isOpen: false },

    openWhyModal: (metric, title, data) => set({ whyModal: { isOpen: true, metric, title, data } }),
    closeWhyModal: () => set((s) => ({ whyModal: { ...s.whyModal, isOpen: false } })),
    openWhatIfModal: (params = {}) => set((s) => ({ whatIfModal: { ...s.whatIfModal, isOpen: true, ...params } })),
    closeWhatIfModal: () => set((s) => ({ whatIfModal: { ...s.whatIfModal, isOpen: false } })),
    openWhatChangedModal: () => set({ whatChangedModal: { isOpen: true } }),
    closeWhatChangedModal: () => set({ whatChangedModal: { isOpen: false } }),
    openWhatShouldIDoModal: () => set({ whatShouldIDoModal: { isOpen: true } }),
    closeWhatShouldIDoModal: () => set({ whatShouldIDoModal: { isOpen: false } }),
    openCanICompleteMissionModal: () => set({ canICompleteMissionModal: { isOpen: true } }),
    closeCanICompleteMissionModal: () => set({ canICompleteMissionModal: { isOpen: false } }),

    // Central Unified EngineIntelligenceState
    intelligenceState: null,

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

    // Manual Lateral Flight Controls & Tactical GPS Navigation
    manualSteerX: 0.0, // -1.5 (left) to +1.5 (right)
    manualHeadingOffset: 0.0, // degrees deviation
    gpsData: {
      latitude: 14.28426,
      longitude: 76.58142,
      lastLocation: '14°17\'03.3"N 76°34\'53.1"E',
      sector: 'Chitradurga ATR Sector 4',
      altitudeMsl: 3658,
      groundSpeedKts: 142,
      headingDeg: 85,
      routeProgressPct: 62.4,
      crossTrackErrorM: 0,
      activeWaypoint: 'WP-04 [SURVEILLANCE ORBIT]',
      nextWaypointDistNm: 18.4,
      etaSec: 466,
      satellites: 18,
      hdop: 0.72,
      gpsFix: '3D DIFFERENTIAL'
    },

    flightParams: {
      throttle: 70.0,
      altitude: 12000.0,
      ambient_temp: 24.0
    },

    alerts: [],

    // Actions
    initSocket: () => {
      // Continuous telemetry ticker fallback: guarantees gauges and charts are never frozen
      const runFallbackTick = () => {
        if (get().connected || get().isPaused) return;
        const currentEngineState = get().engineState;
        const base = get().telemetry || {};

        let rpm = 4850 + (Math.sin(Date.now() / 1000) * 16) + (Math.random() * 10 - 5);
        let cht = 142.4 + (Math.sin(Date.now() / 3200) * 0.4);
        let egt = 795.0 + (Math.cos(Date.now() / 2500) * 2.8);
        let oil_pressure = 4.2 + (Math.sin(Date.now() / 2100) * 0.05);
        let oil_temp = 92.5 + (Math.cos(Date.now() / 4200) * 0.3);
        let fuel_flow = 18.2 + (Math.sin(Date.now() / 1600) * 0.18);
        let vib = 2.15 + (Math.sin(Date.now() / 750) * 0.08);
        let bus = 28.1 + (Math.random() * 0.1 - 0.05);

        const activeFaults = get().activeFaults || {};
        const diag = computeFaultDiagnostics(activeFaults, base);

        rpm += diag.telemetryDeltas.rpm;
        cht += diag.telemetryDeltas.cht;
        egt += diag.telemetryDeltas.egt;
        oil_pressure = Math.max(0.8, oil_pressure + diag.telemetryDeltas.oil_pressure);
        oil_temp += diag.telemetryDeltas.oil_temperature;
        fuel_flow += diag.telemetryDeltas.fuel_flow;
        vib += diag.telemetryDeltas.vibration;

        if (currentEngineState === 'OFF') {
          rpm = 0;
          cht = Math.max(24, ((base.cht || 142) - 0.3));
          egt = Math.max(24, ((base.egt || 795) - 2.0));
          oil_pressure = 0.1;
          fuel_flow = 0.0;
          vib = 0.0;
        } else if (currentEngineState === 'STARTING') {
          rpm = 280 + (Math.random() * 20 - 10);
          oil_pressure = 0.8;
          fuel_flow = 2.2;
          vib = 0.6;
        }

        const simulatedTelemetry = {
          ...base,
          rpm: Math.round(rpm * 10) / 10,
          cht: Math.round(cht * 10) / 10,
          egt: Math.round(egt * 10) / 10,
          oil_pressure: Math.round(oil_pressure * 100) / 100,
          oil_temperature: Math.round(oil_temp * 10) / 10,
          fuel_flow: Math.round(fuel_flow * 10) / 10,
          vibration: Math.round(vib * 100) / 100,
          battery_voltage: Math.round(bus * 10) / 10,
          timestamp: new Date().toISOString()
        };

        const timestamp = new Date().toLocaleTimeString();
        const newHistoryPoint = {
          time: timestamp,
          rpm: simulatedTelemetry.rpm,
          cht: simulatedTelemetry.cht,
          egt: simulatedTelemetry.egt,
          oil_pressure: simulatedTelemetry.oil_pressure,
          oil_temperature: simulatedTelemetry.oil_temperature,
          fuel_flow: simulatedTelemetry.fuel_flow,
          vibration: simulatedTelemetry.vibration,
          anomaly_score: currentEngineState === 'OFF' ? 0.05 : (diag.isFaulted ? diag.anomaly_score : 0.18),
          overall_health: diag.isFaulted ? diag.overall_health : 94.2
        };

        set((state) => ({
          telemetry: simulatedTelemetry,
          fault: diag.isFaulted ? {
            ...state.fault,
            primary_fault: diag.primary_fault,
            severity: diag.severity,
            probability: diag.probability
          } : state.fault,
          anomaly: diag.isFaulted ? {
            ...state.anomaly,
            is_anomaly: true,
            anomaly_score: diag.anomaly_score
          } : state.anomaly,
          health: diag.isFaulted ? {
            ...state.health,
            overall_health: diag.overall_health
          } : state.health,
          history: [...state.history, newHistoryPoint].slice(-40)
        }));
      };

      if (!fallbackTimer) {
        fallbackTimer = setInterval(runFallbackTick, 1000);
      }

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
            twinState: frame.twin_state || frame.intelligence_state || state.twinState,
            intelligenceState: frame.intelligence_state || frame.twin_state || state.intelligenceState,
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
      const diag = computeFaultDiagnostics(merged, get().telemetry);
      
      const currentTelem = get().telemetry || {};
      const updatedTelem = {
        ...currentTelem,
        rpm: Math.max(0, Math.round(4850 + diag.telemetryDeltas.rpm)),
        cht: Number((142.4 + diag.telemetryDeltas.cht).toFixed(1)),
        egt: Number((795.0 + diag.telemetryDeltas.egt).toFixed(1)),
        oil_pressure: Math.max(0.8, Number((4.2 + diag.telemetryDeltas.oil_pressure).toFixed(2))),
        oil_temperature: Number((92.5 + diag.telemetryDeltas.oil_temperature).toFixed(1)),
        fuel_flow: Number((18.2 + diag.telemetryDeltas.fuel_flow).toFixed(1)),
        vibration: Number((2.15 + diag.telemetryDeltas.vibration).toFixed(2))
      };

      set((state) => ({
        activeFaults: merged,
        telemetry: updatedTelem,
        fault: {
          ...state.fault,
          primary_fault: diag.primary_fault,
          severity: diag.severity,
          probability: diag.probability,
          class_probabilities: {
            ...state.fault.class_probabilities,
            [diag.primary_fault]: diag.probability,
            Healthy: diag.isFaulted ? 0.05 : 0.95
          }
        },
        anomaly: {
          ...state.anomaly,
          is_anomaly: diag.is_anomaly,
          anomaly_score: diag.anomaly_score,
          classification: diag.primary_fault
        },
        health: {
          ...state.health,
          overall_health: diag.overall_health,
          thermal_health: diag.thermal_health,
          combustion_health: diag.combustion_health,
          lubrication_health: diag.lubrication_health,
          vibration_health: diag.vibration_health,
          degradation_index: Math.round((100 - diag.overall_health) * 10) / 10
        },
        explanation: diag.explanation,
        alerts: diag.alerts.length > 0 ? [...diag.alerts, ...state.alerts.filter(a => !a.id.startsWith('ALT-'))].slice(0, 30) : state.alerts
      }));

      if (diag.isFaulted) {
        soundFx.playWarningChime();
      }

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
      const diag = computeFaultDiagnostics(cleared, get().telemetry);
      const restoredTelem = {
        ...get().telemetry,
        rpm: 4850,
        cht: 142.4,
        egt: 795.0,
        oil_pressure: 4.2,
        oil_temperature: 92.5,
        fuel_flow: 18.2,
        vibration: 2.15
      };
      set((state) => ({
        activeFaults: cleared,
        telemetry: restoredTelem,
        fault: {
          ...state.fault,
          primary_fault: 'Healthy',
          severity: 'LOW',
          probability: 0.95
        },
        anomaly: {
          ...state.anomaly,
          is_anomaly: false,
          anomaly_score: 0.18,
          classification: 'Normal'
        },
        health: {
          ...state.health,
          overall_health: 94.2,
          thermal_health: 92.5,
          combustion_health: 96.0,
          lubrication_health: 93.8,
          vibration_health: 95.1,
          degradation_index: 5.8
        },
        explanation: diag.explanation,
        alerts: []
      }));
      soundFx.playSuccess();
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
    },

    // Manual Flight Steering Actions (Move Left / Right)
    steerLeft: () => {
      soundFx.playClick('high');
      set((state) => {
        const newX = Math.max(-1.5, Number((state.manualSteerX - 0.3).toFixed(2)));
        const newHdgOffset = Number((state.manualHeadingOffset - 3.0).toFixed(1));
        const newLon = Number((76.58142 + newX * 0.0035).toFixed(5));
        return {
          manualSteerX: newX,
          manualHeadingOffset: newHdgOffset,
          gpsData: {
            ...state.gpsData,
            longitude: newLon,
            headingDeg: Math.round(85 + newHdgOffset),
            crossTrackErrorM: Math.round(newX * 45),
            lastLocation: `14°17'03.3"N 76°${(34.8 + newX * 0.4).toFixed(1)}'E`
          }
        };
      });
    },

    steerRight: () => {
      soundFx.playClick('high');
      set((state) => {
        const newX = Math.min(1.5, Number((state.manualSteerX + 0.3).toFixed(2)));
        const newHdgOffset = Number((state.manualHeadingOffset + 3.0).toFixed(1));
        const newLon = Number((76.58142 + newX * 0.0035).toFixed(5));
        return {
          manualSteerX: newX,
          manualHeadingOffset: newHdgOffset,
          gpsData: {
            ...state.gpsData,
            longitude: newLon,
            headingDeg: Math.round(85 + newHdgOffset),
            crossTrackErrorM: Math.round(newX * 45),
            lastLocation: `14°17'03.3"N 76°${(34.8 + newX * 0.4).toFixed(1)}'E`
          }
        };
      });
    },

    resetSteer: () => {
      soundFx.playClick('toggle');
      set((state) => ({
        manualSteerX: 0.0,
        manualHeadingOffset: 0.0,
        gpsData: {
          ...state.gpsData,
          longitude: 76.58142,
          headingDeg: 85,
          crossTrackErrorM: 0,
          lastLocation: '14°17\'03.3"N 76°34\'53.1"E'
        }
      }));
    },

    setManualSteerX: (val) => {
      const clamped = Math.max(-1.5, Math.min(1.5, Number(val)));
      set((state) => ({
        manualSteerX: clamped,
        manualHeadingOffset: Number((clamped * 10.0).toFixed(1)),
        gpsData: {
          ...state.gpsData,
          longitude: Number((76.58142 + clamped * 0.0035).toFixed(5)),
          headingDeg: Math.round(85 + clamped * 10.0),
          crossTrackErrorM: Math.round(clamped * 45),
          lastLocation: `14°17'03.3"N 76°${(34.8 + clamped * 0.4).toFixed(1)}'E`
        }
      }));
    }
  };
});
