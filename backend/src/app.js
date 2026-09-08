/**
 * AEROTWIN AI - Main Application Gateway Server
 * Node.js Express & Socket.IO Telemetry Gateway
 */

require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const db = require('./config/db');
const apiRoutes = require('./routes/api');
const setupTelemetrySocket = require('./websocket/telemetrySocket');

const app = express();
const server = http.createServer(app);

// Cross-Origin Resource Sharing
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Root health & status
app.get('/health', (req, res) => {
  res.json({
    status: 'UP',
    system: 'AEROTWIN-AI-Gateway',
    version: '1.0.0',
    db_mode: db.isPostgres() ? 'PostgreSQL' : 'Embedded-Persistence',
    timestamp: new Date().toISOString()
  });
});

// Configure Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Start Telemetry Streaming & WebSocket Pipeline
const telemetrySource = setupTelemetrySocket(io);

// Simulation control endpoints directly tied to telemetry source
app.post('/api/simulation/fault', (req, res) => {
  telemetrySource.injectFault(req.body);
  res.json({ message: 'Fault parameters updated', active_faults: telemetrySource.activeFaults });
});

app.post('/api/simulation/clear', (req, res) => {
  telemetrySource.clearFaults();
  res.json({ message: 'Faults cleared', active_faults: telemetrySource.activeFaults });
});

app.post('/api/simulation/flight-params', (req, res) => {
  telemetrySource.setFlightParams(req.body);
  res.json({
    message: 'Flight parameters updated',
    throttle: telemetrySource.throttle,
    altitude: telemetrySource.altitude,
    ambient_temperature: telemetrySource.ambientTemp
  });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  await db.init();
  server.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(` AEROTWIN AI - Ground Control Station Backend Gateway `);
    console.log(` HTTP & WebSocket Server running on port: ${PORT}`);
    console.log(` AI Microservice Target URL: ${process.env.AI_SERVICE_URL || 'http://localhost:8000'}`);
    console.log(`=======================================================`);
  });
}

startServer();

module.exports = { app, server };
