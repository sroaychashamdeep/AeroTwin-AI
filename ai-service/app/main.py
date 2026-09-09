"""
AEROTWIN AI - Main FastAPI Microservice
AI/ML, Digital Twin Physics, Sensor Fusion & Diagnostics Gateway
"""

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, Optional

from app.models.schemas import (
    TelemetryData,
    SimulationRequest,
    MissionSimulationRequest,
    AnomalyPredictionResponse,
    FaultPredictionResponse,
    RulPredictionResponse,
    SensorFaultResponse,
    HealthScoreResponse,
    ExplanationResponse
)
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

app = FastAPI(
    title="AEROTWIN AI Microservice",
    description="Digital Twin Physics, Ensemble Anomaly Detection, Temporal Fault Classification & RUL Estimation",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize singletons
physics_model = AeroPistonPhysicsModel()
kalman_filter = EngineKalmanFilter()
state_estimator_2 = StateEstimator2(filter_type="EKF")
anomaly_detector = EnsembleAnomalyDetector(models_dir=os.path.join(os.path.dirname(__file__), "..", "trained_models"))
fault_classifier = TemporalFaultClassifier(models_dir=os.path.join(os.path.dirname(__file__), "..", "trained_models"))
time_series_ensemble = TimeSeriesEnsembleManager(models_dir=os.path.join(os.path.dirname(__file__), "..", "trained_models"))
rul_estimator = EngineRulEstimator()
probabilistic_rul = ProbabilisticRulEstimator()
xai_explainer = EngineXAiExplainer()
mission_simulator = MissionProfileSimulator()
reliability_engine = MissionReliabilityEngine()
vision_detector = EngineVisionDefectDetector()

@app.get("/health")
def health_check():
    return {
        "status": "UP",
        "service": "AEROTWIN-AI-Service",
        "version": "1.0.0",
        "models_loaded": {
            "autoencoder": anomaly_detector.is_loaded,
            "fault_classifier": True,
            "kalman_filter": True,
            "physics_engine": True
        }
    }

@app.post("/simulate/engine")
def simulate_engine_step(req: SimulationRequest):
    """Generates synthetic physics-informed engine telemetry frame."""
    fault_dict = req.faults.model_dump() if req.faults else {}
    result = physics_model.compute_telemetry(
        throttle_pct=req.throttle,
        altitude_ft=req.altitude,
        ambient_temp_c=req.ambient_temperature,
        faults=fault_dict,
        add_noise=True
    )
    return result

@app.post("/predict/sensor-fault", response_model=SensorFaultResponse)
def predict_sensor_fault(telemetry: Dict[str, Any]):
    """Runs Kalman filter state estimation and computes sensor residuals."""
    meas = telemetry.get("measured", telemetry)
    physics_exp = telemetry.get("physics_expected", None)
    _, diagnostics = kalman_filter.step(meas, physics_exp)
    return diagnostics

@app.post("/predict/anomaly", response_model=AnomalyPredictionResponse)
def predict_anomaly(telemetry: Dict[str, Any]):
    """Evaluates Isolation Forest and PyTorch Autoencoder ensemble."""
    meas = telemetry.get("measured", telemetry)
    return anomaly_detector.predict(meas)

@app.post("/predict/fault", response_model=FaultPredictionResponse)
def predict_fault(payload: Dict[str, Any]):
    """Classifies telemetry sequence with PyTorch temporal classifier."""
    telemetry = payload.get("telemetry", payload)
    active_faults = payload.get("faults_active", None)
    meas = telemetry.get("measured", telemetry)
    return fault_classifier.predict(meas, active_faults)

@app.post("/predict/rul", response_model=RulPredictionResponse)
def predict_rul(payload: Dict[str, Any]):
    """Predicts Remaining Useful Life, degradation index, and 95% CI."""
    telemetry = payload.get("telemetry", payload)
    operating_hours = float(payload.get("operating_hours", 342.5))
    active_fault = payload.get("active_fault", "Healthy")
    fault_prob = float(payload.get("fault_prob", 0.0))
    anomaly_score = float(payload.get("anomaly_score", 0.05))
    meas = telemetry.get("measured", telemetry)

    res = rul_estimator.estimate_health_and_rul(
        telemetry=meas,
        operating_hours=operating_hours,
        active_fault=active_fault,
        fault_prob=fault_prob,
        anomaly_score=anomaly_score
    )
    return {
        "rul_hours": res["rul_hours"],
        "confidence": res["rul_confidence"],
        "ci_lower": res["rul_ci_lower"],
        "ci_upper": res["rul_ci_upper"],
        "degradation_index": res["degradation_index"],
        "health_score": res["overall_health"]
    }

@app.post("/predict/health", response_model=HealthScoreResponse)
def compute_health_scores(payload: Dict[str, Any]):
    """Computes comprehensive health score breakdown across 6 engine subsystems."""
    telemetry = payload.get("telemetry", payload)
    operating_hours = float(payload.get("operating_hours", 342.5))
    active_fault = payload.get("active_fault", "Healthy")
    fault_prob = float(payload.get("fault_prob", 0.0))
    anomaly_score = float(payload.get("anomaly_score", 0.05))
    meas = telemetry.get("measured", telemetry)

    return rul_estimator.estimate_health_and_rul(
        telemetry=meas,
        operating_hours=operating_hours,
        active_fault=active_fault,
        fault_prob=fault_prob,
        anomaly_score=anomaly_score
    )

@app.post("/explain", response_model=ExplanationResponse)
def explain_prediction(payload: Dict[str, Any]):
    """Generates XAI feature importance, deviations, and engineering narrative."""
    telemetry = payload.get("telemetry", {})
    meas = telemetry.get("measured", telemetry)
    primary_fault = payload.get("primary_fault", "Healthy")
    fault_prob = float(payload.get("fault_probability", 0.0))
    anomaly_score = float(payload.get("anomaly_score", 0.05))
    sensor_res = payload.get("sensor_residuals", {})

    return xai_explainer.explain(
        telemetry=meas,
        primary_fault=primary_fault,
        fault_prob=fault_prob,
        anomaly_score=anomaly_score,
        sensor_residuals=sensor_res
    )

@app.post("/simulate/mission")
def simulate_mission(req: MissionSimulationRequest):
    """Simulates an end-to-end UAV mission profile with thermal, fuel, and RUL analysis."""
    return mission_simulator.run_mission(
        mission_type=req.mission_type,
        duration_hours=req.duration_hours,
        target_altitude_ft=req.altitude_ft,
        throttle_pct=req.throttle_pct,
        ambient_temp_c=req.ambient_temp_c,
        humidity_pct=req.humidity_pct,
        payload_weight_kg=req.payload_weight_kg,
        fault_scenario=req.fault_scenario
    )

@app.post("/process-telemetry")
def process_full_telemetry_pipeline(payload: Dict[str, Any]):
    """
    High-speed composite pipeline endpoint producing the single source of truth: TwinState.
    Performs EKF State Estimation -> Residual Intelligence -> Anomaly Detection ->
    Multi-Model Consensus -> Probabilistic RUL -> Mission Reliability -> XAI.
    """
    telemetry = payload.get("telemetry", payload)
    meas = telemetry.get("measured", telemetry)
    physics_exp = telemetry.get("physics_expected", None)
    active_faults = payload.get("faults_active", None)
    operating_hours = float(payload.get("operating_hours", 342.5))
    throttle = float(meas.get("throttle", 70.0))
    altitude = float(meas.get("altitude", 12000.0))
    ambient_temp = float(meas.get("ambient_temperature", 24.0))

    # 1. State Estimation 2.0 (EKF & Multi-Channel Residuals)
    filtered_state, diagnostics_2 = state_estimator_2.step(meas, physics_exp)
    residuals_data = diagnostics_2["residuals"]

    # 2. Environmental compensation factor
    # Higher density altitude or extreme ambient temp shifts baseline
    env_factor = 1.0 + max(0.0, (ambient_temp - 20.0) * 0.015) + (altitude / 50000.0)
    residual_intel = state_estimator_2.get_residual_intelligence(residuals_data, env_factor)

    # 3. Anomaly Detection Ensemble
    anomaly_res = anomaly_detector.predict(meas)
    anomaly_score = anomaly_res["anomaly_score"]

    # 4. Multi-Model Time-Series Consensus (GRU, LSTM, TCN, Transformer, Physics)
    consensus_res = time_series_ensemble.predict_consensus(
        telemetry=meas,
        active_faults=active_faults,
        anomaly_score=anomaly_score
    )
    primary_fault = consensus_res["primary_fault"]
    fault_prob = consensus_res["probability"]

    # 5. Legacy Fault Classifier for compatibility
    fault_res = fault_classifier.predict(meas, active_faults)
    # Merge consensus properties into fault_res
    fault_res["primary_fault"] = primary_fault
    fault_res["probability"] = fault_prob
    fault_res["affected_subsystem"] = consensus_res["affected_subsystem"]
    fault_res["model_consensus"] = consensus_res["model_consensus"]
    fault_res["is_unknown_fault"] = consensus_res["is_unknown_fault"]
    fault_res["fault_stage"] = consensus_res["fault_stage"]

    # 6. RUL & Subsystem Health Estimation
    health_res = rul_estimator.estimate_health_and_rul(
        telemetry=meas,
        operating_hours=operating_hours,
        active_fault=primary_fault,
        fault_prob=fault_prob,
        anomaly_score=anomaly_score
    )
    overall_health = health_res["overall_health"]
    degradation_index = health_res["degradation_index"]

    # 7. Probabilistic RUL Ensemble (P10, P50, P90, Dynamic Failure Curve)
    prob_rul_res = probabilistic_rul.estimate_probabilistic_rul(
        operating_hours=operating_hours,
        overall_health=overall_health,
        degradation_index=degradation_index,
        active_fault=primary_fault,
        fault_prob=fault_prob
    )
    # Update health_res with probabilistic percentiles
    health_res["p10_hours"] = prob_rul_res["p10_hours"]
    health_res["p50_hours"] = prob_rul_res["p50_hours"]
    health_res["p90_hours"] = prob_rul_res["p90_hours"]
    health_res["rul_hours"] = prob_rul_res["expected_rul_hours"]
    health_res["high_uncertainty"] = prob_rul_res["high_model_uncertainty"]
    health_res["model_breakdown"] = prob_rul_res["model_breakdown"]
    health_res["failure_probability_curve"] = prob_rul_res["failure_probability_curve"]

    # 8. Explainable AI
    xai_res = xai_explainer.explain(
        telemetry=meas,
        primary_fault=primary_fault,
        fault_prob=fault_prob,
        anomaly_score=anomaly_score,
        sensor_residuals=diagnostics_2
    )

    # 9. Mission Reliability & Phase-Specific Risk
    mission_rel = reliability_engine.assess_mission_reliability(
        duration_hours=6.0,
        altitude_ft=altitude,
        throttle_pct=throttle,
        current_health=overall_health,
        rul_hours=prob_rul_res["expected_rul_hours"],
        active_fault=primary_fault,
        fault_prob=fault_prob,
        ambient_temp_c=ambient_temp
    )

    # 10. Engine Health DNA (8-Axis Radar)
    health_dna = {
        "Thermal": health_res.get("thermal_health", 92.0),
        "Combustion": health_res.get("combustion_health", 95.0),
        "Lubrication": health_res.get("lubrication_health", 93.0),
        "Mechanical": health_res.get("vibration_health", 94.0),
        "Electrical": health_res.get("electrical_health", 98.0),
        "Fuel": health_res.get("fuel_system_health", 94.0),
        "Sensor": diagnostics_2["system_confidence"],
        "Efficiency": round(max(50.0, 100.0 - (degradation_index * 1.2)), 1)
    }

    # 11. Twin Fidelity Score (4-Factor Dynamic Calculation)
    physics_agreement = round(max(60.0, 100.0 - (np.mean([abs(r.get("z_score", 0)) for r in residuals_data.values()]) * 6.5)), 1)
    sensor_agreement = diagnostics_2["system_confidence"]
    ai_agreement = round(consensus_res["model_agreement"] * 100.0, 1)
    temporal_consistency = round(max(70.0, 98.0 - (anomaly_score * 25.0)), 1)
    twin_fidelity = round(physics_agreement * 0.30 + sensor_agreement * 0.25 + ai_agreement * 0.25 + temporal_consistency * 0.20, 1)

    # 12. Complete TwinState Master Object
    twin_state = {
        "physical": meas,
        "estimated": filtered_state,
        "predicted": physics_exp or filtered_state,
        "residuals": residuals_data,
        "residual_intelligence": residual_intel,
        "health": health_res,
        "health_dna": health_dna,
        "fault": fault_res,
        "consensus": consensus_res,
        "probabilistic_rul": prob_rul_res,
        "mission": mission_rel,
        "fidelity": {
            "overall_fidelity": twin_fidelity,
            "physics_agreement": physics_agreement,
            "sensor_agreement": sensor_agreement,
            "ai_agreement": ai_agreement,
            "temporal_consistency": temporal_consistency
        },
        "environment": {
            "altitude_ft": altitude,
            "ambient_temp_c": ambient_temp,
            "environmental_compensation_factor": round(env_factor, 2)
        },
        "maintenance": {
            "priority": "P1" if overall_health < 70 else ("P2" if overall_health < 82 else ("P3" if overall_health < 90 else "P4")),
            "recommended_window": "< 12 operating hours" if overall_health < 75 else "Next scheduled 50-hour check",
            "risk_if_delayed": "HIGH" if overall_health < 75 else "LOW"
        }
    }

    return {
        "twin_state": twin_state,
        "filtered_telemetry": filtered_state,
        "sensor_diagnostics": diagnostics_2,
        "anomaly": anomaly_res,
        "fault": fault_res,
        "health": health_res,
        "explanation": xai_res,
        "mission_reliability": mission_rel,
        "twin_sync": {
            "status": "SYNCHRONIZED",
            "sync_percentage": twin_fidelity,
            "latency_ms": 115,
            "last_update_sec_ago": 0.8
        }
    }

@app.post("/vision/inspect")
def inspect_component_image(payload: Dict[str, Any]):
    """Experimental Computer Vision defect detection endpoint."""
    return vision_detector.inspect_image_data(payload)

@app.get("/mission/plans")
def get_ai_mission_plans():
    """Generates candidate mission plans (Plan A, Plan B, Plan C) with simulation ratings."""
    return reliability_engine.generate_candidate_plans()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
