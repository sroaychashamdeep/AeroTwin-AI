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
from app.sensor_fusion.state_estimator import StateEstimator2
from app.anomaly.ensemble_detector import EnsembleAnomalyDetector
from app.fault_prediction.temporal_classifier import TemporalFaultClassifier
from app.fault_prediction.ensemble_manager import TimeSeriesEnsembleManager
from app.rul.rul_estimator import EngineRulEstimator
from app.rul.probabilistic_rul import ProbabilisticRulEstimator
from app.explainability.xai_engine import EngineXAiExplainer
from app.simulation.mission_runner import MissionProfileSimulator
from app.mission.reliability_engine import MissionReliabilityEngine
from app.vision.defect_detector import EngineVisionDefectDetector

class TestAeroTwinAI(unittest.TestCase):
    def setUp(self):
        self.physics = AeroPistonPhysicsModel()
        self.kalman = EngineKalmanFilter()
        self.state_estimator = StateEstimator2(filter_type="EKF")
        models_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "ai-service", "trained_models"))
        self.anomaly = EnsembleAnomalyDetector(models_dir=models_dir)
        self.classifier = TemporalFaultClassifier(models_dir=models_dir)
        self.time_series_ensemble = TimeSeriesEnsembleManager(models_dir=models_dir)
        self.rul = EngineRulEstimator()
        self.prob_rul = ProbabilisticRulEstimator()
        self.xai = EngineXAiExplainer()
        self.mission_sim = MissionProfileSimulator()
        self.reliability_engine = MissionReliabilityEngine()
        self.vision = EngineVisionDefectDetector()

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

    def test_state_estimator_2_and_residuals(self):
        telem = self.physics.compute_telemetry(70.0)["measured"]
        filtered, diag = self.state_estimator.step(telem)
        self.assertIn("rpm", filtered)
        self.assertIn("residuals", diag)
        intel = self.state_estimator.get_residual_intelligence(diag["residuals"])
        self.assertIn("root_classification", intel)
        print(f"[PASS] StateEstimator2 & Residual Intelligence test passed ({intel['root_classification']}).")

    def test_time_series_consensus_and_unknown_fault(self):
        telem = self.physics.compute_telemetry(70.0, faults={"injector_degradation": 0.8})["measured"]
        pred = self.time_series_ensemble.predict_consensus(telem, {"injector_degradation": 0.8})
        self.assertIn("model_consensus", pred)
        self.assertIn("fault_stage", pred)
        self.assertGreater(pred["model_agreement"], 0.60)
        print(f"[PASS] Time-Series Ensemble Consensus test passed (Agreement: {pred['model_agreement']*100}%).")

    def test_probabilistic_rul_and_failure_curve(self):
        prob = self.prob_rul.estimate_probabilistic_rul(operating_hours=342.5, overall_health=92.0, degradation_index=8.0)
        self.assertIn("p10_hours", prob)
        self.assertIn("p50_hours", prob)
        self.assertIn("p90_hours", prob)
        self.assertLessEqual(prob["p10_hours"], prob["p50_hours"])
        self.assertLessEqual(prob["p50_hours"], prob["p90_hours"])
        self.assertEqual(len(prob["failure_probability_curve"]), 12)
        print(f"[PASS] Probabilistic RUL ensemble test passed (P10={prob['p10_hours']}h, P50={prob['p50_hours']}h, P90={prob['p90_hours']}h).")

    def test_mission_reliability_and_phase_risk(self):
        rel = self.reliability_engine.assess_mission_reliability(duration_hours=6.0, current_health=92.0)
        self.assertIn("missionSuccessProbability", rel)
        self.assertIn("phase_risks", rel)
        self.assertIn("TAKEOFF", rel["phase_risks"])
        self.assertIn("LOITER", rel["phase_risks"])
        plans = self.reliability_engine.generate_candidate_plans(current_health=92.0)
        self.assertEqual(len(plans), 3)
        print(f"[PASS] Mission Reliability Engine & Phase Risk test passed (Success Prob: {rel['missionSuccessProbability']}).")

    def test_vision_defect_detection(self):
        res = self.vision.inspect_image_data({"component": "Exhaust Manifold", "scenario": "thermal_stress"})
        self.assertTrue(res["is_defect_detected"])
        self.assertIn("confidence_pct", res)
        print(f"[PASS] Computer Vision Defect Detection test passed ({res['visual_anomaly']}).")

if __name__ == "__main__":
    unittest.main()
