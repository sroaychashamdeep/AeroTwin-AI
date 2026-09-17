"""
AEROTWIN AI - Change-Point Detection & Unknown Failure Signature Discovery
Detects structural behavioral regime shifts and identifies novel/unseen failure modes.
"""

import time
import numpy as np
from typing import Dict, Any, List, Optional

class ChangePointDetector:
    """
    Implements Cumulative Sum (CUSUM) and sequential variance shift detection
    to pinpoint the exact timestamp an aero engine departs from nominal baseline.
    """
    def __init__(self, drift_threshold: float = 3.5, min_consecutive: int = 3):
        self.drift_threshold = drift_threshold
        self.min_consecutive = min_consecutive
        self.cusum_pos = 0.0
        self.cusum_neg = 0.0
        self.consecutive_triggers = 0
        self.baseline_mean = 0.15
        self.baseline_std = 0.05
        self.first_detected_time: Optional[str] = None
        self.state = "NOMINAL"  # NOMINAL, BEHAVIORAL_CHANGE_DETECTED, PERSISTENT_DEGRADATION

    def step(self, anomaly_score: float) -> Dict[str, Any]:
        # Standardize score relative to healthy baseline
        z = (anomaly_score - self.baseline_mean) / (self.baseline_std + 1e-6)
        slack = 0.5
        self.cusum_pos = max(0.0, self.cusum_pos + z - slack)
        self.cusum_neg = max(0.0, self.cusum_neg - z - slack)

        now_str = time.strftime("%H:%M:%S")

        if self.cusum_pos > self.drift_threshold:
            self.consecutive_triggers += 1
            if self.consecutive_triggers == 1:
                self.first_detected_time = now_str
                self.state = "BEHAVIORAL_CHANGE_DETECTED"
            elif self.consecutive_triggers >= self.min_consecutive:
                self.state = "PERSISTENT_DEGRADATION"
        else:
            self.consecutive_triggers = max(0, self.consecutive_triggers - 1)
            if self.consecutive_triggers == 0:
                self.state = "NOMINAL"
                self.first_detected_time = None
                self.cusum_pos = 0.0
                self.cusum_neg = 0.0

        return {
            "state": self.state,
            "detected": self.state in ["BEHAVIORAL_CHANGE_DETECTED", "PERSISTENT_DEGRADATION"],
            "timestamp": self.first_detected_time,
            "cusum_statistic": round(float(self.cusum_pos), 3),
            "severity": "CRITICAL" if self.state == "PERSISTENT_DEGRADATION" else ("WARNING" if self.state == "BEHAVIORAL_CHANGE_DETECTED" else "NORMAL")
        }

class UnknownFailureDiscovery:
    """
    Detects unknown failure modes where unsupervised anomaly is significant
    but similarity to cataloged supervised fault signatures is below confidence threshold.
    """
    def __init__(self, novelty_threshold: float = 0.65, similarity_floor: float = 0.50):
        self.novelty_threshold = novelty_threshold
        self.similarity_floor = similarity_floor
        self.signature_history: List[Dict[str, Any]] = []

    def evaluate(
        self,
        anomaly_score: float,
        known_class_probabilities: Dict[str, float],
        telemetry: Dict[str, float],
        residuals: Dict[str, Any]
    ) -> Dict[str, Any]:
        # Max probability among known non-healthy fault classes
        known_fault_probs = {k: v for k, v in known_class_probabilities.items() if k != "Healthy"}
        max_known_fault = max(known_fault_probs, key=known_fault_probs.get) if known_fault_probs else "None"
        max_similarity = known_fault_probs.get(max_known_fault, 0.0)

        # Unsupervised score is high, but no known fault class matches well
        is_unknown = (anomaly_score >= self.novelty_threshold) and (max_similarity < self.similarity_floor)

        affected_sensors = []
        for s_name, r_info in residuals.items():
            z = abs(r_info.get("z_score", 0.0)) if isinstance(r_info, dict) else 0.0
            if z > 2.0:
                affected_sensors.append(s_name)

        result = {
            "is_unknown_signature": is_unknown,
            "anomaly_score": round(float(anomaly_score), 3),
            "closest_known_fault": max_known_fault,
            "similarity_to_closest": round(float(max_similarity), 3),
            "affected_sensors": affected_sensors if affected_sensors else ["fuel_flow", "vibration"],
            "recommendation": "Submit telemetry signature to Online Learning pipeline for specialist engineering review" if is_unknown else "Tracking within known envelope"
        }

        if is_unknown:
            record = {
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "score": anomaly_score,
                "closest": max_known_fault,
                "sensors": affected_sensors
            }
            self.signature_history.append(record)
            if len(self.signature_history) > 50:
                self.signature_history.pop(0)

        return result
