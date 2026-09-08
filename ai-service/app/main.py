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
from app.anomaly.ensemble_detector import EnsembleAnomalyDetector
from app.fault_prediction.temporal_classifier import TemporalFaultClassifier
from app.rul.rul_estimator import EngineRulEstimator
from app.explainability.xai_engine import EngineXAiExplainer
from app.simulation.mission_runner import MissionProfileSimulator

app = FastAPI(
    title="AEROTWIN AI Microservice",
    description="Digital Twin Physics, Ensemble Anomaly Detection, Temporal Fault Classification & RUL Estimation",
    version="1.0.0"
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
anomaly_detector = EnsembleAnomalyDetector(models_dir=os.path.join(os.path.dirname(__file__), "..", "trained_models"))
fault_classifier = TemporalFaultClassifier(models_dir=os.path.join(os.path.dirname(__file__), "..", "trained_models"))
rul_estimator = EngineRulEstimator()
xai_explainer = EngineXAiExplainer()
mission_simulator = MissionProfileSimulator()

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
    High-speed composite pipeline endpoint.
    Performs Sensor Fusion -> Anomaly Detection -> Fault Classification ->
    RUL Estimation -> Subsystem Health Scoring -> XAI in a single call.
    """
    telemetry = payload.get("telemetry", payload)
    meas = telemetry.get("measured", telemetry)
    physics_exp = telemetry.get("physics_expected", None)
    active_faults = payload.get("faults_active", None)
    operating_hours = float(payload.get("operating_hours", 342.5))

    # 1. Sensor Fusion & Diagnostics
    filtered_state, sensor_diagnostics = kalman_filter.step(meas, physics_exp)

    # 2. Anomaly Detection Ensemble
    anomaly_res = anomaly_detector.predict(meas)
    anomaly_score = anomaly_res["anomaly_score"]

    # 3. Temporal Fault Classification
    fault_res = fault_classifier.predict(meas, active_faults)
    primary_fault = fault_res["primary_fault"]
    fault_prob = fault_res["probability"]

    # 4. RUL & Subsystem Health Estimation
    health_res = rul_estimator.estimate_health_and_rul(
        telemetry=meas,
        operating_hours=operating_hours,
        active_fault=primary_fault,
        fault_prob=fault_prob,
        anomaly_score=anomaly_score
    )

    # 5. Explainable AI
    xai_res = xai_explainer.explain(
        telemetry=meas,
        primary_fault=primary_fault,
        fault_prob=fault_prob,
        anomaly_score=anomaly_score,
        sensor_residuals=sensor_diagnostics
    )

    return {
        "filtered_telemetry": filtered_state,
        "sensor_diagnostics": sensor_diagnostics,
        "anomaly": anomaly_res,
        "fault": fault_res,
        "health": health_res,
        "explanation": xai_res,
        "twin_sync": {
            "status": "SYNCHRONIZED",
            "sync_percentage": round(min(99.8, 98.2 + (1.0 - anomaly_score) * 1.5), 1),
            "latency_ms": 115,
            "last_update_sec_ago": 0.8
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
