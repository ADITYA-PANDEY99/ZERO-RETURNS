"""
ZeroReturn ML Training — 02: Feature Engineering
=================================================
Transforms raw order data into ML-ready feature vectors.
Creates interaction terms, polynomial features, and categorical encodings.

Usage:
    python ml_training/02_feature_engineering.py
    python ml_training/02_feature_engineering.py --data ml_training/outputs/exploration_report.csv
"""

import argparse
import os
import warnings

warnings.filterwarnings("ignore")

import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder, StandardScaler

# ============================================================
# CATEGORY METADATA
# ============================================================

CATEGORY_RISK = {
    "Electronics": 0.72, "Clothing": 0.65, "Footwear": 0.58,
    "Books": 0.18, "Home": 0.42, "Beauty": 0.35, "Sports": 0.45, "Toys": 0.39,
}

CATEGORY_AVG_PRICE = {
    "Electronics": 18500, "Clothing": 1200, "Footwear": 2800,
    "Books": 400,  "Home": 3200,   "Beauty": 850,  "Sports": 2100, "Toys": 1400,
}


# ============================================================
# FEATURE ENGINEERING FUNCTIONS
# ============================================================

def create_price_features(df: pd.DataFrame) -> pd.DataFrame:
    """Price-based features."""
    price = pd.to_numeric(df["price"], errors="coerce").fillna(df["price"].median())
    df = df.copy()

    df["price_log"] = np.log1p(price)
    df["price_sqrt"] = np.sqrt(price)

    # Price relative to category average
    cat_avg = df["category"].map(CATEGORY_AVG_PRICE).fillna(2500)
    df["price_vs_cat_avg"] = price / cat_avg

    # Price bucket (ordinal)
    df["price_bucket"] = pd.cut(
        price,
        bins=[0, 500, 1500, 5000, 15000, float("inf")],
        labels=[0, 1, 2, 3, 4],
    ).astype(float)

    # Is premium? (above ₹10k)
    df["is_premium"] = (price >= 10000).astype(int)

    return df


def create_content_quality_features(df: pd.DataFrame) -> pd.DataFrame:
    """Description and image quality features."""
    df = df.copy()

    # Description features
    if "description_quality" in df.columns:
        desc_q = pd.to_numeric(df["description_quality"], errors="coerce").fillna(0.5)
        df["desc_quality_bin"] = pd.cut(desc_q, bins=[0, 0.2, 0.4, 0.6, 0.8, 1.0],
                                         labels=[0, 1, 2, 3, 4]).astype(float)
        df["desc_is_poor"] = (desc_q < 0.4).astype(int)
        df["desc_is_excellent"] = (desc_q >= 0.8).astype(int)

    if "description_length" in df.columns:
        desc_len = pd.to_numeric(df["description_length"], errors="coerce").fillna(200)
        df["desc_len_log"] = np.log1p(desc_len)
        df["desc_too_short"] = (desc_len < 100).astype(int)
        df["desc_adequate"] = (desc_len >= 300).astype(int)

    # Image features
    if "image_quality" in df.columns:
        img_q = pd.to_numeric(df["image_quality"], errors="coerce").fillna(0.6)
        df["img_is_poor"] = (img_q < 0.4).astype(int)
        df["img_is_good"] = (img_q >= 0.75).astype(int)

    # Combined content quality score
    if "description_quality" in df.columns and "image_quality" in df.columns:
        desc_q = pd.to_numeric(df["description_quality"], errors="coerce").fillna(0.5)
        img_q  = pd.to_numeric(df["image_quality"], errors="coerce").fillna(0.6)
        df["content_quality"] = (desc_q * 0.6 + img_q * 0.4)

    return df


def create_review_features(df: pd.DataFrame) -> pd.DataFrame:
    """Review-based features."""
    df = df.copy()

    if "avg_review_score" in df.columns:
        review = pd.to_numeric(df["avg_review_score"], errors="coerce").fillna(3.5)
        df["review_score_norm"] = (review - 1) / 4  # normalize to 0-1
        df["review_is_poor"] = (review < 3.0).astype(int)
        df["review_is_excellent"] = (review >= 4.5).astype(int)

    if "review_count" in df.columns:
        rc = pd.to_numeric(df["review_count"], errors="coerce").fillna(10).clip(lower=1)
        df["review_count_log"] = np.log1p(rc)
        df["has_many_reviews"] = (rc >= 100).astype(int)
        df["is_new_product"] = (rc < 5).astype(int)

    if "seller_rating" in df.columns:
        sr = pd.to_numeric(df["seller_rating"], errors="coerce").fillna(3.5)
        df["seller_is_poor"] = (sr < 3.5).astype(int)
        df["seller_is_top"] = (sr >= 4.5).astype(int)

    return df


def create_delivery_features(df: pd.DataFrame) -> pd.DataFrame:
    """Delivery and logistics features."""
    df = df.copy()
    if "days_to_delivery" in df.columns:
        dtd = pd.to_numeric(df["days_to_delivery"], errors="coerce").fillna(5).clip(1, 30)
        df["days_to_delivery_log"] = np.log1p(dtd)
        df["slow_delivery"] = (dtd > 7).astype(int)
        df["fast_delivery"] = (dtd <= 3).astype(int)
    return df


def create_category_features(df: pd.DataFrame) -> pd.DataFrame:
    """Category encoding and risk features."""
    df = df.copy()
    df["category_risk"] = df["category"].map(CATEGORY_RISK).fillna(0.45)

    # One-hot encoding
    categories = list(CATEGORY_RISK.keys())
    for cat in categories:
        col = f"cat_{cat.lower()}"
        df[col] = (df["category"] == cat).astype(int)

    return df


def create_interaction_features(df: pd.DataFrame) -> pd.DataFrame:
    """Interaction terms between key features."""
    df = df.copy()

    if "description_quality" in df.columns and "image_quality" in df.columns:
        desc_q = pd.to_numeric(df["description_quality"], errors="coerce").fillna(0.5)
        img_q  = pd.to_numeric(df["image_quality"], errors="coerce").fillna(0.6)
        df["content_x_price"] = df["content_quality"] * df.get("price_log", np.log1p(df.get("price", 999)))
        df["desc_x_img"] = desc_q * img_q
        df["poor_content_flag"] = ((desc_q < 0.4) & (img_q < 0.4)).astype(int)

    if "avg_review_score" in df.columns and "seller_rating" in df.columns:
        review = pd.to_numeric(df["avg_review_score"], errors="coerce").fillna(3.5)
        seller = pd.to_numeric(df["seller_rating"], errors="coerce").fillna(3.5)
        df["combined_trust_score"] = (review / 5 * 0.6 + seller / 5 * 0.4)

    return df


def select_final_features(df: pd.DataFrame) -> tuple:
    """Select and return final feature matrix and target."""
    feature_cols = [
        # Price
        "price_log", "price_bucket", "price_vs_cat_avg", "is_premium",
        # Description
        "desc_quality_bin", "desc_is_poor", "desc_is_excellent",
        "desc_len_log", "desc_too_short", "desc_adequate",
        # Image
        "img_is_poor", "img_is_good",
        # Content combined
        "content_quality", "desc_x_img", "poor_content_flag",
        # Reviews
        "review_score_norm", "review_is_poor", "review_is_excellent",
        "review_count_log", "has_many_reviews", "is_new_product",
        # Seller
        "seller_is_poor", "seller_is_top", "combined_trust_score",
        # Delivery
        "days_to_delivery_log", "slow_delivery", "fast_delivery",
        # Category
        "category_risk",
    ]

    # Only include cols that exist
    available = [c for c in feature_cols if c in df.columns]
    X = df[available].fillna(0)
    y = df["returned"] if "returned" in df.columns else None
    return X, y, available


# ============================================================
# MAIN PIPELINE
# ============================================================

def engineer_all_features(df: pd.DataFrame) -> pd.DataFrame:
    df = create_price_features(df)
    df = create_content_quality_features(df)
    df = create_review_features(df)
    df = create_delivery_features(df)
    df = create_category_features(df)
    df = create_interaction_features(df)
    return df


def main():
    parser = argparse.ArgumentParser(description="ZeroReturn Feature Engineering")
    parser.add_argument("--data", type=str, default="ml_training/outputs/exploration_report.csv")
    parser.add_argument("--output", type=str, default="ml_training/outputs/features.csv")
    args = parser.parse_args()

    print("🔧 ZeroReturn — Feature Engineering")
    print("="*60)

    if os.path.exists(args.data):
        df = pd.read_csv(args.data)
        print(f"📂 Loaded {len(df):,} rows from {args.data}")
    else:
        print(f"⚠️  Data file not found: {args.data}")
        print("    Run 01_data_exploration.py first, or generating synthetic data...")
        from ml_training.scripts._01_data_exploration import generate_synthetic_dataset
        df = generate_synthetic_dataset()

    # Run feature engineering
    df_feat = engineer_all_features(df)
    X, y, feature_cols = select_final_features(df_feat)

    print(f"\n✅ Feature Engineering Complete:")
    print(f"   Total features: {len(feature_cols)}")
    print(f"   Feature names: {feature_cols}")
    print(f"\n   Feature stats:")
    print(X.describe().round(3).to_string())

    if y is not None:
        print(f"\n   Target: returned (0/1)")
        print(f"   Class balance: {y.mean()*100:.1f}% returns")

    # Save
    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    df_feat.to_csv(args.output, index=False)
    print(f"\n💾 Feature dataset saved to: {args.output}")
    print(f"   Run next: python ml_training/03_model_training.py --data {args.output}")


if __name__ == "__main__":
    main()
