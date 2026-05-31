"""
DataProcessor — handles CSV/Excel parsing, column auto-detection,
feature engineering, ML prediction pipeline, and dashboard data creation.
"""
from __future__ import annotations

import io
import logging
from typing import Any, Dict, List, Optional

import numpy as np
import pandas as pd

logger = logging.getLogger(__name__)


class DataProcessor:
    """End-to-end pipeline from raw CSV to ML predictions and dashboard data."""

    CATEGORY_RISK = {
        "Electronics": 0.72, "Clothing": 0.65, "Footwear": 0.58,
        "Home": 0.42, "Beauty": 0.35, "Books": 0.18,
        "Sports": 0.45, "Toys": 0.39, "Grocery": 0.12,
    }

    # ------------------------------------------------------------------
    def process_csv(self, file_content: bytes, ext: str = "csv") -> pd.DataFrame:
        """Parse CSV or Excel bytes into a cleaned DataFrame."""
        if ext in {"xlsx", "xls"}:
            df = pd.read_excel(io.BytesIO(file_content))
        else:
            for encoding in ["utf-8", "latin-1", "cp1252"]:
                try:
                    df = pd.read_csv(io.BytesIO(file_content), encoding=encoding)
                    break
                except UnicodeDecodeError:
                    continue
            else:
                raise ValueError("Cannot decode CSV — try UTF-8 encoding")

        # Basic cleaning
        df = df.dropna(how="all")
        df.columns = [str(c).strip() for c in df.columns]
        logger.info(f"DataProcessor: parsed {len(df)} rows, {len(df.columns)} columns")
        return df

    # ------------------------------------------------------------------
    def auto_detect_columns(self, df: pd.DataFrame) -> Dict[str, Optional[str]]:
        """Map DataFrame columns to expected ZeroReturn schema fields."""
        cols_lower = {
            c.lower().strip().replace(" ", "_").replace("-", "_"): c
            for c in df.columns
        }

        aliases = {
            "order_id":        ["order_id", "orderid", "order_number", "id", "order_no"],
            "product_name":    ["product_name", "product", "item_name", "name", "title", "item"],
            "category":        ["category", "cat", "product_category", "dept", "department"],
            "price":           ["price", "mrp", "amount", "cost", "selling_price", "order_value", "value"],
            "returned":        ["returned", "is_returned", "return_flag", "return_status", "return"],
            "description":     ["description", "product_description", "desc", "details", "product_details"],
            "customer_name":   ["customer_name", "customer", "buyer", "user", "buyer_name"],
            "seller_name":     ["seller_name", "seller", "vendor", "merchant"],
            "review_score":    ["review_score", "rating", "avg_rating", "star_rating", "avg_review"],
            "review_count":    ["review_count", "num_reviews", "reviews", "ratings_count"],
            "seller_rating":   ["seller_rating", "seller_score", "vendor_rating"],
            "days_to_delivery":["days_to_delivery", "delivery_days", "shipping_days", "delivery_time"],
            "image_url":       ["image_url", "image", "img", "photo_url", "product_image"],
        }

        mapping: Dict[str, Optional[str]] = {}
        for field, field_aliases in aliases.items():
            for alias in field_aliases:
                if alias in cols_lower:
                    mapping[field] = cols_lower[alias]
                    break
            if field not in mapping:
                mapping[field] = None

        logger.info(f"DataProcessor: detected columns — {mapping}")
        return mapping

    # ------------------------------------------------------------------
    def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Create ML-ready features from raw DataFrame."""
        col_map = self.auto_detect_columns(df)

        def _get(field, default):
            col = col_map.get(field)
            if col and col in df.columns:
                return pd.to_numeric(df[col], errors="coerce").fillna(default)
            return pd.Series([default] * len(df), index=df.index)

        def _get_str(field, default=""):
            col = col_map.get(field)
            if col and col in df.columns:
                return df[col].fillna(default).astype(str)
            return pd.Series([default] * len(df), index=df.index)

        features = pd.DataFrame(index=df.index)

        # Price features
        price = _get("price", 999).clip(lower=1)
        features["price"] = price
        features["price_log"] = np.log(price)
        features["price_bucket"] = pd.cut(
            price, bins=[0, 500, 1500, 5000, 15000, float("inf")],
            labels=["budget", "low", "mid", "high", "premium"]
        ).astype(str)

        # Category risk
        category = _get_str("category", "Other")
        features["category"] = category
        features["category_risk"] = category.map(self.CATEGORY_RISK).fillna(0.45)

        # Description quality
        description = _get_str("description", "")
        features["description_length"] = description.str.len()
        features["description_quality"] = (
            features["description_length"].clip(0, 500) / 500
        ).clip(0, 1)

        # Review metrics
        features["avg_review_score"] = _get("review_score", 3.5).clip(1, 5)
        review_count = _get("review_count", 10).clip(lower=1)
        features["review_count"] = review_count
        features["review_count_log"] = np.log(review_count)

        # Seller rating
        features["seller_rating"] = _get("seller_rating", 3.5).clip(1, 5)

        # Delivery
        features["days_to_delivery"] = _get("days_to_delivery", 5).clip(1, 30)

        # Image quality (set to mid if no image analysis available)
        features["image_quality"] = pd.Series([0.6] * len(df), index=df.index)

        return features

    # ------------------------------------------------------------------
    def generate_predictions(self, df: pd.DataFrame) -> List[Dict[str, Any]]:
        """Run ReturnPredictor on all rows in the DataFrame."""
        from app.models.return_predictor import ReturnPredictor

        predictor = ReturnPredictor()
        predictor.initialize()

        col_map = self.auto_detect_columns(df)
        features_df = self.engineer_features(df)
        results = []

        for i, (idx, row) in enumerate(features_df.iterrows()):
            feature_dict = row.to_dict()
            prediction = predictor.predict(feature_dict)

            # Add order identifiers if available
            order_id_col = col_map.get("order_id")
            order_id = str(df.at[idx, order_id_col]) if order_id_col else f"ROW-{i+1}"

            product_col = col_map.get("product_name")
            product_name = str(df.at[idx, product_col]) if product_col else f"Product {i+1}"

            results.append({
                "row_index": i,
                "order_id": order_id,
                "product_name": product_name,
                "category": feature_dict.get("category", "Unknown"),
                "price": feature_dict.get("price", 0),
                **prediction,
            })

        return results

    # ------------------------------------------------------------------
    def create_dashboard_data(self, df: pd.DataFrame) -> Dict[str, Any]:
        """Create a full dashboard summary from uploaded data."""
        predictions = self.generate_predictions(df)
        total = len(predictions)

        if total == 0:
            return {"error": "No data to process"}

        risk_dist = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
        revenue_at_risk = 0.0
        category_stats: Dict[str, Dict] = {}

        for pred in predictions:
            level = pred.get("risk_level", "Low")
            risk_dist[level] = risk_dist.get(level, 0) + 1
            price = float(pred.get("price", 0))
            prob = float(pred.get("probability", 0))

            if level in ("High", "Critical"):
                revenue_at_risk += price * prob * 0.7

            cat = pred.get("category", "Other")
            if cat not in category_stats:
                category_stats[cat] = {"orders": 0, "risk_sum": 0, "revenue_at_risk": 0}
            category_stats[cat]["orders"] += 1
            category_stats[cat]["risk_sum"] += pred.get("risk_score", 0)
            if level in ("High", "Critical"):
                category_stats[cat]["revenue_at_risk"] += price * prob * 0.7

        avg_risk = float(np.mean([p.get("risk_score", 0) for p in predictions]))
        high_risk_count = risk_dist["Critical"] + risk_dist["High"]

        category_summary = [
            {
                "category": cat,
                "orders": stats["orders"],
                "avg_risk_score": round(stats["risk_sum"] / stats["orders"], 1),
                "revenue_at_risk": round(stats["revenue_at_risk"]),
            }
            for cat, stats in sorted(
                category_stats.items(),
                key=lambda x: x[1]["revenue_at_risk"],
                reverse=True,
            )
        ]

        return {
            "total_orders": total,
            "avg_risk_score": round(avg_risk, 1),
            "high_risk_orders": high_risk_count,
            "revenue_at_risk": round(revenue_at_risk),
            "risk_distribution": risk_dist,
            "category_summary": category_summary,
            "top_risky_orders": sorted(
                predictions, key=lambda x: x.get("risk_score", 0), reverse=True
            )[:10],
            "predictions": predictions,
        }
