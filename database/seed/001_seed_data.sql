-- AEROTWIN AI: Seed Data
-- Realistic MALE UAV Fleet, Engines, Users, and Baseline Telemetry

-- 1. Users (Password hashes for demo purposes; bcrypt hashes of 'Aerotwin2026!')
INSERT INTO users (id, username, email, password_hash, role, full_name) VALUES
('usr_admin', 'admin', 'admin@aerotwin.mil', '$2a$10$wN9P3P1QW8lG5h9ZkSXeCOkM68qTz9n3.XoN3.7g/jZc0t8vK3a2u', 'Administrator', 'Flight Ops Commander'),
('usr_eng', 'engineer', 'lead.engineer@aerotwin.mil', '$2a$10$wN9P3P1QW8lG5h9ZkSXeCOkM68qTz9n3.XoN3.7g/jZc0t8vK3a2u', 'Engineer', 'Chief Propulsion Specialist'),
('usr_tech', 'tech', 'maintenance@aerotwin.mil', '$2a$10$wN9P3P1QW8lG5h9ZkSXeCOkM68qTz9n3.XoN3.7g/jZc0t8vK3a2u', 'Maintenance', 'Avionics & Powerplant Tech'),
('usr_pilot', 'operator', 'gcs.pilot@aerotwin.mil', '$2a$10$wN9P3P1QW8lG5h9ZkSXeCOkM68qTz9n3.XoN3.7g/jZc0t8vK3a2u', 'Operator', 'MALE GCS Flight Operator')
ON CONFLICT (id) DO NOTHING;

-- 2. UAVs
INSERT INTO uavs (id, tail_number, model, callsign, status, total_flight_hours) VALUES
('uav_001', 'UAV-001', 'TAPAS MALE-201', 'GARUDA-01', 'ACTIVE', 342.5),
('uav_002', 'UAV-002', 'Hermes 450 Class', 'VALKYRIE-02', 'ACTIVE', 512.0),
('uav_003', 'UAV-003', 'Predator XP MALE', 'SHADOW-03', 'ACTIVE', 188.2),
('uav_004', 'UAV-004', 'Heron TP Class', 'SENTINEL-04', 'MAINTENANCE', 680.7)
ON CONFLICT (id) DO NOTHING;

-- 3. Engines
INSERT INTO engines (id, uav_id, serial_number, model, rated_power_hp, max_rpm, operating_hours, status) VALUES
('eng_001', 'uav_001', 'RTX-914-F0192', 'Rotax 914 Turbo Aero Piston', 115.0, 5800.0, 342.5, 'NOMINAL'),
('eng_002', 'uav_002', 'RTX-915-iS-4410', 'Rotax 915 iS Turbo Fuel-Injected', 141.0, 5800.0, 512.0, 'ATTENTION'),
('eng_003', 'uav_003', 'RTX-915-iS-8821', 'Rotax 915 iS Turbo Fuel-Injected', 141.0, 5800.0, 188.2, 'NOMINAL'),
('eng_004', 'uav_004', 'RTX-914-F0076', 'Rotax 914 Turbo Aero Piston', 115.0, 5800.0, 680.7, 'WARNING')
ON CONFLICT (id) DO NOTHING;

-- 4. Baseline Missions
INSERT INTO missions (id, uav_id, engine_id, code, mission_type, status, target_altitude_ft, target_throttle_pct, ambient_temp_c, duration_hours, fuel_consumed_kg, mission_risk) VALUES
('msn_001', 'uav_001', 'eng_001', 'MSN-ISR-0841', 'ISR', 'IN_PROGRESS', 15000.0, 72.0, 24.5, 8.0, 34.2, 'LOW'),
('msn_002', 'uav_002', 'eng_002', 'MSN-MAR-0319', 'Maritime Surveillance', 'COMPLETED', 12000.0, 68.0, 28.0, 10.0, 48.6, 'MEDIUM'),
('msn_003', 'uav_003', 'eng_003', 'MSN-REL-1002', 'Communication Relay', 'SCHEDULED', 18000.0, 65.0, 18.0, 14.0, 0.0, 'LOW'),
('msn_004', 'uav_004', 'eng_004', 'MSN-HOT-0077', 'Hot-Weather Endurance', 'COMPLETED', 14000.0, 78.0, 42.0, 6.5, 38.9, 'HIGH')
ON CONFLICT (id) DO NOTHING;

-- 5. Baseline Health Scores
INSERT INTO health_scores (id, engine_id, overall_health, thermal_health, combustion_health, lubrication_health, vibration_health, electrical_health, fuel_system_health, degradation_index) VALUES
('hlth_001', 'eng_001', 94.2, 92.5, 96.0, 93.8, 95.1, 98.0, 94.7, 5.8),
('hlth_002', 'eng_002', 78.4, 74.0, 81.2, 79.5, 71.0, 91.0, 83.2, 21.6),
('hlth_003', 'eng_003', 96.8, 97.0, 98.1, 95.9, 96.4, 99.2, 97.5, 3.2),
('hlth_004', 'eng_004', 61.3, 58.2, 64.0, 59.1, 62.8, 84.5, 60.2, 38.7)
ON CONFLICT (id) DO NOTHING;

-- 6. Baseline Maintenance Records
INSERT INTO maintenance_records (id, engine_id, title, description, recommendation, priority, status, predicted_risk, triggered_by_fault) VALUES
('mnt_001', 'eng_001', 'Routine 350-Hour TBO Inspection', 'Scheduled borescope inspection of cylinders and valve lash check', 'Inspect cylinder 3 intake valve and oil filter particulate trap', 'LOW', 'Pending', 0.08, 'None'),
('mnt_002', 'eng_002', 'Vibration Spectral Peak & Oil Pressure Warning', 'Increasing 1X rotational vibration with subtle oil pressure decay', 'Inspect journal bearings, inspect oil pump relief valve, and check magnetic chip detector', 'HIGH', 'Pending', 0.68, 'Lubrication Degradation'),
('mnt_004', 'eng_004', 'Overheating & Injector Nozzle Cleaning', 'Cylinder 2 CHT trending above 185C during climb phase', 'Clean and bench-test electro-injectors, flush oil heat exchanger radiator', 'CRITICAL', 'Pending', 0.84, 'Overheating / Injector Degradation')
ON CONFLICT (id) DO NOTHING;

-- 7. Baseline Alerts
INSERT INTO alerts (id, engine_id, category, title, message, severity, acknowledged) VALUES
('alt_001', 'eng_001', 'INFO', 'Digital Twin Synchronized', 'Telemetry pipeline connected via high-frequency telemetry stream. Sync fidelity 99.4%', 'LOW', false),
('alt_002', 'eng_002', 'PREDICTIVE', 'Elevated Vibration Harmonic Detected', 'Vibration RMS reached 4.6 mm/s at 5200 RPM. Trending above nominal baseline', 'WARNING', false),
('alt_003', 'eng_004', 'CRITICAL', 'CHT Thermal Margin Exceeded', 'Cylinder Head Temp reached 192C under 78% throttle. Recommended power reduction', 'CRITICAL', false)
ON CONFLICT (id) DO NOTHING;
