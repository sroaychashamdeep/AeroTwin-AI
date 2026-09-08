/**
 * AEROTWIN AI - Report Generation Controller
 */

const db = require('../config/db');

async function getReports(req, res) {
  try {
    const reports = await db.getReports();
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function generateReport(req, res) {
  try {
    const { mission_id, engine_id, summary, health_start, health_end, max_cht, max_egt, max_vib, fuel_kg, recommendations } = req.body;
    
    const report = {
      id: 'rep_' + Date.now(),
      mission_id: mission_id || 'MSN-ISR-0841',
      engine_id: engine_id || 'eng_001',
      title: `Mission Reliability & Propulsion Diagnostic Report: ${mission_id || 'MSN-ISR-0841'}`,
      generated_at: new Date().toISOString(),
      summary: summary || 'Comprehensive MALE UAV propulsion digital twin assessment completed.',
      start_health: health_start || 95.0,
      end_health: health_end || 92.4,
      fuel_consumed_kg: fuel_kg || 34.2,
      max_cht_c: max_cht || 158.2,
      max_egt_c: max_egt || 812.0,
      max_vibration_rms: max_vib || 2.4,
      anomalies_detected: 1,
      faults_detected: 0,
      rul_impact_hours: 9.6,
      recommendations: recommendations || 'Powerplant cleared for subsequent scheduled sortie. Maintain standard oil spectrographic sampling interval.'
    };

    await db.createReport(report);
    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { getReports, generateReport };
