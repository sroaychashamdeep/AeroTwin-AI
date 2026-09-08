from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any

class TelemetryData(BaseModel):
    timestamp: Optional[str] = None
    rpm: float = Field(..., description="Engine Revolutions Per Minute")
    cht: float = Field(..., description="Cylinder Head Temperature in Celsius")
    egt: float = Field(..., description="Exhaust Gas Temperature in Celsius")
    oil_pressure: float = Field(..., description="Oil Pressure in bar/psi")
    oil_temperature: float = Field(..., description="Oil Temperature in Celsius")
    fuel_flow: float = Field(..., description="Fuel Flow in liters/hour or kg/hour")
    vibration: float = Field(..., description="Overall Vibration RMS in mm/s")
    battery_voltage: float = Field(28.0, description="Avionics DC Bus Voltage")
    alternator_output: float = Field(35.0, description="Alternator Current in Amps")
    injection_timing: float = Field(22.0, description="Injection timing BTDC in degrees")
    throttle: float = Field(70.0, description="Throttle position percentage")
    torque: float = Field(140.0, description="Brake Torque in Nm")
    power: float = Field(80.0, description="Brake Power in kW")
    altitude: float = Field(10000.0, description="Altitude in feet")
    ambient_temperature: float = Field(20.0, description="Ambient air temp in Celsius")
    ambient_pressure: float = Field(697.0, description="Ambient air pressure in hPa")
    humidity: float = Field(50.0, description="Relative humidity percentage")
    engine_load: float = Field(70.0, description="Calculated engine load percentage")

class FaultInjectionRequest(BaseModel):
    injector_degradation: float = Field(0.0, ge=0.0, le=1.0)
    misfire_severity: float = Field(0.0, ge=0.0, le=1.0)
    lubrication_degradation: float = Field(0.0, ge=0.0, le=1.0)
    overheating: float = Field(0.0, ge=0.0, le=1.0)
    vibration_fault: float = Field(0.0, ge=0.0, le=1.0)
    sensor_drift: float = Field(0.0, ge=0.0, le=1.0)

class SimulationRequest(BaseModel):
    throttle: float = Field(70.0, ge=0.0, le=100.0)
    altitude: float = Field(10000.0, ge=0.0, le=30000.0)
    ambient_temperature: float = Field(20.0, ge=-50.0, le=60.0)
    faults: Optional[FaultInjectionRequest] = None
    step_seconds: float = Field(1.0, ge=0.1, le=10.0)

class MissionSimulationRequest(BaseModel):
    duration_hours: float = Field(8.0, ge=0.5, le=36.0)
    altitude_ft: float = Field(15000.0, ge=1000.0, le=30000.0)
    throttle_pct: float = Field(70.0, ge=20.0, le=100.0)
    ambient_temp_c: float = Field(25.0, ge=-40.0, le=55.0)
    humidity_pct: float = Field(50.0, ge=0.0, le=100.0)
    mission_type: str = Field("ISR", description="ISR, Maritime, Relay, Endurance, Hot-Weather")
    payload_weight_kg: float = Field(45.0, ge=0.0, le=150.0)
    fault_scenario: Optional[str] = Field(None, description="Optional fault scenario to test")

class AnomalyPredictionResponse(BaseModel):
    anomaly_score: float
    isolation_forest_score: float
    autoencoder_score: float
    classification: str
    is_anomaly: bool
    threshold: float

class FaultPredictionResponse(BaseModel):
    primary_fault: str
    probability: float
    severity: str
    class_probabilities: Dict[str, float]

class RulPredictionResponse(BaseModel):
    rul_hours: float
    confidence: float
    ci_lower: float
    ci_upper: float
    degradation_index: float
    health_score: float

class SensorFaultResponse(BaseModel):
    sensor_residuals: Dict[str, Dict[str, Any]]
    faulty_sensors: List[str]
    system_confidence: float

class HealthScoreResponse(BaseModel):
    overall_health: float
    thermal_health: float
    combustion_health: float
    lubrication_health: float
    vibration_health: float
    electrical_health: float
    fuel_system_health: float
    degradation_index: float
    anomaly_score: float
    failure_probability: float
    rul_hours: float

class ExplanationResponse(BaseModel):
    primary_fault: str
    probability: float
    main_contributing_factors: List[Dict[str, Any]]
    subsystem_impacts: Dict[str, float]
    historical_trend: str
    narrative_summary: str
