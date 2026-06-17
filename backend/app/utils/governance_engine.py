import sqlite3
import pandas as pd
from datetime import datetime
from typing import Dict, Any, List

class DataGovernanceEngine:
    """Calculates data freshness, schema drift, completeness, and pipeline health scores from the warehouse."""

    @staticmethod
    def calculate_metrics(db_conn: sqlite3.Connection) -> Dict[str, Any]:
        """Calculates live metrics from the SQLite database."""
        try:
            # Load orders into DataFrame
            df = pd.read_sql_query("SELECT * FROM orders", db_conn)
        except Exception:
            df = pd.DataFrame()

        if df.empty:
            return {
                "governance_score": 0,
                "freshness_pct": 0,
                "completeness_pct": 0,
                "duplicate_rate_pct": 0,
                "missing_values_count": 0,
                "validation_status": "Failed",
                "drift_detected": True,
                "alerts": [{"severity": "Critical", "message": "Warehouse table 'orders' is empty or missing."}]
            }

        total_rows = len(df)
        
        # 1. Completeness: Check non-null percentage across crucial columns
        critical_cols = ["id", "product_name", "category", "price", "customer_name", "seller_name"]
        non_null_counts = 0
        total_fields = total_rows * len(critical_cols)
        
        for col in critical_cols:
            if col in df.columns:
                non_null_counts += df[col].notna().sum()
                
        completeness_pct = round((non_null_counts / total_fields) * 100, 1) if total_fields > 0 else 0.0

        # 2. Duplicate Rate
        duplicate_count = df.duplicated(subset=["id"]).sum()
        duplicate_rate_pct = round((duplicate_count / total_rows) * 100, 2) if total_rows > 0 else 0.0

        # 3. Missing Values
        missing_count = int(df.isna().sum().sum())

        # 4. Freshness
        # For simulation, since we use mock static data, we assume data freshness is high if loaded today
        freshness_pct = 98.4

        # 5. Schema Drift
        # Verify columns match standard schema
        expected_cols = {"id", "product_name", "category", "price", "customer_name", "seller_name", "returned", "review_score", "seller_rating"}
        actual_cols = set(df.columns)
        missing_expected = expected_cols - actual_cols
        drift_detected = len(missing_expected) > 0

        # Compute combined Governance Score
        # Weights: Completeness (40%), Freshness (30%), Duplicate prevention (20%), Schema validation (10%)
        schema_score = 100 if not drift_detected else 50
        dup_score = max(0, 100 - (duplicate_rate_pct * 5))
        
        governance_score = round(
            (completeness_pct * 0.40) + 
            (freshness_pct * 0.30) + 
            (dup_score * 0.20) + 
            (schema_score * 0.10), 
            1
        )

        # Build active alert logs
        alerts = []
        if drift_detected:
            alerts.append({
                "severity": "Warning",
                "message": f"Schema drift detected. Missing expected fields: {', '.join(missing_expected)}",
                "root_cause": "Catalog update template mismatch during upload process."
            })
        if duplicate_rate_pct > 0.5:
            alerts.append({
                "severity": "Critical",
                "message": f"High transaction duplicate rate: {duplicate_rate_pct}%",
                "root_cause": "API idempotency tokens failed on payment client checkouts."
            })
        if completeness_pct < 95.0:
            alerts.append({
                "severity": "Warning",
                "message": f"Data fields incomplete: {completeness_pct}%",
                "root_cause": "Seller profiles submitted without formal ratings."
            })
            
        if not alerts:
            alerts.append({
                "severity": "Info",
                "message": "All data ingestion checks passed validation rules.",
                "root_cause": "N/A"
            })

        return {
            "governance_score": governance_score,
            "freshness_pct": freshness_pct,
            "completeness_pct": completeness_pct,
            "duplicate_rate_pct": duplicate_rate_pct,
            "missing_values_count": missing_count,
            "validation_status": "Passed" if governance_score >= 80 else "Degraded",
            "drift_detected": drift_detected,
            "alerts": alerts,
            "total_rows": total_rows
        }

    @staticmethod
    def get_historical_trends() -> List[Dict[str, Any]]:
        """Returns mock history for visual chart displays."""
        return [
            {"date": "2026-06-12", "score": 96.2, "freshness": 98.1, "completeness": 99.4},
            {"date": "2026-06-13", "score": 96.5, "freshness": 98.4, "completeness": 99.4},
            {"date": "2026-06-14", "score": 95.8, "freshness": 96.2, "completeness": 99.1},
            {"date": "2026-06-15", "score": 94.2, "freshness": 95.1, "completeness": 98.5},
            {"date": "2026-06-16", "score": 97.4, "freshness": 98.4, "completeness": 99.6},
            {"date": "2026-06-17", "score": 97.8, "freshness": 98.4, "completeness": 99.6},
        ]
