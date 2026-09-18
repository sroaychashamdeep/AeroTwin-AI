# AEROTWIN AI — COMPREHENSIVE PROJECT REPORT
## Autonomous Real-Time Digital Twin, Predictive Health Management (PHM) & Mission Reliability System for MALE UAV Aero Piston Powerplants

---

### EXECUTIVE DETAILS & PROJECT IDENTIFICATION
* **Project Name**: AEROTWIN AI
* **Domain**: Aerospace & Defence Avionics / Smart India Hackathon (SIH)
* **Target Platforms**: Medium-Altitude Long-Endurance (MALE) Unmanned Aerial Vehicles (TAPAS-BH-201 / Rustom-II, Hermes 450, Heron TP, Predator XP)
* **Target Powerplant Class**: Rotax 914 / 915 iS Turbocharged 4-Stroke Aero Piston Engine
* **Technology Stack**: Python 3.13, FastAPI, PyTorch (Bi-GRU & Transformer), Scikit-Learn, SciPy, Node.js, Express, Socket.IO, React 18, Vite, Three.js (WebGL), Tailwind CSS, PostgreSQL / Dual Embedded Persistence, Docker Compose
* **Repository**: [https://github.com/sroaychashamdeep/AeroTwin-AI](https://github.com/sroaychashamdeep/AeroTwin-AI)
* **Live Cloud Deployment**: Render Multi-Service Blueprint (`aerotwin-ai-service`, `aerotwin-backend`, `aerotwin-frontend`)

---

## 1. EXECUTIVE SUMMARY

**AEROTWIN AI** is an advanced aerospace digital twin and predictive health management (PHM) platform engineered for turbocharged 4-stroke aero piston engines operating in MALE Unmanned Aerial Vehicles (UAVs). 

Tactical MALE UAVs conduct persistent 14-to-24-hour Intelligence, Surveillance, Target Acquisition, and Reconnaissance (ISTAR) sorties. Because these UAVs rely on a single powerplant, an undetected mid-flight fault—such as fuel injector nozzle clogging, oil pressure decay, valve thermal fatigue, or turbocharger wastegate failure—presents an extreme operational hazard, resulting in forced ditching, emergency landing, or airframe loss.

AeroTwin AI eliminates reactive post-failure repairs and legacy static-threshold warnings by establishing a closed-loop propulsion intelligence pipeline across 11 stages:
`SENSE ➔ FUSE ➔ UNDERSTAND ➔ DETECT ➔ DIAGNOSE ➔ PREDICT ➔ EXPLAIN ➔ SIMULATE ➔ OPTIMIZE ➔ RECOMMEND ➔ LEARN`.

The platform integrates:
1. A reduced-order **thermodynamic and ISA atmospheric engine physics model** computing nominal performance envelopes under varying altitude (up to FL180) and ambient temperatures.
2. An **Extended Kalman Filter (EKF)** for sub-second sensor noise removal, state estimation, and sensor drift isolation.
3. A multi-model anomaly detection suite (**Isolation Forest + PyTorch Deep Autoencoder**).
4. A 10-class **PyTorch Bidirectional GRU & Self-Attention Aero Transformer** temporal fault classifier (achieving **98.2% accuracy**).
5. A physics-guided **Remaining Useful Life (RUL) regression engine** with dynamic **95% Confidence Intervals**.
6. **Explainable AI (XAI)** calculating Shapley feature attributions and directed causal graphs ("What changed first?").
7. A **Counterfactual "What-If" simulator** allowing mission commanders to evaluate alternate altitude and throttle profiles to preserve thermal margins.
8. An **SOP-grounded Grok AI Maintenance Copilot** with 12 deterministic tool calls.
9. An automated **Maintenance Digital Thread** outputting structured Work Orders (e.g. `WO-2026-AERO-042`) and economic ROI calculations.
10. A military-grade **14-page Tactical Ground Control Station (GCS)** featuring an immersive **3D WebGL Digital Twin** with dynamic heat flux shaders and engine ignition state machine.

All 38 steps of the autonomous end-to-end acceptance suite have been empirically verified (**100% pass rate**).

---

## 2. PROJECT VISION & TARGET PLATFORMS

### 2.1 The Strategic Vision
To safeguard national defence aerospace assets by providing military UAV operators, mission commanders, and ground maintenance engineers with continuous, physics-informed, auditable propulsion lifecycle intelligence.

### 2.2 Target Airframes & Powerplant Specifications
* **Airframes**:
  - **TAPAS-BH-201 (Rustom-II)**: Tactical Airborne Platform for Aerial Surveillance (DRDO / ADE India).
  - **Hermes 450 / Heron TP / Predator XP**: Medium-Altitude Long-Endurance ISTAR platforms.
* **Target Engine**: Rotax 914 / 915 iS Turbocharged 4-stroke air/liquid-cooled aero piston engine.
  - **Displacement**: 1,352 cc
  - **Configuration**: 4-cylinder horizontally opposed with central camshaft and pushrods.
  - **Max Power**: 115 HP (84.5 kW) @ 5,800 RPM (takeoff), 100 HP @ 5,500 RPM (continuous cruise).
  - **Fuel Injection**: Dual electronic fuel injection (FADEC / ECU controlled).
  - **Turbocharging**: Exhaust gas turbocharger with automatic wastegate control.

---

## 3. PROBLEM STATEMENT & DETAILED TECHNICAL CHALLENGES

```
                        TRADITIONAL VS. AEROTWIN AI PARADIGM
┌──────────────────────────────────────────┐    ┌──────────────────────────────────────────┐
│          LEGACY MONOCHROME GCS           │    │               AEROTWIN AI                │
├──────────────────────────────────────────┤    ├──────────────────────────────────────────┤
│ • Static Threshold Alarms (CHT > 180°C) │    │ • Dynamic ISA Atmospheric Physics Envelope│
│ • High False Alarm & Alert Storms        │    │ • EKF Residual Noise Filtering           │
│ • Black-Box AI (No Auditability)         │    │ • Explainable AI (Shapley Attributions)  │
│ • Zero Predictive Horizon                │    │ • Probabilistic RUL with 95% CI Bands    │
│ • No Counterfactual Survival Options     │    │ • What-If Counterfactual Optimizer       │
│ • Paper/Manual Maintenance Logs          │    │ • Automated Maintenance Digital Thread   │
└──────────────────────────────────────────┘    └──────────────────────────────────────────┘
```

### 3.1 Challenge 1: Single-Engine Critical Dependency
MALE UAV sorties span 14 to 24 hours. Because these airframes carry a single engine, any unmanaged degradation leads directly to airframe loss or forced abort.

### 3.2 Challenge 2: Inadequacy of Static Threshold Alarms
Static threshold warnings (e.g. `If CHT > 180°C then WARN`) fail in aviation:
- At sea level on a cold day, a CHT of 170°C is an anomaly indicating coolant blockage.
- At FL160 on a hot summer climb, 170°C is within expected thermodynamic bounds.
Static thresholds cause either **false alarms** (cancelling vital missions) or **missed detections** (failing to catch localized damage).

### 3.3 Challenge 3: Telemetry Noise & Sensor Drift
Telemetry transmitted from airborne platforms suffers from high-frequency vibration noise and thermocouple drift. Legacy systems cannot distinguish between an actual oil pressure drop and a failing oil transducer.

### 3.4 Challenge 4: The Black-Box AI Risk in Defence Aviation
Unconstrained neural networks (such as standard LSTMs) lack physical boundaries and cannot explain *why* a fault was diagnosed. Defence aviation authorities (DGCA / CEMILAC) require auditable, physics-backed explanations before authorizing mission diversions.

### 3.5 Challenge 5: Lack of Predictive Mission Horizon
When a fault manifests 8 hours into a 16-hour sortie, commanders lack data on whether the engine can sustain the remaining 8 hours or if immediate descent is required.

---

## 4. SYSTEM ARCHITECTURE & 3-TIER MICROSERVICES

AeroTwin AI is structured as a 3-tier microservices architecture ensuring separation of concerns, high throughput, and air-gapped deployment capability.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               TIER 3: GROUND STATION GCS                               │
│                  React 18 + Vite + Three.js + Tailwind CSS + Recharts                  │
│                     3D UAV Digital Twin • Causal Graph • 14 Pages                      │
└───────────────────────────────────────────▲────────────────────────────────────────────┘
                                            │ (WebSockets & REST /api)
┌───────────────────────────────────────────▼────────────────────────────────────────────┐
│                             TIER 2: NODE.JS GATEWAY SERVER                             │
│                  Express Gateway + Socket.IO Broadcaster (1000ms stream)               │
│                  Dual PostgreSQL + Embedded Zero-Config Persistence                    │
│                  Maintenance Digital Thread & Grok Copilot Safety Guard                │
└───────────────────────────────────────────▲────────────────────────────────────────────┘
                                            │ (REST /process-telemetry, /simulate)
┌───────────────────────────────────────────▼────────────────────────────────────────────┘
│                          TIER 1: PYTHON 3.13 AI MICROSERVICE                           │
│             FastAPI + PyTorch (Bi-GRU & Transformer) + Scikit-Learn + SciPy            │
│             Physics Engine + Extended Kalman Filter + XAI + RUL Regressor              │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 4.1 Tier 1: Scientific AI Microservice (FastAPI / PyTorch)
- **Port**: `8000`
- **Responsibility**: Runs mathematical physics engines, Extended Kalman Filters, PyTorch neural models, Shapley XAI calculations, and RUL regressions.
- **Key Modules**:
  - `ai-service/app/simulation/`: Reduced-order thermodynamic engine & atmosphere physics.
  - `ai-service/app/anomaly/`: Isolation Forest & PyTorch Deep Autoencoder.
  - `ai-service/app/fault_prediction/`: 10-class PyTorch Bi-GRU & Lightweight Aero Transformer.
  - `ai-service/app/diagnostics/`: `RootCauseEngine` with temporal causality sequence calculation.
  - `ai-service/app/rul/`: `FailureHorizonEngine` with 95% Confidence Intervals.
  - `ai-service/app/orchestrator/`: `CentralAIOrchestrator` compiling canonical `EngineIntelligenceState`.

### 4.2 Tier 2: Mission Gateway Server (Node.js / Express)
- **Port**: `5000`
- **Responsibility**: Ingests high-frequency telemetry, broadcasts Socket.IO frames at 1Hz, manages database persistence, proxies Grok-2 API calls with aerospace guardrails, and manages structured work orders.
- **Key Modules**:
  - `backend/src/services/telemetrySource.js`: Real-time telemetry generator with fault injection.
  - `backend/src/services/maintenanceService.js`: Maintenance economics & Work Order engine.
  - `backend/src/services/grokService.js`: Copilot proxy with 12 deterministic tool bindings.

### 4.3 Tier 3: Tactical Ground Control Station (React 18 / Three.js)
- **Port**: `3000`
- **Responsibility**: Operates 14 distinct tactical pages, 3D WebGL Digital Twin, interactive directed causal graphs, universal action modals, and mission replay timeline scrubber.

---

## 5. THE 11-STAGE CLOSED-LOOP AUTONOMOUS INTELLIGENCE PIPELINE

AeroTwin AI executes a continuous closed-loop pipeline for every incoming telemetry frame:

```
  ┌──────────┐      ┌──────────┐      ┌──────────────┐      ┌──────────┐
  │ 1. SENSE │ ────►│ 2. FUSE  │ ────►│ 3.UNDERSTAND │ ────►│ 4. DETECT│
  └──────────┘      └──────────┘      └──────────────┘      └────┬─────┘
                                                                 │
  ┌──────────┐      ┌──────────┐      ┌──────────────┐           │
  │ 7.EXPLAIN│ ◄────│ 6.PREDICT│ ◄────│ 5. DIAGNOSE  │ ◄─────────┘
  └────┬─────┘      └──────────┘      └──────────────┘
       │
       ▼
  ┌──────────┐      ┌──────────┐      ┌──────────────┐      ┌──────────┐
  │8.SIMULATE│ ────►│9.OPTIMIZE│ ────►│10. RECOMMEND │ ────►│ 11. LEARN│
  └──────────┘      └──────────┘      └──────────────┘      └──────────┘
```

1. **SENSE**: Ingestion of 14 high-rate telemetry signals (RPM, MAP, CHT1-4, EGT1-4, Oil Pressure, Oil Temp, Fuel Flow, Vibration RMS, Battery Voltage).
2. **FUSE**: Extended Kalman Filtering (EKF) strips high-frequency vibration noise and calculates sensor residual deltas ($\mathbf{z}_k - \hat{\mathbf{x}}_{k|k-1}$).
3. **UNDERSTAND**: Reduced-order thermodynamics computes baseline expected parameters under ISA altitude and temperature conditions.
4. **DETECT**: Dual anomaly evaluation (**Isolation Forest + PyTorch Autoencoder**) flags out-of-manifold telemetry.
5. **DIAGNOSE**: 2-layer Bidirectional PyTorch GRU classifies fault across 10 discrete failure modes.
6. **PREDICT**: RUL Engine forecasts remaining operating hours, discrete hazard bands (`<1h`, `1-6h`, `6-24h`, `1-7d`, `>7d`), and 95% Confidence Intervals.
7. **EXPLAIN**: Shapley attributions rank top contributing sensors, generating plain-English root-cause narratives and directed causal graphs.
8. **SIMULATE**: Physics twin runs counterfactual forward projections under alternate flight plans.
9. **OPTIMIZE**: Multi-phase mission success model computes completion probability across Climb, Cruise, Loiter, and RTB phases.
10. **RECOMMEND**: Economics model evaluates Preventive Cost vs Failure Impact and issues structured Maintenance Work Orders.
11. **LEARN**: Online learning manager monitors residual drift and triggers retraining gating when model degradation exceeds thresholds.

---

## 6. MATHEMATICAL FORMULATION & PHYSICS ENGINE

The physics engine (`ai-service/app/simulation/engine_model.py`) models thermodynamic, mechanical, fluid, and atmospheric dynamics:

### 6.1 Shaft Power & Torque
$$P_{\text{shaft}} = \frac{2\pi \cdot N \cdot T}{60000} \quad (\text{kW})$$
Torque $T$ is governed by manifold air pressure ($P_{\text{MAP}}$), volumetric efficiency ($\eta_v$), and ambient air density ($\rho_a$):
$$T = T_{\text{base}} \cdot \left(\frac{P_{\text{MAP}}}{P_0}\right) \cdot \left(\frac{\rho_a}{\rho_0}\right) \cdot (1 - \delta_{\text{misfire}} - \delta_{\text{friction}})$$

### 6.2 Thermal Equilibrium (CHT & EGT)
$$\dot{Q}_{\text{gen}} = \dot{m}_f \cdot Q_{\text{LHV}} \cdot (1 - \eta_{\text{thermal}})$$
$$\dot{Q}_{\text{cooling}} = h_{\text{cooling}} \cdot A_{\text{cyl}} \cdot (T_{\text{CHT}} - T_{\text{ambient}}) \cdot \sqrt{\frac{N}{N_0}} \cdot \left(\frac{\rho_a}{\rho_0}\right)^{0.8}$$
$$T_{\text{CHT}}(t) = T_{\text{CHT}}(t-1) + \frac{\Delta t}{C_{\text{thermal}}} \cdot (\dot{Q}_{\text{gen}} - \dot{Q}_{\text{cooling}})$$

### 6.3 Lubrication Dynamics & Andrade Viscosity Decay
$$P_{\text{oil}} = f(N_{\text{RPM}}) \cdot \frac{\mu(T_{\text{oil}})}{\mu_0} - \Delta P_{\text{bearing wear}}$$
$$\mu(T_{\text{oil}}) = \mu_0 \cdot \exp\left(b_{\text{oil}} \cdot \left[\frac{1}{T_{\text{oil}} + 273.15} - \frac{1}{T_0 + 273.15}\right]\right)$$

### 6.4 Vibration Harmonics
$$f_1 = \frac{N}{60} \text{ Hz}, \quad f_{\text{firing}} = \frac{N}{30} \text{ Hz}$$
$$\text{Vib}_{\text{RMS}} = \text{Vib}_{\text{base}}(N, \text{Load}) + \Delta\text{Vib}_{\text{unbalance}} + \Delta\text{Vib}_{\text{misfire}}$$

---

## 7. MACHINE LEARNING & DEEP LEARNING ENSEMBLE

```
                          AI DIAGNOSTIC ENSEMBLE FLOW
┌───────────────────────┐   ┌───────────────────────┐   ┌───────────────────────┐
│   ISOLATION FOREST    │   │  PYTORCH AUTOENCODER  │   │   PYTORCH BI-GRU      │
│  Tree Anomaly Depth   │   │ Latent Manifold Recon │   │ 10-Class Classifier   │
└───────────┬───────────┘   └───────────┬───────────┘   └───────────┬───────────┘
            │                           │                           │
            └───────────────────┬───────┴───────────────────────────┘
                                ▼
                   [CENTRAL AI ORCHESTRATOR]
                     Canonical Engine Intelligence State
```

### 7.1 Isolation Forest Anomaly Detector
- **Model**: Scikit-learn Multivariate Isolation Forest
- **Features**: 12 scaled sensor channels
- **Output**: Normalized anomaly score $S_{\text{iForest}} \in [0, 1]$

### 7.2 PyTorch Deep Autoencoder
- **Architecture**: 7-layer symmetric neural network ($12 \to 16 \to 8 \to 4 \text{ (latent)} \to 8 \to 16 \to 12$)
- **Loss Function**: Mean Squared Error (MSE) reconstruction loss
- **Output**: Reconstruction error score $S_{\text{Autoencoder}} \in [0, 1]$

### 7.3 PyTorch Bidirectional GRU (10-Class Classifier)
- **Architecture**: 2-layer Bi-GRU with dropout ($0.2$), input sequence length $T=15$ steps.
- **Classes (10)**:
  1. `Healthy`
  2. `Severe Misfire`
  3. `Injector Abnormality`
  4. `Lubrication Degradation`
  5. `Sensor Drift`
  6. `Sensor Failure`
  7. `Combustion Instability`
  8. `Overheating`
  9. `Abnormal Vibration`
  10. `Electrical System Degradation`
- **Performance**: **98.2% accuracy**, **0.983 F1-score**.

### 7.4 Lightweight Aero Transformer
- **Architecture**: PyTorch Multi-Head Self-Attention model ($H=4$ heads, $D=64$ embedding dim).
- **Execution Modes**: `FAST` (2 heads, short window), `BALANCED` (4 heads), `HIGH_ACCURACY` (8 heads, deep sequence).

---

## 8. 3D DIGITAL TWIN & TACTICAL GROUND CONTROL STATION (GCS)

The Ground Control Station (`frontend/src/`) delivers a 14-page military-grade interface built with React 18, Three.js, and Tailwind CSS.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          TACTICAL GCS INTERFACE NAVIGATION                             │
├───────────────────┬───────────────────┬───────────────────┬────────────────────────┤
│ 1. Dashboard      │ 2. 3D Digital Twin│ 3. Live Telemetry │ 4. AI Diagnostics      │
│ 5. RUL & Hazard   │ 6. Simulator      │ 7. Mission Replay │ 8. What-If Analysis    │
│ 9. Fleet Station  │ 10. Maintenance   │ 11. AI Copilot    │ 12. Digital Reports    │
│ 13. AI Validation │ 14. CV Inspection │ 15. GCS Settings  │                        │
└───────────────────┴───────────────────┴───────────────────┴────────────────────────┘
```

### 8.1 Immersive 3D WebGL Airframe & Powerplant Model
- **Engine State Coupling**: Propeller rotational speed dynamically tracks simulated engine RPM via WebGL animation frame callbacks.
- **Dynamic Thermal Shader**: Custom GLSL vertex/fragment shaders map Cylinder Head Temperature (CHT) and Exhaust Gas Temperature (EGT) thermal distributions directly onto the 3D engine casing.
- **Engine Ignition State Machine**: True-to-life electrical sequence: `OFF` $\to$ `STARTING` (280 RPM starter cranking with procedural audio) $\to$ `RUNNING` $\to$ `SHUTDOWN`.
- **Flight Dynamics Effects**: Real-time pitch attitude, altitude climb/descent particle dust, and tactical grid overlay.

### 8.2 Operational Mode Switcher
The top bar features 4 role-based viewport modes:
1. **OPERATOR**: High-level tactical flight status, active alerts, and mission risk.
2. **ENGINEER**: Detailed sensor telemetry plots, raw residuals, and model confidence scores.
3. **MAINTENANCE**: Digital thread work orders, economics ROI, and component wear counters.
4. **COPILOT**: Interactive NLP query interface with Grok-2 aerospace grounding.

### 8.3 Interactive Directed Causal Graph Viewer
Visually renders the chronological order of failure propagation with millisecond delta-t tracking, identifying the initiating trigger (e.g., `fuel_flow` $\to +11.0s \to$ `egt` $\to +15.0s \to$ `rpm`).

---

## 9. EXPLAINABLE AI (XAI), RUL & COUNTERFACTUAL WHAT-IF ANALYSIS

### 9.1 Explainable AI (XAI) Shapley Attributions
To prevent black-box opacity, the XAI engine computes relative feature contributions for every diagnostic alert:
- **Fuel Flow Imbalance**: 42.0% contribution
- **EGT Delta (Cyl 2)**: 24.5% contribution
- **CHT Thermal Flux**: 18.0% contribution
- **MAP Pressure Delta**: 10.5% contribution
- **Vibration 1X Harmonic**: 5.0% contribution

### 9.2 Probabilistic RUL & Failure Horizon Engine
Computes Remaining Useful Life with **95% Confidence Intervals** ($[\text{RUL}_{\text{lower}}, \text{RUL}_{\text{upper}}]$) and classifies the failure risk into discrete time horizons:
- `< 1 hour`: Critical Immediate Abort
- `1 - 6 hours`: High Urgency Divert
- `6 - 24 hours`: Next Sortie Servicing
- `1 - 7 days`: Scheduled Maintenance
- `> 7 days`: Nominal Operation

### 9.3 Counterfactual "What-If" Simulation Engine
Enables mission commanders to run interactive trade-off evaluations:
- **Plan A (Current Course)**: FL140, 72% Throttle $\to$ 72% Success Probability (High Thermal Hazard).
- **Plan B (Descend & Throttle Back)**: FL90, 60% Throttle $\to$ **91% Success Probability** (Restores Thermal Margin).
- **Plan C (Immediate Divert)**: FL60, 45% Throttle $\to$ 85% Success Probability.

---

## 10. GROK AI COPILOT, MAINTENANCE DIGITAL THREAD & ECONOMICS

### 10.1 Grok-2 AI Copilot & Deterministic Tool Bindings
The Copilot operates via a secure backend proxy (`backend/src/services/grokService.js`) with 12 deterministic tool calls:
- `getEngineState()`: Retrieves live telemetry snapshot.
- `simulateMission()`: Evaluates mission feasibility scores.
- `computeCausality()`: Retrieves root-cause sequence.
- `generateWorkOrder()`: Creates structured maintenance tasks.

All responses are strictly grounded in Rotax operating manuals and AeroTwin SOPs with verifiable citations (e.g. `[ROTAX-914-MM-73-10]`, `[AERO-SOP-EMERG-03]`).

### 10.2 Maintenance Economics & Work Order Generator
Quantifies financial ROI in real time:
- **Preventive Servicing Cost**: ₹12,000 INR (Ultrasonic injector cleaning & seal replacement).
- **Expected Failure Impact**: ₹85,000 INR (Catastrophic cylinder destruction & emergency landing).
- **Work Order Output**: Generates military-formatted Work Orders detailing ATA chapters (e.g. ATA 73-10-00), required toolkits, step-by-step procedures, and urgency windows.

---

## 11. EMPIRICAL VALIDATION & 38-STEP ACCEPTANCE SUITE

### 11.1 Quantitative Benchmark Summary
*From `ai-service/trained_models/evaluation_metrics.json` (1,800 synthetic flight cycles):*

| Metric | Target Requirement | Measured Empirical Value | Status |
| :--- | :--- | :--- | :--- |
| **Temporal Fault Classifier Accuracy** | $> 95.0\%$ | **98.2%** | **PASSED** |
| **Fault Classifier F1-Score** | $> 0.950$ | **0.983** | **PASSED** |
| **Anomaly Detection ROC-AUC** | $> 0.900$ | **0.954** | **PASSED** |
| **RUL Mean Absolute Error (MAE)** | $< 120\text{ hours}$ | **93.21 operating hours** | **PASSED** |
| **Sensor Noise Tolerance** | Up to $10\%$ noise | **Passed under 15% Gaussian noise** | **PASSED** |
| **38-Step Acceptance Test Suite** | $100\%$ pass | **38 / 38 steps passed (100%)** | **PASSED** |

### 11.2 Acceptance Test Verification
Executed via `py -3.13 scripts/test_acceptance_38step.py`:
- All 38 closed-loop acceptance steps (ignition, altitude scaling, fault injection, residual divergence, Bi-GRU classification, root cause isolation, RUL contraction, XAI generation, What-If optimization, Copilot tool calling, Work Order generation, and audit logging) **passed with zero errors**.

---

## 12. DEPLOYMENT GUIDE & REPOSITORY STRUCTURE

### 12.1 Directory Structure
```
d:/SIH/
├── ai-service/                 # Python 3.13 FastAPI Scientific Microservice
│   ├── app/
│   │   ├── anomaly/            # Isolation Forest & PyTorch Autoencoder
│   │   ├── diagnostics/        # Causal Root Cause Engine
│   │   ├── fault_prediction/   # Bi-GRU & Aero Transformer models
│   │   ├── knowledge/          # RAG Aerospace Knowledge Base & SOPs
│   │   ├── learning/           # Online Drift Monitoring & Retraining
│   │   ├── mission/            # Mission Success & Trajectory Risk Model
│   │   ├── models/             # EngineIntelligenceState Pydantic schemas
│   │   ├── orchestrator/       # Central AI Orchestrator
│   │   ├── rul/                # Failure Horizon Engine & RUL Regressor
│   │   └── simulation/         # Reduced-order engine & atmosphere physics
│   ├── trained_models/         # Exported PyTorch (.pt) & Scikit weights
│   └── requirements.txt
├── backend/                    # Node.js Express Gateway & Socket.IO
│   ├── src/
│   │   ├── config/             # DB & persistence engine
│   │   ├── routes/             # REST API endpoints
│   │   ├── services/           # Telemetry, Maintenance & Grok services
│   │   └── websocket/          # Socket.IO 1Hz telemetry broadcaster
│   └── package.json
├── frontend/                   # React 18 + Vite + Three.js Tactical GCS
│   ├── src/
│   │   ├── components/         # 3D Twin, Causal Graph, Modals, ModeBar
│   │   ├── layouts/            # GCS Application Shell & Sidebar
│   │   ├── pages/              # 14 Tactical GCS viewports
│   │   ├── store/              # Zustand global telemetry state
│   │   └── utils/              # Sound FX & procedural audio
│   ├── package.json
│   └── vite.config.js
├── docs/                       # Architecture, Reports, PPTs & Scripts
│   ├── FULL_PROJECT_REPORT.md
│   ├── PRESENTATION_SPEAKER_SCRIPT.md
│   ├── PROBLEM_STATEMENT_AND_SOLUTION.md
│   ├── HOW_TO_EXPLAIN_THE_PROJECT.md
│   └── ppt_assets/             # Embedded high-res charts
├── scripts/                    # Test suites & chart generators
│   ├── test_acceptance_38step.py
│   ├── test_system.py
│   ├── generate_charts.py
│   └── generate_ppt.py
├── docker-compose.yml          # Complete 4-container orchestration
├── render.yaml                 # 1-Click Render Cloud Blueprint
└── vercel.json                 # Frontend Vercel deployment blueprint
```

### 12.2 One-Command Docker Deployment
```bash
git clone https://github.com/sroaychashamdeep/AeroTwin-AI.git
cd AeroTwin-AI
docker-compose up --build
```
Access the application at: **`http://localhost:3000`**

---

## 13. CONCLUSION & FUTURE SCOPE

**AEROTWIN AI** successfully upgrades traditional UAV telemetry monitoring into a physics-informed, autonomous propulsion intelligence platform. By uniting reduced-order thermodynamics, Extended Kalman Filtering, PyTorch deep learning ensembles, Explainable AI, and interactive 3D WebGL visualization, the system ensures complete operational transparency, predictive reliability, and quantifiable maintenance economics.

### Future Scope & Roadmap
1. **Hardware-in-the-Loop (HITL) Dyno Bench Validation**: Interfacing the digital twin with physical Rotax engine dyno-bench hardware via CAN bus / ARINC 429 protocols.
2. **On-Board Edge AI Deployment**: Quantizing PyTorch models via TensorRT for direct deployment on NVIDIA Jetson Orin defense avionics units.
3. **Multi-Engine Fleet Swarm Intelligence**: Extending the cross-airframe similarity engine to support heterogeneous UAV swarm logistics and automated squadron servicing.
