# AEROTWIN AI
### AI-Enabled Real-Time Digital Twin System for Health Monitoring, Fault Prediction and Mission Reliability Enhancement of Aero Piston Engines used in MALE UAVs

> **Predict. Simulate. Explain. Prevent.**

---

## 1. Project Overview

**AEROTWIN AI** is an advanced aerospace digital twin and predictive health management (PHM) platform engineered for turbocharged 4-stroke aero piston engines (Rotax 914 / 915 iS class) utilized in Medium-Altitude Long-Endurance (MALE) Unmanned Aerial Vehicles (UAVs) such as TAPAS-BH-201, Hermes 450, Heron TP, and Predator XP.

The system continuously pairs real-time physics-informed engine models with deep learning and statistical machine learning ensembles to deliver:
- Sub-second telemetry ingestion and state estimation under noisy sensor conditions.
- Real-time 3D Digital Twin visualization driven by physical RPM, CHT heat flux, and fault animations.
- Multi-model anomaly detection (Isolation Forest + Deep Autoencoder).
- 10-class temporal fault classification (PyTorch Bidirectional GRU).
- Remaining Useful Life (RUL) regression with 95% confidence uncertainty intervals.
- Explainable AI (XAI) feature attribution and engineering root-cause narratives.
- Natural Language Mission Queries and What-If side-by-side trade-off analysis.
- NLP / Grok AI Maintenance Copilot with aerospace decision-support safety boundaries.
- Fleet management, mission replay timeline scrubbing, and prescriptive maintenance work orders.

---

## 2. Technology Stack & Architecture

```text
                                  ┌────────────────────────────────┐
                                  │      React + Vite Frontend     │
                                  │     Three.js / React Three     │
                                  │       Recharts + Tailwind      │
                                  └───────────────▲────────────────┘
                                                  │ (WebSockets & REST)
                                  ┌───────────────▼────────────────┐
                                  │     Node.js Express Server     │
                                  │      Socket.IO Broadcaster     │
                                  │   JWT Auth & RBAC Middleware   │
                                  └───────┬────────────────┬───────┘
                                          │                │
                        ┌─────────────────▼──┐   ┌─────────▼──────────────────┐
                        │ PostgreSQL / Dual  │   │     Python AI Service      │
                        │ Embedded Datastore │   │   FastAPI + PyTorch + SKL  │
                        └────────────────────┘   │   Kalman Filter + Physics  │
                                                 └────────────────────────────┘
```

- **Frontend**: React 18, Vite, Three.js, `@react-three/fiber`, `@react-three/drei`, Tailwind CSS, Lucide React, Recharts, Zustand, Axios, Socket.io-client.
- **Backend**: Node.js, Express.js, Socket.IO, JWT, bcryptjs, PostgreSQL (`pg`) with embedded zero-config persistence fallback.
- **AI/ML Service**: Python 3.13, FastAPI, Uvicorn, PyTorch, Scikit-learn, XGBoost, SciPy, NumPy, Pandas, Joblib.
- **Simulator**: Reduced-order thermodynamics, ISA atmosphere modeling, mechanical vibration harmonics, and fault injection engine.

---

## 3. Directory Structure

```text
d:/SIH/
├── frontend/             # React + Vite + Three.js Ground Control UI
├── backend/              # Node.js Express Gateway & Socket.IO server
├── ai-service/           # Python FastAPI scientific AI/ML microservice
│   ├── app/
│   │   ├── simulation/   # Reduced-order aero engine physics & missions
│   │   ├── anomaly/      # Isolation Forest & PyTorch Autoencoder
│   │   ├── fault_prediction/ # 10-class PyTorch GRU temporal model
│   │   ├── rul/          # RUL regression & 95% uncertainty interval
│   │   ├── sensor_fusion/# Kalman Filter & sensor residual diagnostics
│   │   └── explainability/ # Feature attribution & XAI engine
│   └── trained_models/   # Exported PyTorch (.pt) and joblib model weights
├── database/             # PostgreSQL migrations & seed data scripts
├── simulator/            # Standalone engine & mission runner CLIs
├── docs/                 # Architecture, API specs, and evaluation guide
├── docker-compose.yml    # Complete 4-service Docker configuration
├── .env.example          # Environment variables template
└── README.md
```

---

## 4. Quick Start & Installation

### Prerequisites
- Node.js (v18+ or v24) and npm
- Python (v3.10 to v3.14) with pip
- Docker & Docker Compose (Optional for containerized deployment)

### Method A: One-Command Docker Deployment
```bash
# 1. Copy environment variables
cp .env.example .env

# 2. Build and launch all services
docker-compose up --build
```
Access the application at: `http://localhost:3000`

---

### Method B: Standalone Local Development

#### Step 1: Start Python AI Microservice
```bash
cd ai-service
# (Optional) python -m pip install -r requirements.txt
py -3.13 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*Verify: Visit `http://localhost:8000/health` (should return UP with models loaded).*

#### Step 2: Start Node.js Gateway Backend
```bash
cd backend
npm install
npm run dev
```
*Verify: Gateway listening on `http://localhost:5000` with WebSocket telemetry streaming.*

#### Step 3: Start React Frontend
```bash
cd frontend
npm install
npm run dev
```
*Access GCS at: `http://localhost:3000`*

---

## 5. Pre-trained AI/ML Models & Retraining

Model weights are already pre-trained and saved in `ai-service/trained_models/`:
- `autoencoder.pt`: PyTorch Deep Autoencoder for nominal telemetry manifold reconstruction.
- `isolation_forest.joblib`: Scikit-learn multivariate tree anomaly detector.
- `temporal_fault_classifier.pt`: PyTorch Bidirectional GRU for 10-class fault classification.
- `rul_regressor.joblib`: XGBoost / Gradient Boosting regression model.
- `evaluation_metrics.json`: Evaluated test metrics.

To retrain from scratch:
```bash
py -3.13 ai-service/scripts/train_and_evaluate.py
```

---

## 6. Predefined Demonstration Scenarios

In the top navigation bar, click **FAULT INJECTOR** to inject live scenarios:
1. **Healthy Engine**: Nominal cruise envelope (Health ~95%, Anomaly < 0.25).
2. **Injector Degradation**: Fuel delivery surge, EGT elevation, CHT differential.
3. **Severe Cylinder Misfire**: Sudden power loss, EGT drop on cylinder 2, vibration spike.
4. **Lubrication Failure**: Oil pressure drop (<2.0 bar), oil temp runaway, bearing wear.
5. **Thermal Overheating**: Coolant boiling, CHT exceeding 195°C critical limit.
6. **Vibration Anomaly**: Propeller shaft unbalance, 1X/2X rotational harmonics.
7. **Sensor Failure / Drift**: CHT sensor artificially offset; flagged by Kalman residual.
8. **Multi-Fault Scenario**: Compound failure propagating through thermal and mechanical paths.

---

## 7. Grok AI Maintenance Copilot

The AI Copilot operates via a secure backend proxy (`POST /api/ai/chat`).
- Add your `XAI_API_KEY` to `.env` to enable live Grok-2 inference.
- **Offline Reliability Mode**: If no key is configured or network is severed, the system seamlessly transitions to an embedded **Aerospace Engineering Knowledge Engine** ensuring 100% offline uptime for presentations and field testing.
- **Aerospace Safety Directives**: Responses strictly provide decision support, prohibit claiming autonomous flight certification, and communicate confidence intervals.

---

## 8. Verified Performance Benchmark

*From `ai-service/trained_models/evaluation_metrics.json` (1,800 synthetic flight cycles):*
- **Anomaly Detection ROC-AUC**: 0.954
- **Temporal Fault Classification Accuracy**: 98.2% (F1: 0.983 across 10 classes)
- **RUL Prediction MAE**: 93.21 operating hours

*Disclaimer: Performance calculated from physics-guided synthetic telemetry benchmark. Certified flight operations require hardware-in-the-loop dyno-bench testing.*

---

## 9. License

Developed for advanced aerospace engineering research, UAV ground station avionics integration, and Smart India Hackathon (SIH) technical demonstration.
