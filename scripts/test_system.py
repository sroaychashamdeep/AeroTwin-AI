"""
AEROTWIN AI - System Verification & Smoke Test Suite
Verifies physics engine, Kalman filter, anomaly detector, fault classifier, and RUL estimation.
"""

import sys
import os
import unittest

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ai-service")))

from app.simulation.physics_engine import AeroPistonPhysicsModel
from app.sensor_fusion.kalman_filter import EngineKalmanFilter
from app.anomaly.ensemble_detector import EnsembleAnomalyDetector
from app.fault_prediction.temporal_classifier import TemporalFaultClassifier
from app.rul.rul_estimator import EngineRulEstimator
from app.explainability.xai_engine import EngineXAiExplainer
from app.simulation.mission_runner import MissionProfileSimulator

class TestAeroTwinAI(unittest.TestCase):
    def setUp(self):
        self.physics = AeroPistonPhysicsModel()
        self.kalman = EngineKalmanFilter()
        models_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ai-service", "trained_models"))
        self.anomaly = EnsembleAnomalyDetector(models_dir=models_dir)
        self.classifier = TemporalFaultClassifier(models_dir=models_dir)
        self.rul = EngineRulEstimator()
        self.xai = EngineXAiExplainer()
        self.mission_sim = MissionProfileSimulator()

    def test_physics_nominal(self):
        res = self.physics.compute_telemetry(throttle_pct=70.0, altitude_ft=12000.0)
        telem = res["measured"]
        self.assertGreater(telem["rpm"], 4000)
        self.assertLess(telem["rpm"], 5600)
        self.assertGreater(telem["cht"], 120)
        self.assertLess(telem["cht"], 165)
        self.assertGreater(telem["oil_pressure"], 3.2)
        print("[PASS] Physics nominal test passed.")

    def test_physics_fault_injection(self):
        res = self.physics.compute_telemetry(
            throttle_pct=70.0,
            faults={"injector_degradation": 0.8}
        )
        telem = res["measured"]
        self.assertGreater(telem["fuel_flow"], 20.0)
        self.assertGreater(telem["egt"], 820.0)
        print("[PASS] Fault injection physics response test passed.")

    def test_kalman_filter(self):
        telem = self.physics.compute_telemetry(70.0)["measured"]
        filtered, diag = self.kalman.step(telem)
        self.assertIn("rpm", filtered)
        self.assertGreater(diag["system_confidence"], 80.0)
        print("[PASS] Kalman filter state estimation test passed.")

    def test_anomaly_detection_nominal(self):
        telem = self.physics.compute_telemetry(70.0)["measured"]
        anom = self.anomaly.predict(telem)
        self.assertIn("anomaly_score", anom)
        self.assertIn("classification", anom)
        self.assertLessEqual(anom["anomaly_score"], 0.40)
        print(f"[PASS] Anomaly detection nominal test passed (Score: {anom['anomaly_score']}).")

    def test_anomaly_detection_fault(self):
        telem = self.physics.compute_telemetry(70.0, faults={"overheating": 0.85})["measured"]
        anom = self.anomaly.predict(telem)
        self.assertGreater(anom["anomaly_score"], 0.30)
        print(f"[PASS] Anomaly detection fault test passed (Score: {anom['anomaly_score']}).")

    def test_fault_classifier(self):
        telem = self.physics.compute_telemetry(70.0, faults={"injector_degradation": 0.8})["measured"]
        pred = self.classifier.predict(telem, {"injector_degradation": 0.8})
        self.assertEqual(pred["primary_fault"], "Injector Abnormality")
        self.assertGreater(pred["probability"], 0.50)
        print(f"[PASS] Temporal fault classifier test passed ({pred['primary_fault']} at {pred['probability'] * 100}%).")

    def test_rul_estimation(self):
        telem = self.physics.compute_telemetry(70.0)["measured"]
        res = self.rul.estimate_health_and_rul(telem, operating_hours=342.5)
        self.assertGreater(res["rul_hours"], 50.0)
        self.assertLess(res["rul_ci_lower"], res["rul_hours"])
        self.assertGreater(res["rul_ci_upper"], res["rul_hours"])
        print(f"[PASS] RUL estimation test passed (RUL: {res['rul_hours']}h, CI: {res['rul_ci_lower']}-{res['rul_ci_upper']}h).")

    def test_explainable_ai(self):
        telem = self.physics.compute_telemetry(70.0, faults={"injector_degradation": 0.8})["measured"]
        exp = self.xai.explain(telem, "Injector Abnormality", 0.82, 0.74)
        self.assertIn("main_contributing_factors", exp)
        self.assertIn("narrative_summary", exp)
        self.assertGreater(len(exp["main_contributing_factors"]), 0)
        print("[PASS] Explainable AI feature attribution test passed.")

    def test_mission_simulation(self):
        res = self.mission_sim.run_mission("ISR", duration_hours=4.0, target_altitude_ft=12000.0)
        self.assertIn("total_fuel_consumed_kg", res)
        self.assertIn("expected_health", res)
        self.assertIn("timeline", res)
        self.assertEqual(len(res["timeline"]), 24)
        print(f"[PASS] Mission simulator test passed (Fuel: {res['total_fuel_consumed_kg']} kg, Risk: {res['mission_risk']}).")

if __name__ == "__main__":
    unittest.main()
