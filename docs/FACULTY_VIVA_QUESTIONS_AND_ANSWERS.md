# AEROTWIN AI — FACULTY & EVALUATOR VIVA QUESTIONS & ANSWERS
### Comprehensive Defense Guide for Major Project Viva, Faculty Evaluation & Technical Jury

---

## CATEGORY 1: PROBLEM STATEMENT & DOMAIN CONTEXT

### Q1.1: What is the core problem your project addresses, and why is it important for defence/aerospace?
**Answer**:  
MALE (Medium-Altitude Long-Endurance) UAVs like India's **TAPAS-BH-201 (Rustom-II)** conduct long 14-to-24-hour reconnaissance missions carrying a **single aero piston engine** (Rotax 914 / 915 iS). 
Existing systems rely on **static threshold warnings** (e.g. *Warn if CHT > 180°C*). At high altitude or high ambient temperature, static thresholds produce either **high false alarm rates** or **detect failures too late**, leading to catastrophic mid-flight engine seizure and loss of multi-crore UAV assets. 
AeroTwin AI introduces a real-time, physics-informed digital twin and AI ensemble that detects microscopic degradation hours before failure, explains the root cause, and evaluates whether the UAV can complete its mission.

### Q1.2: Why did you choose the Rotax 914 / 915 iS engine specifically?
**Answer**:  
The Rotax 914 / 915 iS is the global industry-standard turbocharged 4-stroke aero piston engine powering the majority of tactical MALE UAVs, including DRDO's TAPAS-BH-201, Hermes 450, and Heron TP class airframes. Choosing a specific, real-world engine allowed us to embed exact physical equations (displacement: 1,352 cc, 115 HP @ 5800 RPM, FADEC dual fuel injection) rather than generic toy models.

---

## CATEGORY 2: ARCHITECTURE & SYSTEM DESIGN

### Q2.1: Explain the overall system architecture of AeroTwin AI.
**Answer**:  
The system is built as a **decoupled 3-tier microservices architecture**:
1. **Tier 1 (AI Microservice — Python 3.13 / FastAPI)**: Handles scientific computations, reduced-order thermodynamic physics models, Extended Kalman Filtering, PyTorch neural inference, Shapley XAI, and RUL estimation.
2. **Tier 2 (Gateway Server — Node.js / Express / Socket.IO)**: Ingests telemetry, broadcasts Socket.IO streams at 1Hz, handles database persistence (PostgreSQL + embedded store fallback), and manages the Grok Copilot proxy.
3. **Tier 3 (Tactical GCS — React 18 / Three.js / Vite)**: Renders a 14-page Ground Control Station UI with a 3D WebGL Digital Twin, interactive causal graphs, and operational mode viewports.

### Q2.2: Why did you separate the backend into FastAPI (Python) and Express (Node.js) instead of using a single framework?
**Answer**:  
Python is ideal for heavy scientific computing, PyTorch tensors, and matrix operations in the Kalman Filter. Node.js with Socket.IO excels at high-concurrency, sub-second asynchronous event broadcasting to frontend clients. Decoupling them prevents heavy ML inference from blocking real-time WebSocket telemetry delivery.

---

## CATEGORY 3: PHYSICS ENGINE & SENSOR FUSION

### Q3.1: How does your Physics Engine work, and how does it prevent false alarms at different altitudes?
**Answer**:  
Our reduced-order engine physics model uses the **International Standard Atmosphere (ISA) model** to adjust expected engine parameters dynamically based on altitude (up to FL180), airspeed, and ambient temperature.
For example, cooling heat flux $\dot{Q}_{\text{cooling}}$ is modeled as:
$$\dot{Q}_{\text{cooling}} = h_{\text{cooling}} \cdot A_{\text{cyl}} \cdot (T_{\text{CHT}} - T_{\text{ambient}}) \cdot \sqrt{\frac{N}{N_0}} \cdot \left(\frac{\rho_a}{\rho_0}\right)^{0.8}$$
As air density $\rho_a$ drops at high altitude, the expected baseline temperature envelope scales automatically, preventing false alarms.

### Q3.2: Why use an Extended Kalman Filter (EKF)? How does it handle sensor noise and drift?
**Answer**:  
Raw UAV sensor data contains high-frequency mechanical vibration noise and electromagnetic interference. The EKF predicts the expected state vector $\hat{\mathbf{x}}_{k|k-1}$ using physics dynamics and updates it with measurement matrix $\mathbf{z}_k$. 
By examining the **measurement residual delta** ($\mathbf{z}_k - \hat{\mathbf{x}}_{k|k-1}$), if a single sensor (e.g. Oil Pressure) diverges while all thermodynamic state equations remain consistent, the EKF flags **Sensor Drift / Sensor Failure** rather than misinterpreting it as an actual mechanical breakdown.

---

## CATEGORY 4: MACHINE LEARNING & DEEP LEARNING ENSEMBLE

### Q4.1: What machine learning models are used in AeroTwin AI, and what are their specific roles?
**Answer**:  
We use a multi-model ensemble:
1. **Isolation Forest**: Scikit-learn multivariate tree model for un-supervised anomaly score calculation.
2. **PyTorch Deep Autoencoder**: 7-layer symmetric neural net ($12 \to 16 \to 8 \to 4 \to 8 \to 16 \to 12$) measuring manifold reconstruction error.
3. **PyTorch Bidirectional GRU (Bi-GRU)**: 2-layer sequence classifier with a 15-step sliding window predicting probabilities across **10 discrete fault classes**.
4. **Lightweight Aero Transformer**: Multi-head self-attention model ($H=4$ heads) capturing temporal cross-channel correlations.
5. **XGBoost / Gradient Boosting Regressor**: Predicts Remaining Useful Life (RUL) in operating hours.

### Q4.2: Why did you use a Bidirectional GRU instead of a standard LSTM or RNN?
**Answer**:  
GRUs have fewer parameters than LSTMs (2 gates vs 3 gates), making them faster for real-time inference on edge avionics. The **Bidirectional** architecture processes temporal dependencies both forward and backward across a 15-second sliding window, capturing early transient fault signatures (like subtle fuel flow pulses before EGT spikes) much better than unidirectional networks.

---

## CATEGORY 5: EXPLAINABLE AI (XAI) & REMAINING USEFUL LIFE (RUL)

### Q5.1: What is Explainable AI (XAI) in your system, and why is it necessary?
**Answer**:  
In military aviation, a black-box notification saying "Error 502" is unusable. Our XAI module computes real-time **Shapley feature attributions** showing the exact mathematical percentage contribution of each sensor to an alert (e.g., *Fuel Flow Imbalance: 42.0%, EGT Delta: 24.5%*). It also constructs an interactive **Directed Causal Graph** showing the chronological sequence of failure ("What changed first?").

### Q5.2: How do you calculate Remaining Useful Life (RUL), and how do you handle uncertainty?
**Answer**:  
RUL is calculated using a hybrid model combining degradation velocity ($\frac{dH}{dt}$) and an XGBoost regression model trained on run-to-failure synthetic flight profiles. Rather than outputting a single point estimate, we provide dynamic **95% Confidence Intervals** ($[\text{RUL}_{\text{lower}}, \text{RUL}_{\text{upper}}]$) that widen as sensor noise increases and contract as fault signatures solidify.

---

## CATEGORY 6: REAL-TIME TELEMETRY & WEBSOCKETS

### Q6.1: How is real-time telemetry streamed to the user interface?
**Answer**:  
The backend telemetry source runs an asynchronous loop broadcasting Socket.IO frames at **1,000 ms (1Hz)** intervals under event name `telemetry_stream`. The React frontend uses a global **Zustand store** (`useTelemetryStore`) to update UI components, WebGL 3D propeller rotation, and telemetry charts without causing full React page re-renders.

### Q6.2: What happens if the network connection drops or latency increases?
**Answer**:  
Socket.IO handles automatic reconnection with exponential backoff (10 reconnection attempts). If the connection is severed, the Zustand store flags `connected: false`, the UI displays a telemetry disconnect banner, and the 3D twin smoothly degrades to idle holding state.

---

## CATEGORY 7: TESTING, EVALUATION & BENCHMARKS

### Q7.1: How did you test and validate your system? What are your benchmark results?
**Answer**:  
We validated the system using a dedicated test suite (`scripts/test_system.py`) and a 38-step end-to-end acceptance script (`scripts/test_acceptance_38step.py`):
- **Bi-GRU Temporal Classification Accuracy**: **98.2%** across 10 fault classes (**0.983 F1-score**).
- **Anomaly Detection ROC-AUC**: **0.954**.
- **RUL Prediction MAE**: **93.21 operating hours**.
- **Acceptance Test Suite**: **38 / 38 steps passed (100% pass rate)**.

### Q7.2: Did you test the system under noisy or extreme conditions?
**Answer**:  
Yes. We evaluated the Extended Kalman Filter under synthetic Gaussian sensor noise up to 15% and simulated extreme high-altitude ambient temperatures (38°C at 15,000 ft). The EKF filtered out the noise without triggering false positive diagnostics.

---

## CATEGORY 8: DEPLOYMENT & REAL-WORLD PRACTICALITY

### Q8.1: Can this system be deployed in an air-gapped, offline military environment?
**Answer**:  
Yes, 100%. The system requires zero external cloud dependencies. It includes an embedded zero-config datastore, local PyTorch model binaries, and offline knowledge bases. It can be launched in any forward operating base using a single command: `docker-compose up --build`.

### Q8.2: How does the system help mission commanders make tactical decisions during a flight?
**Answer**:  
Through our **Counterfactual "What-If" Simulator**. When an engine fault occurs, the commander can compare flight plans:
- **Plan A (Current Course)**: FL140 @ 72% Throttle $\to$ 72% Success Probability.
- **Plan B (Descend & Throttle Back)**: FL90 @ 60% Throttle $\to$ **91% Success Probability** (Restores CHT thermal margin).
This provides actionable, quantitative decision support to save the aircraft.

### Q8.3: What is the future scope or next phase of this project?
**Answer**:  
1. **Hardware-in-the-Loop (HITL) Dyno Bench Integration**: Interfacing with actual Rotax engine dyno-bench hardware over CAN bus / ARINC 429 avionics protocols.
2. **Edge AI TensorRT Optimization**: Quantizing PyTorch models to run on NVIDIA Jetson Orin defense edge hardware mounted directly inside the UAV avionics bay.
