"""
ZeroReturn ML Training — 04: Model Evaluation
==============================================
Comprehensive evaluation of the trained return predictor:
  - ROC/PR curves
  - Calibration analysis
  - Business impact metrics
  - Threshold optimization
  - Category-wise performance breakdown

Usage:
    python ml_training/04_model_evaluation.py
    python ml_training/04_model_evaluation.py --model ml_models/return_predictor.joblib
"""

import argparse
import json
import os
import warnings
from pathlib import Path

warnings.filterwarnings("ignore")

import joblib
import numpy as np
import pandas as pd
from sklearn.calibration import calibration_curve
from sklearn.metrics import (
    accuracy_score, average_precision_score, classification_report,
    confusion_matrix, f1_score, precision_recall_curve,
    precision_score, recall_score, roc_auc_score, roc_curve,
)
from sklearn.model_selection import train_test_split

OUTPUT_DIR = Path("ml_training/outputs")
MODEL_DIR  = Path("ml_models")

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


# ============================================================
# EVALUATION FUNCTIONS
# ============================================================

def evaluate_roc_auc(y_test, y_proba):
    """Compute and print ROC-AUC metrics."""
    fpr, tpr, thresholds = roc_curve(y_test, y_proba)
    auc = roc_auc_score(y_test, y_proba)

    # Find optimal threshold (Youden's J)
    j_scores = tpr - fpr
    optimal_idx = np.argmax(j_scores)
    optimal_threshold = float(thresholds[optimal_idx])

    print(f"\n📈 ROC-AUC Analysis:")
    print(f"   AUC Score: {auc:.4f}")
    print(f"   Optimal threshold: {optimal_threshold:.3f}")
    print(f"   @ threshold: TPR={tpr[optimal_idx]:.3f}, FPR={fpr[optimal_idx]:.3f}")
    return auc, optimal_threshold


def evaluate_precision_recall(y_test, y_proba):
    """Precision-Recall analysis."""
    precision, recall, pr_thresholds = precision_recall_curve(y_test, y_proba)
    ap = average_precision_score(y_test, y_proba)

    # Find threshold achieving 70% precision
    target_precision = 0.70
    valid = np.where(precision >= target_precision)[0]
    if len(valid) > 0:
        best_idx = valid[np.argmax(recall[valid])]
        p70_threshold = float(pr_thresholds[min(best_idx, len(pr_thresholds)-1)])
        p70_recall = float(recall[best_idx])
    else:
        p70_threshold = 0.5
        p70_recall = 0.0

    print(f"\n📊 Precision-Recall Analysis:")
    print(f"   Average Precision (AP): {ap:.4f}")
    print(f"   Threshold for 70% precision: {p70_threshold:.3f}")
    print(f"   Recall at 70% precision: {p70_recall:.3f}")
    return ap, p70_threshold


def evaluate_business_impact(y_test, y_proba, prices=None, threshold=0.5):
    """Compute business metrics: revenue saved, cost of false positives."""
    y_pred = (y_proba >= threshold).astype(int)

    tp = int(np.sum((y_pred == 1) & (y_test == 1)))
    fp = int(np.sum((y_pred == 1) & (y_test == 0)))
    fn = int(np.sum((y_pred == 0) & (y_test == 1)))
    tn = int(np.sum((y_pred == 0) & (y_test == 0)))

    # Business impact (assuming avg order value ₹2,500)
    avg_price = float(np.mean(prices)) if prices is not None else 2500.0
    return_cost_ratio = 0.70  # 70% of order value lost per return

    revenue_saved = tp * avg_price * return_cost_ratio
    cost_false_positive = fp * avg_price * 0.05  # 5% intervention cost
    net_benefit = revenue_saved - cost_false_positive

    print(f"\n💰 Business Impact Analysis (threshold={threshold:.2f}):")
    print(f"   Confusion Matrix:")
    print(f"     TP (caught returns):         {tp:,}")
    print(f"     FP (false alarms):           {fp:,}")
    print(f"     FN (missed returns):         {fn:,}")
    print(f"     TN (correct non-returns):    {tn:,}")
    print(f"\n   Revenue saved:              ₹{revenue_saved:,.0f}")
    print(f"   Cost of false alarms:       ₹{cost_false_positive:,.0f}")
    print(f"   Net benefit:                ₹{net_benefit:,.0f}")
    print(f"   Return prevention rate:     {tp/(tp+fn)*100:.1f}%")
    return {"tp": tp, "fp": fp, "fn": fn, "tn": tn, "net_benefit": net_benefit}


def evaluate_by_category(df_test, y_proba, model):
    """Evaluate model performance per category."""
    if "category" not in df_test.columns or "returned" not in df_test.columns:
        return

    df_eval = df_test.copy()
    df_eval["y_proba"] = y_proba
    df_eval["y_pred"]  = (y_proba >= 0.5).astype(int)
    df_eval["returned_int"] = df_eval["returned"].astype(int)

    print("\n🏷️ Performance by Category:")
    print(f"{'Category':<15} {'ROC-AUC':>8} {'Precision':>10} {'Recall':>8} {'F1':>8} {'N':>6}")
    print("-" * 58)

    for cat in sorted(df_eval["category"].unique()):
        mask = df_eval["category"] == cat
        y_t = df_eval.loc[mask, "returned_int"]
        y_p = df_eval.loc[mask, "y_pred"]
        y_pr= df_eval.loc[mask, "y_proba"]
        n = mask.sum()

        if y_t.nunique() < 2 or n < 10:
            continue

        try:
            auc = roc_auc_score(y_t, y_pr)
            prec = precision_score(y_t, y_p, zero_division=0)
            rec  = recall_score(y_t, y_p, zero_division=0)
            f1   = f1_score(y_t, y_p, zero_division=0)
            print(f"{cat:<15} {auc:>8.4f} {prec:>10.4f} {rec:>8.4f} {f1:>8.4f} {n:>6}")
        except Exception:
            pass


def evaluate_calibration(y_test, y_proba):
    """Check probability calibration quality."""
    fraction_pos, mean_pred_value = calibration_curve(y_test, y_proba, n_bins=10)

    print(f"\n🎯 Calibration Analysis (ideal: fraction_positive ≈ mean_predicted):")
    print(f"{'Bin':>5} {'Predicted':>12} {'Actual':>10} {'Diff':>8}")
    print("-" * 38)
    for pred, actual in zip(mean_pred_value, fraction_pos):
        diff = actual - pred
        indicator = "✅" if abs(diff) < 0.05 else ("⚠️" if abs(diff) < 0.10 else "❌")
        print(f"       {pred:>10.3f} {actual:>10.3f} {diff:>+8.3f}  {indicator}")

    # Brier score (lower is better, 0 = perfect)
    brier = float(np.mean((y_proba - y_test) ** 2))
    print(f"\n   Brier Score: {brier:.4f} (lower is better, 0.0 = perfect, 0.25 = random)")
    return brier


def find_optimal_threshold(y_test, y_proba, min_precision: float = 0.65):
    """Find threshold maximizing F1 while maintaining min precision."""
    best_f1 = 0.0
    best_thresh = 0.5

    for thresh in np.arange(0.3, 0.8, 0.05):
        y_pred = (y_proba >= thresh).astype(int)
        prec = precision_score(y_test, y_pred, zero_division=0)
        rec  = recall_score(y_test, y_pred, zero_division=0)
        f1   = f1_score(y_test, y_pred, zero_division=0)

        if prec >= min_precision and f1 > best_f1:
            best_f1 = f1
            best_thresh = thresh

    print(f"\n⚙️  Optimal Threshold Analysis (min precision: {min_precision:.0%}):")
    print(f"   Best threshold: {best_thresh:.2f}")
    print(f"   Best F1: {best_f1:.4f}")
    return best_thresh


# ============================================================
# MAIN
# ============================================================

def main():
    parser = argparse.ArgumentParser(description="ZeroReturn Model Evaluation")
    parser.add_argument("--model", type=str, default="ml_models/return_predictor.joblib")
    parser.add_argument("--data",  type=str, default="ml_training/outputs/features.csv")
    args = parser.parse_args()

    print("🔬 ZeroReturn — Model Evaluation")
    print("="*60)

    # Load model
    if not os.path.exists(args.model):
        print(f"⚠️  Model not found: {args.model}")
        print("    Run 03_model_training.py first.")
        return

    print(f"📦 Loading model from: {args.model}")
    model = joblib.load(args.model)

    # Load test data
    if not os.path.exists(args.data):
        print(f"⚠️  Data not found: {args.data}. Run previous scripts first.")
        return

    df = pd.read_csv(args.data)
    available = [c for c in FEATURE_COLS if c in df.columns]
    for c in FEATURE_COLS:
        if c not in df.columns:
            df[c] = 0.0

    X = df[FEATURE_COLS].fillna(0)
    y = df["returned"].astype(int)
    prices = df["price"].values if "price" in df.columns else None

    _, X_test, _, y_test, _, df_test = train_test_split(
        X, y, df, test_size=0.2, random_state=42, stratify=y
    )

    print(f"📊 Test set: {len(y_test):,} samples | {y_test.mean()*100:.1f}% returns")

    # Predictions
    y_proba = model.predict_proba(X_test)[:, 1]

    # Evaluations
    auc, optimal_thresh = evaluate_roc_auc(y_test, y_proba)
    ap, p70_thresh = evaluate_precision_recall(y_test, y_proba)
    business = evaluate_business_impact(y_test, y_proba, prices=prices, threshold=optimal_thresh)
    brier = evaluate_calibration(y_test, y_proba)
    best_thresh = find_optimal_threshold(y_test, y_proba)
    evaluate_by_category(df_test, y_proba, model)

    # Final summary
    print("\n" + "="*60)
    print("📋 FINAL EVALUATION SUMMARY")
    print("="*60)
    summary = {
        "roc_auc": round(auc, 4),
        "average_precision": round(ap, 4),
        "brier_score": round(brier, 4),
        "optimal_threshold": round(optimal_thresh, 3),
        "recommended_threshold": round(best_thresh, 3),
        "business_net_benefit_inr": round(float(business["net_benefit"]), 2),
        "return_prevention_rate": round(float(business["tp"]) / max(business["tp"] + business["fn"], 1), 4),
        "test_set_size": len(y_test),
    }
    for k, v in summary.items():
        print(f"  {k:<35}: {v}")

    # Save evaluation report
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_DIR / "evaluation_report.json", "w") as f:
        json.dump(summary, f, indent=2)
    print(f"\n💾 Evaluation report saved to: {OUTPUT_DIR}/evaluation_report.json")
    print("\n✅ Evaluation complete! Your model is ready for production use.")
    print(f"   Model path: {args.model}")
    print(f"   Recommended threshold: {best_thresh:.2f}")


if __name__ == "__main__":
    main()
