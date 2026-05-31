"""
ZeroReturn ML Training — 03: Model Training
============================================
Trains multiple return prediction models, performs hyperparameter tuning,
and saves the best model for production API use.

Models trained:
  1. Logistic Regression (baseline)
  2. Random Forest
  3. Gradient Boosting
  4. XGBoost

Usage:
    python ml_training/03_model_training.py
    python ml_training/03_model_training.py --data ml_training/outputs/features.csv
"""

import argparse
import json
import os
import time
import warnings
from pathlib import Path

warnings.filterwarnings("ignore")

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score, classification_report, confusion_matrix,
    roc_auc_score, f1_score, average_precision_score,
)
from sklearn.model_selection import (
    StratifiedKFold, cross_val_score, train_test_split,
)
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler

# ============================================================
# FEATURE SELECTION (must match 02_feature_engineering.py)
# ============================================================

FEATURE_COLS = [
    "price_log", "price_bucket", "price_vs_cat_avg", "is_premium",
    "desc_quality_bin", "desc_is_poor", "desc_is_excellent",
    "desc_len_log", "desc_too_short", "desc_adequate",
    "img_is_poor", "img_is_good",
    "content_quality", "desc_x_img", "poor_content_flag",
    "review_score_norm", "review_is_poor", "review_is_excellent",
    "review_count_log", "has_many_reviews", "is_new_product",
    "seller_is_poor", "seller_is_top", "combined_trust_score",
    "days_to_delivery_log", "slow_delivery", "fast_delivery",
    "category_risk",
]

OUTPUT_DIR = Path("ml_training/outputs")
MODEL_DIR  = Path("ml_models")


# ============================================================
# MODEL DEFINITIONS
# ============================================================

MODELS = {
    "logistic_regression": Pipeline([
        ("scaler", StandardScaler()),
        ("clf", LogisticRegression(
            C=1.0, max_iter=500, random_state=42, class_weight="balanced",
        )),
    ]),
    "random_forest": Pipeline([
        ("scaler", StandardScaler()),
        ("clf", RandomForestClassifier(
            n_estimators=200,
            max_depth=8,
            min_samples_leaf=10,
            class_weight="balanced",
            random_state=42,
            n_jobs=-1,
        )),
    ]),
    "gradient_boosting": Pipeline([
        ("scaler", StandardScaler()),
        ("clf", GradientBoostingClassifier(
            n_estimators=200,
            max_depth=5,
            learning_rate=0.1,
            subsample=0.8,
            random_state=42,
        )),
    ]),
}

# Add XGBoost if available
try:
    from xgboost import XGBClassifier
    MODELS["xgboost"] = Pipeline([
        ("scaler", StandardScaler()),
        ("clf", XGBClassifier(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            scale_pos_weight=2,  # handle class imbalance
            use_label_encoder=False,
            eval_metric="logloss",
            random_state=42,
        )),
    ])
    print("✅ XGBoost available")
except ImportError:
    print("⚠️  XGBoost not available, skipping")


# ============================================================
# TRAINING FUNCTIONS
# ============================================================

def load_and_prepare_data(filepath: str):
    """Load feature-engineered data and prepare train/test splits."""
    df = pd.read_csv(filepath)
    print(f"📂 Loaded {len(df):,} rows from {filepath}")

    # Select available features
    available_features = [c for c in FEATURE_COLS if c in df.columns]
    missing_features   = [c for c in FEATURE_COLS if c not in df.columns]

    if missing_features:
        print(f"⚠️  Missing features (will use defaults): {missing_features}")
        for f in missing_features:
            df[f] = 0.0

    X = df[FEATURE_COLS].fillna(0)
    y = df["returned"].astype(int)

    print(f"📊 Features: {len(FEATURE_COLS)} | Target balance: {y.mean()*100:.1f}% returns")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    return X_train, X_test, y_train, y_test, available_features


def evaluate_model(model, X_test, y_test, name: str) -> dict:
    """Evaluate model on test set."""
    y_pred  = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1]

    results = {
        "model": name,
        "accuracy":          round(accuracy_score(y_test, y_pred), 4),
        "f1_score":          round(f1_score(y_test, y_pred, average="weighted"), 4),
        "roc_auc":           round(roc_auc_score(y_test, y_proba), 4),
        "avg_precision":     round(average_precision_score(y_test, y_proba), 4),
    }

    print(f"\n{'='*50}")
    print(f"📈 Model: {name}")
    print(f"{'='*50}")
    for k, v in results.items():
        if k != "model":
            print(f"  {k:<25}: {v:.4f}")
    print(f"\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=["Not Returned", "Returned"]))

    return results


def get_feature_importance(model, feature_names: list) -> pd.DataFrame:
    """Extract feature importance from fitted model."""
    try:
        clf = model.named_steps.get("clf")
        if hasattr(clf, "feature_importances_"):
            importances = clf.feature_importances_
        elif hasattr(clf, "coef_"):
            importances = abs(clf.coef_[0])
        else:
            return pd.DataFrame()

        fi_df = pd.DataFrame({
            "feature":    feature_names[:len(importances)],
            "importance": importances[:len(feature_names)],
        }).sort_values("importance", ascending=False)

        return fi_df
    except Exception:
        return pd.DataFrame()


def train_with_cv(model, X_train, y_train, name: str, cv: int = 5) -> float:
    """Train with cross-validation and report CV scores."""
    print(f"\n🔄 Cross-validating {name} ({cv}-fold)...")
    start = time.time()
    scores = cross_val_score(model, X_train, y_train, cv=StratifiedKFold(cv), scoring="roc_auc", n_jobs=-1)
    elapsed = time.time() - start
    print(f"  CV ROC-AUC: {scores.mean():.4f} ± {scores.std():.4f} ({elapsed:.1f}s)")
    return float(scores.mean())


# ============================================================
# MAIN
# ============================================================

def main():
    parser = argparse.ArgumentParser(description="ZeroReturn Model Training")
    parser.add_argument("--data",    type=str, default="ml_training/outputs/features.csv")
    parser.add_argument("--cv",      type=int, default=5, help="Cross-validation folds")
    parser.add_argument("--save",    action="store_true", default=True, help="Save best model")
    args = parser.parse_args()

    print("🤖 ZeroReturn — Model Training")
    print("="*60)

    # Load data
    if not os.path.exists(args.data):
        print(f"Data not found: {args.data}. Running feature engineering first...")
        os.system(f"python ml_training/02_feature_engineering.py")

    X_train, X_test, y_train, y_test, available_features = load_and_prepare_data(args.data)

    # Train all models
    results_list = []
    fitted_models = {}

    for name, model in MODELS.items():
        print(f"\n🏋️  Training {name}...")
        cv_auc = train_with_cv(model, X_train, y_train, name, cv=args.cv)

        # Full training
        start = time.time()
        model.fit(X_train, y_train)
        elapsed = time.time() - start
        print(f"  Full training time: {elapsed:.1f}s")

        # Evaluate
        result = evaluate_model(model, X_test, y_test, name)
        result["cv_roc_auc"] = cv_auc
        result["train_time_s"] = round(elapsed, 2)
        results_list.append(result)
        fitted_models[name] = model

        # Feature importance
        fi = get_feature_importance(model, FEATURE_COLS)
        if not fi.empty:
            print(f"\n  Top 10 important features:")
            for _, row in fi.head(10).iterrows():
                bar = "█" * int(row["importance"] * 40)
                print(f"    {row['feature']:<30} {row['importance']:.4f}  {bar}")

    # Summary
    results_df = pd.DataFrame(results_list).sort_values("roc_auc", ascending=False)
    print("\n" + "="*60)
    print("📊 FINAL MODEL COMPARISON")
    print("="*60)
    print(results_df[["model", "accuracy", "f1_score", "roc_auc", "cv_roc_auc"]].to_string(index=False))

    # Select best model
    best_row = results_df.iloc[0]
    best_name = best_row["model"]
    best_model = fitted_models[best_name]
    print(f"\n🏆 Best model: {best_name} (ROC-AUC: {best_row['roc_auc']:.4f})")

    # Save
    if args.save:
        MODEL_DIR.mkdir(parents=True, exist_ok=True)
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

        model_path = MODEL_DIR / "return_predictor.joblib"
        joblib.dump(best_model, model_path)
        print(f"💾 Best model saved to: {model_path}")

        # Save all results
        results_df.to_csv(OUTPUT_DIR / "training_results.csv", index=False)
        with open(OUTPUT_DIR / "best_model_info.json", "w") as f:
            json.dump({
                "model_name": best_name,
                "roc_auc": float(best_row["roc_auc"]),
                "accuracy": float(best_row["accuracy"]),
                "f1_score": float(best_row["f1_score"]),
                "features": FEATURE_COLS,
                "trained_at": pd.Timestamp.now().isoformat(),
            }, f, indent=2)
        print(f"📄 Training results saved to: {OUTPUT_DIR}/training_results.csv")

    print(f"\n✅ Training complete! Run next: python ml_training/04_model_evaluation.py")


if __name__ == "__main__":
    main()
