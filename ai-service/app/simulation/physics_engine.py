"""
AEROTWIN AI - Reduced-Order Physics Engine Model
Aero Piston Turbocharged Engine (Rotax 914 / 915 iS Class for MALE UAVs)
"""

import math
import random
import numpy as np
from typing import Dict, Any, Optional

class AeroPistonPhysicsModel:
    def __init__(self):
        # Engine Architecture Constants
        self.cylinders = 4
        self.displacement_cc = 1352.0
        self.compression_ratio = 8.2
        self.rated_power_kw = 104.0  # 141 HP
        self.max_rpm = 5800.0
        self.idle_rpm = 1600.0
        self.critical_altitude_ft = 15000.0 # Turbo maintains MAP up to 15,000 ft
        
        # Physical Constants
        self.R_spec = 287.05  # J/(kg*K)
        self.sea_level_press_hpa = 1013.25
        self.sea_level_temp_k = 288.15
        self.temp_lapse_rate = 0.001981  # K per foot
        
        # State memory for smooth thermal dynamics
        self.prev_cht = 142.0
        self.prev_oil_temp = 92.0
        self.prev_oil_press = 4.2
        self.operating_hours = 342.5

    def get_atmospheric_state(self, altitude_ft: float, ambient_temp_c: Optional[float] = None) -> Dict[str, float]:
        """Calculates ISA atmosphere parameters at given altitude."""
        alt = max(0.0, min(35000.0, altitude_ft))
        
        # Standard ISA temperature
        isa_temp_k = self.sea_level_temp_k - (self.temp_lapse_rate * alt)
        if ambient_temp_c is not None:
            actual_temp_k = ambient_temp_c + 273.15
        else:
            actual_temp_k = isa_temp_k
            
        # Standard atmospheric pressure (hPa)
        press_hpa = self.sea_level_press_hpa * math.pow(1.0 - (2.25577e-5 * alt), 5.25588)
        
        # Air density (kg/m3)
        density = (press_hpa * 100.0) / (self.R_spec * actual_temp_k)
        density_ratio = density / 1.225
        
        return {
            "altitude_ft": alt,
            "ambient_temperature_c": actual_temp_k - 273.15,
            "ambient_pressure_hpa": press_hpa,
            "air_density": density,
            "density_ratio": density_ratio
        }

    def compute_telemetry(
        self,
        throttle_pct: float,
        altitude_ft: float = 10000.0,
        ambient_temp_c: Optional[float] = None,
        faults: Optional[Dict[str, float]] = None,
        add_noise: bool = True
    ) -> Dict[str, Any]:
        """
        Computes fully coupled, physics-informed engine telemetry.
        Correlates RPM, Torque, Power, BSFC, CHT, EGT, Oil, Vibration, and Electrical.
        """
        faults = faults or {}
        inj_deg = float(faults.get("injector_degradation", 0.0))
        misfire = float(faults.get("misfire_severity", 0.0))
        lub_deg = float(faults.get("lubrication_degradation", 0.0))
        overheat = float(faults.get("overheating", 0.0))
        vib_fault = float(faults.get("vibration_fault", 0.0))
        sens_drift = float(faults.get("sensor_drift", 0.0))

        # 1. Environmental coupling
        env = self.get_atmospheric_state(altitude_ft, ambient_temp_c)
        T_amb = env["ambient_temperature_c"]
        density_ratio = env["density_ratio"]
        alt_penalty = max(0.0, (altitude_ft - self.critical_altitude_ft) / 15000.0) * 0.25

        # 2. Powerplant Mechanical Dynamics (RPM, Torque, Power)
        throttle = max(0.0, min(100.0, throttle_pct))
        
        # Base RPM from throttle with governor
        rpm_target = self.idle_rpm + (self.max_rpm - self.idle_rpm) * (throttle / 100.0) ** 0.85
        # Friction and misfire drag
        rpm_target -= (misfire * 450.0 + lub_deg * 120.0 + overheat * 80.0)
        rpm = max(1200.0, min(6000.0, rpm_target))

        # Engine Load %
        engine_load = max(10.0, min(100.0, throttle * (1.0 - alt_penalty * 0.5) + misfire * 15.0))

        # Torque (Nm): Peak torque around 4800-5200 RPM
        rpm_norm = (rpm - 4800.0) / 1000.0
        torque_base = (145.0 - 18.0 * (rpm_norm ** 2)) * (engine_load / 100.0)
        torque = max(15.0, torque_base * (1.0 - misfire * 0.45 - lub_deg * 0.15 - inj_deg * 0.2))

        # Shaft Power: P = 2*pi*N*T / 60 / 1000 (kW)
        power_kw = (2.0 * math.pi * rpm * torque) / (60.0 * 1000.0)

        # 3. Fuel Dynamics & BSFC
        # BSFC curve: sweet spot around 70% load (~270 g/kWh), higher at idle & full throttle
        load_ratio = engine_load / 100.0
        bsfc_g_kwh = 270.0 + 110.0 * ((load_ratio - 0.72) ** 2) + (50.0 if rpm > 5400 else 0.0)
        if inj_deg > 0.0:
            bsfc_g_kwh += inj_deg * 115.0 # Inefficient combustion / leaking injector
        
        fuel_mass_flow_kg_h = (bsfc_g_kwh * power_kw) / 1000.0
        # Fuel density ~ 0.74 kg/L (AvGas 100LL or Mogas)
        fuel_flow_l_h = fuel_mass_flow_kg_h / 0.74
        fuel_flow_l_h = max(2.5, fuel_flow_l_h)

        # 4. Thermal Behavior (Thermodynamic Heat Balance)
        # Heat generation = f(fuel flow, combustion efficiency)
        heat_gen = fuel_flow_l_h * 32.0 * (1.0 + inj_deg * 0.35 + overheat * 0.6)
        # Heat dissipation = f(airspeed/prop-wash, ambient temp)
        cooling_factor = 0.45 * math.sqrt(rpm / 5000.0) * density_ratio
        cooling_rate = (self.prev_cht - T_amb) * cooling_factor

        # Steady-state target CHT
        cht_target = T_amb + 75.0 + (engine_load * 0.78) + (heat_gen * 0.12)
        cht_target += (overheat * 65.0 + inj_deg * 28.0 + misfire * 14.0)
        cht = self.prev_cht * 0.82 + cht_target * 0.18
        self.prev_cht = cht

        # Exhaust Gas Temperature (EGT)
        # Peak EGT around stoichiometric (slightly lean of peak)
        egt_base = 740.0 + (engine_load * 1.3) + (rpm / 5800.0) * 35.0
        # Injector degradation causes localized lean/rich divergence
        egt_target = egt_base + (inj_deg * 78.0) - (misfire * 110.0) + (overheat * 45.0)
        egt = egt_target

        # 5. Lubrication Dynamics
        # Dynamic viscosity decreases as oil temp rises
        oil_temp_target = 82.0 + (engine_load * 0.24) + ((cht - 140.0) * 0.18) + (lub_deg * 38.0) + (overheat * 22.0)
        oil_temp = self.prev_oil_temp * 0.85 + oil_temp_target * 0.15
        self.prev_oil_temp = oil_temp

        # Oil pressure increases with RPM, drops with oil temp (viscosity) and bearing wear
        viscosity_factor = math.exp(280.0 / (oil_temp + 273.15) - 280.0 / 363.15)
        oil_press_target = (1.8 + 2.8 * (rpm / 5800.0)) * viscosity_factor
        oil_press_target -= (lub_deg * 2.2 + overheat * 0.5)
        oil_pressure = max(0.6, oil_press_target)
        self.prev_oil_press = oil_pressure

        # 6. Vibration Harmonics & Mechanical Dynamics
        # Fundamental rotational component
        f0 = rpm / 60.0
        # Baseline vibration RMS (mm/s)
        base_vib = 1.4 + 1.2 * (rpm / 5800.0) ** 1.5 + (engine_load / 100.0) * 0.5
        # Degradation additions
        vib_anomaly = (vib_fault * 5.2) + (misfire * 4.4) + (lub_deg * 2.8) + (inj_deg * 1.5)
        vibration = max(0.8, base_vib + vib_anomaly)

        # 7. Electrical Subsystem
        # Alternator driven by engine accessory gearbox
        alt_active = rpm > 1400.0
        battery_voltage = 28.2 - (0.05 * (5800.0 - rpm) / 1000.0) if alt_active else 24.1
        if lub_deg > 0.7:
            battery_voltage -= 0.6
        alternator_output = max(5.0, 38.0 * (engine_load / 100.0) + (2.0 if alt_active else 0.0))

        # 8. Electronic Fuel Injection (EFI) Timing
        # Advance timing with RPM, retard under heavy load
        injection_timing = 18.0 + (rpm / 5800.0) * 8.0 - (engine_load / 100.0) * 3.0
        if inj_deg > 0.0:
            injection_timing += inj_deg * 4.0

        # Physical true values (before sensor noise & drift)
        true_telemetry = {
            "rpm": float(rpm),
            "cht": float(cht),
            "egt": float(egt),
            "oil_pressure": float(oil_pressure),
            "oil_temperature": float(oil_temp),
            "fuel_flow": float(fuel_flow_l_h),
            "vibration": float(vibration),
            "battery_voltage": float(battery_voltage),
            "alternator_output": float(alternator_output),
            "injection_timing": float(injection_timing),
            "throttle": float(throttle),
            "torque": float(torque),
            "power": float(power_kw),
            "altitude": float(altitude_ft),
            "ambient_temperature": float(T_amb),
            "ambient_pressure": float(env["ambient_pressure_hpa"]),
            "humidity": float(env.get("humidity", 48.0)),
            "engine_load": float(engine_load),
        }

        # Sensor readings with measurement noise and sensor drift
        measured = dict(true_telemetry)
        if add_noise:
            measured["rpm"] += random.gauss(0, 8.0)
            measured["cht"] += random.gauss(0, 0.4)
            measured["egt"] += random.gauss(0, 1.8)
            measured["oil_pressure"] += random.gauss(0, 0.03)
            measured["oil_temperature"] += random.gauss(0, 0.25)
            measured["fuel_flow"] += random.gauss(0, 0.12)
            measured["vibration"] += random.gauss(0, 0.08)
            measured["battery_voltage"] += random.gauss(0, 0.04)

        # Apply sensor drift / sensor fault if injected
        if sens_drift > 0.0:
            # Affect CHT or Oil Pressure with drift
            measured["cht"] -= sens_drift * 55.0  # Drift or stuck low
            measured["oil_pressure"] += sens_drift * 1.8

        return {
            "measured": measured,
            "physics_expected": true_telemetry,
            "faults_active": faults,
            "operating_hours": self.operating_hours
        }

    def reset(self):
        """Resets dynamic thermal/pressure states."""
        self.prev_cht = 142.0
        self.prev_oil_temp = 92.0
        self.prev_oil_press = 4.2
