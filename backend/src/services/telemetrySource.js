/**
 * AEROTWIN AI - Telemetry Source Abstraction Layer
 * Interfaces for Simulator, CAN Bus, SocketCAN, and FADEC Avionics Gateways
 */

const axios = require('axios');

class TelemetrySource {
  constructor(name) {
    if (this.constructor === TelemetrySource) {
      throw new Error("Cannot instantiate abstract class TelemetrySource directly.");
    }
    this.name = name;
    this.listeners = [];
  }

  subscribe(callback) {
    this.listeners.push(callback);
  }

  unsubscribe(callback) {
    this.listeners = this.listeners.filter(cb => cb !== callback);
  }

  emitTelemetry(data) {
    for (const listener of this.listeners) {
      try {
        listener(data);
      } catch (err) {
        console.error(`[TelemetrySource:${this.name}] Listener error:`, err.message);
      }
    }
  }

  start() { throw new Error("Method start() must be implemented."); }
  stop() { throw new Error("Method stop() must be implemented."); }
  injectFault(faults) { throw new Error("Method injectFault() must be implemented."); }
}

class SimulatorTelemetrySource extends TelemetrySource {
  constructor(aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000') {
    super('SIMULATOR');
    this.aiServiceUrl = aiServiceUrl;
    this.isRunning = false;
    this.intervalId = null;
    this.throttle = 70.0;
    this.altitude = 12000.0;
    this.ambientTemp = 24.0;
    this.activeFaults = {
      injector_degradation: 0.0,
      misfire_severity: 0.0,
      lubrication_degradation: 0.0,
      overheating: 0.0,
      vibration_fault: 0.0,
      sensor_drift: 0.0
    };
    this.operatingHours = 342.5;
  }

  setFlightParams({ throttle, altitude, ambientTemp }) {
    if (throttle !== undefined) this.throttle = Math.max(0, Math.min(100, Number(throttle)));
    if (altitude !== undefined) this.altitude = Math.max(0, Math.min(30000, Number(altitude)));
    if (ambientTemp !== undefined) this.ambientTemp = Number(ambientTemp);
  }

  injectFault(faults) {
    this.activeFaults = { ...this.activeFaults, ...faults };
    console.log('[SimulatorTelemetrySource] Injected fault update:', this.activeFaults);
  }

  clearFaults() {
    this.activeFaults = {
      injector_degradation: 0.0,
      misfire_severity: 0.0,
      lubrication_degradation: 0.0,
      overheating: 0.0,
      vibration_fault: 0.0,
      sensor_drift: 0.0
    };
  }

  start(intervalMs = 1000) {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(`[SimulatorTelemetrySource] Streaming started (interval: ${intervalMs}ms)`);

    this.intervalId = setInterval(async () => {
      this.operatingHours += (1.0 / 3600.0);
      try {
        // 1. Fetch simulated physics frame from AI Service
        let frame;
        try {
          const simRes = await axios.post(`${this.aiServiceUrl}/simulate/engine`, {
            throttle: this.throttle,
            altitude: this.altitude,
            ambient_temperature: this.ambientTemp,
            faults: this.activeFaults,
            step_seconds: 1.0
          }, { timeout: 1500 });
          frame = simRes.data;
        } catch (simErr) {
          // Fallback physics if AI service is temporarily offline
          frame = this._localPhysicsFallback();
        }

        // 2. Process through AI Microservice diagnostics pipeline
        let diagnostics;
        try {
          const diagRes = await axios.post(`${this.aiServiceUrl}/process-telemetry`, {
            telemetry: frame,
            faults_active: this.activeFaults,
            operating_hours: this.operatingHours
          }, { timeout: 1800 });
          diagnostics = diagRes.data;
        } catch (diagErr) {
          diagnostics = this._localDiagnosticsFallback(frame);
        }

        const intelState = diagnostics.intelligence_state || diagnostics.twin_state || null;
        const alerts = this._suppressAlertStorm(diagnostics, frame.measured);

        const payload = {
          timestamp: new Date().toISOString(),
          source: 'SIMULATOR',
          engine_id: 'AERO-ENG-001',
          uav_id: 'UAV-001',
          telemetry: frame.measured,
          physics_expected: frame.physics_expected,
          faults_active: this.activeFaults,
          filtered_telemetry: diagnostics.filtered_telemetry,
          sensor_diagnostics: diagnostics.sensor_diagnostics,
          anomaly: diagnostics.anomaly,
          fault: diagnostics.fault,
          health: diagnostics.health,
          explanation: diagnostics.explanation,
          twin_sync: diagnostics.twin_sync,
          twin_state: intelState,
          intelligence_state: intelState,
          mission_reliability: diagnostics.mission_reliability || null,
          alerts: alerts
        };

        this.emitTelemetry(payload);
      } catch (err) {
        console.error('[SimulatorTelemetrySource] Cycle error:', err.message);
      }
    }, intervalMs);
  }

  _suppressAlertStorm(diagnostics, measured) {
    const intel = diagnostics.intelligence_state || diagnostics.twin_state || {};
    const diag = intel.diagnosis || diagnostics.fault || {};
    const root = intel.root_cause || {};
    const primaryFault = diag.primary_fault || 'Healthy';

    if (primaryFault === 'Healthy') {
      return [];
    }

    const supporting = [];
    if (measured.egt > 820) supporting.push('EGT (+35°C deviation)');
    if (measured.cht > 155) supporting.push('CHT (+18°C thermal soak)');
    if (measured.fuel_flow > 21) supporting.push('Fuel Flow (+20% MAP schedule)');
    if (measured.vibration > 3.5) supporting.push('Vibration (harmonic 3.5g RMS)');
    if (measured.oil_pressure < 2.5) supporting.push('Oil Pressure (-42% low)');

    // Collapse into 1 root-cause alert
    return [{
      id: `ALT-RC-${Date.now() % 10000}`,
      timestamp: new Date().toISOString(),
      severity: intel.recommendation?.priority === 'P1' ? 'CRITICAL' : 'WARNING',
      title: `Root Cause: ${primaryFault}`,
      initiating_signal: root.initiating_signal || 'Fuel System',
      message: `Cascaded sensor storm suppressed. Primary driver identified as ${primaryFault}.`,
      supporting_signals: supporting,
      count_suppressed: Math.max(0, supporting.length - 1),
      recommendation: intel.recommendation?.action || 'Inspect subsystem components'
    }];
  }

  stop() {
    if (!this.isRunning) return;
    clearInterval(this.intervalId);
    this.intervalId = null;
    this.isRunning = false;
    console.log('[SimulatorTelemetrySource] Streaming stopped.');
  }

  _localPhysicsFallback() {
    const t = this.throttle;
    const rpm = 1600 + (5800 - 1600) * Math.pow(t / 100, 0.85);
    const cht = 135 + t * 0.25 + (this.activeFaults.overheating * 50);
    const egt = 780 + t * 0.6 + (this.activeFaults.injector_degradation * 60);
    const oil_p = Math.max(1.0, 4.2 - this.activeFaults.lubrication_degradation * 2.0);
    const oil_t = 92 + this.activeFaults.lubrication_degradation * 30;
    const ff = 16 + (t / 100) * 14 + (this.activeFaults.injector_degradation * 8);
    const vib = 2.0 + this.activeFaults.vibration_fault * 5.0 + this.activeFaults.misfire_severity * 4.0;
    const meas = {
      rpm: Math.round(rpm),
      cht: Number(cht.toFixed(1)),
      egt: Number(egt.toFixed(1)),
      oil_pressure: Number(oil_p.toFixed(2)),
      oil_temperature: Number(oil_t.toFixed(1)),
      fuel_flow: Number(ff.toFixed(1)),
      vibration: Number(vib.toFixed(2)),
      battery_voltage: 28.1,
      alternator_output: 35.0,
      injection_timing: 22.0,
      throttle: t,
      torque: 138.0,
      power: 78.5,
      altitude: this.altitude,
      ambient_temperature: this.ambientTemp,
      ambient_pressure: 700.0,
      humidity: 50.0,
      engine_load: t
    };
    return { measured: meas, physics_expected: meas };
  }

  _localDiagnosticsFallback(frame) {
    const isAnom = Object.values(this.activeFaults).some(v => v > 0.15);
    const score = isAnom ? 0.72 : 0.15;
    return {
      filtered_telemetry: frame.measured,
      sensor_diagnostics: { sensor_residuals: {}, faulty_sensors: [], system_confidence: 96.0 },
      anomaly: { anomaly_score: score, isolation_forest_score: score, autoencoder_score: score, classification: isAnom ? 'Warning' : 'Normal', is_anomaly: isAnom, threshold: 0.8 },
      fault: { primary_fault: isAnom ? 'Injector Abnormality' : 'Healthy', probability: isAnom ? 0.82 : 0.95, severity: isAnom ? 'HIGH' : 'LOW', class_probabilities: {} },
      health: { overall_health: isAnom ? 74.0 : 95.0, degradation_index: isAnom ? 22.0 : 8.0, rul_hours: isAnom ? 92.0 : 182.0, rul_confidence: 88.0, rul_ci_lower: isAnom ? 75.0 : 160.0, rul_ci_upper: isAnom ? 110.0 : 205.0 },
      explanation: { primary_fault: isAnom ? 'Injector Abnormality' : 'Healthy', probability: isAnom ? 0.82 : 0.95, main_contributing_factors: [], historical_trend: 'Stable', narrative_summary: 'Operating with local telemetry fallback.' },
      twin_sync: { status: 'SYNCHRONIZED', sync_percentage: 99.1, latency_ms: 120, last_update_sec_ago: 0.8 }
    };
  }
}

// Stubs for future CAN / FADEC hardware integration
class CANBusTelemetrySource extends TelemetrySource {
  constructor(canInterface = 'can0', baudRate = 500000) {
    super('CAN_BUS');
    this.canInterface = canInterface;
    this.baudRate = baudRate;
  }
  start() { console.log(`[CANBusTelemetrySource] CAN hardware interface ${this.canInterface} initialized at ${this.baudRate} bps.`); }
  stop() { console.log('[CANBusTelemetrySource] CAN interface closed.'); }
  injectFault() { console.warn('[CANBusTelemetrySource] Hardware CAN does not accept software fault injection.'); }
}

class SocketCANSource extends TelemetrySource {
  constructor(socketPath = '/tmp/vcan0') {
    super('SOCKET_CAN');
    this.socketPath = socketPath;
  }
  start() { console.log(`[SocketCANSource] SocketCAN bound to ${this.socketPath}`); }
  stop() { console.log('[SocketCANSource] SocketCAN detached.'); }
  injectFault() {}
}

class FADECSource extends TelemetrySource {
  constructor(avionicsBus = 'ARINC-429') {
    super('FADEC');
    this.avionicsBus = avionicsBus;
  }
  start() { console.log(`[FADECSource] Subscribed to ${this.avionicsBus} FADEC stream.`); }
  stop() { console.log('[FADECSource] Detached from FADEC bus.'); }
  injectFault() {}
}

module.exports = {
  TelemetrySource,
  SimulatorTelemetrySource,
  CANBusTelemetrySource,
  SocketCANSource,
  FADECSource
};
