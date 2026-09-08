/**
 * AEROTWIN AI - Alert Controller
 */

const db = require('../config/db');

async function getAlerts(req, res) {
  try {
    const acknowledged = req.query.acknowledged !== undefined ? req.query.acknowledged === 'true' : null;
    const alerts = await db.getAlerts(acknowledged);
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function acknowledgeAlert(req, res) {
  try {
    const { id } = req.params;
    const alert = await db.acknowledgeAlert(id);
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    res.json(alert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getAlerts, acknowledgeAlert };
