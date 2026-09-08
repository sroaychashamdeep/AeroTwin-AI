-- AEROTWIN AI: Database Schema Migration 001
-- Tables for Aero Piston Engine Digital Twin & Health Management

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    username VARCHAR(64) UNIQUE NOT NULL,
    email VARCHAR(128) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'Engineer', -- Operator, Engineer, Maintenance, Administrator
    full_name VARCHAR(128),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. UAVs Table
CREATE TABLE IF NOT EXISTS uavs (
    id VARCHAR(64) PRIMARY KEY,
    tail_number VARCHAR(32) UNIQUE NOT NULL,
    model VARCHAR(64) NOT NULL,
    callsign VARCHAR(64),
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    total_flight_hours DOUBLE PRECISION DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Engines Table
CREATE TABLE IF NOT EXISTS engines (
    id VARCHAR(64) PRIMARY KEY,
    uav_id VARCHAR(64) REFERENCES uavs(id) ON DELETE SET NULL,
    serial_number VARCHAR(64) UNIQUE NOT NULL,
    model VARCHAR(64) NOT NULL,
    rated_power_hp DOUBLE PRECISION DEFAULT 141.0,
    max_rpm DOUBLE PRECISION DEFAULT 5800.0,
    operating_hours DOUBLE PRECISION DEFAULT 0.0,
    install_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(32) DEFAULT 'NOMINAL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Missions Table
CREATE TABLE IF NOT EXISTS missions (
    id VARCHAR(64) PRIMARY KEY,
    uav_id VARCHAR(64) REFERENCES uavs(id) ON DELETE CASCADE,
    engine_id VARCHAR(64) REFERENCES engines(id) ON DELETE CASCADE,
    code VARCHAR(64) UNIQUE NOT NULL,
    mission_type VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'SCHEDULED',
    target_altitude_ft DOUBLE PRECISION DEFAULT 15000.0,
    target_throttle_pct DOUBLE PRECISION DEFAULT 70.0,
    ambient_temp_c DOUBLE PRECISION DEFAULT 25.0,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    duration_hours DOUBLE PRECISION DEFAULT 8.0,
    fuel_consumed_kg DOUBLE PRECISION DEFAULT 0.0,
    mission_risk VARCHAR(32) DEFAULT 'LOW',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Telemetry Table
CREATE TABLE IF NOT EXISTS telemetry (
    id VARCHAR(64) PRIMARY KEY,
    engine_id VARCHAR(64) REFERENCES engines(id) ON DELETE CASCADE,
    mission_id VARCHAR(64) REFERENCES missions(id) ON DELETE SET NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    rpm DOUBLE PRECISION NOT NULL,
    cht DOUBLE PRECISION NOT NULL,
    egt DOUBLE PRECISION NOT NULL,
    oil_pressure DOUBLE PRECISION NOT NULL,
    oil_temperature DOUBLE PRECISION NOT NULL,
    fuel_flow DOUBLE PRECISION NOT NULL,
    vibration DOUBLE PRECISION NOT NULL,
    battery_voltage DOUBLE PRECISION NOT NULL,
    alternator_output DOUBLE PRECISION NOT NULL,
    injection_timing DOUBLE PRECISION NOT NULL,
    throttle DOUBLE PRECISION NOT NULL,
    torque DOUBLE PRECISION NOT NULL,
    power DOUBLE PRECISION NOT NULL,
    altitude DOUBLE PRECISION NOT NULL,
    ambient_temperature DOUBLE PRECISION NOT NULL,
    ambient_pressure DOUBLE PRECISION NOT NULL,
    humidity DOUBLE PRECISION NOT NULL,
    engine_load DOUBLE PRECISION NOT NULL
);

-- 6. Sensor Readings Table
CREATE TABLE IF NOT EXISTS sensor_readings (
    id VARCHAR(64) PRIMARY KEY,
    telemetry_id VARCHAR(64) REFERENCES telemetry(id) ON DELETE CASCADE,
    sensor_name VARCHAR(64) NOT NULL,
    measured_value DOUBLE PRECISION NOT NULL,
    physics_predicted_value DOUBLE PRECISION,
    residual DOUBLE PRECISION,
    confidence_score DOUBLE PRECISION DEFAULT 1.0,
    is_faulty BOOLEAN DEFAULT FALSE,
    fault_type VARCHAR(64) DEFAULT 'NONE',
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Faults Table
CREATE TABLE IF NOT EXISTS faults (
    id VARCHAR(64) PRIMARY KEY,
    engine_id VARCHAR(64) REFERENCES engines(id) ON DELETE CASCADE,
    mission_id VARCHAR(64) REFERENCES missions(id) ON DELETE SET NULL,
    fault_name VARCHAR(128) NOT NULL,
    category VARCHAR(64) NOT NULL,
    severity VARCHAR(32) NOT NULL,
    probability DOUBLE PRECISION NOT NULL,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    status VARCHAR(32) DEFAULT 'ACTIVE'
);

-- 8. Predictions Table
CREATE TABLE IF NOT EXISTS predictions (
    id VARCHAR(64) PRIMARY KEY,
    engine_id VARCHAR(64) REFERENCES engines(id) ON DELETE CASCADE,
    telemetry_id VARCHAR(64) REFERENCES telemetry(id) ON DELETE SET NULL,
    anomaly_score DOUBLE PRECISION NOT NULL,
    isolation_forest_score DOUBLE PRECISION,
    autoencoder_score DOUBLE PRECISION,
    primary_fault VARCHAR(128),
    fault_probability DOUBLE PRECISION,
    severity VARCHAR(32),
    rul_hours DOUBLE PRECISION,
    rul_confidence DOUBLE PRECISION,
    rul_ci_lower DOUBLE PRECISION,
    rul_ci_upper DOUBLE PRECISION,
    failure_probability DOUBLE PRECISION,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Health Scores Table
CREATE TABLE IF NOT EXISTS health_scores (
    id VARCHAR(64) PRIMARY KEY,
    engine_id VARCHAR(64) REFERENCES engines(id) ON DELETE CASCADE,
    overall_health DOUBLE PRECISION NOT NULL,
    thermal_health DOUBLE PRECISION NOT NULL,
    combustion_health DOUBLE PRECISION NOT NULL,
    lubrication_health DOUBLE PRECISION NOT NULL,
    vibration_health DOUBLE PRECISION NOT NULL,
    electrical_health DOUBLE PRECISION NOT NULL,
    fuel_system_health DOUBLE PRECISION NOT NULL,
    degradation_index DOUBLE PRECISION NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Degradation History Table
CREATE TABLE IF NOT EXISTS degradation_history (
    id VARCHAR(64) PRIMARY KEY,
    engine_id VARCHAR(64) REFERENCES engines(id) ON DELETE CASCADE,
    operating_hours DOUBLE PRECISION NOT NULL,
    health_pct DOUBLE PRECISION NOT NULL,
    degradation_pct DOUBLE PRECISION NOT NULL,
    thermal_efficiency DOUBLE PRECISION,
    oil_system_health DOUBLE PRECISION,
    combustion_health DOUBLE PRECISION,
    vibration_metric DOUBLE PRECISION,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Maintenance Records Table
CREATE TABLE IF NOT EXISTS maintenance_records (
    id VARCHAR(64) PRIMARY KEY,
    engine_id VARCHAR(64) REFERENCES engines(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    recommendation TEXT NOT NULL,
    priority VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'Pending',
    predicted_risk DOUBLE PRECISION,
    triggered_by_fault VARCHAR(128),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    technician_notes TEXT
);

-- 12. Mission Reports Table
CREATE TABLE IF NOT EXISTS mission_reports (
    id VARCHAR(64) PRIMARY KEY,
    mission_id VARCHAR(64) REFERENCES missions(id) ON DELETE CASCADE,
    engine_id VARCHAR(64) REFERENCES engines(id) ON DELETE CASCADE,
    summary TEXT NOT NULL,
    start_health DOUBLE PRECISION,
    end_health DOUBLE PRECISION,
    fuel_consumed DOUBLE PRECISION,
    max_cht DOUBLE PRECISION,
    max_egt DOUBLE PRECISION,
    max_vibration DOUBLE PRECISION,
    anomalies_detected INTEGER DEFAULT 0,
    faults_detected INTEGER DEFAULT 0,
    rul_impact_hours DOUBLE PRECISION,
    recommendations TEXT,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 13. Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
    id VARCHAR(64) PRIMARY KEY,
    engine_id VARCHAR(64) REFERENCES engines(id) ON DELETE CASCADE,
    category VARCHAR(32) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(32) NOT NULL,
    acknowledged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 14. AI Chat History Table
CREATE TABLE IF NOT EXISTS ai_chat_history (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    engine_id VARCHAR(64) REFERENCES engines(id) ON DELETE SET NULL,
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    context_snapshot TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_telemetry_engine_time ON telemetry(engine_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_predictions_engine_time ON predictions(engine_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_health_engine_time ON health_scores(engine_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_engine_severity ON alerts(engine_id, severity, acknowledged);
