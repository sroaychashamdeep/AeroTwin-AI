/**
 * AEROTWIN AI - WebSocket & Real-Time Telemetry Gateway
 * High-Speed Telemetry Streaming via Socket.IO
 */

const { SimulatorTelemetrySource } = require('../services/telemetrySource');
const db = require('../config/db');

function setupTelemetrySocket(io) {
  const telemetrySource = new SimulatorTelemetrySource(process.env.AI_SERVICE_URL || 'http://localhost:8000');
  let currentEngineId = 'eng_001';

  // Listen to telemetry emissions from simulator
  telemetrySource.subscribe(async (data) => {
    // 1. Broadcast telemetry frame to all connected clients
    io.emit('telemetry_stream', data);

    // 2. Save telemetry frame to history in DB
    await db.saveTelemetry({
      id: 'tel_' + Date.now(),
      engine_id: data.engine_id,
      ...data.telemetry
    });

    // 3. Check for severe alerts to broadcast
    if (data.anomaly && data.anomaly.is_anomaly && data.anomaly.anomaly_score > 0.75) {
      const alert = {
        id: 'alt_' + Date.now(),
        engine_id: data.engine_id,
        category: 'CRITICAL',
        title: `Critical Anomaly: ${data.fault.primary_fault}`,
        message: data.explanation ? data.explanation.narrative_summary : 'Severe parameter deviation detected.',
        severity: 'CRITICAL',
        acknowledged: false,
        created_at: new Date().toISOString()
      };
      await db.createAlert(alert);
      io.emit('new_alert', alert);
    }
  });

  // Automatically start simulator telemetry stream
  telemetrySource.start(1000);

  io.on('connection', (socket) => {
    console.log(`[WebSocket] Client connected: ${socket.id}`);

    // Send initial sync handshake
    socket.emit('connection_status', {
      connected: true,
      engine_id: currentEngineId,
      source: telemetrySource.name,
      interval_ms: 1000,
      active_faults: telemetrySource.activeFaults
    });

    // Client commands
    socket.on('inject_fault', (faults) => {
      telemetrySource.injectFault(faults);
      io.emit('faults_updated', telemetrySource.activeFaults);
    });

    socket.on('clear_faults', () => {
      telemetrySource.clearFaults();
      io.emit('faults_updated', telemetrySource.activeFaults);
    });

    socket.on('set_flight_parameters', (params) => {
      telemetrySource.setFlightParams(params);
      io.emit('flight_params_updated', {
        throttle: telemetrySource.throttle,
        altitude: telemetrySource.altitude,
        ambient_temp: telemetrySource.ambientTemp
      });
    });

    socket.on('select_engine', (engineId) => {
      currentEngineId = engineId;
      socket.emit('engine_selected', { engine_id: currentEngineId });
    });

    socket.on('toggle_stream', (run) => {
      if (run) telemetrySource.start(1000);
      else telemetrySource.stop();
      io.emit('stream_status', { isRunning: telemetrySource.isRunning });
    });

    socket.on('disconnect', () => {
      console.log(`[WebSocket] Client disconnected: ${socket.id}`);
    });
  });

  return telemetrySource;
}

module.exports = setupTelemetrySocket;
