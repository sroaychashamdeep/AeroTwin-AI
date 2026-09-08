# AEROTWIN AI - System Architecture Document

## 1. System Overview

**AEROTWIN AI** is an aerospace-grade, real-time Digital Twin and Predictive Health Management (PHM) platform engineered for turbocharged aero piston engines (Rotax 914 / 915 iS class) used in Medium-Altitude Long-Endurance (MALE) Unmanned Aerial Vehicles (e.g. TAPAS-BH-201, Hermes 450, Predator XP).

```text
React (Port 3000) ──WebSocket / REST──> Node.js Gateway (Port 5000) ──REST──> FastAPI AI Service (Port 8000)
                                                 │                                          │
                                        PostgreSQL / Embedded Store                   PyTorch & Scikit Models
```

---

## 2. Reduced-Order Physics Model

The physics engine implements coupled thermodynamic, mechanical, lubrication, and aerodynamic relationships:

### A. Shaft Power & Torque
$$P_{\text{shaft}} = \frac{2\pi N T}{60 \times 1000} \quad (\text{kW})$$
Torque is modulated by throttle position, manifold air pressure (MAP), ambient air density, and mechanical degradation penalties.

### B. Specific Fuel Consumption (BSFC)
$$\text{BSFC} = \frac{\dot{m}_{\text{fuel}}}{P_{\text{shaft}}} \quad (\text{g/kWh})$$
The fuel flow rate $\dot{m}_f$ follows a non-linear efficiency curve with a minimum around 70% cruise power (~270 g/kWh).

### C. Thermal Dynamics (CHT & EGT)
$$\dot{Q}_{\text{gen}} = \dot{m}_f \cdot Q_{\text{LHV}} \cdot (1 - \eta_{\text{thermal}})$$
$$\dot{Q}_{\text{cooling}} = h_{\text{cooling}} A (T_{\text{CHT}} - T_{\text{ambient}}) \sqrt{\frac{N}{N_0}}$$
$$T_{\text{CHT}}(t) = T_{\text{CHT}}(t-1) + \frac{\Delta t}{C_{\text{thermal}}} (\dot{Q}_{\text{gen}} - \dot{Q}_{\text{cooling}})$$

### D. Lubrication Dynamics
$$P_{\text{oil}} = f(N_{\text{RPM}}) \cdot \frac{\mu(T_{\text{oil}})}{\mu_0} - \Delta P_{\text{bearing wear}}$$
Dynamic viscosity decays exponentially with increasing oil temperature according to the Andrade equation:
$$\mu(T) = \mu_0 \exp\left(\frac{b}{T + 273.15}\right)$$

### E. Vibration Harmonics
$$f_1 = \frac{N}{60} \text{ Hz}, \quad f_{\text{firing}} = 2 \times f_1 = \frac{N}{30} \text{ Hz}$$
$$\text{Vibration RMS} = \text{Vib}_{\text{base}}(N, \text{Load}) + \Delta\text{Vib}_{\text{unbalance}} + \Delta\text{Vib}_{\text{misfire}}$$

---

## 3. Sensor Fusion & State Estimation

State vector:
$$\mathbf{x} = [N_{\text{RPM}}, T_{\text{CHT}}, T_{\text{EGT}}, P_{\text{oil}}, T_{\text{oil}}, \dot{m}_f, \text{Vib}]^T$$

The Kalman filter executes continuous predict and update steps:
1. **Prediction**: $\hat{\mathbf{x}}_{k|k-1} = \mathbf{F} \hat{\mathbf{x}}_{k-1|k-1} + \mathbf{B} \mathbf{u}_k$
2. **Covariance**: $\mathbf{P}_{k|k-1} = \mathbf{F} \mathbf{P}_{k-1|k-1} \mathbf{F}^T + \mathbf{Q}$
3. **Gain**: $\mathbf{K}_k = \mathbf{P}_{k|k-1} (\mathbf{P}_{k|k-1} + \mathbf{R})^{-1}$
4. **Update**: $\hat{\mathbf{x}}_{k|k} = \hat{\mathbf{x}}_{k|k-1} + \mathbf{K}_k (\mathbf{z}_k - \hat{\mathbf{x}}_{k|k-1})$

Sensor residuals exceeding $3\sigma$ or zero-variance sensor locks trigger **Sensor Drift** or **Sensor Stuck** warnings.

---

## 4. Machine Learning Diagnostics Ensemble

1. **Isolation Forest**: Computes multivariate anomaly tree depth across 12 scaled features.
2. **PyTorch Autoencoder**: 7-layer deep neural network with bottleneck latent dimension (6 neurons). Reconstruction error ($\text{MSE}$) flags out-of-manifold states.
3. **Ensemble Anomaly Score**: Normalized weighted average $S \in [0, 1.0]$.
4. **PyTorch Temporal GRU**: Bidirectional 2-layer GRU with 15-step sliding window predicting probabilities across 10 fault classes:
   - Healthy
   - Misfire
   - Injector Abnormality
   - Lubrication Degradation
   - Sensor Drift
   - Sensor Failure
   - Combustion Instability
   - Overheating
   - Abnormal Vibration
   - Electrical System Degradation
5. **RUL Regressor**: Predicts Remaining Useful Life in operating hours, degradation index ($0-100\%$), and $95\%$ confidence intervals.
