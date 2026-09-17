"""
AEROTWIN AI - Mission Success Model, Phase Risk & Trajectory Forecast
Evaluates multi-phase mission reliability, thermal/vibration margins, and envelope deviations.
"""

from typing import Dict, Any, List
import numpy as np

class MissionSuccessModel:
    """
    Simulates UAV mission profile under active powerplant health constraints.
    """
    def __init__(self):
        self.phase_weights = {
            "TAKEOFF": 1.4,
            "CLIMB": 1.2,
            "CRUISE": 0.8,
            "LOITER": 1.5,
            "RETURN": 0.9,
            "LANDING": 1.1
        }

    def evaluate_mission_success(
        self,
        current_health: float,
        expected_rul_hours: float,
        fault_prob: float,
        mission_duration_hours: float = 6.0,
        altitude_ft: float = 12000.0,
        throttle_pct: float = 70.0,
        ambient_temp_c: float = 24.0,
        telemetry: Dict[str, float] = None
    ) -> Dict[str, Any]:
        telem = telemetry or {}

        # 1. Physics margins
        cht = float(telem.get("cht", 140.0))
        thermal_margin = max(0.0, 165.0 - cht)  # Rotax max continuous limit is 165C

        vib = float(telem.get("vibration", 2.1))
        vibration_margin = max(0.0, 5.0 - vib)   # Airframe alert threshold is 5.0g

        ff = float(telem.get("fuel_flow", 18.0))
        fuel_margin = max(0.0, 25.0 - (ff - 18.0) * 1.5)

        # 2. Mission Success Probability
        health_penalty = max(0.0, (90.0 - current_health) * 0.012)
        duration_factor = (mission_duration_hours / max(1.0, expected_rul_hours)) * 0.65
        thermal_penalty = max(0.0, (15.0 - thermal_margin) * 0.015)

        total_risk = float(np.clip(fault_prob * 0.45 + health_penalty + duration_factor + thermal_penalty, 0.02, 0.98))
        success_prob = round(1.0 - total_risk, 3)

        # 3. Phase-specific risks
        base_risk = total_risk * 100.0
        phase_risks = {
            "TAKEOFF": round(min(95.0, base_risk * 0.35 + 2.0), 1),
            "CLIMB": round(min(95.0, base_risk * 0.65 + 4.0), 1),
            "CRUISE": round(min(95.0, base_risk * 0.85 + 5.0), 1),
            "LOITER": round(min(98.0, base_risk * 1.45 + 8.0), 1),
            "RETURN": round(min(95.0, base_risk * 0.95 + 4.0), 1),
            "LANDING": round(min(95.0, base_risk * 0.45 + 3.0), 1)
        }
        critical_phase = max(phase_risks, key=phase_risks.get)

        # 4. Trajectory forecast bands vs actual
        forecast_timeline = []
        for i, ph in enumerate(["TAKEOFF", "CLIMB", "CRUISE", "LOITER", "RETURN", "LANDING"]):
            hour_offset = i * (mission_duration_hours / 6.0)
            proj_rpm = 5400 if ph in ["TAKEOFF", "CLIMB"] else 4800
            proj_egt = 820 if ph in ["TAKEOFF", "CLIMB"] else 785
            forecast_timeline.append({
                "phase": ph,
                "elapsed_hours": round(hour_offset, 1),
                "expected_rpm": proj_rpm,
                "rpm_band": [proj_rpm - 80, proj_rpm + 80],
                "expected_egt": proj_egt,
                "egt_band": [proj_egt - 15, proj_egt + 15],
                "expected_health": round(max(30.0, current_health - (hour_offset * 1.2)), 1)
            })

        # 5. Mission deviation score
        exp_egt = 785.0
        actual_egt = float(telem.get("egt", 790.0))
        egt_dev = abs(actual_egt - exp_egt) / exp_egt * 100.0

        exp_rpm = 4800.0
        actual_rpm = float(telem.get("rpm", 4850.0))
        rpm_dev = abs(actual_rpm - exp_rpm) / exp_rpm * 100.0

        deviation_score = round((egt_dev * 0.6 + rpm_dev * 0.4) + (fault_prob * 12.0), 1)

        return {
            "success_probability": success_prob,
            "mission_risk": round(total_risk, 3),
            "critical_phase": critical_phase,
            "phase_risks": phase_risks,
            "thermal_margin_deg": round(thermal_margin, 1),
            "vibration_margin_g": round(vibration_margin, 2),
            "fuel_margin_pct": round(fuel_margin, 1),
            "deviation_score_pct": deviation_score,
            "trajectory_forecast": forecast_timeline,
            "recommendation": "Mission feasible within standard parameters" if success_prob > 0.80 else ("Recommend loiter altitude reduction to mitigate thermal stress" if success_prob > 0.65 else "Immediate mission abort / RTB advised")
        }
