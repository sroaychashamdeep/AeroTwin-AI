"""
AEROTWIN AI - Ensemble Anomaly Detection Engine
PyTorch Neural Network Autoencoder + Scikit-Learn Isolation Forest
"""

import os
import torch
import torch.nn as nn
import numpy as np
import joblib
from sklearn.ensemble import IsolationForest
from typing import Dict, Any, Tuple, Optional

class EngineAutoencoder(nn.Module):
    """Deep Autoencoder for learning nominal manifold of healthy aero engine telemetry."""
    def __init__(self, input_dim: int = 12):
        super(EngineAutoencoder, self).__init__()
        # Encoder
        self.encoder = nn.Sequential(
            nn.Linear(input_dim, 24),
            nn.BatchNorm1d(24),
            nn.SiLU(),
            nn.Linear(24, 12),
            nn.BatchNorm1d(12),
            nn.SiLU(),
            nn.Linear(12, 6) # Latent bottleneck
        )
        # Decoder
        self.decoder = nn.Sequential(
            nn.Linear(6, 12),
            nn.BatchNorm1d(12),
            nn.SiLU(),
            nn.Linear(12, 24),
            nn.BatchNorm1d(24),
            nn.SiLU(),
            nn.Linear(24, input_dim)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        latent = self.encoder(x)
        reconstruction = self.decoder(latent)
        return reconstruction

class EnsembleAnomalyDetector:
    FEATURE_NAMES = [
        "rpm", "cht", "egt", "oil_pressure", "oil_temperature",
        "fuel_flow", "vibration", "battery_voltage", "injection_timing",
        "throttle", "torque", "power"
    ]

    # Nominal bounds for min-max scaling
    FEATURE_MINS = np.array([1200.0, 80.0, 500.0, 1.0, 60.0, 3.0, 0.5, 22.0, 10.0, 0.0, 20.0, 10.0], dtype=np.float32)
    FEATURE_MAXS = np.array([6000.0, 220.0, 950.0, 6.0, 135.0, 42.0, 12.0, 30.0, 32.0, 100.0, 180.0, 120.0], dtype=np.float32)

    def __init__(self, models_dir: str = "trained_models"):
        self.models_dir = models_dir
        self.input_dim = len(self.FEATURE_NAMES)
        self.autoencoder = EngineAutoencoder(self.input_dim)
        self.isolation_forest: Optional[IsolationForest] = None
        self.is_loaded = False
        
        # Configurable classification thresholds
        self.thresh_normal = 0.30
        self.thresh_attention = 0.60
        self.thresh_warning = 0.80

        self._load_or_initialize()

    def _normalize(self, features: np.ndarray) -> np.ndarray:
        denom = self.FEATURE_MAXS - self.FEATURE_MINS
        denom[denom == 0] = 1.0
        norm = (features - self.FEATURE_MINS) / denom
        return np.clip(norm, 0.0, 1.5)

    def _extract_vector(self, data: Dict[str, float]) -> np.ndarray:
        vec = []
        for name in self.FEATURE_NAMES:
            val = float(data.get(name, 0.0))
            vec.append(val)
        return np.array(vec, dtype=np.float32)

    def _load_or_initialize(self):
        ae_path = os.path.join(self.models_dir, "autoencoder.pt")
        if_path = os.path.join(self.models_dir, "isolation_forest.joblib")

        if os.path.exists(ae_path) and os.path.exists(if_path):
            try:
                self.autoencoder.load_state_dict(torch.load(ae_path, map_location=torch.device('cpu'), weights_only=True))
                self.autoencoder.eval()
                self.isolation_forest = joblib.load(if_path)
                self.is_loaded = True
                return
            except Exception as e:
                print(f"[AnomalyDetector] Warning loading saved models: {e}. Reinitializing.")

        # If not trained yet, initialize with default Isolation Forest
        self.isolation_forest = IsolationForest(
            n_estimators=100,
            contamination=0.05,
            random_state=42
        )
        # Train baseline dummy nominal dataset so model is instantly functional
        np.random.seed(42)
        nominal_features = np.zeros((300, self.input_dim), dtype=np.float32)
        # Populate nominal range
        for i in range(300):
            throttle = np.random.uniform(50.0, 85.0)
            rpm = 1600.0 + (5800.0 - 1600.0) * (throttle / 100.0) ** 0.85
            cht = 135.0 + throttle * 0.25 + np.random.normal(0, 3)
            egt = 780.0 + throttle * 0.6 + np.random.normal(0, 8)
            oil_p = 3.8 + (rpm / 5800.0) * 1.0 + np.random.normal(0, 0.1)
            oil_t = 88.0 + throttle * 0.15 + np.random.normal(0, 2)
            ff = 15.0 + (throttle / 100.0) * 16.0 + np.random.normal(0, 0.5)
            vib = 1.8 + (rpm / 5800.0) * 1.2 + np.random.normal(0, 0.1)
            volt = 28.0 + np.random.normal(0, 0.1)
            timing = 22.0 + np.random.normal(0, 0.5)
            torque = 135.0 * (throttle / 100.0)
            power = (2 * np.pi * rpm * torque) / 60000.0

            nominal_features[i] = [rpm, cht, egt, oil_p, oil_t, ff, vib, volt, timing, throttle, torque, power]

        norm_nominal = self._normalize(nominal_features)
        self.isolation_forest.fit(norm_nominal)
        self.autoencoder.eval()
        self.is_loaded = True

    def predict(self, telemetry_dict: Dict[str, float]) -> Dict[str, Any]:
        """
        Computes Isolation Forest Score and Autoencoder Reconstruction Score,
        returning the ensemble anomaly score and severity classification.
        """
        raw_vec = self._extract_vector(telemetry_dict).reshape(1, -1)
        norm_vec = self._normalize(raw_vec)

        # 1. Isolation Forest score
        # decision_function gives signed distance (negative for anomaly, positive for inliers)
        if_score_raw = self.isolation_forest.decision_function(norm_vec)[0]
        # Map decision function roughly to [0, 1] anomaly score where 1 is extreme anomaly
        # Typically if_score is between -0.3 and 0.25
        if_anomaly_score = float(np.clip((0.18 - if_score_raw) / 0.35, 0.0, 1.0))

        # 2. PyTorch Autoencoder Reconstruction Loss
        self.autoencoder.eval()
        with torch.no_grad():
            t_in = torch.tensor(norm_vec, dtype=torch.float32)
            recon = self.autoencoder(t_in)
            mse_loss = nn.functional.mse_loss(t_in, recon).item()
            # Normalize Autoencoder MSE to [0, 1]
            # Normal baseline MSE is < 0.015; severe faults reach > 0.15
            ae_anomaly_score = float(np.clip(mse_loss / 0.12, 0.0, 1.0))

        # 3. Physics Residual Perturbation Factor
        # Direct check on critical physical limits (e.g. CHT > 185, Oil P < 2.0, Vib > 5.0)
        phys_multiplier = 1.0
        cht = telemetry_dict.get("cht", 140.0)
        oil_p = telemetry_dict.get("oil_pressure", 4.0)
        vib = telemetry_dict.get("vibration", 2.0)
        if cht > 185.0 or oil_p < 2.0 or vib > 4.5:
            phys_multiplier = 1.25

        # 4. Ensemble Score (Weighted Combination)
        ensemble_score = float(np.clip((0.45 * if_anomaly_score + 0.55 * ae_anomaly_score) * phys_multiplier, 0.0, 1.0))

        # 5. Classification
        if ensemble_score <= self.thresh_normal:
            classification = "Normal"
            is_anomaly = False
        elif ensemble_score <= self.thresh_attention:
            classification = "Attention"
            is_anomaly = False
        elif ensemble_score <= self.thresh_warning:
            classification = "Warning"
            is_anomaly = True
        else:
            classification = "Critical"
            is_anomaly = True

        return {
            "anomaly_score": round(ensemble_score, 3),
            "isolation_forest_score": round(if_anomaly_score, 3),
            "autoencoder_score": round(ae_anomaly_score, 3),
            "classification": classification,
            "is_anomaly": is_anomaly,
            "threshold": self.thresh_warning
        }
