# AEROTWIN AI - Step-by-Step Demonstration Guide

Follow this end-to-end evaluation flow to demonstrate the full capabilities of **AEROTWIN AI**:

---

## 16-Step Live Demonstration Script

### Step 1: Open Command Center
- Navigate to `http://localhost:3000/dashboard`.
- Notice the dark command-center aesthetic, live status badges, tactical status bar, and real-time telemetry gauges.

### Step 2: Start Healthy Engine
- Confirm the powerplant is operating nominally.
- Health Index is approximately **94–96%**.
- Anomaly score is **Normal (< 0.25)** and primary fault is **Healthy**.

### Step 3: Start Simulated ISR Mission
- Notice the active mission banner: `MSN-ISR-0841 (ISR at 12,000 ft, 70% Throttle)`.
- Risk indicator displays **LOW RISK**.

### Step 4: Show Live Telemetry
- Inspect the rolling telemetry graph on the Command Center or click **LIVE TELEMETRY** in the sidebar.
- Observe physical correlations: RPM directly dictates fuel burn, cooling air factor, and baseline vibration harmonics.

### Step 5: Inject Injector Degradation
- Click the red **FAULT INJECTOR** button in the top navigation bar.
- Select **"2. Injector Degradation"** or drag the **Injector Degradation slider to 75%**.
- Click **Confirm & Close**.

### Step 6: AI Detects Increasing Anomaly Score
- Watch the live telemetry respond:
  - Fuel flow rate spikes (+20–30%)
  - Exhaust Gas Temperature (EGT) climbs
  - Cylinder Head Temperature (CHT) increases
- Anomaly score increases from `0.18` (Normal) to **`0.72–0.85` (Critical)**.

### Step 7: Fault Prediction Appears
- The **Active Diagnostic Alert** banner appears immediately at the top of the screen:
  - `AI DIAGNOSTIC ALERT: Injector Abnormality (82–88% Confidence)`
  - Severity badge flashes **HIGH / CRITICAL**.

### Step 8: Explainable AI Shows Why
- Click **AI DIAGNOSTICS** in the sidebar or click **"View XAI Breakdown"**.
- View the **Explainable AI Feature Attribution**:
  - `Fuel Flow: +24% abnormal increase`
  - `EGT: +14% abnormal increase`
  - `Vibration: +9% mechanical combustion roughness`
  - Engineering narrative clearly explains the root cause.

### Step 9: Remaining Useful Life (RUL) Decreases
- Click **RUL & DEGRADATION** in the sidebar.
- Observe that estimated RUL has dropped from **182 hours down to ~85–95 hours**.
- The 95% confidence interval dynamically shifts downward to reflect accelerated stress accumulation.

### Step 10: Mission Risk Escalates
- In the Command Center, the mission risk indicator shifts from **LOW RISK** to **HIGH / ELEVATED RISK**.

### Step 11: Open What-If Analysis
- Navigate to **WHAT-IF ANALYSIS** (`/what-if`).
- Mission A represents the current high-stress envelope (FL120, 65% throttle, 25°C).
- Mission B represents an alternative hot, high-throttle envelope (FL180, 80% throttle, 42°C).

### Step 12: Run Alternative Mission Comparison
- Click **"EXECUTE WHAT-IF COMPARISON"**.

### Step 13: System Recommends the Lower-Risk Mission
- Review the comparison table:
  - System flags Delta Fuel (+kg), Delta CHT (+°C), and Delta RUL hours consumed.
  - Automated directive issues: `"Mission A is strongly recommended..."`.

### Step 14: Open AI Copilot
- Navigate to **AI COPILOT** (`/ai-copilot`).
- Click the quick prompt: **"Why is engine health decreasing?"**.
- Grok / Offline Knowledge Engine evaluates the **actual live telemetry snapshot** and outputs the 5 structured sections:
  1. Engineering Assessment
  2. Physical & Sensor Evidence
  3. Operational & Mission Risk
  4. Prescriptive Maintenance Recommendation
  5. Uncertainty & Limitations

### Step 15: Open Mission Replay
- Navigate to **MISSION REPLAY** (`/mission-replay`).
- Scrub the interactive timeline slider.
- Point out the red **FAULT ONSET MARKER at T+4.8 hours**, demonstrating exactly when degradation began during the sortie.

### Step 16: Open Maintenance Center
- Navigate to **MAINTENANCE CENTER** (`/maintenance`).
- Review the active work order: `Inspect Cylinder 3 Electro-Injector and Flow Test`.
- Click **"Inspected"** or **"Resolved"** to demonstrate technician lifecycle tracking.

This completes the comprehensive end-to-end propulsion digital twin demonstration story.
