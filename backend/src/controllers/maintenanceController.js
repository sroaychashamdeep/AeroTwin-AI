/**
 * AEROTWIN AI - Maintenance Controller
 */

const db = require('../config/db');

async function getMaintenanceRecords(req, res) {
  try {
    const engineId = req.query.engine_id || null;
    const records = await db.getMaintenanceRecords(engineId);
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function createMaintenanceRecord(req, res) {
  try {
    const { engine_id, title, description, recommendation, priority, predicted_risk, triggered_by_fault } = req.body;
    if (!title || !recommendation) {
      return res.status(400).json({ error: 'Title and recommendation are required.' });
    }

    const rec = await db.createMaintenanceRecord({
      id: 'mnt_' + Date.now(),
      engine_id: engine_id || 'eng_001',
      title,
      description: description || '',
      recommendation,
      priority: priority || 'MEDIUM',
      status: 'Pending',
      predicted_risk: predicted_risk || 0.5,
      triggered_by_fault: triggered_by_fault || 'Manual Engineer Inspection',
      created_at: new Date().toISOString()
    });

    res.status(201).json(rec);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function updateStatus(req, res) {
  try {
    const { id } = req.params;
    const { status, notes } = req.body; // Pending, Inspected, Resolved, Deferred

    const validStatuses = ['Pending', 'Inspected', 'Resolved', 'Deferred'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const updated = await db.updateMaintenanceStatus(id, status, notes);
    if (!updated) return res.status(404).json({ error: 'Maintenance record not found' });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getMaintenanceRecords,
  createMaintenanceRecord,
  updateStatus
};
