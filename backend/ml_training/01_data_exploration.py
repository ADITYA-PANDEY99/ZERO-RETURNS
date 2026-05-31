"""
ZeroReturn ML Training — 01: Data Exploration
==============================================
This script explores the return prediction dataset and generates
summary statistics, visualizations, and data quality reports.

Usage:
    python ml_training/01_data_exploration.py
    python ml_training/01_data_exploration.py --data path/to/your_data.csv
"""

import argparse
import os
import sys
import warnings

warnings.filterwarnings("ignore")

import numpy as np
import pandas as pd

# ============================================================
# 1. SYNTHETIC DATA GENERATION (used when no real data provided)
# ============================================================

def generate_synthetic_dataset(n_samples: int = 5000, seed: int = 42) -> pd.DataFrame:
    """Generate a realistic synthetic Indian e-commerce dataset."""
    rng = np.random.RandomState(seed)

    CATEGORIES = ["Electronics", "Clothing", "Footwear", "Books", "Home", "Beauty", "Sports", "Toys"]
    CATEGORY_RISK = {
        "Electronics": 0.72, "Clothing": 0.65, "Footwear": 0.58,
        "Books": 0.18, "Home": 0.42, "Beauty": 0.35, "Sports": 0.45, "Toys": 0.39,
    }

    PRODUCTS = {
        "Electronics": ["Samsung Galaxy", "OnePlus Nord", "HP Laptop", "boAt Headphones", "Redmi Note"],
        "Clothing":    ["Cotton Kurta", "Formal Shirt", "Slim Fit Jeans", "Anarkali Kurti", "Chinos"],
        "Footwear":    ["Formal Shoes", "Running Shoes", "Sandals", "Boots", "Sports Shoes"],
        "Books":       ["Atomic Habits", "Rich Dad Poor Dad", "The Alchemist", "Harry Potter", "Ikigai"],
        "Home":        ["Pressure Cooker", "Air Fryer", "Water Bottle", "Bedsheet Set", "Water Purifier"],
        "Beauty":      ["Lipstick", "Foundation", "Hair Oil", "Face Wash", "Shampoo"],
        "Sports":      ["Cricket Kit", "Badminton Racket", "Gym Gloves", "Yoga Mat", "Dumbbells"],
        "Toys":        ["Monopoly Board Game", "LEGO Bricks", "Remote Control Car", "UNO Cards", "Puzzle"],
    }

    PRICE_RANGES = {
        "Electronics": (1299, 55000),
        "Clothing":    (299, 5999),
        "Footwear":    (499, 12000),
        "Books":       (150, 1500),
        "Home":        (299, 25000),
        "Beauty":      (99, 3000),
        "Sports":      (199, 8000),
        "Toys":        (199, 5000),
    }

    SELLER_NAMES = [
        "TechZone India", "FashionHub", "HomeComfort", "BookWorld",
        "SportsFit", "BeautyGlow", "ElectroKing", "StyleVilla",
    ]

    CUSTOMER_NAMES = [
        "Rahul Sharma", "Priya Patel", "Arjun Singh", "Sneha Reddy",
        "Vikram Gupta", "Anita Desai", "Rohit Verma", "Kavita Nair",
    ]

    records = []
    for i in range(n_samples):
        category = rng.choice(CATEGORIES)
        cat_risk = CATEGORY_RISK[category]
        price_min, price_max = PRICE_RANGES[category]
        price = float(rng.uniform(price_min, price_max))

        desc_quality = float(rng.beta(2, 2))           # Beta distribution for realistic skew
        img_quality  = float(rng.beta(2.5, 1.5))
        seller_rating = float(rng.uniform(2.5, 5.0))
        avg_review   = float(rng.uniform(1.5, 5.0))
        review_count = int(rng.exponential(200))
        desc_len     = int(rng.uniform(30, 800))
        days_delivery = int(rng.uniform(1, 14))

        # Return probability (ground truth label)
        return_prob = (
            cat_risk * 0.35
            + (1 - desc_quality) * 0.20
            + (1 - img_quality) * 0.20
            + (1 - avg_review / 5) * 0.15
            + min(price / 50000, 1.0) * 0.05
            + rng.uniform(-0.05, 0.05)
        )
        return_prob = float(np.clip(return_prob, 0.02, 0.98))
        returned = int(rng.uniform(0, 1) < return_prob)

        records.append({
            "order_id": f"ORD-{i+1:05d}",
            "product_name": rng.choice(PRODUCTS[category]),
            "category": category,
            "price": round(price, 2),
            "customer_name": rng.choice(CUSTOMER_NAMES),
            "seller_name": rng.choice(SELLER_NAMES),
            "order_date": pd.Timestamp("2024-01-01") + pd.Timedelta(days=int(rng.uniform(0, 365))),
            "description_length": desc_len,
            "description_quality": round(desc_quality, 4),
            "image_quality": round(img_quality, 4),
            "seller_rating": round(seller_rating, 2),
            "avg_review_score": round(avg_review, 2),
            "review_count": max(1, review_count),
            "days_to_delivery": days_delivery,
            "return_probability": round(return_prob, 4),
            "returned": returned,
        })

    return pd.DataFrame(records)


# ============================================================
# 2. EXPLORATION FUNCTIONS
# ============================================================

def explore_basic_stats(df: pd.DataFrame):
    print("\n" + "="*60)
    print("📊 BASIC DATASET STATISTICS")
    print("="*60)
    print(f"Shape: {df.shape[0]:,} rows × {df.shape[1]} columns")
    print(f"\nColumns:\n{list(df.columns)}")
    print(f"\nData Types:\n{df.dtypes.to_string()}")
    print(f"\nMissing Values:\n{df.isnull().sum()[df.isnull().sum() > 0].to_string()}")
    print(f"\nNumerical Summary:")
    print(df.describe().round(3).to_string())


def explore_return_distribution(df: pd.DataFrame):
    print("\n" + "="*60)
    print("📦 RETURN DISTRIBUTION")
    print("="*60)

    if "returned" in df.columns:
        vc = df["returned"].value_counts()
        total = len(df)
        print(f"Total orders: {total:,}")
        print(f"Returned:     {vc.get(1, 0):,} ({vc.get(1, 0)/total*100:.1f}%)")
        print(f"Not returned: {vc.get(0, 0):,} ({vc.get(0, 0)/total*100:.1f}%)")

    if "category" in df.columns and "returned" in df.columns:
        print("\n📁 Return Rate by Category:")
        cat_stats = df.groupby("category")["returned"].agg(["sum", "count", "mean"])
        cat_stats.columns = ["returns", "orders", "return_rate"]
        cat_stats["return_rate_pct"] = (cat_stats["return_rate"] * 100).round(1)
        cat_stats = cat_stats.sort_values("return_rate", ascending=False)
        print(cat_stats.to_string())


def explore_price_analysis(df: pd.DataFrame):
    print("\n" + "="*60)
    print("💰 PRICE ANALYSIS")
    print("="*60)

    if "price" in df.columns:
        price = df["price"]
        print(f"Price range: ₹{price.min():,.0f} – ₹{price.max():,.0f}")
        print(f"Median price: ₹{price.median():,.0f}")
        print(f"Mean price:   ₹{price.mean():,.0f}")

        # Price buckets
        bins   = [0, 500, 1500, 5000, 15000, float("inf")]
        labels = ["₹0-500", "₹500-1.5k", "₹1.5k-5k", "₹5k-15k", "₹15k+"]
        df = df.copy()
        df["price_bucket"] = pd.cut(price, bins=bins, labels=labels)
        if "returned" in df.columns:
            print("\n💸 Return Rate by Price Range:")
            print(df.groupby("price_bucket")["returned"].mean().apply(lambda x: f"{x*100:.1f}%").to_string())


def explore_feature_correlations(df: pd.DataFrame):
    print("\n" + "="*60)
    print("🔗 FEATURE CORRELATIONS WITH RETURN")
    print("="*60)

    numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    if "returned" in numeric_cols:
        corr = df[numeric_cols].corr()["returned"].drop("returned").sort_values(key=abs, ascending=False)
        print("Top correlates with return (|corr|):")
        for col, val in corr.head(10).items():
            bar = "█" * int(abs(val) * 20)
            direction = "+" if val > 0 else "-"
            print(f"  {col:<30} {direction}{abs(val):.4f}  {bar}")


def explore_quality_scores(df: pd.DataFrame):
    print("\n" + "="*60)
    print("🎯 QUALITY SCORE ANALYSIS")
    print("="*60)

    quality_cols = ["description_quality", "image_quality", "avg_review_score", "seller_rating"]
    for col in quality_cols:
        if col in df.columns and "returned" in df.columns:
            quartiles = df.groupby(pd.qcut(df[col], q=4, duplicates="drop"))["returned"].mean()
            print(f"\n{col} quartile return rates:")
            for bucket, rate in quartiles.items():
                print(f"  {str(bucket):<30} → {rate*100:.1f}% return rate")


# ============================================================
# 3. MAIN
# ============================================================

def main():
    parser = argparse.ArgumentParser(description="ZeroReturn Data Exploration")
    parser.add_argument("--data", type=str, default=None, help="Path to CSV data file")
    parser.add_argument("--samples", type=int, default=5000, help="Synthetic sample count")
    parser.add_argument("--output", type=str, default="ml_training/outputs/exploration_report.csv")
    args = parser.parse_args()

    print("🚀 ZeroReturn — ML Data Exploration")
    print("="*60)

    if args.data and os.path.exists(args.data):
        print(f"📂 Loading data from: {args.data}")
        df = pd.read_csv(args.data)
    else:
        print(f"🔧 Generating {args.samples:,} synthetic samples...")
        df = generate_synthetic_dataset(n_samples=args.samples)

    explore_basic_stats(df)
    explore_return_distribution(df)
    explore_price_analysis(df)
    explore_feature_correlations(df)
    explore_quality_scores(df)

    # Save for next stage
    os.makedirs(os.path.dirname(args.output), exist_ok=True)
    df.to_csv(args.output, index=False)
    print(f"\n✅ Exploration complete. Dataset saved to: {args.output}")
    print(f"   Run next: python ml_training/02_feature_engineering.py --data {args.output}")


if __name__ == "__main__":
    main()
