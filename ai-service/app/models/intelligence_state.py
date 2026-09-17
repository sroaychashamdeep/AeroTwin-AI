"""
AEROTWIN AI - Unified Engine Intelligence State Schemas
Canonical single source of truth for all dashboards, models, and decision support layers.
"""

from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any

class SubsystemHealth(BaseModel):
    overall: float = Field(..., ge=0, le=100)
    thermal: float = Field(..., ge=0, le=100)
    combustion: float = Field(..., ge=0, le=100)
    lubrication: float = Field(..., ge=0, le=100)
    mechanical: float = Field(..., ge=0, le=100)
    electrical: float = Field(..., ge=0, le=100)
    fuel: float = Field(..., ge=0, le=100)
    sensor: float = Field(..., ge=0, le=100)

class AnomalyState(BaseModel):
    score: float = Field(..., ge=0.0, le=1.0)
    severity: str = "NORMAL"  # NORMAL, ADVISORY, WARNING, CRITICAL
    is_anomaly: bool = False
    autoencoder_score: float = 0.0
    isolation_forest_score: float = 0.0
    change_point_detected: bool = False
    change_point_timestamp: Optional[str] = None
    is_unknown_signature: bool = False
    unknown_signature_info: Optional[Dict[str, Any]] = None

class DiagnosisState(BaseModel):
    primary_fault: str = "Healthy"
    probability: float = Field(..., ge=0.0, le=1.0)
    confidence: float = Field(..., ge=0.0, le=1.0)
    uncertainty: float = Field(..., ge=0.0, le=1.0)
    model_agreement: float = Field(..., ge=0.0, le=1.0)
    model_consensus: Dict[str, float] = {}
    affected_subsystem: str = "Nominal"
    fault_stage: str = "STABLE"

class DegradationState(BaseModel):
    index: float = 0.0
    rate: float = 0.0  # health points per 10 operating hours
    velocity: str = "STABLE"  # STABLE, ACCELERATING, DECELERATING

class RulState(BaseModel):
    p10: float
    p50: float
    p90: float
    expected_hours: float
    confidence: float
    uncertainty_level: str = "LOW"
    failure_horizon: Dict[str, float] = {
        "less_than_1h": 0.02,
        "1_to_6h": 0.05,
        "6_to_24h": 0.15,
        "1_to_7d": 0.45,
        "greater_than_7d": 0.33
    }

class MissionRiskState(BaseModel):
    risk: float = 0.05
    success_probability: float = 0.95
    critical_phase: str = "LOITER"
    phase_risks: Dict[str, float] = {
        "TAKEOFF": 0.03,
        "CLIMB": 0.06,
        "CRUISE": 0.10,
        "LOITER": 0.18,
        "RETURN": 0.08,
        "LANDING": 0.04
    }
    thermal_margin_deg: float = 32.0
    vibration_margin_g: float = 2.4
    fuel_margin_pct: float = 18.0
    deviation_score_pct: float = 2.4

class ConfidenceState(BaseModel):
    sensor: float = 0.96
    physics: float = 0.93
    ml: float = 0.88
    dl: float = 0.91
    overall: float = 0.92
    model_agreement: float = 0.89
    data_quality: float = 0.98

class RootCauseState(BaseModel):
    root_cause: str = "Healthy"
    probability: float = 0.95
    initiating_signal: Optional[str] = None
    temporal_sequence: List[Dict[str, Any]] = []
    contributing_factors: List[Dict[str, Any]] = []
    causal_nodes: List[Dict[str, Any]] = []

class RecommendationState(BaseModel):
    priority: str = "P4"  # P1, P2, P3, P4
    action: str = "Maintain standard surveillance"
    recommended_window: str = "Next scheduled 50-hour inspection"
    risk_if_delayed: str = "LOW"
    estimated_preventive_cost_inr: float = 12000.0
    estimated_failure_impact_inr: float = 85000.0

class FidelityState(BaseModel):
    overall_fidelity: float = 94.5
    thermal_fidelity: float = 95.2
    mechanical_fidelity: float = 91.8
    fuel_fidelity: float = 96.4
    electrical_fidelity: float = 94.0
    before_calibration_error_pct: float = 7.8
    after_calibration_error_pct: float = 3.2

class EngineIntelligenceState(BaseModel):
    engine_id: str = "AERO-ENG-001"
    operational_state: str = "RUNNING"  # RUNNING, STARTING, OFF
    timestamp: str
    twin_version: str = "v2.5.0-AERO"
    physics_version: str = "v2.1-Rotax914"
    ai_model_version: str = "v2.0-Ensemble"
    dataset_version: str = "AeroTrain-2026.08"
    health: SubsystemHealth
    anomaly: AnomalyState
    diagnosis: DiagnosisState
    degradation: DegradationState
    rul: RulState
    mission: MissionRiskState
    confidence: ConfidenceState
    root_cause: RootCauseState
    recommendation: RecommendationState
    fidelity: FidelityState
    flight_context: Dict[str, Any] = {}
    source_metadata: Dict[str, Any] = {
        "source": "AEROTWIN-AI-Central-Orchestrator",
        "data_quality_pct": 98.4,
        "latency_ms": 32
    }
