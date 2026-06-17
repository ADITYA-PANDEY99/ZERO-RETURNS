"""
ReturnPredictor — 4-model ensemble (RandomForest + XGBoost + LightGBM + CatBoost)
for predicting product return probability.

NOTE: Training uses 1500 synthetic samples at startup (no real data required).
Synthetic data is calibrated to Indian e-commerce return patterns.
In production, call .train(real_data_df) to retrain on your actual orders.

Model breakdown:
  1. RandomForestClassifier  (sklearn)
  2. XGBClassifier           (xgboost)
  3. LGBMClassifier          (lightgbm)
  4. CatBoostClassifier      (catboost)

Combination: soft-voting (average of predicted_proba from all 4 models).
Each model's individual prediction is included in the response for transparency.
"""
from __future__ import annotations

import logging
import warnings
from pathlib import Path
from typing import Any, Dict, List, Optional

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

logger = logging.getLogger(__name__)

MODEL_DIR = Path(__file__).parent.parent.parent / "ml_models"
ENSEMBLE_PATH = MODEL_DIR / "ensemble_predictor.joblib"

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

# Feature names (must match _features_to_array order)
FEATURE_COLS = [
    "price_log", "description_length", "description_quality",
    "image_quality", "seller_rating", "review_count_log",
    "avg_review_score", "days_to_delivery", "category_risk",
]


def _make_synthetic_data(n: int = 1500, seed: int = 42) -> tuple[np.ndarray, np.ndarray]:
    """
    Generate n synthetic training samples calibrated to Indian e-commerce patterns.
    Synthetic because no real labelled data is available at startup — the model
    gives reasonable predictions and should be retrained on real data once available.
    """
    rng = np.random.RandomState(seed)

    category_risks = rng.choice(list(CATEGORY_RISK.values()), n)
    price_log = rng.uniform(4, 12, n)              # log(₹55 to ₹162K)
    desc_len = rng.uniform(20, 1200, n)
    desc_quality = rng.uniform(0.15, 1.0, n)
    img_quality = rng.uniform(0.20, 1.0, n)
    seller_rating = rng.uniform(1.5, 5.0, n)
    review_cnt_log = rng.uniform(0, 8, n)
    avg_review = rng.uniform(1.0, 5.0, n)
    days_delivery = rng.uniform(1, 14, n)

    X = np.column_stack([
        price_log, desc_len, desc_quality, img_quality,
        seller_rating, review_cnt_log, avg_review,
        days_delivery, category_risks,
    ])

    # Label: high return probability when quality is poor, price is high, reviews bad
    prob = (
        0.35 * category_risks
        + 0.18 * (1 - desc_quality)
        + 0.17 * (1 - img_quality)
        + 0.12 * (1 - avg_review / 5)
        + 0.10 * (days_delivery / 14)
        + 0.05 * rng.uniform(0, 1, n)   # random noise
        + 0.03 * np.clip((price_log - 8) / 4, 0, 1)   # very high price adds risk
    )
    y = (prob > 0.48).astype(int)   # ~45% positive class
    return X, y


class ReturnPredictor:
    """
    4-model soft-voting ensemble return predictor.
    Trains RF + XGBoost + LightGBM + CatBoost on 1500 synthetic samples at startup.
    """

    def __init__(self):
        self._models: Dict[str, Any] = {}   # name → fitted model/pipeline
        self._scaler: Optional[StandardScaler] = None
        self.is_ready: bool = False

    # ------------------------------------------------------------------
    def initialize(self):
        """Load persisted ensemble or train a new one on synthetic data."""
        MODEL_DIR.mkdir(parents=True, exist_ok=True)

        if ENSEMBLE_PATH.exists():
            try:
                saved = joblib.load(ENSEMBLE_PATH)
                self._models = saved["models"]
                self._scaler = saved["scaler"]
                self.is_ready = True
                model_names = list(self._models.keys())
                logger.info(f"ReturnPredictor: loaded ensemble from disk — {model_names}")
                return
            except Exception as e:
                logger.warning(f"ReturnPredictor: could not load ensemble — {e}, rebuilding...")

        self._build_ensemble()

    # ------------------------------------------------------------------
    def _build_ensemble(self):
        """Train 4 models on synthetic data and save the ensemble."""
        logger.info("ReturnPredictor: training ensemble (RF + XGBoost + LightGBM + CatBoost) ...")
        X, y = _make_synthetic_data(n=1500, seed=42)

        self._scaler = StandardScaler()
        X_scaled = self._scaler.fit_transform(X)

        models_to_train = [
            ("random_forest", self._build_rf),
            ("xgboost",       self._build_xgb),
            ("lightgbm",      self._build_lgbm),
            ("catboost",      self._build_catboost),
        ]

        self._models = {}
        for name, builder in models_to_train:
            try:
                model = builder(X_scaled, y)
                self._models[name] = model
                logger.info(f"  ✅ {name} trained")
            except Exception as e:
                logger.warning(f"  ⚠️  {name} failed — {e} (skipping)")

        if not self._models:
            raise RuntimeError("No models could be trained — check dependencies")

        self.is_ready = True
        logger.info(f"ReturnPredictor: ensemble ready with {len(self._models)} model(s): {list(self._models.keys())}")

        try:
            joblib.dump({"models": self._models, "scaler": self._scaler}, ENSEMBLE_PATH)
            logger.info("ReturnPredictor: ensemble saved to disk")
        except Exception as e:
            logger.warning(f"ReturnPredictor: could not save ensemble — {e}")

    # ------------------------------------------------------------------
    @staticmethod
    def _build_rf(X, y):
        from sklearn.ensemble import RandomForestClassifier
        model = RandomForestClassifier(
            n_estimators=150, max_depth=7, min_samples_leaf=5,
            random_state=42, n_jobs=1
        )
        model.fit(X, y)
        return model

    @staticmethod
    def _build_xgb(X, y):
        from xgboost import XGBClassifier
        model = XGBClassifier(
            n_estimators=150, max_depth=5, learning_rate=0.1,
            subsample=0.8, colsample_bytree=0.8,
            random_state=42, eval_metric="logloss",
            use_label_encoder=False, verbosity=0,
        )
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            model.fit(X, y)
        return model

    @staticmethod
    def _build_lgbm(X, y):
        from lightgbm import LGBMClassifier
        import numpy as np
        model = LGBMClassifier(
            n_estimators=150, max_depth=5, learning_rate=0.1,
            num_leaves=31, subsample=0.8, colsample_bytree=0.8,
            random_state=42, verbosity=-1,
        )
        # Pass as numpy array to avoid feature-name mismatch warning at predict time
        model.fit(np.asarray(X), np.asarray(y))
        return model

    @staticmethod
    def _build_catboost(X, y):
        from catboost import CatBoostClassifier
        model = CatBoostClassifier(
            iterations=150, depth=5, learning_rate=0.1,
            random_seed=42, verbose=False,
        )
        model.fit(X, y)
        return model

    # ------------------------------------------------------------------
    def _features_to_array(self, features: Dict[str, Any]) -> np.ndarray:
        """Convert feature dict to model input array."""
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
        """
        Predict return probability using the ensemble.
        Returns:
          - probability: ensemble soft-vote average
          - risk_score: 0–100
          - risk_level: Low/Medium/High/Critical
          - risk_factors: top contributing factors
          - model_breakdown: individual predictions from each model
          - models_used: list of model names that contributed
        """
        if not self.is_ready or not self._models:
            return self._heuristic_fallback(features)

        try:
            X = self._features_to_array(features)
            X_scaled = self._scaler.transform(X) if self._scaler else X

            individual_probs: Dict[str, float] = {}
            for name, model in self._models.items():
                try:
                    prob = float(model.predict_proba(X_scaled)[0][1])
                    individual_probs[name] = round(prob, 4)
                except Exception as e:
                    logger.debug(f"Model {name} predict error: {e}")

            if not individual_probs:
                return self._heuristic_fallback(features)

            # Soft voting: average all model probabilities
            ensemble_prob = float(np.mean(list(individual_probs.values())))
            risk_level = self._probability_to_risk(ensemble_prob)
            risk_factors = self._compute_risk_factors(features, ensemble_prob)

            return {
                "probability": round(ensemble_prob, 4),
                "risk_score": round(ensemble_prob * 100, 1),
                "risk_level": risk_level,
                "risk_factors": risk_factors,
                "model_breakdown": {
                    name: {"probability": p, "risk_score": round(p * 100, 1)}
                    for name, p in individual_probs.items()
                },
                "models_used": list(individual_probs.keys()),
                "ensemble_method": "soft_voting",
            }

        except Exception as e:
            logger.error(f"ReturnPredictor.predict error: {e}")
            return self._heuristic_fallback(features)

    # ------------------------------------------------------------------
    def _heuristic_fallback(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """Heuristic scoring when ensemble models are unavailable."""
        category = features.get("category", "Other")
        cat_risk = CATEGORY_RISK.get(category, 0.45)
        price = float(features.get("price", 999))
        desc_quality = float(features.get("description_quality", 0.5))
        img_quality = float(features.get("image_quality", 0.5))
        avg_review = float(features.get("avg_review_score", 3.5))
        days_delivery = float(features.get("days_to_delivery", 5))

        probability = float(np.clip(
            cat_risk * 0.35
            + (1 - desc_quality) * 0.20
            + (1 - img_quality) * 0.20
            + (1 - avg_review / 5) * 0.15
            + min(price / 50000, 1.0) * 0.10,
            0.05, 0.95,
        ))
        return {
            "probability": round(probability, 4),
            "risk_score": round(probability * 100, 1),
            "risk_level": self._probability_to_risk(probability),
            "risk_factors": self._compute_risk_factors(features, probability),
            "model_breakdown": {},
            "models_used": ["heuristic_fallback"],
            "ensemble_method": "heuristic",
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
        """Retrain ensemble on real labelled data."""
        required = {"returned", "category", "price"}
        missing = required - set(data.columns)
        if missing:
            raise ValueError(f"Missing columns for training: {missing}")

        def _safe_col(col, default):
            if col in data.columns:
                return pd.to_numeric(data[col], errors="coerce").fillna(default)
            return pd.Series([default] * len(data))

        cat_risk = data["category"].map(CATEGORY_RISK).fillna(0.45)
        price_series = pd.to_numeric(data["price"], errors="coerce").fillna(999).clip(lower=1)

        X = np.column_stack([
            np.log(price_series),
            _safe_col("description_length", 200),
            _safe_col("description_quality", 0.5),
            _safe_col("image_quality", 0.5),
            _safe_col("seller_rating", 3.5),
            np.log(_safe_col("review_count", 10).clip(lower=1)),
            _safe_col("avg_review_score", 3.5),
            _safe_col("days_to_delivery", 5),
            cat_risk,
        ])
        y = pd.to_numeric(data["returned"], errors="coerce").fillna(0).astype(int).values

        # Reuse existing model builders on real data
        self._scaler = StandardScaler()
        X_scaled = self._scaler.fit_transform(X)

        self._models = {}
        for name, builder in [
            ("random_forest", self._build_rf),
            ("xgboost",       self._build_xgb),
            ("lightgbm",      self._build_lgbm),
            ("catboost",      self._build_catboost),
        ]:
            try:
                self._models[name] = builder(X_scaled, y)
            except Exception as e:
                logger.warning(f"Retrain skipping {name}: {e}")

        self.is_ready = True
        joblib.dump({"models": self._models, "scaler": self._scaler}, ENSEMBLE_PATH)

        # Accuracy on training set (informational — use cross-val for real evaluation)
        probs = np.mean([m.predict_proba(X_scaled)[:, 1] for m in self._models.values()], axis=0)
        train_acc = float(np.mean((probs > 0.5).astype(int) == y))
        logger.info(f"ReturnPredictor retrained: {len(y)} samples, {len(self._models)} models, train_acc={train_acc:.3f}")

        return {
            "status": "trained",
            "samples": len(y),
            "models": list(self._models.keys()),
            "train_accuracy": round(train_acc, 4),
        }
