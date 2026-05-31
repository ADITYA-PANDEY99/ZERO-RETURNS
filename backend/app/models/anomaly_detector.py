"""
AnomalyDetector — Isolation Forest + Z-score based anomaly detection
for return rate time-series monitoring.
"""
from __future__ import annotations

import logging
from typing import Any, Dict, List, Optional

import numpy as np

logger = logging.getLogger(__name__)


class AnomalyDetector:
    """Detects anomalies in return rate time series using Isolation Forest."""

    def __init__(self):
        self.model = None
        self.is_ready: bool = False
        self._fitted_data: Optional[np.ndarray] = None

    # ------------------------------------------------------------------
    def initialize(self):
        """Initialize with a warm-up on synthetic data."""
        # Pre-fit on synthetic 90-day return-rate history
        rng = np.random.RandomState(42)
        synthetic = rng.normal(loc=18.5, scale=2.5, size=90).reshape(-1, 1)
        self.fit(list(synthetic.flatten()))
        logger.info("AnomalyDetector initialized with synthetic warm-up data")

    # ------------------------------------------------------------------
    def fit(self, time_series: List[float]) -> None:
        """Fit Isolation Forest on historical return-rate data."""
        from sklearn.ensemble import IsolationForest

        if len(time_series) < 5:
            logger.warning("AnomalyDetector: insufficient data for fitting")
            return

        data = np.array(time_series, dtype=float).reshape(-1, 1)
        self._fitted_data = data
        self.model = IsolationForest(
            contamination=0.05,
            random_state=42,
            n_estimators=100,
        )
        self.model.fit(data)
        self.is_ready = True

    # ------------------------------------------------------------------
    def detect(self, current_value: float, history: List[float]) -> Dict[str, Any]:
        """
        Detect if current_value is anomalous given historical context.

        Returns:
            is_anomaly: bool
            confidence: 0–1
            reason: explanation string
            severity: normal | warning | critical
        """
        if len(history) < 5:
            return self._zscore_detect(current_value, history)

        try:
            # Isolation Forest score
            if self.model is not None:
                score = self.model.score_samples([[current_value]])[0]
                # score_samples returns negative values; more negative = more anomalous
                is_anomaly = self.model.predict([[current_value]])[0] == -1
                confidence = float(np.clip(abs(score), 0, 1))
            else:
                return self._zscore_detect(current_value, history)

            hist_mean = float(np.mean(history[-30:]))
            hist_std = float(np.std(history[-30:]) or 1.0)
            z = (current_value - hist_mean) / hist_std

            reason = self._build_reason(current_value, hist_mean, z)
            severity = "critical" if abs(z) > 3 else "warning" if is_anomaly else "normal"

            return {
                "is_anomaly": bool(is_anomaly),
                "confidence": round(confidence, 3),
                "z_score": round(float(z), 3),
                "reason": reason,
                "severity": severity,
                "current_value": current_value,
                "expected_range": [
                    round(hist_mean - 2 * hist_std, 2),
                    round(hist_mean + 2 * hist_std, 2),
                ],
            }
        except Exception as e:
            logger.warning(f"AnomalyDetector.detect error: {e}")
            return self._zscore_detect(current_value, history)

    # ------------------------------------------------------------------
    @staticmethod
    def _zscore_detect(current_value: float, history: List[float]) -> Dict[str, Any]:
        """Fallback Z-score based detection."""
        if len(history) < 2:
            return {
                "is_anomaly": False,
                "confidence": 0.0,
                "z_score": 0.0,
                "reason": "Insufficient history for anomaly detection",
                "severity": "normal",
                "current_value": current_value,
                "expected_range": [current_value * 0.8, current_value * 1.2],
            }

        hist = np.array(history, dtype=float)
        mean = float(np.mean(hist))
        std = float(np.std(hist) or 1.0)
        z = (current_value - mean) / std
        is_anomaly = abs(z) > 2.0
        confidence = float(np.clip(abs(z) / 4.0, 0, 1))
        reason = AnomalyDetector._build_reason(current_value, mean, z)
        severity = "critical" if abs(z) > 3 else "warning" if is_anomaly else "normal"

        return {
            "is_anomaly": is_anomaly,
            "confidence": round(confidence, 3),
            "z_score": round(z, 3),
            "reason": reason,
            "severity": severity,
            "current_value": current_value,
            "expected_range": [round(mean - 2 * std, 2), round(mean + 2 * std, 2)],
        }

    # ------------------------------------------------------------------
    @staticmethod
    def _build_reason(current: float, mean: float, z: float) -> str:
        direction = "above" if current > mean else "below"
        pct_diff = abs((current - mean) / mean * 100) if mean else 0
        if abs(z) > 3:
            return (
                f"Critical anomaly: Return rate {direction} normal range by {pct_diff:.1f}%. "
                "Immediate investigation recommended."
            )
        elif abs(z) > 2:
            return (
                f"Anomaly detected: Return rate is {pct_diff:.1f}% {direction} expected "
                f"value of {mean:.1f}%."
            )
        return f"Normal variation: ±{pct_diff:.1f}% from expected {mean:.1f}%."

    # ------------------------------------------------------------------
    def get_daily_anomalies(self, data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Process a list of {date, value} dicts and return anomaly annotations.

        Args:
            data: list of {"date": str, "value": float}

        Returns:
            list of detected anomaly dicts with date, value, and detection info
        """
        if not data:
            return []

        values = [float(d.get("value", 0)) for d in data]
        anomalies = []

        for i, point in enumerate(data):
            history = values[max(0, i - 30):i]  # rolling 30-day window
            current = float(point.get("value", 0))
            result = self.detect(current, history)
            if result["is_anomaly"]:
                anomalies.append({
                    "date": point.get("date", f"day_{i}"),
                    "value": current,
                    **result,
                })

        return anomalies
