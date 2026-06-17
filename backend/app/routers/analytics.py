"""
Analytics router — advanced charts, period comparison, what-if simulator,
and PDF report generation endpoint.
"""
from __future__ import annotations

import random
import sqlite3
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

from app.schemas.models import (
    WhatIfRequest, WhatIfResponse, ReportRequest,
    KPISummaryResponse, CohortItem, RFMItem, ParetoResponse
)

router = APIRouter(prefix="/analytics", tags=["Analytics"])

_RNG = random.Random(2024)



# ---------------------------------------------------------------------------
# Chart data
# ---------------------------------------------------------------------------

@router.get("/charts")
async def get_all_charts() -> Dict[str, Any]:
    """All chart data for the analytics page."""
    return {
        "category_breakdown": _category_breakdown(),
        "return_reasons": _return_reasons(),
        "price_vs_return": _price_vs_return(),
        "daily_anomaly": _daily_anomaly_data(),
        "seller_performance": _seller_performance(),
        "return_by_day": _return_by_day_of_week(),
        "description_quality_impact": _description_quality_impact(),
        "generated_at": datetime.utcnow().isoformat(),
    }


@router.get("/comparison")
async def get_period_comparison(days: int = 30) -> Dict[str, Any]:
    """Compare current period vs previous period."""
    current = _period_metrics(days)
    previous = _period_metrics(days, offset_days=days)

    def pct_change(curr, prev):
        if prev == 0:
            return 0.0
        return round((curr - prev) / prev * 100, 2)

    return {
        "current_period": {
            "label": f"Last {days} days",
            "start": (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d"),
            "end": datetime.now().strftime("%Y-%m-%d"),
            **current,
        },
        "previous_period": {
            "label": f"Prior {days} days",
            "start": (datetime.now() - timedelta(days=days * 2)).strftime("%Y-%m-%d"),
            "end": (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%d"),
            **previous,
        },
        "changes": {
            "total_orders_pct": pct_change(current["total_orders"], previous["total_orders"]),
            "return_rate_pct": pct_change(current["return_rate"], previous["return_rate"]),
            "revenue_at_risk_pct": pct_change(current["revenue_at_risk"], previous["revenue_at_risk"]),
            "returns_prevented_pct": pct_change(current["returns_prevented"], previous["returns_prevented"]),
        },
    }


# ---------------------------------------------------------------------------
# What-If Simulator
# ---------------------------------------------------------------------------

@router.post("/whatif", response_model=WhatIfResponse)
async def whatif_simulator(request: WhatIfRequest) -> WhatIfResponse:
    """
    Estimate impact of quality improvements on return rate.
    Simple linear model based on published e-commerce research coefficients.
    """
    BASE_RETURN_RATE = 18.3
    BASE_REVENUE_AT_RISK = 2_341_800
    TOTAL_ORDERS = 12847

    # Coefficient weights (percentage points reduction per 10% improvement)
    DESC_COEFF = 0.18    # 18% of return reduction from description quality
    IMG_COEFF = 0.142    # 14.2% from image quality
    PRICE_COEFF = 0.08   # 8% from price optimization

    desc_reduction = (request.description_quality_improvement / 10) * DESC_COEFF * BASE_RETURN_RATE
    img_reduction = (request.image_quality_improvement / 10) * IMG_COEFF * BASE_RETURN_RATE
    price_adjustment = abs(request.price_optimization) / 100 * PRICE_COEFF * BASE_RETURN_RATE

    total_reduction = min(desc_reduction + img_reduction + price_adjustment, BASE_RETURN_RATE * 0.6)
    new_return_rate = round(max(BASE_RETURN_RATE - total_reduction, 2.0), 2)

    returns_saved = int(TOTAL_ORDERS * (BASE_RETURN_RATE - new_return_rate) / 100)
    avg_order_value = BASE_REVENUE_AT_RISK / (TOTAL_ORDERS * BASE_RETURN_RATE / 100)
    revenue_saved = round(returns_saved * avg_order_value * 0.7)

    return WhatIfResponse(
        estimated_return_reduction=round(total_reduction, 2),
        estimated_revenue_saved=revenue_saved,
        new_return_rate=new_return_rate,
        breakdown={
            "description_improvement": round(desc_reduction, 2),
            "image_improvement": round(img_reduction, 2),
            "price_optimization": round(price_adjustment, 2),
        },
    )


# ---------------------------------------------------------------------------
# PDF Report
# ---------------------------------------------------------------------------

@router.post("/report/generate")
async def generate_report(request: ReportRequest) -> Dict[str, Any]:
    """Generate PDF report and return download info."""
    try:
        from app.utils.pdf_generator import PDFGenerator
        from app.routers.dashboard import _build_kpis, _build_heatmap

        report_data = {
            "kpis": _build_kpis(),
            "heatmap": _build_heatmap(),
            "report_type": request.report_type,
            "date_range_days": request.date_range_days,
            "generated_at": datetime.utcnow().isoformat(),
        }

        generator = PDFGenerator()
        pdf_bytes = generator.generate_report(report_data)

        # Return as base64 for frontend download
        import base64
        pdf_b64 = base64.b64encode(pdf_bytes).decode("utf-8")
        filename = f"zeroreturns_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"

        return {
            "status": "generated",
            "filename": filename,
            "size_bytes": len(pdf_bytes),
            "pdf_base64": pdf_b64,
            "generated_at": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")


# ---------------------------------------------------------------------------
# Reusable SQL Analytics & KPI Endpoints (Sprint Upgrade)
# ---------------------------------------------------------------------------

def _get_populated_analytics_db() -> sqlite3.Connection:
    """Helper to spin up an in-memory database representing current orders."""
    conn = sqlite3.connect(":memory:")
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id TEXT PRIMARY KEY,
            product_name TEXT,
            category TEXT,
            price REAL,
            customer_name TEXT,
            seller_name TEXT,
            returned INTEGER,
            review_score REAL,
            seller_rating REAL
        )
    """)
    
    # Import mock orders
    from app.routers.orders import _MOCK_ORDERS
    for o in _MOCK_ORDERS:
        cursor.execute("""
            INSERT OR IGNORE INTO orders (id, product_name, category, price, customer_name, seller_name, returned, review_score, seller_rating)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            o["order_id"], o["product_name"], o["category"], o["price"],
            o["customer_name"], o["seller_name"],
            1 if o["risk_level"] in ("High", "Critical") else 0,
            o.get("avg_review_score", 4.0), o.get("seller_rating", 4.0)
        ))
    conn.commit()
    return conn


@router.get("/kpis", response_model=KPISummaryResponse)
async def get_kpis_summary() -> KPISummaryResponse:
    """Fetch high-level enterprise metrics computed via the reusable KPIEngine."""
    db_conn = _get_populated_analytics_db()
    try:
        from app.utils.analytics_layer import AnalyticsFeatureStore, KPIEngine
        
        # Sync feature tables
        fs = AnalyticsFeatureStore(db_conn)
        # Fetch current orders as DataFrame
        orders_df = pd.read_sql_query("SELECT * FROM orders", db_conn)
        fs.sync_feature_store(orders_df)
        
        # Compute KPIs
        engine = KPIEngine(db_conn)
        kpi_data = engine.compute_all_kpis()
        return KPISummaryResponse(**kpi_data)
    finally:
        db_conn.close()


@router.get("/cohorts", response_model=List[CohortItem])
async def get_cohort_analysis() -> List[CohortItem]:
    """Execute Category/Price distribution Cohort returns analysis."""
    db_conn = _get_populated_analytics_db()
    try:
        from app.utils.analytics_layer import SQLAnalyticsLayer
        layer = SQLAnalyticsLayer(db_conn)
        return layer.cohort_analysis()
    finally:
        db_conn.close()


@router.get("/rfm", response_model=List[RFMItem])
async def get_rfm_analysis() -> List[RFMItem]:
    """Segment customers using Recency, Frequency, and Monetary parameters."""
    db_conn = _get_populated_analytics_db()
    try:
        from app.utils.analytics_layer import AnalyticsFeatureStore, SQLAnalyticsLayer
        fs = AnalyticsFeatureStore(db_conn)
        orders_df = pd.read_sql_query("SELECT * FROM orders", db_conn)
        fs.sync_feature_store(orders_df)
        
        layer = SQLAnalyticsLayer(db_conn)
        return layer.rfm_analysis()
    finally:
        db_conn.close()


@router.get("/pareto", response_model=ParetoResponse)
async def get_pareto_analysis() -> ParetoResponse:
    """Detect return drivers based on the Pareto 80/20 principle."""
    db_conn = _get_populated_analytics_db()
    try:
        from app.utils.analytics_layer import AnalyticsFeatureStore, SQLAnalyticsLayer
        fs = AnalyticsFeatureStore(db_conn)
        orders_df = pd.read_sql_query("SELECT * FROM orders", db_conn)
        fs.sync_feature_store(orders_df)
        
        layer = SQLAnalyticsLayer(db_conn)
        return ParetoResponse(**layer.pareto_analysis())
    finally:
        db_conn.close()



# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _category_breakdown() -> List[Dict[str, Any]]:
    return [
        {"category": "Electronics",  "orders": 2841, "returns": 807,  "return_rate": 28.4, "revenue_at_risk": 896500},
        {"category": "Clothing",     "orders": 3204, "returns": 708,  "return_rate": 22.1, "revenue_at_risk": 509760},
        {"category": "Footwear",     "orders": 1876, "returns": 351,  "return_rate": 18.7, "revenue_at_risk": 588600},
        {"category": "Home",         "orders": 1563, "returns": 216,  "return_rate": 13.8, "revenue_at_risk": 261180},
        {"category": "Beauty",       "orders": 987,  "returns": 111,  "return_rate": 11.2, "revenue_at_risk": 59400},
        {"category": "Books",        "orders": 1245, "returns": 52,   "return_rate": 4.2,  "revenue_at_risk": 14040},
        {"category": "Sports",       "orders": 723,  "returns": 105,  "return_rate": 14.5, "revenue_at_risk": 131250},
        {"category": "Toys",         "orders": 408,  "returns": 49,   "return_rate": 12.1, "revenue_at_risk": 44070},
    ]


def _return_reasons() -> List[Dict[str, Any]]:
    return [
        {"reason": "Product doesn't match description", "count": 687, "pct": 29.2},
        {"reason": "Wrong size / doesn't fit",          "count": 519, "pct": 22.1},
        {"reason": "Product quality issues",            "count": 423, "pct": 18.0},
        {"reason": "Damaged on delivery",               "count": 284, "pct": 12.1},
        {"reason": "Changed mind",                      "count": 198, "pct": 8.4},
        {"reason": "Wrong item received",               "count": 142, "pct": 6.0},
        {"reason": "Other",                             "count": 98,  "pct": 4.2},
    ]


def _price_vs_return() -> List[Dict[str, Any]]:
    """Scatter-style data: price bucket vs avg return rate."""
    return [
        {"price_range": "₹0–500",       "avg_return_rate": 8.2,  "order_count": 2341},
        {"price_range": "₹500–1,500",   "avg_return_rate": 14.5, "order_count": 3892},
        {"price_range": "₹1,500–5,000", "avg_return_rate": 19.8, "order_count": 3127},
        {"price_range": "₹5,000–15,000","avg_return_rate": 26.1, "order_count": 1984},
        {"price_range": "₹15,000+",     "avg_return_rate": 31.4, "order_count": 1503},
    ]


def _daily_anomaly_data() -> List[Dict[str, Any]]:
    """30-day return rate data with anomaly flags."""
    data = []
    base = datetime.now() - timedelta(days=30)
    for i in range(30):
        date = base + timedelta(days=i)
        rate = _RNG.gauss(18.3, 2.1)
        is_anomaly = i in [7, 14, 22]  # Simulate anomaly days
        if is_anomaly:
            rate += _RNG.uniform(8, 15)
        data.append({
            "date": date.strftime("%Y-%m-%d"),
            "return_rate": round(max(5, rate), 2),
            "is_anomaly": is_anomaly,
            "anomaly_reason": "Sudden spike — possible quality batch issue" if is_anomaly else None,
        })
    return data


def _seller_performance() -> List[Dict[str, Any]]:
    sellers = [
        ("TechZone India Pvt Ltd", 72, 28.4),
        ("FashionHub Retail", 65, 22.1),
        ("HomeComfort Store", 42, 13.8),
        ("BookWorld Online", 12, 4.2),
        ("SportsFit India", 45, 14.5),
        ("BeautyGlow Cosmetics", 35, 11.2),
        ("ElectroKing Wholesale", 68, 25.3),
        ("StyleVilla Fashion", 58, 19.7),
        ("KidZone Toys", 39, 12.1),
        ("QuickShop India", 48, 15.6),
    ]
    return [
        {"seller": s, "risk_score": rs, "return_rate": rr,
         "orders": _RNG.randint(200, 1500), "status": "high_risk" if rs > 60 else "normal"}
        for s, rs, rr in sellers
    ]


def _return_by_day_of_week() -> List[Dict[str, Any]]:
    days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
    rates = [16.8, 17.2, 18.1, 17.9, 20.3, 22.1, 21.4]
    return [{"day": d, "return_rate": r} for d, r in zip(days, rates)]


def _description_quality_impact() -> List[Dict[str, Any]]:
    return [
        {"quality_range": "0–20 (Very Poor)",  "avg_return_rate": 34.2},
        {"quality_range": "20–40 (Poor)",      "avg_return_rate": 27.8},
        {"quality_range": "40–60 (Fair)",      "avg_return_rate": 19.3},
        {"quality_range": "60–80 (Good)",      "avg_return_rate": 13.1},
        {"quality_range": "80–100 (Excellent)", "avg_return_rate": 7.4},
    ]


def _period_metrics(days: int, offset_days: int = 0) -> Dict[str, Any]:
    base_orders = 12847 if offset_days == 0 else 11400
    base_rate = 18.3 if offset_days == 0 else 21.5
    return {
        "total_orders": base_orders,
        "return_rate": base_rate,
        "revenue_at_risk": int(base_orders * base_rate / 100 * 2100),
        "returns_prevented": 1847 if offset_days == 0 else 1482,
    }
