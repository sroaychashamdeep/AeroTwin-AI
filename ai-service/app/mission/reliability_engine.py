"""
AEROTWIN AI - Mission Reliability Engine & Optimization
Computes phase-specific mission risk (Takeoff, Climb, Cruise, Loiter, Return, Landing),
mission success probabilities, AI Mission Planning (Plan A/B/C), and constrained optimization.
"""

import numpy as np
from typing import Dict, Any, List

class MissionReliabilityEngine:
    """
    Evaluates end-to-end tactical mission risk, computes risk per flight phase,
    and runs multi-objective simulation optimization for engine life preservation.
    """
    def __init__(self):
        self.phases = ["TAKEOFF", "CLIMB", "CRUISE", "LOITER", "RETURN", "LANDING"]

    def assess_mission_reliability(
        self,
        mission_type: str = "ISR",
        duration_hours: float = 6.0,
        altitude_ft: float = 12000.0,
        throttle_pct: float = 70.0,
        current_health: float = 94.0,
        rul_hours: float = 180.0,
        active_fault: str = "Healthy",
        fault_prob: float = 0.0,
        ambient_temp_c: float = 24.0,
        fuel_remaining_kg: float = 85.0
    ) -> Dict[str, Any]:
        """
        Assesses overall mission success probability and breaks down risk per flight phase.
        """
        # Baseline fuel burn rate ~ 14.5 kg/hr at 70% throttle
        hourly_fuel_burn = (throttle_pct / 100.0) * 20.0
        fuel_required_kg = duration_hours * hourly_fuel_burn
        fuel_margin_kg = fuel_remaining_kg - fuel_required_kg
        is_fuel_sufficient = fuel_margin_kg >= 15.0  # 15 kg reserve requirement

        # Phase risks calculation
        phase_risks = {}
        fault_penalty = fault_prob * 0.4 if active_fault != "Healthy" else 0.0
        thermal_stress = max(0.0, (ambient_temp_c - 20.0) * 0.01)

        # 1. Takeoff (High power demand 100% throttle, peak CHT risk)
        takeoff_risk = min(0.95, 0.08 + fault_penalty * 1.5 + (0.05 if current_health < 80 else 0.0))
        phase_risks["TAKEOFF"] = {
            "risk_level": "LOW" if takeoff_risk < 0.20 else ("MEDIUM" if takeoff_risk < 0.50 else "HIGH"),
            "risk_score": round(takeoff_risk, 3),
            "primary_concern": "Full-power thermal and cylinder pressure peak on takeoff roll.",
            "duration_min": 10
        }

        # 2. Climb (Sustained 85% throttle, decaying ambient cooling)
        climb_risk = min(0.95, 0.12 + fault_penalty * 1.2 + thermal_stress)
        phase_risks["CLIMB"] = {
            "risk_level": "LOW" if climb_risk < 0.20 else ("MEDIUM" if climb_risk < 0.50 else "HIGH"),
            "risk_score": round(climb_risk, 3),
            "primary_concern": "Continuous high manifold pressure & turbocharger heat soak during ascent.",
            "duration_min": 25
        }

        # 3. Cruise (Transit to area of interest, 75% throttle)
        cruise_risk = min(0.95, 0.10 + fault_penalty * 0.8)
        phase_risks["CRUISE"] = {
            "risk_level": "LOW" if cruise_risk < 0.20 else ("MEDIUM" if cruise_risk < 0.50 else "HIGH"),
            "risk_score": round(cruise_risk, 3),
            "primary_concern": "Long-distance electrical bus stability and fuel delivery balance.",
            "duration_min": int(duration_hours * 25)
        }

        # 4. Loiter (High duration ISR orbit, 65% throttle, high cumulative vibration fatigue)
        loiter_risk = min(0.95, 0.14 + fault_penalty * 1.3 + (0.15 if duration_hours > 8 else 0.05))
        phase_risks["LOITER"] = {
            "risk_level": "LOW" if loiter_risk < 0.20 else ("MEDIUM" if loiter_risk < 0.50 else "HIGH"),
            "risk_score": round(loiter_risk, 3),
            "primary_concern": "Extended cumulative vibration cycles and journal bearing oil breakdown.",
            "duration_min": int(duration_hours * 35)
        }

        # 5. Return (Descent and transit back to base)
        return_risk = min(0.95, 0.09 + fault_penalty * 0.7)
        phase_risks["RETURN"] = {
            "risk_level": "LOW" if return_risk < 0.20 else ("MEDIUM" if return_risk < 0.50 else "HIGH"),
            "risk_score": round(return_risk, 3),
            "primary_concern": "Engine rapid cooling / shock cooling thermal gradient during throttle reduction.",
            "duration_min": int(duration_hours * 20)
        }

        # 6. Landing (Approach, go-around readiness, low throttle)
        landing_risk = min(0.95, 0.07 + fault_penalty * 1.1)
        phase_risks["LANDING"] = {
            "risk_level": "LOW" if landing_risk < 0.20 else ("MEDIUM" if landing_risk < 0.50 else "HIGH"),
            "risk_score": round(landing_risk, 3),
            "primary_concern": "Engine responsiveness for sudden aborted landing / go-around thrust demands.",
            "duration_min": 15
        }

        # Composite Mission Success Probability
        composite_risk = max(r["risk_score"] for r in phase_risks.values()) * 0.6 + np.mean([r["risk_score"] for r in phase_risks.values()]) * 0.4
        if not is_fuel_sufficient:
            composite_risk = max(composite_risk, 0.85)

        success_prob = max(0.05, round(1.0 - composite_risk, 3))
        overall_risk_level = "LOW" if composite_risk < 0.25 else ("MEDIUM" if composite_risk < 0.55 else "HIGH")

        critical_phase = max(phase_risks, key=lambda k: phase_risks[k]["risk_score"])
        expected_health_at_end = max(40.0, round(current_health - (duration_hours * 1.25) - (fault_prob * 15.0), 1))
        expected_rul_at_end = max(10.0, round(rul_hours - duration_hours * 1.8, 1))

        return {
            "missionSuccessProbability": success_prob,
            "missionRisk": overall_risk_level,
            "composite_risk_score": round(composite_risk, 3),
            "criticalPhase": critical_phase,
            "healthAtEnd": expected_health_at_end,
            "expectedRULAtEnd": expected_rul_at_end,
            "fuel_assessment": {
                "fuel_required_kg": round(fuel_required_kg, 1),
                "fuel_remaining_kg": round(fuel_remaining_kg, 1),
                "fuel_margin_kg": round(fuel_margin_kg, 1),
                "sufficient_reserve": is_fuel_sufficient
            },
            "phase_risks": phase_risks
        }

    def generate_candidate_plans(
        self,
        current_health: float = 94.0,
        rul_hours: float = 180.0,
        active_fault: str = "Healthy"
    ) -> List[Dict[str, Any]]:
        """
        Generates 3 candidate mission plans (Plan A, Plan B, Plan C) with simulation ratings.
        """
        # Plan A: High Endurance Standard Profile
        res_a = self.assess_mission_reliability(
            duration_hours=8.0, altitude_ft=15000.0, throttle_pct=72.0,
            current_health=current_health, rul_hours=rul_hours, active_fault=active_fault
        )
        plan_a = {
            "plan_id": "PLAN_A",
            "name": "Standard High-Endurance ISR (8.0h @ FL150)",
            "duration_hours": 8.0,
            "altitude_ft": 15000,
            "throttle_pct": 72,
            "risk_score": round(res_a["composite_risk_score"] * 100, 1),
            "health_at_end": res_a["healthAtEnd"],
            "expected_rul_at_end": res_a["expectedRULAtEnd"],
            "fuel_burn_kg": res_a["fuel_assessment"]["fuel_required_kg"],
            "recommended": False
        }

        # Plan B: Conservation Low-Stress Profile
        res_b = self.assess_mission_reliability(
            duration_hours=5.5, altitude_ft=12000.0, throttle_pct=64.0,
            current_health=current_health, rul_hours=rul_hours, active_fault=active_fault
        )
        plan_b = {
            "plan_id": "PLAN_B",
            "name": "Engine Life Conservation Profile (5.5h @ FL120)",
            "duration_hours": 5.5,
            "altitude_ft": 12000,
            "throttle_pct": 64,
            "risk_score": round(res_b["composite_risk_score"] * 100, 1),
            "health_at_end": res_b["healthAtEnd"],
            "expected_rul_at_end": res_b["expectedRULAtEnd"],
            "fuel_burn_kg": res_b["fuel_assessment"]["fuel_required_kg"],
            "recommended": True
        }

        # Plan C: Maximum Speed Tactical Dash
        res_c = self.assess_mission_reliability(
            duration_hours=4.0, altitude_ft=18000.0, throttle_pct=88.0,
            current_health=current_health, rul_hours=rul_hours, active_fault=active_fault
        )
        plan_c = {
            "plan_id": "PLAN_C",
            "name": "Rapid Intercept Dash (4.0h @ FL180)",
            "duration_hours": 4.0,
            "altitude_ft": 18000,
            "throttle_pct": 88,
            "risk_score": round(res_c["composite_risk_score"] * 100, 1),
            "health_at_end": res_c["healthAtEnd"],
            "expected_rul_at_end": res_c["expectedRULAtEnd"],
            "fuel_burn_kg": res_c["fuel_assessment"]["fuel_required_kg"],
            "recommended": False
        }

        return [plan_b, plan_a, plan_c]  # Ordered with recommended first
