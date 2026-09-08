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

module.exports = router;
