# AEROTWIN AI — IMPORTANT TECHNOLOGIES, MODELS & ARCHITECTURE USED

---

## 1. FRONTEND & 3D VISUALIZATION STACK (Ground Control Station UI)

* **React 18 & Vite**: Lightning-fast component-based frontend framework and build tool powering the 14-page military-grade Ground Control Station (GCS).
* **Three.js & `@react-three/fiber` / `@react-three/drei`**: High-performance WebGL 3D graphics rendering the TAPAS-BH-201 MALE UAV airframe in real-time.
  - **Custom GLSL Shader**: Dynamically renders a thermal heat flux map across the 3D engine casing based on Cylinder Head Temperature (CHT) and Exhaust Gas Temperature (EGT).
  - **Dynamic Propeller Coupling**: Propeller rotation speed is frame-coupled directly to simulated engine RPM.
* **Tailwind CSS & Lucide Icons**: Modern dark-mode cybersecurity aesthetic with glassmorphic cards, custom tactical badges, and role-based themes.
* **Recharts**: High-frequency telemetry graphing for multi-channel sensor feeds (RPM, CHT, EGT, Oil Pressure, Fuel Flow, Vibration).
* **Zustand**: Lightweight, zero-boilerplate global state management storing live telemetry frames, connection states, and universal modal states.

---

## 2. BACKEND & WEBSOCKET GATEWAY STACK

* **Node.js & Express.js**: REST API gateway handling authentication, mission controls, and maintenance work orders on port 5000.
* **Socket.IO**: Real-time bi-directional WebSocket engine broadcasting telemetry frames to connected clients at **1,000 ms (1Hz)** intervals.
* **PostgreSQL & Dual Embedded Store**: Dual-mode persistence engine. Supports PostgreSQL when available, or seamlessly falls back to an in-memory embedded datastore with zero configuration.
* **Predictive Alert Storm Suppression**: Backend filtering algorithm that suppresses redundant alarm cascades when a single root cause triggers multiple downstream warnings.

---

## 3. AI / ML & DEEP LEARNING STACK (Python 3.13 & FastAPI)

* **FastAPI & Uvicorn**: High-performance asynchronous Python REST microservice running on port 8000 for scientific AI inference.
* **PyTorch (Torch)**:
  - **Bidirectional GRU (Bi-GRU)**: 2-layer temporal sequence classifier (15-step window) classifying faults across **10 discrete failure modes** with **98.2% accuracy**.
  - **Deep Autoencoder**: 7-layer symmetric neural network ($12 \to 16 \to 8 \to 4 \to 8 \to 16 \to 12$) measuring manifold reconstruction error.
  - **Lightweight Aero Transformer**: Multi-head self-attention model ($H=4$ heads) capturing cross-channel temporal dependencies.
* **Scikit-Learn**:
  - **Isolation Forest**: Unsupervised multivariate tree anomaly detector.
* **XGBoost & SciPy**: Gradient boosting regressor predicting Remaining Useful Life (RUL) with **95% Confidence Intervals**.

---

## 4. PHYSICS & THERMODYNAMIC ENGINE

* **International Standard Atmosphere (ISA) Model**: Dynamically recalculates air density ($\rho_a$), ambient pressure, and ambient temperature up to 18,000 ft (FL180) to scale nominal CHT/EGT expectations.
* **Extended Kalman Filter (EKF)**: Fuses 14 telemetry channels, strips mechanical vibration noise, and calculates sensor measurement residuals to separate **real mechanical failures** from **sensor drift/transducer failure**.
* **Engine Thermodynamics Equations**:
  - Shaft Power & Torque ($P_{\text{shaft}} = \frac{2\pi NT}{60000}$).
  - Thermal Equilibrium ($\dot{Q}_{\text{gen}}$ vs $\dot{Q}_{\text{cooling}}$).
  - Andrade Oil Viscosity Decay ($\mu(T_{\text{oil}}) = \mu_0 \exp\left(b \left[\frac{1}{T_{\text{oil}}+273.15} - \frac{1}{T_0+273.15}\right]\right)$).

---

## 5. EXPLAINABLE AI (XAI) & DECISION SUPPORT

* **Shapley Feature Attribution**: Mathematically ranks top sensor contributors for every diagnostic alert (e.g. *Fuel Flow: 42.0%, EGT: 24.5%*).
* **RootCauseEngine & Directed Causal Graph**: Tracks chronological sequence of failure onset with millisecond delta-t precision (*"What changed first?"*).
* **Counterfactual "What-If" Simulator**: Evaluates alternate flight profiles (Plan A vs Plan B) to optimize throttle/altitude and preserve thermal margins.
* **Grok-2 AI Copilot Proxy**: NLP maintenance assistant backed by 12 deterministic tool calls with verifiable citations from Rotax operating manuals.

---

## 6. DEPLOYMENT & TESTING TOOLS

* **Docker & Docker Compose**: 4-container orchestration (`postgres`, `ai-service`, `backend`, `frontend`) for 1-command air-gapped deployment.
* **Render & Vercel Blueprints**: Multi-service cloud deployment configurations (`render.yaml`, `vercel.json`).
* **Python Test Suite**: Automated 38-step end-to-end acceptance script (`scripts/test_acceptance_38step.py`) and system regression suite (`scripts/test_system.py`) with 100% pass rate.
