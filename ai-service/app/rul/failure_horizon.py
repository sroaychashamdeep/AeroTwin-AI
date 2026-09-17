"""
AEROTWIN AI - Failure Horizon, Degradation Velocity & Health Trend Forecast
Computes discrete failure probability windows and differential health degradation rates.
"""

from typing import Dict, Any, List
import numpy as np

class FailureHorizonEngine:
    """
    Computes time-to-failure horizon probabilities and degradation velocity.
    """
    def __init__(self):
        self.health_history: List[float] = [95.0, 94.5, 94.0, 93.5, 93.0]

    def update_history(self, current_health: float):
        self.health_history.append(current_health)
        if len(self.health_history) > 30:
            self.health_history.pop(0)

    def calculate(
        self,
        current_health: float,
        expected_rul_hours: float,
        degradation_index: float,
        fault_prob: float
    ) -> Dict[str, Any]:
        self.update_history(current_health)

        # 1. Failure Horizon probabilities
        # Normal healthy engine has virtually 0 probability under 24h
        if current_health >= 90.0 and fault_prob < 0.2:
            p_lt_1h = 0.01
            p_1_6h = 0.03
            p_6_24h = 0.08
            p_1_7d = 0.38
            p_gt_7d = 0.50
        elif current_health >= 78.0:
            p_lt_1h = 0.04
            p_1_6h = 0.12
            p_6_24h = 0.28
            p_1_7d = 0.42
            p_gt_7d = 0.14
        elif current_health >= 65.0:
            p_lt_1h = 0.14
            p_1_6h = 0.36
            p_6_24h = 0.32
            p_1_7d = 0.15
            p_gt_7d = 0.03
        else:
            p_lt_1h = 0.42
            p_1_6h = 0.38
            p_6_24h = 0.14
            p_1_7d = 0.05
            p_gt_7d = 0.01

        horizon = {
            "less_than_1h": round(p_lt_1h, 3),
            "1_to_6h": round(p_1_6h, 3),
            "6_to_24h": round(p_6_24h, 3),
            "1_to_7d": round(p_1_7d, 3),
            "greater_than_7d": round(p_gt_7d, 3)
        }

        # 2. Degradation Velocity (Health Points / 10 operating hours)
        if len(self.health_history) >= 2:
            delta_health = self.health_history[-1] - self.health_history[0]
            rate_per_10h = round((delta_health / max(1, len(self.health_history))) * 10.0, 2)
        else:
            rate_per_10h = -0.4

        if rate_per_10h < -2.5:
            velocity = "ACCELERATING"
        elif rate_per_10h < -0.8:
            velocity = "STABLE"
        else:
            velocity = "DECELERATING" if current_health < 85 else "STABLE"

        # 3. Health Trend Forecast (6h, 12h, 24h, 72h, 7d)
        future_hours = [6, 12, 24, 72, 168]
        forecast_points = []
        for h in future_hours:
            proj_drop = (abs(rate_per_10h) / 10.0) * h
            proj_health = round(float(np.clip(current_health - proj_drop, 20.0, 100.0)), 1)
            margin = round(min(15.0, 2.0 + (h * 0.05)), 1)
            forecast_points.append({
                "timeframe": f"+{h}h" if h < 48 else f"+{h//24}d",
                "hours": h,
                "projected_health": proj_health,
                "lower_bound": round(max(0.0, proj_health - margin), 1),
                "upper_bound": round(min(100.0, proj_health + margin), 1)
            })

        return {
            "failure_horizon": horizon,
            "degradation_rate_per_10h": rate_per_10h,
            "degradation_velocity": velocity,
            "health_trend_forecast": forecast_points
        }
