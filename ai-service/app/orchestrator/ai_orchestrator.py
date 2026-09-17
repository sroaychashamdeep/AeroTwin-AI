"""
AEROTWIN AI - Central AI Orchestrator
Master coordinating layer executing the complete aerospace intelligence loop:
SENSE -> FUSE -> UNDERSTAND -> DETECT -> DIAGNOSE -> PREDICT -> EXPLAIN -> SIMULATE -> OPTIMIZE -> RECOMMEND -> LEARN
Produces the canonical EngineIntelligenceState consumed across the entire platform.
"""

import os
import time
from typing import Dict, Any, Optional
import numpy as np

from app.models.intelligence_state import (
    EngineIntelligenceState,
    SubsystemHealth,
    AnomalyState,
    DiagnosisState,
    DegradationState,
    RulState,
    MissionRiskState,
    ConfidenceState,
    RootCauseState,
    RecommendationState,
    FidelityState
)

from app.simulation.physics_engine import AeroPistonPhysicsModel
from app.sensor_fusion.state_estimator import StateEstimator2
from app.anomaly.ensemble_detector import EnsembleAnomalyDetector
from app.anomaly.change_point import ChangePointDetector, UnknownFailureDiscovery
from app.fault_prediction.ensemble_manager import TimeSeriesEnsembleManager
from app.fault_prediction.temporal_classifier import TemporalFaultClassifier
from app.fault_prediction.transformer_model import AeroTransformerManager
from app.rul.rul_estimator import EngineRulEstimator
from app.rul.probabilistic_rul import ProbabilisticRulEstimator
from app.rul.failure_horizon import FailureHorizonEngine
from app.diagnostics.root_cause import RootCauseEngine
from app.simulation.twin_calibration import TwinCalibrationEngine
from app.mission.success_model import MissionSuccessModel
from app.learning.online_learning import OnlineLearningManager
from app.knowledge.rag_knowledge import AerospaceRAGKnowledgeBase
from app.explainability.xai_engine import EngineXAiExplainer

class CentralAIOrchestrator:
    """
    Central AI Orchestrator providing unified, single-source-of-truth
    engine intelligence for MALE UAV aero piston engines.
    """
    def __init__(self, models_dir: Optional[str] = None):
        if models_dir is None:
            models_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "trained_models"))

        # Subsystem singletons
        self.physics = AeroPistonPhysicsModel()
        self.estimator = StateEstimator2(filter_type="EKF")
        self.anomaly = EnsembleAnomalyDetector(models_dir=models_dir)
        self.change_point = ChangePointDetector()
        self.unknown_discovery = UnknownFailureDiscovery()
        self.classifier = TemporalFaultClassifier(models_dir=models_dir)
        self.consensus = TimeSeriesEnsembleManager(models_dir=models_dir)
        self.transformer = AeroTransformerManager()
        self.rul = EngineRulEstimator()
        self.prob_rul = ProbabilisticRulEstimator()
        self.horizon = FailureHorizonEngine()
        self.root_cause = RootCauseEngine()
        self.calibration = TwinCalibrationEngine()
        self.mission_model = MissionSuccessModel()
        self.learning = OnlineLearningManager()
        self.rag = AerospaceRAGKnowledgeBase()
        self.xai = EngineXAiExplainer()

        # Engine metadata
        self.engine_id = "AERO-ENG-001"
        self.twin_version = "v2.5.0-AERO"

    def process_telemetry_frame(
        self,
        telemetry: Dict[str, Any],
        physics_expected: Optional[Dict[str, Any]] = None,
        active_faults: Optional[Dict[str, float]] = None,
        operating_hours: float = 342.5,
        engine_state: str = "RUNNING"
    ) -> Dict[str, Any]:
        """
        Executes end-to-end multi-tier pipeline and synthesizes canonical EngineIntelligenceState.
        """
        start_time = time.perf_counter()
        meas = telemetry.get("measured", telemetry)

        # Environmental factors
        alt = float(meas.get("altitude", 12000.0))
        ambient_temp = float(meas.get("ambient_temperature", 24.0))
        throttle = float(meas.get("throttle", 70.0))

        # 1. State Estimation & Sensor Residuals
        filtered_state, diagnostics = self.estimator.step(meas, physics_expected)
        residuals_data = diagnostics["residuals"]
        sensor_confidence = float(diagnostics["system_confidence"])

        # 2. Anomaly Detection (Autoencoder + Isolation Forest)
        anomaly_res = self.anomaly.predict(meas)
        anom_score = float(anomaly_res["anomaly_score"])

        # 3. Change-Point Detection (CUSUM departure tracker)
        cp_res = self.change_point.step(anom_score)

        # 4. Multi-Model Consensus (Physics, GRU, LSTM, TCN, Baseline)
        consensus_res = self.consensus.predict_consensus(
            telemetry=meas,
            active_faults=active_faults,
            anomaly_score=anom_score
        )
        primary_fault = consensus_res["primary_fault"]
        fault_prob = float(consensus_res["probability"])
        model_agreement = float(consensus_res["model_agreement"])

        # 5. Lightweight Transformer Time-Series Validation
        transformer_res = self.transformer.predict(meas, active_faults)
        if transformer_res["active"]:
            consensus_res["model_consensus"]["Transformer"] = transformer_res["confidence"]

        # 6. Unknown Failure Discovery
        unknown_res = self.unknown_discovery.evaluate(
            anomaly_score=anom_score,
            known_class_probabilities=consensus_res.get("class_probabilities", {}),
            telemetry=meas,
            residuals=residuals_data
        )

        # 7. RUL, Degradation Velocity & Probabilistic Horizon
        health_res = self.rul.estimate_health_and_rul(
            telemetry=meas,
            operating_hours=operating_hours,
            active_fault=primary_fault,
            fault_prob=fault_prob,
            anomaly_score=anom_score
        )
        overall_health = float(health_res["overall_health"])
        deg_index = float(health_res["degradation_index"])

        prob_rul_res = self.prob_rul.estimate_probabilistic_rul(
            operating_hours=operating_hours,
            overall_health=overall_health,
            degradation_index=deg_index,
            active_fault=primary_fault,
            fault_prob=fault_prob
        )
        expected_rul = float(prob_rul_res["expected_rul_hours"])

        horizon_res = self.horizon.calculate(
            current_health=overall_health,
            expected_rul_hours=expected_rul,
            degradation_index=deg_index,
            fault_prob=fault_prob
        )

        # 8. Root Cause Analysis & Temporal Causality ("What changed first?")
        rc_res = self.root_cause.analyze(
            primary_fault=primary_fault,
            fault_prob=fault_prob,
            telemetry=meas,
            residuals=residuals_data,
            active_faults=active_faults
        )

        # 9. Mission Success Model & Phase Risk
        mission_res = self.mission_model.evaluate_mission_success(
            current_health=overall_health,
            expected_rul_hours=expected_rul,
            fault_prob=fault_prob,
            altitude_ft=alt,
            throttle_pct=throttle,
            ambient_temp_c=ambient_temp,
            telemetry=meas
        )

        # 10. Twin Calibration & Fidelity Assessment
        fidelity_res = self.calibration.compute_fidelity(
            sensor_confidence=sensor_confidence,
            residuals=residuals_data,
            ai_agreement=model_agreement * 100.0,
            anomaly_score=anom_score
        )

        # 11. Model Drift Monitoring
        drift_res = self.learning.evaluate_drift(
            recent_telemetry=meas,
            residuals=residuals_data,
            confidence=model_agreement
        )

        # 12. Explainable AI (XAI)
        xai_res = self.xai.explain(
            telemetry=meas,
            primary_fault=primary_fault,
            fault_prob=fault_prob,
            anomaly_score=anom_score,
            sensor_residuals=diagnostics
        )

        latency_ms = int((time.perf_counter() - start_time) * 1000)

        # Assembling the Canonical EngineIntelligenceState
        intelligence_state = {
            "engine_id": self.engine_id,
            "operational_state": engine_state,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "twin_version": self.twin_version,
            "physics_version": "v2.1-Rotax914",
            "ai_model_version": "v2.0-Ensemble",
            "dataset_version": "AeroTrain-2026.08",
            "health": {
                "overall": overall_health,
                "thermal": health_res.get("thermal_health", 92.0),
                "combustion": health_res.get("combustion_health", 95.0),
                "lubrication": health_res.get("lubrication_health", 93.0),
                "mechanical": health_res.get("vibration_health", 94.0),
                "electrical": health_res.get("electrical_health", 98.0),
                "fuel": health_res.get("fuel_system_health", 94.0),
                "sensor": round(sensor_confidence, 1)
            },
            "anomaly": {
                "score": round(anom_score, 3),
                "severity": "CRITICAL" if anom_score > 0.8 else ("WARNING" if anom_score > 0.6 else "NORMAL"),
                "is_anomaly": anomaly_res["is_anomaly"],
                "autoencoder_score": round(float(anomaly_res.get("autoencoder_score", anom_score)), 3),
                "isolation_forest_score": round(float(anomaly_res.get("isolation_forest_score", anom_score)), 3),
                "change_point_detected": cp_res["detected"],
                "change_point_timestamp": cp_res["timestamp"],
                "is_unknown_signature": unknown_res["is_unknown_signature"],
                "unknown_signature_info": unknown_res
            },
            "diagnosis": {
                "primary_fault": primary_fault,
                "probability": round(fault_prob, 3),
                "confidence": round(model_agreement, 3),
                "uncertainty": round(1.0 - model_agreement, 3),
                "model_agreement": round(model_agreement, 3),
                "model_consensus": consensus_res["model_consensus"],
                "affected_subsystem": consensus_res["affected_subsystem"],
                "fault_stage": consensus_res["fault_stage"]
            },
            "degradation": {
                "index": round(deg_index, 2),
                "rate": horizon_res["degradation_rate_per_10h"],
                "velocity": horizon_res["degradation_velocity"]
            },
            "rul": {
                "p10": prob_rul_res["p10_hours"],
                "p50": prob_rul_res["p50_hours"],
                "p90": prob_rul_res["p90_hours"],
                "expected_hours": expected_rul,
                "confidence": round(float(health_res["rul_confidence"]), 1),
                "uncertainty_level": "HIGH" if prob_rul_res["high_model_uncertainty"] else "LOW",
                "failure_horizon": horizon_res["failure_horizon"],
                "health_trend_forecast": horizon_res["health_trend_forecast"]
            },
            "mission": {
                "risk": mission_res["mission_risk"],
                "success_probability": mission_res["success_probability"],
                "critical_phase": mission_res["critical_phase"],
                "phase_risks": mission_res["phase_risks"],
                "thermal_margin_deg": mission_res["thermal_margin_deg"],
                "vibration_margin_g": mission_res["vibration_margin_g"],
                "fuel_margin_pct": mission_res["fuel_margin_pct"],
                "deviation_score_pct": mission_res["deviation_score_pct"],
                "trajectory_forecast": mission_res["trajectory_forecast"]
            },
            "confidence": {
                "sensor": round(sensor_confidence / 100.0, 3),
                "physics": round(fidelity_res["physics_agreement"] / 100.0, 3),
                "ml": round(float(anomaly_res.get("isolation_forest_score", 0.85)), 3),
                "dl": round(float(consensus_res["model_consensus"].get("GRU", 0.88)), 3),
                "overall": round(float(np.mean([sensor_confidence/100.0, fidelity_res["physics_agreement"]/100.0, model_agreement])), 3),
                "model_agreement": round(model_agreement, 3),
                "data_quality": 0.985
            },
            "root_cause": {
                "root_cause": rc_res["root_cause"],
                "probability": rc_res["probability"],
                "initiating_signal": rc_res["initiating_signal"],
                "temporal_sequence": rc_res["temporal_sequence"],
                "contributing_factors": rc_res["contributing_factors"],
                "causal_nodes": rc_res["causal_nodes"],
                "causal_edges": rc_res["causal_edges"],
                "narrative": rc_res["narrative"]
            },
            "recommendation": {
                "priority": "P1" if overall_health < 70 else ("P2" if overall_health < 82 else ("P3" if overall_health < 90 else "P4")),
                "action": "Immediate fuel injection servo-valve calibration and ultrasonic nozzle cleansing" if "Injector" in primary_fault else ("Check scavenging pump and filter" if "Lubrication" in primary_fault else "Maintain standard surveillance"),
                "recommended_window": "< 12 operating hours" if overall_health < 75 else ("< 35 operating hours" if overall_health < 85 else "Next scheduled 50-hour inspection"),
                "risk_if_delayed": "CRITICAL" if overall_health < 70 else ("HIGH" if overall_health < 80 else "LOW"),
                "estimated_preventive_cost_inr": 12000.0,
                "estimated_failure_impact_inr": 85000.0
            },
            "fidelity": fidelity_res,
            "drift_monitoring": drift_res,
            "flight_context": {
                "altitude_ft": alt,
                "ambient_temp_c": ambient_temp,
                "throttle_pct": throttle
            },
            "source_metadata": {
                "source": "AEROTWIN-AI-Central-Orchestrator",
                "model_breakdown": consensus_res["model_consensus"],
                "data_quality_pct": 98.5,
                "latency_ms": latency_ms,
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ")
            }
        }

        return {
            "intelligence_state": intelligence_state,
            "twin_state": intelligence_state,  # Backward compatibility
            "filtered_telemetry": filtered_state,
            "sensor_diagnostics": diagnostics,
            "anomaly": anomaly_res,
            "fault": consensus_res,
            "health": health_res,
            "explanation": xai_res,
            "mission_reliability": mission_res,
            "twin_sync": {
                "status": "SYNCHRONIZED",
                "sync_percentage": fidelity_res["overall_fidelity"],
                "latency_ms": latency_ms,
                "last_update_sec_ago": 0.5
            }
        }
