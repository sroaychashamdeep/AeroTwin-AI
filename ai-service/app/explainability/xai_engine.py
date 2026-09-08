"""
AEROTWIN AI - Explainable AI (XAI) Engine
Feature Attribution, Percent Deviation, Subsystem Impact, and Interpretability
"""

from typing import Dict, Any, List, Optional

class EngineXAiExplainer:
    """
    Provides aerospace engineering explanations for anomaly scores and fault predictions,
    calculating feature deviations relative to the nominal operational baseline.
    """
    # Nominal baseline reference for cruise state (70% throttle, 4800 RPM, 10,000 ft)
    NOMINAL_BASELINES = {
        "rpm": 4850.0,
        "cht": 142.0,
        "egt": 795.0,
        "oil_pressure": 4.2,
        "oil_temperature": 92.0,
        "fuel_flow": 18.2,
        "vibration": 2.1,
        "battery_voltage": 28.1,
        "power": 78.5,
        "injection_timing": 22.0
    }

    SUBSYSTEM_MAP = {
        "cht": "Thermal Management",
        "egt": "Combustion & Exhaust",
        "oil_pressure": "Lubrication System",
        "oil_temperature": "Lubrication System",
        "fuel_flow": "Fuel Injection System",
        "vibration": "Rotating Assembly & Bearings",
        "battery_voltage": "Electrical Bus",
        "power": "Propulsion Output",
        "injection_timing": "FADEC / Ignition Control"
    }

    def explain(
        self,
        telemetry: Dict[str, float],
        primary_fault: str,
        fault_prob: float,
        anomaly_score: float,
        sensor_residuals: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Computes feature deviations, ranks top contributing factors,
        and generates an engineering narrative summary.
        """
        contributing_factors = []
        subsystem_deviations = {
            "Thermal Management": 0.0,
            "Combustion & Exhaust": 0.0,
            "Lubrication System": 0.0,
            "Fuel Injection System": 0.0,
            "Rotating Assembly & Bearings": 0.0,
            "Electrical Bus": 0.0
        }

        # Calculate percentage deviations against nominal baseline
        for param, base_val in self.NOMINAL_BASELINES.items():
            actual_val = float(telemetry.get(param, base_val))
            pct_deviation = ((actual_val - base_val) / base_val) * 100.0
            abs_dev = abs(pct_deviation)

            subsys = self.SUBSYSTEM_MAP.get(param, "General Propulsion")
            subsystem_deviations[subsys] = max(subsystem_deviations.get(subsys, 0.0), abs_dev)

            # Keep significant deviations
            if abs_dev >= 4.0:
                direction = "abnormal increase" if pct_deviation > 0 else "abnormal decrease"
                sign = "+" if pct_deviation > 0 else ""
                contributing_factors.append({
                    "parameter": param,
                    "parameter_label": param.replace("_", " ").upper(),
                    "actual_value": round(actual_val, 2),
                    "baseline_value": round(base_val, 2),
                    "deviation_pct": f"{sign}{round(pct_deviation, 1)}%",
                    "abs_deviation": round(abs_dev, 2),
                    "subsystem": subsys,
                    "direction": direction,
                    "importance_score": round(min(1.0, abs_dev / 50.0), 3)
                })

        # Sort factors by absolute deviation / importance
        contributing_factors.sort(key=lambda x: x["abs_deviation"], reverse=True)
        top_factors = contributing_factors[:5]

        # Determine historical trend classification
        if anomaly_score > 0.75:
            trend = "Progressively degrading rapidly"
        elif anomaly_score > 0.45:
            trend = "Moderate sustained degradation"
        elif anomaly_score > 0.20:
            trend = "Early deviation trend emerging"
        else:
            trend = "Stable within nominal envelope"

        # Generate engineering narrative summary
        if primary_fault == "Healthy" or anomaly_score < 0.25:
            summary = (
                f"Engine telemetry parameters conform to standard aero-piston envelope. "
                f"Thermal margins and lubrication pressures show stability. "
                f"Anomaly score is {round(anomaly_score, 2)} (Normal)."
            )
        else:
            factor_strings = [
                f"{f['parameter_label']} ({f['deviation_pct']} vs nominal)"
                for f in top_factors[:3]
            ]
            factors_joined = ", ".join(factor_strings) if factor_strings else "multivariate sensor divergence"
            summary = (
                f"Identified {primary_fault} with {round(fault_prob * 100.0, 1)}% confidence. "
                f"Primary root cause driven by {factors_joined}. "
                f"Observed trend: {trend}. Recommended immediate maintenance verification."
            )

        return {
            "primary_fault": primary_fault,
            "probability": round(fault_prob, 3),
            "main_contributing_factors": top_factors,
            "subsystem_impacts": {k: round(v, 1) for k, v in subsystem_deviations.items()},
            "historical_trend": trend,
            "narrative_summary": summary
        }
