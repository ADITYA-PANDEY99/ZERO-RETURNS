"""
Orders router — paginated order list, single order details, full ML analysis,
and fix-applied endpoint.
50 realistic mock orders with Indian e-commerce data.
"""
from __future__ import annotations

import math
import random
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/orders", tags=["Orders"])

# ---------------------------------------------------------------------------
# Mock data generation (deterministic with seed so IDs are stable)
# ---------------------------------------------------------------------------

PRODUCTS = [
    # (name, category, base_price, desc_quality, img_quality)
    ("Samsung Galaxy M34 5G 128GB", "Electronics", 18999, 0.55, 0.72),
    ("OnePlus Nord CE 3 Lite 5G", "Electronics", 19999, 0.48, 0.65),
    ("boAt Rockerz 450 Pro Headphone", "Electronics", 2299, 0.62, 0.78),
    ("Redmi Note 13 Pro 5G", "Electronics", 24999, 0.70, 0.82),
    ("HP 15s Intel i5 Laptop", "Electronics", 52999, 0.45, 0.60),
    ("Boat Airdopes 141", "Electronics", 1299, 0.58, 0.70),
    ("Sony WH-1000XM4 Headphones", "Electronics", 24990, 0.85, 0.90),
    ("Canon EOS 1500D DSLR Camera", "Electronics", 34990, 0.78, 0.85),
    ("Fabindia Cotton Handloom Kurta", "Clothing", 1299, 0.35, 0.45),
    ("W Brand Printed Anarkali Kurti", "Clothing", 899, 0.42, 0.55),
    ("Van Heusen Men Formal Shirt", "Clothing", 1299, 0.65, 0.72),
    ("Levi's 511 Slim Fit Jeans", "Clothing", 2999, 0.75, 0.80),
    ("Allen Solly Regular Fit Shirt", "Clothing", 1099, 0.60, 0.68),
    ("Bata Men's Formal Lace-Up Shoes", "Footwear", 1999, 0.50, 0.65),
    ("Nike Air Max 270 Running Shoes", "Footwear", 9995, 0.80, 0.88),
    ("Puma Women Sports Shoes", "Footwear", 2499, 0.72, 0.75),
    ("Woodland Men Leather Boots", "Footwear", 4499, 0.68, 0.74),
    ("Atomic Habits - James Clear", "Books", 449, 0.95, 0.92),
    ("Rich Dad Poor Dad", "Books", 299, 0.98, 0.95),
    ("The Alchemist - Paulo Coelho", "Books", 250, 0.96, 0.93),
    ("Prestige 5L Pressure Cooker", "Home", 1899, 0.70, 0.75),
    ("Philips Air Fryer HD9200", "Home", 6999, 0.82, 0.85),
    ("Milton Thermosteel Flip Lid Flask", "Home", 799, 0.78, 0.80),
    ("Borosil Glass Water Bottle", "Home", 499, 0.85, 0.88),
    ("Lakme Absolute Matte Lipstick", "Beauty", 650, 0.60, 0.70),
    ("Maybelline Fit Me Foundation", "Beauty", 485, 0.55, 0.65),
    ("Mama Earth Onion Hair Oil", "Beauty", 349, 0.75, 0.78),
    ("WOW Skin Science Apple Cider Shampoo", "Beauty", 499, 0.72, 0.76),
    ("Cosco Champion Cricket Kit", "Sports", 2499, 0.55, 0.62),
    ("Yonex Mavis 10 Badminton Shuttles", "Sports", 349, 0.88, 0.90),
    ("Boldfit Gym Gloves", "Sports", 399, 0.60, 0.70),
    ("Funskool Monopoly Board Game", "Toys", 899, 0.80, 0.82),
    ("LEGO Classic Creative Bricks", "Toys", 2499, 0.92, 0.95),
    ("Hamleys Remote Control Car", "Toys", 1299, 0.65, 0.72),
    ("Redmi Smart TV 43 inch", "Electronics", 26999, 0.60, 0.78),
    ("Whirlpool 1.5 Ton Split AC", "Electronics", 32990, 0.52, 0.68),
    ("Raymond Premium Suit Fabric", "Clothing", 2499, 0.45, 0.50),
    ("Pepe Jeans Slim Fit Chinos", "Clothing", 1799, 0.65, 0.70),
    ("Crocs Classic Clogs", "Footwear", 3499, 0.78, 0.82),
    ("Sparx Men's Running Shoes", "Footwear", 999, 0.55, 0.60),
    ("The Psychology of Money", "Books", 399, 0.97, 0.94),
    ("Pigeon Non-Stick Dosa Tawa", "Home", 599, 0.72, 0.76),
    ("Kent RO Water Purifier 8L", "Home", 14999, 0.68, 0.75),
    ("Himalaya Face Wash Purifying Neem", "Beauty", 180, 0.82, 0.85),
    ("Noise ColorFit Ultra 3 Smart Watch", "Electronics", 4499, 0.58, 0.72),
    ("Fire-Boltt Phoenix Pro Smart Watch", "Electronics", 1999, 0.50, 0.65),
    ("Wildcraft Rucksack 45 Litre", "Sports", 2299, 0.70, 0.75),
    ("Rabaul UNO Classic Card Game", "Toys", 299, 0.85, 0.88),
    ("Usha Garment Steamer 1100W", "Home", 1799, 0.65, 0.72),
    ("Syska LED Smart Bulb 9W", "Electronics", 349, 0.75, 0.80),
]

CUSTOMER_NAMES = [
    "Rahul Sharma", "Priya Patel", "Arjun Singh", "Sneha Reddy", "Vikram Gupta",
    "Anita Desai", "Rohit Verma", "Kavita Nair", "Suresh Kumar", "Meena Joshi",
    "Aditya Bansal", "Pooja Mehta", "Kiran Rao", "Deepak Chaudhary", "Sunita Tiwari",
    "Rajesh Iyer", "Nandini Pillai", "Amit Agarwal", "Swati Bhatt", "Gaurav Malhotra",
]

SELLER_NAMES = [
    "TechZone India Pvt Ltd", "FashionHub Retail", "HomeComfort Store",
    "BookWorld Online", "SportsFit India", "BeautyGlow Cosmetics",
    "ElectroKing Wholesale", "StyleVilla Fashion", "KidZone Toys",
    "QuickShop India",
]

REASONS = {
    "Critical": [
        "Description severely mismatches customer expectations",
        "Product images do not reflect actual item",
        "Size information completely absent",
        "Technical specs inaccurate in listing",
    ],
    "High": [
        "Product description lacks key specifications",
        "Image quality too low — colors appear different",
        "No size guide available for this product",
        "Pricing significantly above market rate",
    ],
    "Medium": [
        "Description could be more detailed",
        "Review sentiment shows moderate dissatisfaction",
        "Shipping time exceeds stated delivery window",
        "Missing warranty information",
    ],
    "Low": [
        "Minor description improvement possible",
        "Good listing quality — low return risk",
        "Strong review score and detailed description",
        "Well-optimized product listing",
    ],
}


def _build_mock_orders() -> List[Dict[str, Any]]:
    """Generate 50 deterministic mock orders."""
    rng = random.Random(2024)
    orders = []
    base_date = datetime.now() - timedelta(days=60)

    for i, (name, category, price, desc_q, img_q) in enumerate(PRODUCTS):
        order_date = base_date + timedelta(days=rng.randint(0, 60))
        avg_review = rng.uniform(2.8, 4.8)
        seller_rating = rng.uniform(3.0, 5.0)
        review_count = rng.randint(5, 2800)

        # Compute risk score using heuristics
        from app.models.return_predictor import CATEGORY_RISK
        cat_risk = CATEGORY_RISK.get(category, 0.45)
        import numpy as np
        raw_risk = (
            cat_risk * 0.35
            + (1 - desc_q) * 0.25
            + (1 - img_q) * 0.20
            + (1 - avg_review / 5) * 0.15
            + min(price / 50000, 1.0) * 0.05
        )
        risk_score = round(float(np.clip(raw_risk * 100, 5, 95)), 1)

        if risk_score >= 75:
            risk_level = "Critical"
        elif risk_score >= 55:
            risk_level = "High"
        elif risk_score >= 35:
            risk_level = "Medium"
        else:
            risk_level = "Low"

        picsum_seed = (i + 1) * 17
        orders.append({
            "order_id": f"ORD-2024-{1000 + i:04d}",
            "product_name": name,
            "category": category,
            "price": price,
            "risk_score": risk_score,
            "risk_level": risk_level,
            "reason": rng.choice(REASONS[risk_level]),
            "customer_name": rng.choice(CUSTOMER_NAMES),
            "seller_name": rng.choice(SELLER_NAMES),
            "order_date": order_date.strftime("%Y-%m-%d"),
            "image_url": f"https://picsum.photos/seed/{picsum_seed}/400/400",
            "description_quality_score": round(desc_q * 100, 1),
            "review_sentiment_score": round((avg_review - 1) / 4 * 100, 1),
            "avg_review_score": round(avg_review, 1),
            "review_count": review_count,
            "seller_rating": round(seller_rating, 1),
            "days_to_delivery": rng.randint(1, 10),
            "fix_applied": False,
        })

    return orders


# Build mock data once at import
_MOCK_ORDERS = _build_mock_orders()
_ORDER_MAP: Dict[str, Dict] = {o["order_id"]: o for o in _MOCK_ORDERS}


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("")
async def list_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    risk_level: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
) -> Dict[str, Any]:
    """Paginated, filterable order list."""
    orders = _MOCK_ORDERS.copy()

    if risk_level:
        orders = [o for o in orders if o["risk_level"].lower() == risk_level.lower()]
    if category:
        orders = [o for o in orders if o["category"].lower() == category.lower()]
    if search:
        s = search.lower()
        orders = [
            o for o in orders
            if s in o["product_name"].lower()
            or s in o["order_id"].lower()
            or s in o["customer_name"].lower()
        ]

    total = len(orders)
    total_pages = math.ceil(total / limit)
    start = (page - 1) * limit
    end = start + limit

    return {
        "data": orders[start:end],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1,
        },
        "filters_applied": {
            "risk_level": risk_level,
            "category": category,
            "search": search,
        },
    }


@router.get("/{order_id}")
async def get_order(order_id: str) -> Dict[str, Any]:
    """Get a single order by ID."""
    order = _ORDER_MAP.get(order_id)
    if not order:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")
    return order


@router.get("/{order_id}/analysis")
async def get_order_analysis(order_id: str) -> Dict[str, Any]:
    """Full ML analysis for a single order."""
    order = _ORDER_MAP.get(order_id)
    if not order:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")

    return _build_full_analysis(order)


@router.post("/{order_id}/fix")
async def apply_fix(order_id: str, fix_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Mark a fix as applied to an order (updates description / image quality)."""
    if order_id not in _ORDER_MAP:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")

    order = _ORDER_MAP[order_id]
    prev_risk = order["risk_score"]
    order["fix_applied"] = True
    order["description_quality_score"] = min(order["description_quality_score"] + 20, 95)
    order["risk_score"] = max(order["risk_score"] - 18, 5)
    if order["risk_score"] < 35:
        order["risk_level"] = "Low"
    elif order["risk_score"] < 55:
        order["risk_level"] = "Medium"

    return {
        "status": "fix_applied",
        "order_id": order_id,
        "previous_risk_score": prev_risk,
        "new_risk_score": order["risk_score"],
        "new_risk_level": order["risk_level"],
        "estimated_return_reduction": round((prev_risk - order["risk_score"]) * 0.6, 1),
        "message": "Fix applied successfully. Description quality improved.",
    }


# ---------------------------------------------------------------------------
# Analysis builder
# ---------------------------------------------------------------------------

def _build_full_analysis(order: Dict[str, Any]) -> Dict[str, Any]:
    rng = random.Random(hash(order["order_id"]))
    category = order["category"]
    risk_score = order["risk_score"]

    # ---- Description analysis ----
    desc_issues = []
    if category in ["Clothing", "Footwear"]:
        desc_issues.append({"type": "missing_size_info", "description": "No size guide in description", "severity": "High"})
        desc_issues.append({"type": "missing_material", "description": "Fabric composition not mentioned", "severity": "Medium"})
    if order["description_quality_score"] < 60:
        desc_issues.append({"type": "too_short", "description": "Description is under 150 characters", "severity": "High"})
    if category == "Electronics":
        desc_issues.append({"type": "missing_specs", "description": "Key specs not highlighted", "severity": "High"})

    mismatch_score = round(rng.uniform(0.15, 0.75 if risk_score > 60 else 0.40), 3)

    description_analysis = {
        "original": f"Buy the amazing {order['product_name']}. Great quality product. Fast delivery.",
        "issues": desc_issues,
        "improved": (
            f"✨ {order['product_name']} — Premium Quality | Fast Delivery\n\n"
            f"🔹 Category: {category}\n"
            f"🔹 Seller: {order['seller_name']}\n"
            f"🔹 Customer Rating: {order['avg_review_score']}/5 ({order['review_count']:,} reviews)\n\n"
            "📦 What's in the Box: 1x Product, 1x User Manual, 1x Warranty Card\n"
            "🛡️ Warranty: 1 Year Manufacturer Warranty\n"
            "🚚 Free delivery on orders above ₹499"
        ),
        "mismatch_score": mismatch_score,
    }

    # ---- Image analysis ----
    img_score = order.get("description_quality_score", 70)
    image_issues = []
    image_recs = []
    if img_score < 60:
        image_issues.extend(["low_resolution", "low_contrast"])
        image_recs.extend([
            "Upload images at 1000×1000 px minimum",
            "Use a plain white background",
        ])
    elif img_score < 75:
        image_issues.append("wrong_aspect_ratio")
        image_recs.append("Crop to 1:1 square ratio for marketplace compliance")

    image_analysis = {
        "score": round(img_score, 1),
        "issues": image_issues,
        "recommendations": image_recs,
        "metrics": {
            "brightness": round(rng.uniform(100, 200), 1),
            "contrast": round(rng.uniform(30, 80), 1),
            "blur_score": round(rng.uniform(120, 400), 1),
            "aspect_ratio": round(rng.uniform(0.9, 1.1), 3),
        },
    }

    # ---- Sentiment analysis ----
    positive_pct = round(rng.uniform(55, 85) if risk_score < 60 else rng.uniform(30, 55), 1)
    negative_pct = round(rng.uniform(5, 20) if risk_score < 60 else rng.uniform(20, 40), 1)
    neutral_pct = round(100 - positive_pct - negative_pct, 1)

    complaints_pool = [
        "Product smaller than expected",
        "Color different from images",
        "Poor packaging on delivery",
        "Size runs small",
        "Quality not matching price",
        "Description misleading",
        "Arrived with missing accessories",
    ]

    word_cloud = [
        {"text": w, "value": rng.randint(5, 50)}
        for w in ["quality", "size", "color", "delivery", "packaging", "value", "material", "fit", "brand", "return"]
    ]

    sentiment_analysis = {
        "positive_pct": positive_pct,
        "negative_pct": negative_pct,
        "neutral_pct": max(0.0, neutral_pct),
        "top_complaints": rng.sample(complaints_pool, k=min(3, len(complaints_pool))),
        "word_cloud_data": word_cloud,
        "review_count": order["review_count"],
        "avg_score": order["avg_review_score"],
    }

    # ---- AI suggestions ----
    from app.models.llm_suggestions import LLMSuggestionEngine
    engine = LLMSuggestionEngine()
    analysis_ctx = {
        "description_analysis": description_analysis,
        "image_analysis": image_analysis,
        "overall_risk_score": risk_score,
        "category": category,
    }
    suggestions_raw = engine.generate_suggestions(analysis_ctx)
    ai_suggestions = {"items": suggestions_raw}

    return {
        "order_id": order["order_id"],
        "product_name": order["product_name"],
        "category": category,
        "description_analysis": description_analysis,
        "image_analysis": image_analysis,
        "sentiment_analysis": sentiment_analysis,
        "ai_suggestions": ai_suggestions,
        "overall_risk_score": risk_score,
        "risk_level": order["risk_level"],
        "generated_at": datetime.utcnow().isoformat(),
    }
