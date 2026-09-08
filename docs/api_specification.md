# AEROTWIN AI - API Specification

## Node.js Gateway REST Endpoints (`http://localhost:5000`)

### Authentication
- `POST /api/auth/login`: Authenticate and obtain JWT token.
- `GET /api/auth/profile`: Get current authenticated user profile.

### Fleet & Engines
- `GET /api/uavs`: List all enrolled MALE UAV airframes.
- `GET /api/engines`: List all aero engines with health, RUL, and operational status.
- `GET /api/engines/:id`: Get detailed engine telemetry and configuration.
- `GET /api/engines/:id/telemetry`: Retrieve recent telemetry history buffer.
- `GET /api/engines/:id/health`: Retrieve 6-subsystem health scores.
- `GET /api/engines/:id/rul`: Retrieve RUL hours and 95% confidence bounds.

### Missions & What-If Analysis
- `GET /api/missions`: List scheduled and historical missions.
- `POST /api/mission/simulate`: Execute mission profile simulation.
- `POST /api/mission/query`: Natural Language Mission Query parser.
- `POST /api/mission/what-if`: Side-by-side comparative mission analysis.

### Maintenance Center
- `GET /api/maintenance`: List all maintenance work orders.
- `POST /api/maintenance`: Create a prescriptive maintenance work order.
- `PATCH /api/maintenance/:id/status`: Transition work order status (`Pending`, `Inspected`, `Resolved`, `Deferred`).

### Alerts & Reports
- `GET /api/alerts`: Retrieve active notifications.
- `PATCH /api/alerts/:id/ack`: Acknowledge an alert.
- `GET /api/reports`: List mission reliability reports.
- `POST /api/reports`: Generate and save a new report.

### AI Copilot
- `POST /api/ai/chat`: Query Grok / Offline Aerospace Decision-Support Copilot.
- `GET /api/ai/history`: Retrieve copilot prompt history.

---

## Python AI Microservice Endpoints (`http://localhost:8000`)

- `GET /health`: Health check and model load verification.
- `POST /simulate/engine`: Generate single physics-informed telemetry frame.
- `POST /simulate/mission`: Execute multi-phase flight profile simulation.
- `POST /predict/anomaly`: Compute Isolation Forest & Autoencoder anomaly score.
- `POST /predict/fault`: 10-class PyTorch GRU fault prediction.
- `POST /predict/rul`: Predict RUL hours with uncertainty interval.
- `POST /predict/sensor-fault`: Kalman filter state estimation and residuals.
- `POST /explain`: Explainable AI feature attribution and narrative summary.
- `POST /process-telemetry`: High-speed composite pipeline endpoint.
