"""
AEROTWIN AI - Sensor Fusion & Kalman Filter Engine
State Estimation and Sensor Fault Diagnostics
"""

import numpy as np
from typing import Dict, Any, List, Tuple, Optional

class EngineKalmanFilter:
    """
    Multivariate Kalman Filter for engine telemetry state estimation.
    State vector: [RPM, CHT, EGT, Oil_Press, Oil_Temp, Fuel_Flow, Vibration]
    """
    def __init__(self):
        self.state_dim = 7
        self.state_names = ["rpm", "cht", "egt", "oil_pressure", "oil_temperature", "fuel_flow", "vibration"]
        
        # Initial state estimate
        self.x = np.array([4900.0, 145.0, 790.0, 4.2, 92.0, 18.5, 2.2], dtype=np.float64)
        
        # Error covariance matrix P
        self.P = np.eye(self.state_dim) * 10.0
        
        # State transition matrix F (slowly varying quasi-steady state with damping)
        self.F = np.eye(self.state_dim)
        
        # Process noise covariance Q (trust in physical persistence)
        self.Q = np.diag([15.0, 0.8, 4.0, 0.05, 0.3, 0.2, 0.05])
        
        # Measurement noise covariance R (sensor sensor variances)
        self.R = np.diag([25.0, 1.2, 9.0, 0.08, 0.5, 0.3, 0.08])
        
        # Sensor history for stuck / drift detection
        self.history = {k: [] for k in self.state_names}
        self.max_history = 20

    def step(self, measurement_dict: Dict[str, float], physics_dict: Optional[Dict[str, float]] = None) -> Tuple[Dict[str, float], Dict[str, Any]]:
        """
        Executes Predict & Update steps of Kalman Filter.
        Computes residual against physical model and generates sensor confidence metrics.
        """
        # Measurement vector z
        z = np.array([
            measurement_dict.get("rpm", self.x[0]),
            measurement_dict.get("cht", self.x[1]),
            measurement_dict.get("egt", self.x[2]),
            measurement_dict.get("oil_pressure", self.x[3]),
            measurement_dict.get("oil_temperature", self.x[4]),
            measurement_dict.get("fuel_flow", self.x[5]),
            measurement_dict.get("vibration", self.x[6])
        ], dtype=np.float64)

        # 1. Predict Step
        # If physics prediction is available, blend it into state prediction
        if physics_dict:
            x_phys = np.array([
                physics_dict.get("rpm", self.x[0]),
                physics_dict.get("cht", self.x[1]),
                physics_dict.get("egt", self.x[2]),
                physics_dict.get("oil_pressure", self.x[3]),
                physics_dict.get("oil_temperature", self.x[4]),
                physics_dict.get("fuel_flow", self.x[5]),
                physics_dict.get("vibration", self.x[6])
            ], dtype=np.float64)
            x_pred = 0.85 * (self.F @ self.x) + 0.15 * x_phys
        else:
            x_pred = self.F @ self.x

        P_pred = self.F @ self.P @ self.F.T + self.Q

        # 2. Update Step
        y_residual = z - x_pred  # Innovation residual
        S = P_pred + self.R      # Innovation covariance
        K = P_pred @ np.linalg.inv(S) # Kalman gain

        self.x = x_pred + K @ y_residual
        self.P = (np.eye(self.state_dim) - K) @ P_pred

        # 3. Update sensor history and diagnostics
        sensor_diagnostics = {}
        faulty_sensors = []

        # Standard nominal tolerance thresholds
        thresholds = {
            "rpm": 250.0,
            "cht": 20.0,
            "egt": 60.0,
            "oil_pressure": 0.8,
            "oil_temperature": 15.0,
            "fuel_flow": 4.0,
            "vibration": 1.5
        }

        total_conf = 0.0

        for i, name in enumerate(self.state_names):
            meas_val = z[i]
            est_val = self.x[i]
            phys_val = physics_dict.get(name, est_val) if physics_dict else est_val
            
            res_physics = abs(meas_val - phys_val)
            thresh = thresholds[name]
            
            # Confidence score calculation (1.0 = perfect, 0.0 = completely failed)
            conf = max(0.0, min(1.0, 1.0 - (res_physics / (thresh * 2.5))))
            total_conf += conf
            
            # Check history for stuck sensor
            hist = self.history[name]
            hist.append(meas_val)
            if len(hist) > self.max_history:
                hist.pop(0)

            is_stuck = False
            if len(hist) >= 10:
                variance = float(np.var(hist))
                if variance < 1e-6:
                    is_stuck = True

            # Diagnosis
            diag = "NOMINAL"
            is_faulty = False
            if is_stuck:
                diag = "STUCK_SENSOR"
                is_faulty = True
                conf = min(conf, 0.15)
            elif res_physics > thresh:
                diag = "DRIFT_OR_BIAS"
                is_faulty = True
                conf = min(conf, 0.35)

            if is_faulty:
                faulty_sensors.append(name)

            sensor_diagnostics[name] = {
                "measured": round(float(meas_val), 2),
                "filtered_state": round(float(est_val), 2),
                "physics_expected": round(float(phys_val), 2),
                "residual": round(float(res_physics), 2),
                "confidence_score": round(float(conf * 100.0), 1),
                "status": diag,
                "is_faulty": is_faulty
            }

        filtered_dict = {name: round(float(self.x[i]), 2) for i, name in enumerate(self.state_names)}
        system_confidence = round(float((total_conf / self.state_dim) * 100.0), 1)

        diagnostics_result = {
            "sensor_residuals": sensor_diagnostics,
            "faulty_sensors": faulty_sensors,
            "system_confidence": system_confidence
        }

        return filtered_dict, diagnostics_result
