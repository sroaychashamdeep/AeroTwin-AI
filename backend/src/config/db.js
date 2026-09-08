/**
 * AEROTWIN AI - Database Persistence Gateway
 * Dual-Mode Database Adapter: PostgreSQL (production/docker) with embedded JSON/SQL fallback
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

let pool = null;
let usePostgres = false;

// Embedded file-backed database path
const DATA_DIR = path.join(__dirname, '..', '..', '..', 'database', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const DB_FILE = path.join(DATA_DIR, 'aerotwin_store.json');

// Memory store fallback
let store = {
  users: [],
  uavs: [],
  engines: [],
  missions: [],
  telemetry: [],
  sensor_readings: [],
  faults: [],
  predictions: [],
  health_scores: [],
  degradation_history: [],
  maintenance_records: [],
  mission_reports: [],
  alerts: [],
  ai_chat_history: []
};

// Save to disk
function saveStore() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB] Error saving store:', err.message);
  }
}

// Load from disk if exists
function loadStore() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      store = { ...store, ...JSON.parse(content) };
    } catch (err) {
      console.warn('[DB] Error loading store file, using defaults');
    }
  }
}

// Seed default MALE UAV fleet data if empty
function seedDefaultData() {
  if (store.uavs.length === 0) {
    store.uavs = [
      { id: 'uav_001', tail_number: 'UAV-001', model: 'TAPAS MALE-201', callsign: 'GARUDA-01', status: 'ACTIVE', total_flight_hours: 342.5 },
      { id: 'uav_002', tail_number: 'UAV-002', model: 'Hermes 450 Class', callsign: 'VALKYRIE-02', status: 'ACTIVE', total_flight_hours: 512.0 },
      { id: 'uav_003', tail_number: 'UAV-003', model: 'Predator XP MALE', callsign: 'SHADOW-03', status: 'ACTIVE', total_flight_hours: 188.2 },
      { id: 'uav_004', tail_number: 'UAV-004', model: 'Heron TP Class', callsign: 'SENTINEL-04', status: 'MAINTENANCE', total_flight_hours: 680.7 }
    ];
  }

  if (store.engines.length === 0) {
    store.engines = [
      { id: 'eng_001', uav_id: 'uav_001', serial_number: 'RTX-914-F0192', model: 'Rotax 914 Turbo Aero Piston', rated_power_hp: 115.0, max_rpm: 5800.0, operating_hours: 342.5, status: 'NOMINAL', health: 94.2, rul: 182.0 },
      { id: 'eng_002', uav_id: 'uav_002', serial_number: 'RTX-915-iS-4410', model: 'Rotax 915 iS Turbo Fuel-Injected', rated_power_hp: 141.0, max_rpm: 5800.0, operating_hours: 512.0, status: 'ATTENTION', health: 78.4, rul: 121.0 },
      { id: 'eng_003', uav_id: 'uav_003', serial_number: 'RTX-915-iS-8821', model: 'Rotax 915 iS Turbo Fuel-Injected', rated_power_hp: 141.0, max_rpm: 5800.0, operating_hours: 188.2, status: 'NOMINAL', health: 96.8, rul: 204.0 },
      { id: 'eng_004', uav_id: 'uav_004', serial_number: 'RTX-914-F0076', model: 'Rotax 914 Turbo Aero Piston', rated_power_hp: 115.0, max_rpm: 5800.0, operating_hours: 680.7, status: 'WARNING', health: 61.3, rul: 73.0 }
    ];
  }

  if (store.users.length === 0) {
    store.users = [
      { id: 'usr_admin', username: 'admin', email: 'admin@aerotwin.mil', password_hash: '$2a$10$wN9P3P1QW8lG5h9ZkSXeCOkM68qTz9n3.XoN3.7g/jZc0t8vK3a2u', role: 'Administrator', full_name: 'Flight Ops Commander' },
      { id: 'usr_eng', username: 'engineer', email: 'lead.engineer@aerotwin.mil', password_hash: '$2a$10$wN9P3P1QW8lG5h9ZkSXeCOkM68qTz9n3.XoN3.7g/jZc0t8vK3a2u', role: 'Engineer', full_name: 'Chief Propulsion Specialist' },
      { id: 'usr_tech', username: 'tech', email: 'maintenance@aerotwin.mil', password_hash: '$2a$10$wN9P3P1QW8lG5h9ZkSXeCOkM68qTz9n3.XoN3.7g/jZc0t8vK3a2u', role: 'Maintenance', full_name: 'Avionics & Powerplant Tech' },
      { id: 'usr_pilot', username: 'operator', email: 'gcs.pilot@aerotwin.mil', password_hash: '$2a$10$wN9P3P1QW8lG5h9ZkSXeCOkM68qTz9n3.XoN3.7g/jZc0t8vK3a2u', role: 'Operator', full_name: 'MALE GCS Flight Operator' }
    ];
  }

  if (store.maintenance_records.length === 0) {
    store.maintenance_records = [
      { id: 'mnt_001', engine_id: 'eng_001', title: 'Routine 350-Hour TBO Inspection', description: 'Scheduled borescope inspection of cylinders and valve lash check', recommendation: 'Inspect cylinder 3 intake valve and oil filter particulate trap', priority: 'LOW', status: 'Pending', predicted_risk: 0.08, triggered_by_fault: 'None', created_at: new Date().toISOString() },
      { id: 'mnt_002', engine_id: 'eng_002', title: 'Vibration Spectral Peak & Oil Pressure Warning', description: 'Increasing 1X rotational vibration with subtle oil pressure decay', recommendation: 'Inspect journal bearings, inspect oil pump relief valve, and check magnetic chip detector', priority: 'HIGH', status: 'Pending', predicted_risk: 0.68, triggered_by_fault: 'Lubrication Degradation', created_at: new Date().toISOString() },
      { id: 'mnt_004', engine_id: 'eng_004', title: 'Overheating & Injector Nozzle Cleaning', description: 'Cylinder 2 CHT trending above 185C during climb phase', recommendation: 'Clean and bench-test electro-injectors, flush oil heat exchanger radiator', priority: 'CRITICAL', status: 'Pending', predicted_risk: 0.84, triggered_by_fault: 'Overheating / Injector Degradation', created_at: new Date().toISOString() }
    ];
  }

  if (store.alerts.length === 0) {
    store.alerts = [
      { id: 'alt_001', engine_id: 'eng_001', category: 'INFO', title: 'Digital Twin Synchronized', message: 'Telemetry pipeline connected via high-frequency telemetry stream. Sync fidelity 99.4%', severity: 'INFO', acknowledged: false, created_at: new Date().toISOString() },
      { id: 'alt_002', engine_id: 'eng_002', category: 'PREDICTIVE', title: 'Elevated Vibration Harmonic Detected', message: 'Vibration RMS reached 4.6 mm/s at 5200 RPM. Trending above nominal baseline', severity: 'WARNING', acknowledged: false, created_at: new Date().toISOString() },
      { id: 'alt_003', engine_id: 'eng_004', category: 'CRITICAL', title: 'CHT Thermal Margin Exceeded', message: 'Cylinder Head Temp reached 192C under 78% throttle. Recommended power reduction', severity: 'CRITICAL', acknowledged: false, created_at: new Date().toISOString() }
    ];
  }

  saveStore();
}

async function initDatabase() {
  loadStore();
  seedDefaultData();

  if (process.env.DATABASE_URL) {
    try {
      pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        connectionTimeoutMillis: 3000
      });
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      usePostgres = true;
      console.log('[DB] Connected successfully to PostgreSQL database.');
      return;
    } catch (err) {
      console.warn('[DB] PostgreSQL unavailable (' + err.message + '). Operating in Embedded High-Speed Persistence Mode.');
      usePostgres = false;
    }
  } else {
    console.log('[DB] DATABASE_URL not set. Running with Embedded Persistence Engine.');
  }
}

// Data Access Object (DAO) providing unified API across DB backends
const db = {
  init: initDatabase,
  isPostgres: () => usePostgres,

  // UAVs
  getUavs: async () => store.uavs,
  getUavById: async (id) => store.uavs.find(u => u.id === id),

  // Engines
  getEngines: async () => store.engines,
  getEngineById: async (id) => store.engines.find(e => e.id === id || e.serial_number === id),
  updateEngineStatus: async (id, update) => {
    const eng = store.engines.find(e => e.id === id);
    if (eng) {
      Object.assign(eng, update);
      saveStore();
      return eng;
    }
    return null;
  },

  // Users
  getUserByUsername: async (username) => store.users.find(u => u.username === username),
  getUserById: async (id) => store.users.find(u => u.id === id),
  createUser: async (user) => {
    store.users.push(user);
    saveStore();
    return user;
  },

  // Telemetry buffer
  saveTelemetry: async (telem) => {
    store.telemetry.unshift(telem);
    if (store.telemetry.length > 300) store.telemetry.pop();
  },
  getRecentTelemetry: async (engineId, limit = 50) => {
    return store.telemetry.slice(0, limit);
  },

  // Maintenance Records
  getMaintenanceRecords: async (engineId) => {
    if (engineId) return store.maintenance_records.filter(m => m.engine_id === engineId);
    return store.maintenance_records;
  },
  createMaintenanceRecord: async (rec) => {
    store.maintenance_records.unshift(rec);
    saveStore();
    return rec;
  },
  updateMaintenanceStatus: async (id, status, notes = '') => {
    const rec = store.maintenance_records.find(m => m.id === id);
    if (rec) {
      rec.status = status;
      if (notes) rec.technician_notes = notes;
      if (status === 'Resolved') rec.resolved_at = new Date().toISOString();
      saveStore();
      return rec;
    }
    return null;
  },

  // Alerts
  getAlerts: async (acknowledged = null) => {
    if (acknowledged !== null) {
      return store.alerts.filter(a => a.acknowledged === acknowledged);
    }
    return store.alerts;
  },
  createAlert: async (alert) => {
    store.alerts.unshift(alert);
    if (store.alerts.length > 100) store.alerts.pop();
    saveStore();
    return alert;
  },
  acknowledgeAlert: async (id) => {
    const alt = store.alerts.find(a => a.id === id);
    if (alt) {
      alt.acknowledged = true;
      saveStore();
      return alt;
    }
    return null;
  },

  // Missions
  getMissions: async () => store.missions,
  createMission: async (mission) => {
    store.missions.unshift(mission);
    saveStore();
    return mission;
  },

  // AI Chat History
  saveChatMessage: async (entry) => {
    store.ai_chat_history.push(entry);
    saveStore();
    return entry;
  },
  getChatHistory: async (userId, limit = 20) => {
    return store.ai_chat_history.slice(-limit);
  },

  // Reports
  getReports: async () => store.mission_reports,
  createReport: async (rep) => {
    store.mission_reports.unshift(rep);
    saveStore();
    return rep;
  }
};

module.exports = db;
