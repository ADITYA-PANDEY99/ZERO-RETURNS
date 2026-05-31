"""
Dashboard router — KPI summary, heatmap, and trend chart data.
All endpoints return realistic Indian e-commerce mock data.
"""
from __future__ import annotations

import random
from datetime import datetime, timedelta
from typing import Any, Dict, List

from fastapi import APIRouter

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

CATEGORIES = ["Electronics", "Clothing", "Footwear", "Books", "Home", "Beauty", "Sports", "Toys"]

CATEGORY_STATS = {
    "Electronics":  {"risk_score": 78, "orders": 2841, "return_rate": 0.284},
    "Clothing":     {"risk_score": 65, "orders": 3204, "return_rate": 0.221},
    "Footwear":     {"risk_score": 58, "orders": 1876, "return_rate": 0.187},
    "Books":        {"risk_score": 12, "orders": 1245, "return_rate": 0.042},
    "Home":         {"risk_score": 42, "orders": 1563, "return_rate": 0.138},
    "Beauty":       {"risk_score": 35, "orders": 987,  "return_rate": 0.112},
    "Sports":       {"risk_score": 45, "orders": 723,  "return_rate": 0.145},
    "Toys":         {"risk_score": 39, "orders": 408,  "return_rate": 0.121},
}


@router.get("/summary")
async def get_summary() -> Dict[str, Any]:
    """Full dashboard summary combining all data."""
    return {
        "kpis": _build_kpis(),
        "heatmap": _build_heatmap(),
        "trends": _build_trends(days=30),
        "top_risk_categories": _top_risk_categories(),
        "generated_at": datetime.utcnow().isoformat(),
    }


@router.get("/kpis")
async def get_kpis() -> Dict[str, Any]:
    """4 KPI cards for the dashboard header."""
    return _build_kpis()


@router.get("/heatmap")
async def get_heatmap() -> List[Dict[str, Any]]:
    """Category risk heatmap data."""
    return _build_heatmap()


@router.get("/trends")
async def get_trends(days: int = 30) -> Dict[str, Any]:
    """30-day trend chart data."""
    return {
        "data": _build_trends(days=days),
        "summary": {
            "avg_daily_orders": 428,
            "avg_daily_returns": 78,
            "total_orders": 12847,
            "total_returns": 2351,
        },
    }


# ---------------------------------------------------------------------------
# Internal builders
# ---------------------------------------------------------------------------

def _build_kpis() -> Dict[str, Any]:
    return {
        "total_orders": 12847,
        "return_rate": 18.3,
        "revenue_at_risk": 2341800,
        "returns_prevented": 1847,
        "trend_total_orders": 12.5,
        "trend_return_rate": -3.2,
        "trend_revenue_at_risk": -8.1,
        "trend_returns_prevented": 24.7,
        "currency": "INR",
        "period": "last_30_days",
    }


def _build_heatmap() -> List[Dict[str, Any]]:
    heatmap = []
    for category, stats in CATEGORY_STATS.items():
        orders = stats["orders"]
        returns = int(orders * stats["return_rate"])
        avg_order_value = {
            "Electronics": 18500, "Clothing": 1200, "Footwear": 2800,
            "Books": 450, "Home": 3200, "Beauty": 890, "Sports": 2100, "Toys": 1500,
        }.get(category, 1500)
        revenue_at_risk = returns * avg_order_value * 0.7  # 70% of returned value is at risk
        heatmap.append({
            "category": category,
            "risk_score": stats["risk_score"],
            "orders": orders,
            "returns": returns,
            "return_rate_pct": round(stats["return_rate"] * 100, 1),
            "revenue_at_risk": round(revenue_at_risk),
            "avg_order_value": avg_order_value,
        })
    return sorted(heatmap, key=lambda x: x["risk_score"], reverse=True)


def _build_trends(days: int = 30) -> List[Dict[str, Any]]:
    trends = []
    rng = random.Random(42)
    base_date = datetime.now() - timedelta(days=days)

    for i in range(days):
        date = base_date + timedelta(days=i)
        # Simulate weekly patterns (weekends have higher orders)
        day_of_week = date.weekday()
        multiplier = 1.25 if day_of_week >= 5 else 1.0

        orders = int(rng.gauss(428 * multiplier, 40))
        return_rate = rng.gauss(0.183, 0.02)
        returns = int(orders * return_rate)
        avg_order_value = rng.gauss(2850, 200)
        revenue = orders * avg_order_value

        trends.append({
            "date": date.strftime("%Y-%m-%d"),
            "orders_count": max(300, orders),
            "returns_count": max(40, returns),
            "revenue": round(revenue),
            "return_rate_pct": round(return_rate * 100, 2),
            "returns_prevented": int(rng.gauss(62, 10)),
        })
    return trends


def _top_risk_categories() -> List[Dict[str, Any]]:
    return [
        {"category": "Electronics", "risk_score": 78, "action": "Improve spec sheets"},
        {"category": "Clothing", "risk_score": 65, "action": "Add size guide"},
        {"category": "Footwear", "risk_score": 58, "action": "Add fit guide"},
    ]
