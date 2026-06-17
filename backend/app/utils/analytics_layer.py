"""
ZeroReturn Analytics & Feature Store Engine
Core implementation of reusable KPI engines, SQL analytics, data validation pipeline, and feature metrics.
"""
from __future__ import annotations

import logging
import sqlite3
import numpy as np
import pandas as pd
from typing import Any, Dict, List, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

# ===========================================================================
# 1. ANALYTICS PIPELINE (Validation -> Cleaning -> Feature Store)
# ===========================================================================

class AnalyticsPipeline:
    """Enterprise Data Pipeline handling data verification, cleansing, aggregation & storage."""

    @staticmethod
    def validate_and_clean(df: pd.DataFrame) -> Dict[str, Any]:
        """
        Validate dataset quality, perform duplicate checks, compute missing metrics,
        and generate a data validation report.
        """
        total_rows = len(df)
        report = {
            "timestamp": datetime.utcnow().isoformat(),
            "total_records_received": total_rows,
            "duplicate_records_removed": 0,
            "null_values_filled": {},
            "issues": []
        }

        if total_rows == 0:
            report["issues"].append("Empty dataset uploaded.")
            return {"cleaned_df": df, "report": report}

        # Clean column spaces
        df.columns = [str(c).strip() for c in df.columns]

        # Duplicate detection
        dup_count = df.duplicated().sum()
        if dup_count > 0:
            df = df.drop_duplicates().reset_index(drop=True)
            report["duplicate_records_removed"] = int(dup_count)

        # Standard cleanups & null checks
        for col in df.columns:
            nulls = df[col].isnull().sum()
            if nulls > 0:
                report["null_values_filled"][col] = int(nulls)
                # Fill logic based on dtype
                if pd.api.types.is_numeric_dtype(df[col]):
                    df[col] = df[col].fillna(df[col].median() if not df[col].median() is np.nan else 0.0)
                else:
                    df[col] = df[col].fillna("Unknown")

        logger.info(f"AnalyticsPipeline: Cleaned {total_rows} -> {len(df)} rows. Report: {report}")
        return {"cleaned_df": df, "report": report}


# ===========================================================================
# 2. FEATURE STORE ENGINE
# ===========================================================================

class AnalyticsFeatureStore:
    """Manages computation and retrieval of derived operational metrics for Customers, Products, and Sellers."""

    def __init__(self, db_conn: sqlite3.Connection | None = None):
        self.conn = db_conn or sqlite3.connect(":memory:")
        self._init_sqlite_store()

    def _init_sqlite_store(self):
        """Build local in-memory/cache schema if running offline or in fallback mode."""
        cursor = self.conn.cursor()
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS customer_features (
                customer_name TEXT PRIMARY KEY,
                clv REAL DEFAULT 0.0,
                purchase_frequency REAL DEFAULT 0.0,
                return_frequency REAL DEFAULT 0.0,
                complaint_frequency REAL DEFAULT 0.0,
                customer_risk_score REAL DEFAULT 0.0,
                total_orders INTEGER DEFAULT 0,
                total_returns INTEGER DEFAULT 0,
                last_updated TEXT
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS product_features (
                product_name TEXT PRIMARY KEY,
                category TEXT,
                product_health_score REAL DEFAULT 100.0,
                review_score REAL DEFAULT 5.0,
                sentiment_score REAL DEFAULT 100.0,
                return_rate REAL DEFAULT 0.0,
                total_sales INTEGER DEFAULT 0,
                total_returns INTEGER DEFAULT 0,
                last_updated TEXT
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS seller_features (
                seller_name TEXT PRIMARY KEY,
                seller_health_score REAL DEFAULT 100.0,
                revenue_contribution REAL DEFAULT 0.0,
                risk_contribution REAL DEFAULT 0.0,
                total_sales_volume REAL DEFAULT 0.0,
                total_returns_volume REAL DEFAULT 0.0,
                last_updated TEXT
            )
        """)
        self.conn.commit()

    def sync_feature_store(self, orders_df: pd.DataFrame):
        """
        Compute operational intelligence statistics from raw transactional data
        and upsert them into the feature store.
        """
        if orders_df.empty:
            return

        # Ensure schema matching aliases
        from app.utils.data_processor import DataProcessor
        dp = DataProcessor()
        mapping = dp.auto_detect_columns(orders_df)

        # Standardize columns internally
        std_df = pd.DataFrame()
        for field, raw_col in mapping.items():
            if raw_col and raw_col in orders_df.columns:
                std_df[field] = orders_df[raw_col]
            else:
                std_df[field] = None

        # Fill default placeholders for required columns
        std_df["price"] = pd.to_numeric(std_df["price"], errors="coerce").fillna(0.0)
        std_df["customer_name"] = std_df["customer_name"].fillna("Unknown Customer").astype(str)
        std_df["product_name"] = std_df["product_name"].fillna("Unknown Product").astype(str)
        std_df["seller_name"] = std_df["seller_name"].fillna("Unknown Seller").astype(str)
        std_df["category"] = std_df["category"].fillna("Other").astype(str)
        std_df["returned"] = std_df["returned"].astype(str).str.lower().isin(["true", "1", "yes", "returned"])

        # Calculate Customer Features
        cust_group = std_df.groupby("customer_name")
        total_revenue = std_df["price"].sum() or 1.0

        for name, group in cust_group:
            total_orders = len(group)
            total_returns = group["returned"].sum()
            clv = group["price"].sum()
            ret_freq = float(total_returns / total_orders) if total_orders > 0 else 0.0
            
            # Simple complaint simulation based on returns
            comp_freq = ret_freq * 0.4 
            
            # Calculate composite risk score
            cust_risk = (ret_freq * 0.6 + comp_freq * 0.4) * 100.0

            cursor = self.conn.cursor()
            cursor.execute("""
                INSERT INTO customer_features (
                    customer_name, clv, purchase_frequency, return_frequency, 
                    complaint_frequency, customer_risk_score, total_orders, total_returns, last_updated
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(customer_name) DO UPDATE SET
                    clv = EXCLUDED.clv,
                    return_frequency = EXCLUDED.return_frequency,
                    complaint_frequency = EXCLUDED.complaint_frequency,
                    customer_risk_score = EXCLUDED.customer_risk_score,
                    total_orders = EXCLUDED.total_orders,
                    total_returns = EXCLUDED.total_returns,
                    last_updated = EXCLUDED.last_updated
            """, (name, clv, float(total_orders), ret_freq, comp_freq, cust_risk, int(total_orders), int(total_returns), datetime.utcnow().isoformat()))

        # Calculate Product Features
        prod_group = std_df.groupby("product_name")
        for name, group in prod_group:
            total_sales = len(group)
            total_returns = group["returned"].sum()
            return_rate = float(total_returns / total_sales) if total_sales > 0 else 0.0
            
            # Simulated sentiment metrics
            rev_score = float(group["review_score"].dropna().mean()) if "review_score" in group.columns and not group["review_score"].dropna().empty else 4.0
            sentiment = (rev_score / 5.0) * 100.0
            health = (1.0 - return_rate) * 100.0

            cursor = self.conn.cursor()
            cursor.execute("""
                INSERT INTO product_features (
                    product_name, category, product_health_score, review_score,
                    sentiment_score, return_rate, total_sales, total_returns, last_updated
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(product_name) DO UPDATE SET
                    product_health_score = EXCLUDED.product_health_score,
                    review_score = EXCLUDED.review_score,
                    sentiment_score = EXCLUDED.sentiment_score,
                    return_rate = EXCLUDED.return_rate,
                    total_sales = EXCLUDED.total_sales,
                    total_returns = EXCLUDED.total_returns,
                    last_updated = EXCLUDED.last_updated
            """, (name, group["category"].iloc[0], health, rev_score, sentiment, return_rate, int(total_sales), int(total_returns), datetime.utcnow().isoformat()))

        # Calculate Seller Features
        seller_group = std_df.groupby("seller_name")
        total_risk_sum = std_df["returned"].sum() or 1.0

        for name, group in seller_group:
            sales_vol = group["price"].sum()
            returns_vol = group[group["returned"] == True]["price"].sum()
            
            sales_count = len(group)
            returns_count = group["returned"].sum()
            return_rate = float(returns_count / sales_count) if sales_count > 0 else 0.0
            
            rev_contrib = float(sales_vol / total_revenue)
            risk_contrib = float(returns_count / total_risk_sum)
            health = (1.0 - return_rate) * 100.0

            cursor = self.conn.cursor()
            cursor.execute("""
                INSERT INTO seller_features (
                    seller_name, seller_health_score, revenue_contribution,
                    risk_contribution, total_sales_volume, total_returns_volume, last_updated
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(seller_name) DO UPDATE SET
                    seller_health_score = EXCLUDED.seller_health_score,
                    revenue_contribution = EXCLUDED.revenue_contribution,
                    risk_contribution = EXCLUDED.risk_contribution,
                    total_sales_volume = EXCLUDED.total_sales_volume,
                    total_returns_volume = EXCLUDED.total_returns_volume,
                    last_updated = EXCLUDED.last_updated
            """, (name, health, rev_contrib, risk_contrib, sales_vol, returns_vol, datetime.utcnow().isoformat()))

        self.conn.commit()


# ===========================================================================
# 3. KPI ENGINE
# ===========================================================================

class KPIEngine:
    """Core calculation engine computing operational KPIs, return rates, and financial metrics."""

    def __init__(self, db_conn: sqlite3.Connection):
        self.conn = db_conn

    def compute_all_kpis(self) -> Dict[str, Any]:
        """Generate high-level aggregated operational KPI metrics."""
        cursor = self.conn.cursor()
        
        # Pull basic sums
        cursor.execute("SELECT COUNT(*), SUM(price), SUM(CASE WHEN returned = 1 THEN 1 ELSE 0 END) FROM orders")
        row = cursor.fetchone()
        total_orders = row[0] or 0
        total_revenue = row[1] or 0.0
        total_returns = row[2] or 0

        return_rate = float(total_returns / total_orders) if total_orders > 0 else 0.0
        
        # Financial Impact Metrics
        revenue_at_risk = float(total_revenue * return_rate * 0.7)
        revenue_saved = float(total_revenue * (0.22 - return_rate) * 0.7) if return_rate < 0.22 else 0.0

        # Quality scoring
        cursor.execute("SELECT AVG(product_health_score) FROM product_features")
        p_health = cursor.fetchone()[0] or 90.0

        cursor.execute("SELECT AVG(seller_health_score) FROM seller_features")
        s_health = cursor.fetchone()[0] or 92.0

        cursor.execute("SELECT AVG(customer_risk_score) FROM customer_features")
        c_health = 100.0 - (cursor.fetchone()[0] or 15.0)

        return {
            "total_orders": int(total_orders),
            "total_revenue": round(total_revenue, 2),
            "total_returns": int(total_returns),
            "return_rate": round(return_rate, 4),
            "refund_rate": round(return_rate * 0.95, 4), # 95% of returns result in refunds
            "revenue_at_risk": round(max(0.0, revenue_at_risk), 2),
            "revenue_saved": round(max(0.0, revenue_saved), 2),
            "product_health": round(p_health, 2),
            "seller_health": round(s_health, 2),
            "customer_health": round(c_health, 2),
            "operational_risk": round(100.0 - s_health, 2)
        }


# ===========================================================================
# 4. SQL ANALYTICS LAYER
# ===========================================================================

class SQLAnalyticsLayer:
    """Executes complex query aggregations (Segmentation, Cohorts, RFM, Pareto)."""

    def __init__(self, db_conn: sqlite3.Connection):
        self.conn = db_conn

    def cohort_analysis(self) -> List[Dict[str, Any]]:
        """Cohort return rates grouped by category and price buckets."""
        df = pd.read_sql_query("""
            SELECT category,
                   CASE 
                       WHEN price < 500 THEN '₹0–500 (Budget)'
                       WHEN price BETWEEN 500 AND 1500 THEN '₹500–1500 (Low)'
                       WHEN price BETWEEN 1500 AND 5000 THEN '₹1500–5000 (Mid)'
                       ELSE '₹5000+ (Premium)'
                   END as price_tier,
                   COUNT(*) as order_count,
                   SUM(CASE WHEN returned = 1 THEN 1 ELSE 0 END) as return_count
            FROM orders
            GROUP BY category, price_tier
        """, self.conn)
        
        df["return_rate"] = (df["return_count"] / df["order_count"]).fillna(0.0).round(4)
        return df.to_dict(orient="records")

    def rfm_analysis(self) -> List[Dict[str, Any]]:
        """Recency, Frequency, Monetary (RFM) Segmentation for customers."""
        # Simple RFM: Frequency (orders count), Monetary (CLV sum)
        return pd.read_sql_query("""
            SELECT customer_name,
                   clv as monetary_value,
                   total_orders as frequency,
                   customer_risk_score,
                   CASE 
                       WHEN clv > 5000 AND total_orders > 3 THEN 'VIP Customer'
                       WHEN customer_risk_score > 50 THEN 'High Return Risk'
                       WHEN total_orders = 1 THEN 'One-time Purchaser'
                       ELSE 'Standard Active'
                   END as segment_name
            FROM customer_features
            ORDER BY monetary_value DESC
            LIMIT 50
        """, self.conn).to_dict(orient="records")

    def pareto_analysis(self) -> Dict[str, Any]:
        """Pareto 80/20 Rule Analysis: Identifying key products/sellers causing 80% of returns."""
        df = pd.read_sql_query("""
            SELECT product_name, total_returns
            FROM product_features
            WHERE total_returns > 0
            ORDER BY total_returns DESC
        """, self.conn)

        if df.empty:
            return {"pareto_ratio": 0.0, "total_returns": 0, "top_drivers": []}

        df["cum_returns"] = df["total_returns"].cumsum()
        total_returns = df["total_returns"].sum()
        df["cum_percentage"] = (df["cum_returns"] / total_returns) * 100.0
        
        top_drivers = df[df["cum_percentage"] <= 80.0]
        drivers_ratio = float(len(top_drivers) / len(df)) if len(df) > 0 else 0.0

        return {
            "pareto_ratio": round(drivers_ratio, 4),
            "total_returns": int(total_returns),
            "top_drivers": top_drivers.to_dict(orient="records")
        }
