"""
AEROTWIN AI - Multi-Mission Flight Profile Simulator
Simulates MALE UAV Mission Scenarios (ISR, Maritime, Relay, Endurance, Hot-Weather)
"""

import math
import numpy as np
from typing import Dict, Any, List, Optional
from app.simulation.physics_engine import AeroPistonPhysicsModel

class MissionProfileSimulator:
    def __init__(self):
        self.physics = AeroPistonPhysicsModel()

    def run_mission(
        self,
        mission_type: str = "ISR",
        duration_hours: float = 8.0,
        target_altitude_ft: float = 15000.0,
        throttle_pct: float = 70.0,
        ambient_temp_c: float = 25.0,
        humidity_pct: float = 50.0,
        payload_weight_kg: float = 45.0,
        fault_scenario: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes a discretized mission timeline (Takeoff, Climb, Loiter/Cruise, Descent).
        Calculates cumulative fuel burn, thermal strain, vibration fatigue, RUL loss, and operational risk.
        """
        # Define Mission Flight Phases (fraction of mission duration)
        # 1. Takeoff (2%), 2. Climb (8%), 3. Cruise/Loiter (82%), 4. Descent (8%)
        phases = [
            {"name": "Takeoff / Rollout", "fraction": 0.03, "throttle_mult": 1.35, "alt_mult": 0.05},
            {"name": "Climb to Loiter Alt", "fraction": 0.08, "throttle_mult": 1.20, "alt_mult": 0.50},
            {"name": "Operational Loiter / ISR", "fraction": 0.81, "throttle_mult": 1.00, "alt_mult": 1.00},
            {"name": "Descent & Recovery", "fraction": 0.08, "throttle_mult": 0.65, "alt_mult": 0.30}
        ]

        # Fault parameter initialization
        fault_dict = {}
        if fault_scenario == "injector_degradation":
            fault_dict["injector_degradation"] = 0.55
        elif fault_scenario == "misfire":
            fault_dict["misfire_severity"] = 0.60
        elif fault_scenario == "lubrication_degradation":
            fault_dict["lubrication_degradation"] = 0.50
        elif fault_scenario == "overheating":
            fault_dict["overheating"] = 0.70
        elif fault_scenario == "vibration_anomaly":
            fault_dict["vibration_fault"] = 0.65

        # Hot-weather operational penalty
        effective_temp = ambient_temp_c
        if mission_type == "Hot-Weather":
            effective_temp = max(ambient_temp_c, 42.0)

        # Time-series sampling points (e.g. 24 points across mission)
        num_steps = 24
        timeline = []
        
        total_fuel_consumed_kg = 0.0
        max_cht = 0.0
        max_egt = 0.0
        max_vib = 0.0
        cumulative_thermal_stress = 0.0
        cumulative_vib_stress = 0.0

        current_time_hr = 0.0
        step_dt_hr = duration_hours / float(num_steps)

        for step in range(num_steps):
            frac = step / float(num_steps)
            
            # Determine current phase
            cum_frac = 0.0
            cur_phase = phases[2]
            for p in phases:
                cum_frac += p["fraction"]
                if frac <= cum_frac:
                    cur_phase = p
                    break

            step_throttle = min(100.0, throttle_pct * cur_phase["throttle_mult"] + (payload_weight_kg / 100.0) * 3.0)
            step_alt = target_altitude_ft * cur_phase["alt_mult"]

            # Simulate physics step
            telemetry_res = self.physics.compute_telemetry(
                throttle_pct=step_throttle,
                altitude_ft=step_alt,
                ambient_temp_c=effective_temp,
                faults=fault_dict,
                add_noise=False
            )
            telem = telemetry_res["measured"]

            # Accumulate metrics
            fuel_rate_kg_h = telem["fuel_flow"] * 0.74 # L/h to kg/h
            total_fuel_consumed_kg += fuel_rate_kg_h * step_dt_hr

            cht_val = telem["cht"]
            egt_val = telem["egt"]
            vib_val = telem["vibration"]

            max_cht = max(max_cht, cht_val)
            max_egt = max(max_egt, egt_val)
            max_vib = max(max_vib, vib_val)

            # Cumulative stress metrics
            if cht_val > 165.0:
                cumulative_thermal_stress += ((cht_val - 165.0) / 10.0) * step_dt_hr
            if vib_val > 3.5:
                cumulative_vib_stress += ((vib_val - 3.5) / 1.5) * step_dt_hr

            timeline.append({
                "time_hours": round(current_time_hr, 2),
                "phase": cur_phase["name"],
                "altitude_ft": round(step_alt, 0),
                "throttle_pct": round(step_throttle, 1),
                "rpm": round(telem["rpm"], 0),
                "cht": round(cht_val, 1),
                "egt": round(egt_val, 1),
                "oil_pressure": round(telem["oil_pressure"], 2),
                "oil_temperature": round(telem["oil_temperature"], 1),
                "fuel_flow_l_h": round(telem["fuel_flow"], 1),
                "vibration": round(vib_val, 2),
                "cumulative_fuel_kg": round(total_fuel_consumed_kg, 2)
            })

            current_time_hr += step_dt_hr

        # Baseline start health
        start_health = 95.0
        # Calculate degradation caused by this mission
        base_degradation_pct = (duration_hours / 1200.0) * 100.0 * 1.5
        stress_degradation_pct = (cumulative_thermal_stress * 0.6) + (cumulative_vib_stress * 0.8)
        if fault_dict:
            stress_degradation_pct += 6.5

        total_degradation_pct = round(base_degradation_pct + stress_degradation_pct, 2)
        end_health = max(15.0, round(start_health - total_degradation_pct, 1))

        # RUL impact (equivalent flight hours consumed)
        rul_impact_hours = round(duration_hours * (1.0 + (total_degradation_pct / 4.0)), 1)

        # Thermal Risk Assessment
        if max_cht > 188.0 or effective_temp > 40.0 and max_cht > 178.0:
            thermal_risk = "HIGH"
        elif max_cht > 168.0:
            thermal_risk = "MEDIUM"
        else:
            thermal_risk = "LOW"

        # Vibration Risk Assessment
        if max_vib > 5.2:
            vibration_risk = "HIGH"
        elif max_vib > 3.8:
            vibration_risk = "MEDIUM"
        else:
            vibration_risk = "LOW"

        # Overall Mission Risk
        if thermal_risk == "HIGH" or vibration_risk == "HIGH" or (fault_dict and len(fault_dict) > 0):
            mission_risk = "CRITICAL" if (thermal_risk == "HIGH" and vibration_risk == "HIGH") else "HIGH"
        elif thermal_risk == "MEDIUM" or vibration_risk == "MEDIUM":
            mission_risk = "MEDIUM"
        else:
            mission_risk = "LOW"

        # Operational Recommendation
        if mission_risk in ["HIGH", "CRITICAL"]:
            recommendation = (
                f"Mission poses elevated operational risk ({mission_risk}). "
                f"Peak CHT reaches {round(max_cht, 1)}°C, vibration reaches {round(max_vib, 2)} mm/s. "
                f"Recommend reducing cruise throttle to 62-65% or staging an intermediate descent for thermal relief."
            )
        elif mission_risk == "MEDIUM":
            recommendation = (
                f"Mission executable with active thermal monitoring. "
                f"Expected fuel consumption: {round(total_fuel_consumed_kg, 1)} kg. "
                f"Thermal and vibration margins remain within acceptable limits."
            )
        else:
            recommendation = (
                f"Mission parameters are optimal. "
                f"Minimal degradation impact ({total_degradation_pct}%). "
                f"All powerplant subsystems expected to operate within nominal envelope."
            )

        return {
            "mission_type": mission_type,
            "duration_hours": duration_hours,
            "target_altitude_ft": target_altitude_ft,
            "total_fuel_consumed_kg": round(total_fuel_consumed_kg, 1),
            "max_cht": round(max_cht, 1),
            "max_egt": round(max_egt, 1),
            "max_vibration": round(max_vib, 2),
            "start_health": start_health,
            "expected_health": end_health,
            "expected_degradation_pct": total_degradation_pct,
            "rul_impact_hours": rul_impact_hours,
            "thermal_risk": thermal_risk,
            "vibration_risk": vibration_risk,
            "mission_risk": mission_risk,
            "recommendation": recommendation,
            "timeline": timeline
        }
