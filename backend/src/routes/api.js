/**
 * AEROTWIN AI - REST API Routes
 */

const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const engineController = require('../controllers/engineController');
const missionController = require('../controllers/missionController');
const maintenanceController = require('../controllers/maintenanceController');
const aiChatController = require('../controllers/aiChatController');
const alertController = require('../controllers/alertController');
const reportController = require('../controllers/reportController');
const db = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// 1. Auth Routes
router.post('/auth/login', authController.login);
router.get('/auth/profile', authenticateToken, authController.getProfile);

// 2. UAVs Routes
router.get('/uavs', authenticateToken, async (req, res) => {
  const uavs = await db.getUavs();
  res.json(uavs);
});

// 3. Engine Routes
router.get('/engines', authenticateToken, engineController.getEngines);
router.get('/engines/:id', authenticateToken, engineController.getEngineById);
router.get('/engines/:id/telemetry', authenticateToken, engineController.getEngineTelemetry);
router.get('/engines/:id/health', authenticateToken, engineController.getEngineHealth);
router.get('/engines/:id/rul', authenticateToken, engineController.getEngineRul);

// 4. Mission & Simulation Routes
router.get('/missions', authenticateToken, missionController.getMissions);
router.post('/mission/simulate', authenticateToken, missionController.simulateMission);
router.post('/mission/query', authenticateToken, missionController.parseNaturalLanguageQuery);
router.post('/mission/what-if', authenticateToken, missionController.runWhatIfAnalysis);

// 5. Maintenance Routes
router.get('/maintenance', authenticateToken, maintenanceController.getMaintenanceRecords);
router.post('/maintenance', authenticateToken, requireRole(['Engineer', 'Maintenance', 'Administrator']), maintenanceController.createMaintenanceRecord);
router.patch('/maintenance/:id/status', authenticateToken, requireRole(['Engineer', 'Maintenance', 'Administrator']), maintenanceController.updateStatus);

// 6. Alerts Routes
router.get('/alerts', authenticateToken, alertController.getAlerts);
router.patch('/alerts/:id/ack', authenticateToken, alertController.acknowledgeAlert);

// 7. Reports Routes
router.get('/reports', authenticateToken, reportController.getReports);
router.post('/reports', authenticateToken, reportController.generateReport);

// 8. AI Copilot Routes
router.post('/ai/chat', authenticateToken, aiChatController.chat);
router.get('/ai/history', authenticateToken, aiChatController.getHistory);

// 9. Work Orders & Digital Thread
const maintenanceService = require('../services/maintenanceService');
const axios = require('axios');
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

router.get('/work-orders', authenticateToken, (req, res) => {
  res.json(maintenanceService.getWorkOrders(req.query));
});

router.post('/work-orders/generate', authenticateToken, (req, res) => {
  const { intelligence_state } = req.body;
  if (!intelligence_state) return res.status(400).json({ error: 'intelligence_state is required.' });
  const wo = maintenanceService.generateWorkOrderFromIntelligence(intelligence_state);
  res.status(201).json(wo);
});

router.patch('/work-orders/:id/status', authenticateToken, (req, res) => {
  const { status, resolutionNote } = req.body;
  const wo = maintenanceService.updateWorkOrderStatus(req.params.id, status, resolutionNote);
  if (!wo) return res.status(404).json({ error: 'Work order not found.' });
  res.json(wo);
});

// 10. AI Orchestrator Diagnostics, RAG & Performance Proxies
router.post('/diagnostics/root-cause', authenticateToken, async (req, res) => {
  try {
    const aiRes = await axios.post(`${AI_SERVICE_URL}/diagnostics/root-cause`, req.body, { timeout: 2000 });
    res.json(aiRes.data);
  } catch (err) {
    res.status(502).json({ error: 'AI microservice root-cause error: ' + err.message });
  }
});

router.post('/calibration/tune', authenticateToken, async (req, res) => {
  try {
    const aiRes = await axios.post(`${AI_SERVICE_URL}/calibration/tune`, req.body, { timeout: 2000 });
    res.json(aiRes.data);
  } catch (err) {
    res.status(502).json({ error: 'AI calibration error: ' + err.message });
  }
});

router.post('/rag/query', authenticateToken, async (req, res) => {
  try {
    const aiRes = await axios.post(`${AI_SERVICE_URL}/rag/query`, req.body, { timeout: 2000 });
    res.json(aiRes.data);
  } catch (err) {
    res.status(502).json({ error: 'RAG search error: ' + err.message });
  }
});

router.post('/simulate/counterfactual', authenticateToken, async (req, res) => {
  try {
    const aiRes = await axios.post(`${AI_SERVICE_URL}/simulate/counterfactual`, req.body, { timeout: 2500 });
    res.json(aiRes.data);
  } catch (err) {
    res.status(502).json({ error: 'Counterfactual simulation error: ' + err.message });
  }
});

router.get('/ai-performance/metrics', authenticateToken, async (req, res) => {
  try {
    const aiRes = await axios.get(`${AI_SERVICE_URL}/ai-performance/metrics`, { timeout: 1500 });
    res.json(aiRes.data);
  } catch (err) {
    res.status(502).json({ error: 'AI scorecard metrics error: ' + err.message });
  }
});

module.exports = router;
