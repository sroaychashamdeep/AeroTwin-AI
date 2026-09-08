"""
AEROTWIN AI - Standalone Aero Piston Telemetry Simulator
Can be run standalone to generate and stream telemetry frames or export CSV logs.
"""

import sys
import os
import time
import json

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "ai-service")))

from app.simulation.physics_engine import AeroPistonPhysicsModel

def run_standalone_simulation(duration_sec: int = 30, throttle: float = 70.0):
    print(f"=== AEROTWIN AI Standalone Engine Simulator ===")
    print(f"Running physics model at {throttle}% throttle for {duration_sec} cycles...")
    physics = AeroPistonPhysicsModel()

    for sec in range(duration_sec):
        res = physics.compute_telemetry(throttle_pct=throttle, altitude_ft=12000.0, add_noise=True)
        m = res["measured"]
        print(f"[{sec:03d}s] RPM: {m['rpm']:.0f} | CHT: {m['cht']:.1f}°C | EGT: {m['egt']:.1f}°C | Oil: {m['oil_pressure']:.2f} bar | Vib: {m['vibration']:.2f} mm/s | Fuel: {m['fuel_flow']:.1f} L/h")
        time.sleep(1.0)

if __name__ == "__main__":
    dur = int(sys.argv[1]) if len(sys.argv) > 1 else 10
    run_standalone_simulation(dur)
