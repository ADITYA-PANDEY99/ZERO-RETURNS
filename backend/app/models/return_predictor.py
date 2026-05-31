"""
ReturnPredictor — lightweight scikit-learn / XGBoost model for predicting
product return probability. Falls back to heuristic scoring when no trained
model is available so the API works with zero data out of the box.
"""
from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.pipeline import Pipeline

logger = logging.getLogger(__name__)

MODEL_DIR = Path(__file__).parent.parent.parent / "ml_models"
MODEL_PATH = MODEL_DIR / "return_predictor.joblib"

CATEGORY_RISK = {
    "Electronics": 0.72,
    "Clothing": 0.65,
    "Footwear": 0.58,
    "Home": 0.42,
    "Beauty": 0.35,
    "Books": 0.18,
    "Sports": 0.45,
    "Toys": 0.39,
    "Grocery": 0.12,
    "Jewellery": 0.48,
}


class ReturnPredictor:
    """Return probability predictor using Random Forest."""

    FEATURE_COLS = [
        "price_log",
        "description_length",
        "description_quality",
        "image_quality",
        "seller_rating",
        "review_count_log",
        "avg_review_score",
        "days_to_delivery",
        "category_risk",
    ]

    def __init__(self):
        self.model: Optional[Pipeline] = None
        self.is_ready: bool = False
        self._label_encoder = LabelEncoder()

    # ------------------------------------------------------------------
    def initialize(self):
        """Load persisted model or build a pre-fitted mock model."""
        MODEL_DIR.mkdir(parents=True, exist_ok=True)
        if MODEL_PATH.exists():
            try:
                self.model = joblib.load(MODEL_PATH)
                self.is_ready = True
                logger.info("ReturnPredictor: loaded model from disk")
                return
            except Exception as e:
                logger.warning(f"ReturnPredictor: failed to load model — {e}")

        # Build a mock pre-fitted model on synthetic data
        self._build_mock_model()

    # ------------------------------------------------------------------
    def _build_mock_model(self):
        """Train a RandomForest on 500 synthetic samples so the API returns
        realistic predictions without any real data."""
        rng = np.random.RandomState(42)
        n = 500

        # Synthetic features
        category_risks = rng.choice(list(CATEGORY_RISK.values()), n)
        price_log = rng.uniform(2, 12, n)           # log(price in INR)
        desc_len = rng.uniform(50, 800, n)
        desc_quality = rng.uniform(0.2, 1.0, n)
        img_quality = rng.uniform(0.3, 1.0, n)
        seller_rating = rng.uniform(1.0, 5.0, n)
        review_cnt_log = rng.uniform(0, 8, n)
        avg_review = rng.uniform(1.0, 5.0, n)
        days_delivery = rng.uniform(1, 14, n)

        X = np.column_stack([
            price_log, desc_len, desc_quality, img_quality,
            seller_rating, review_cnt_log, avg_review,
            days_delivery, category_risks,
        ])

        # Synthetic labels — high risk when quality is poor & price is high
        prob = (
            0.4 * category_risks
            + 0.15 * (1 - desc_quality)
            + 0.15 * (1 - img_quality)
            + 0.1 * (1 - avg_review / 5)
            + 0.1 * (days_delivery / 14)
            + 0.1 * rng.uniform(0, 1, n)
        )
        y = (prob > 0.5).astype(int)

        self.model = Pipeline([
            ("scaler", StandardScaler()),
            ("clf", RandomForestClassifier(
                n_estimators=100, max_depth=6, random_state=42, n_jobs=1
            )),
        ])
        self.model.fit(X, y)
        self.is_ready = True

        # Persist
        try:
            joblib.dump(self.model, MODEL_PATH)
            logger.info("ReturnPredictor: mock model trained and saved")
        except Exception as e:
            logger.warning(f"ReturnPredictor: could not save model — {e}")

    # ------------------------------------------------------------------
    def _features_to_array(self, features: Dict[str, Any]) -> np.ndarray:
        category = features.get("category", "Other")
        cat_risk = CATEGORY_RISK.get(category, 0.45)

        price = max(float(features.get("price", 999)), 1)
        price_log = np.log(price)

        desc_len = float(features.get("description_length", 200))
        desc_quality = float(features.get("description_quality", 0.5))
        img_quality = float(features.get("image_quality", 0.5))
        seller_rating = float(features.get("seller_rating", 3.5))
        review_count = max(float(features.get("review_count", 10)), 1)
        review_cnt_log = np.log(review_count)
        avg_review = float(features.get("avg_review_score", 3.5))
        days_delivery = float(features.get("days_to_delivery", 5))

        return np.array([[
            price_log, desc_len, desc_quality, img_quality,
            seller_rating, review_cnt_log, avg_review,
            days_delivery, cat_risk,
        ]])

    # ------------------------------------------------------------------
    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Predict return probability and risk level for a single order."""
        if not self.is_ready or self.model is None:
            return self._generate_mock_prediction(features)

        try:
            X = self._features_to_array(features)
            probability = float(self.model.predict_proba(X)[0][1])
            risk_level = self._probability_to_risk(probability)
            risk_factors = self._compute_risk_factors(features, probability)
            return {
                "probability": round(probability, 4),
                "risk_score": round(probability * 100, 1),
                "risk_level": risk_level,
                "risk_factors": risk_factors,
            }
        except Exception as e:
            logger.error(f"ReturnPredictor.predict error: {e}")
            return self._generate_mock_prediction(features)

    # ------------------------------------------------------------------
    def _generate_mock_prediction(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Heuristic-based fallback that produces realistic probabilities."""
        category = features.get("category", "Other")
        cat_risk = CATEGORY_RISK.get(category, 0.45)
        price = float(features.get("price", 999))
        desc_quality = float(features.get("description_quality", 0.5))
        img_quality = float(features.get("image_quality", 0.5))
        avg_review = float(features.get("avg_review_score", 3.5))

        price_factor = min(price / 50000, 1.0) * 0.15  # higher price → more risk
        probability = (
            cat_risk * 0.35
            + (1 - desc_quality) * 0.20
            + (1 - img_quality) * 0.20
            + (1 - avg_review / 5) * 0.15
            + price_factor
            + 0.05
        )
        probability = float(np.clip(probability, 0.05, 0.95))
        return {
            "probability": round(probability, 4),
            "risk_score": round(probability * 100, 1),
            "risk_level": self._probability_to_risk(probability),
            "risk_factors": self._compute_risk_factors(features, probability),
        }

    # ------------------------------------------------------------------
    @staticmethod
    def _probability_to_risk(prob: float) -> str:
        if prob >= 0.75:
            return "Critical"
        elif prob >= 0.55:
            return "High"
        elif prob >= 0.35:
            return "Medium"
        return "Low"

    # ------------------------------------------------------------------
    @staticmethod
    def _compute_risk_factors(features: Dict[str, Any], prob: float) -> List[str]:
        factors = []
        desc_quality = float(features.get("description_quality", 0.5))
        img_quality = float(features.get("image_quality", 0.5))
        avg_review = float(features.get("avg_review_score", 3.5))
        days_delivery = float(features.get("days_to_delivery", 5))
        price = float(features.get("price", 999))
        category = features.get("category", "Other")

        if desc_quality < 0.4:
            factors.append("Poor product description quality")
        if img_quality < 0.4:
            factors.append("Low-quality product images")
        if avg_review < 3.0:
            factors.append("Low average review score")
        if days_delivery > 7:
            factors.append("Slow delivery time increases dissatisfaction")
        if price > 10000:
            factors.append("High-value item has elevated return risk")
        if category in ["Electronics", "Clothing"]:
            factors.append(f"{category} category has inherently high return rate")
        if not factors:
            factors.append("Moderate risk based on category and pricing")
        return factors[:5]

    # ------------------------------------------------------------------
    def train(self, data: pd.DataFrame) -> Dict[str, Any]:
        """Train (or retrain) on provided labelled data."""
        required = {"returned", "category", "price"}
        missing = required - set(data.columns)
        if missing:
            raise ValueError(f"Missing columns for training: {missing}")

        def _safe_feature(col, default, transform=None):
            if col in data.columns:
                val = pd.to_numeric(data[col], errors="coerce").fillna(default)
                return transform(val) if transform else val
            return pd.Series([default] * len(data))

        cat_risk = data["category"].map(CATEGORY_RISK).fillna(0.45)
        X = pd.DataFrame({
            "price_log": np.log(pd.to_numeric(data["price"], errors="coerce").fillna(999).clip(lower=1)),
            "description_length": _safe_feature("description_length", 200),
            "description_quality": _safe_feature("description_quality", 0.5),
            "image_quality": _safe_feature("image_quality", 0.5),
            "seller_rating": _safe_feature("seller_rating", 3.5),
            "review_count_log": np.log(_safe_feature("review_count", 10).clip(lower=1)),
            "avg_review_score": _safe_feature("avg_review_score", 3.5),
            "days_to_delivery": _safe_feature("days_to_delivery", 5),
            "category_risk": cat_risk,
        }).values

        y = pd.to_numeric(data["returned"], errors="coerce").fillna(0).astype(int).values

        self.model = Pipeline([
            ("scaler", StandardScaler()),
            ("clf", RandomForestClassifier(n_estimators=200, max_depth=8, random_state=42)),
        ])
        self.model.fit(X, y)
        self.is_ready = True
        joblib.dump(self.model, MODEL_PATH)

        train_acc = self.model.score(X, y)
        logger.info(f"ReturnPredictor retrained: accuracy={train_acc:.3f} on {len(y)} samples")
        return {"status": "trained", "samples": len(y), "accuracy": round(train_acc, 4)}
