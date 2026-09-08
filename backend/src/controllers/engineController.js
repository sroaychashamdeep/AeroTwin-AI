/**
 * AEROTWIN AI - Engine & Fleet Telemetry Controller
 */

const db = require('../config/db');

async function getEngines(req, res) {
  try {
    const engines = await db.getEngines();
    const uavs = await db.getUavs();
    
    // Attach UAV metadata
    const populated = engines.map(eng => {
      const uav = uavs.find(u => u.id === eng.uav_id);
      return {
        ...eng,
        uav_callsign: uav ? uav.callsign : 'UNASSIGNED',
        uav_tail: uav ? uav.tail_number : 'N/A',
        uav_model: uav ? uav.model : 'MALE UAV'
      };
    });

    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getEngineById(req, res) {
  try {
    const eng = await db.getEngineById(req.params.id);
    if (!eng) return res.status(404).json({ error: 'Engine not found' });
    
    const uavs = await db.getUavs();
    const uav = uavs.find(u => u.id === eng.uav_id);

    res.json({
      ...eng,
      uav: uav || null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getEngineTelemetry(req, res) {
  try {
    const limit = parseInt(req.query.limit) || 60;
    const telemetry = await db.getRecentTelemetry(req.params.id, limit);
    res.json(telemetry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getEngineHealth(req, res) {
  try {
    const eng = await db.getEngineById(req.params.id);
    if (!eng) return res.status(404).json({ error: 'Engine not found' });

    res.json({
      engine_id: eng.id,
      overall_health: eng.health || 94.2,
      thermal_health: 92.5,
      combustion_health: 96.0,
      lubrication_health: 93.8,
      vibration_health: 95.1,
      electrical_health: 98.0,
      fuel_system_health: 94.7,
      degradation_index: 5.8
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function getEngineRul(req, res) {
  try {
    const eng = await db.getEngineById(req.params.id);
    if (!eng) return res.status(404).json({ error: 'Engine not found' });

    res.json({
      engine_id: eng.id,
      operating_hours: eng.operating_hours,
      rul_hours: eng.rul || 182.0,
      confidence: 88.5,
      ci_lower: (eng.rul || 182.0) - 22.0,
      ci_upper: (eng.rul || 182.0) + 24.0,
      disclaimer: "Simulated prototype RUL estimation for MALE UAV flight planning."
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getEngines,
  getEngineById,
  getEngineTelemetry,
  getEngineHealth,
  getEngineRul
};
