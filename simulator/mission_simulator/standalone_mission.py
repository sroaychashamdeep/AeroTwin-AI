"""
AEROTWIN AI - Standalone Mission Profile Simulator Runner
"""

import sys
import os
import json

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "ai-service")))

from app.simulation.mission_runner import MissionProfileSimulator

def run_mission_cli(mission_type="ISR", duration=8.0, altitude=15000.0, throttle=70.0):
    print(f"=== AEROTWIN AI Mission Simulator CLI ===")
    print(f"Type: {mission_type} | Duration: {duration}h | Altitude: {altitude}ft | Throttle: {throttle}%")
    sim = MissionProfileSimulator()
    res = sim.run_mission(mission_type, duration, altitude, throttle)
    print("\n--- Mission Summary Results ---")
    print(f"Expected Fuel Burn: {res['total_fuel_consumed_kg']} kg")
    print(f"Peak CHT: {res['max_cht']}°C (Risk: {res['thermal_risk']})")
    print(f"Expected Health: {res['expected_health']}%")
    print(f"RUL Impact: {res['rul_impact_hours']} hours consumed")
    print(f"Overall Risk: {res['mission_risk']}")
    print(f"Directive: {res['recommendation']}")

if __name__ == "__main__":
    run_mission_cli()
