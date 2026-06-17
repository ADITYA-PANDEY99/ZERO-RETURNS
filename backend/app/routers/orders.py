"""
Orders router — paginated order list, single order details, full ML analysis,
and fix-applied endpoint.
50 realistic mock orders with Indian e-commerce data.

FIX 2+3 (2026-06-17): _build_full_analysis() now calls the real NLPAnalyzer
and ImageScorer models from app.state (initialized in main.py lifespan).
Each order has a real, varied product description that the NLP model analyzes.
"""
from __future__ import annotations

import math
import random
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import JSONResponse
from app.schemas.models import SHAPExplanationResponse


router = APIRouter(prefix="/orders", tags=["Orders"])

# ---------------------------------------------------------------------------
# Real, varied product descriptions (NLPAnalyzer will analyze these)
# These differ intentionally: some are poor quality (short, vague, missing
# key info), some are excellent — so the NLP analysis varies between orders.
# ---------------------------------------------------------------------------

PRODUCT_DESCRIPTIONS: Dict[str, str] = {
    "Samsung Galaxy M34 5G 128GB": (
        "Good phone. Buy now."
    ),
    "OnePlus Nord CE 3 Lite 5G": (
        "OnePlus Nord CE 3 Lite 5G with 108MP camera, 5000mAh battery, "
        "6.72\" AMOLED display, 67W SUPERVOOC charging, 8GB RAM + 128GB storage. "
        "Available in Chromatic Gray and Pastel Lime. 1 Year OnePlus Warranty included."
    ),
    "boAt Rockerz 450 Pro Headphone": (
        "Nice headphone good for music."
    ),
    "Redmi Note 13 Pro 5G": (
        "Redmi Note 13 Pro 5G | 200MP OIS Camera | 6.67\" CurvedAMOLED 1.5K display | "
        "MediaTek Dimensity 7200-Ultra | 67W Turbo Charge | IP54 Splash Resistant. "
        "Colors: Scarlet Red, Stardust Purple, Midnight Black. 1 year warranty."
    ),
    "HP 15s Intel i5 Laptop": (
        "HP 15s laptop."
    ),
    "Boat Airdopes 141": (
        "boAt Airdopes 141 Truly Wireless Earbuds with 42H Playtime | ENx Technology for Clear Calls | "
        "IPX4 Water Resistant | ASAP Charge | Bluetooth 5.3 | Passive Noise Cancellation. "
        "Available in: Active Black, Mint Green, White Pearl. In-box: Earbuds, charging case, cable, ear tips (S, M, L)."
    ),
    "Sony WH-1000XM4 Headphones": (
        "Sony WH-1000XM4 Industry Leading Noise Canceling Wireless Headphones | "
        "30hr battery life | Alexa built-in | multi-device pairing | "
        "Speak-to-Chat auto pause | 360 Reality Audio | High Resolution Audio with DSEE Extreme. "
        "Available in Black and Silver. Includes headphones, carry case, USB-C cable, 3.5mm audio cable, "
        "noise canceling headphone plug adapter, and airplane adapter. 1 Year Sony India Warranty."
    ),
    "Canon EOS 1500D DSLR Camera": (
        "Canon EOS 1500D 24.1MP Digital SLR Camera (Black) with EF-S18-55mm f/3.5-5.6 IS II lens. "
        "Includes: Camera body, EF-S 18-55mm f/3.5-5.6 IS II Lens, LP-E10 Battery Pack, "
        "LC-E10 Battery Charger, EW-400D Wide Strap, IFC-600PCU USB Interface Cable. "
        "DIGIC 4+ processor, 9-point autofocus, Full HD video at 30fps. 1 Year Canon India Warranty."
    ),
    "Fabindia Cotton Handloom Kurta": (
        "Kurta. Blue color."
    ),
    "W Brand Printed Anarkali Kurti": (
        "Beautiful printed kurti great for all occasions."
    ),
    "Van Heusen Men Formal Shirt": (
        "Van Heusen Men's Slim Fit Formal Shirt | 60% Cotton 40% Polyester | "
        "Stain Release Technology | Color: Solid Blue | Collar Type: Regular | Sleeve Type: Full Sleeve. "
        "Available Sizes: S (38), M (40), L (42), XL (44), XXL (46) — chest measurement in inches. "
        "Machine washable. 1 Year Van Heusen warranty on manufacturing defects."
    ),
    "Levi's 511 Slim Fit Jeans": (
        "Levi's Men's 511 Slim Fit Jeans | 99% Cotton 1% Elastane | "
        "Rise: Mid Rise | Fit: Slim through thigh and leg | Closure: Zip fly with button. "
        "Color: Dark Indigo. Waist sizes: 30W-40W, Lengths: 30L-34L — refer size chart in images. "
        "Machine wash cold, tumble dry low."
    ),
    "Allen Solly Regular Fit Shirt": (
        "Smart casual shirt. Comfortable."
    ),
    "Bata Men's Formal Lace-Up Shoes": (
        "Leather shoes formal."
    ),
    "Nike Air Max 270 Running Shoes": (
        "Nike Air Max 270 Men's Shoe — Max Air unit in the heel for cushioning. "
        "Breathable mesh upper, foam midsole with rubber outsole. "
        "Upper: Mesh and synthetic leather | Sole: Rubber. "
        "Available in sizes UK 6-12. Color: Black/White/Anthracite. "
        "Refer Nike size chart in product images — runs true to size."
    ),
    "Puma Women Sports Shoes": (
        "Sports shoes pink color for women. Good quality."
    ),
    "Woodland Men Leather Boots": (
        "Woodland Men's Casual Leather Boots | Upper: Full Grain Leather | "
        "Sole: Vulcanized Rubber | Height: Ankle | Closure: Lace-Up. "
        "Color: Dark Brown | Sizes Available: UK 6-12 (refer size chart). "
        "Waterproof upper for outdoor use. Machine Clean: No — wipe with damp cloth."
    ),
    "Atomic Habits - James Clear": (
        "Atomic Habits by James Clear — International Bestseller. "
        "Paperback | Publisher: Penguin Random House | Language: English | "
        "ISBN: 978-1847941831 | Pages: 320 | Weight: 318g. "
        "A proven framework for improving every day. This book will reshape the way you think about "
        "progress and success, and give you the tools and strategies you need to transform your habits."
    ),
    "Rich Dad Poor Dad": (
        "Rich Dad Poor Dad by Robert T. Kiyosaki — #1 Personal Finance book. "
        "Paperback | Publisher: Plata Publishing | Language: English | Pages: 226. "
        "What the rich teach their kids about money that the poor and middle class do not."
    ),
    "The Alchemist - Paulo Coelho": (
        "The Alchemist by Paulo Coelho — A Fable About Following Your Dream. "
        "Paperback | Publisher: HarperOne | ISBN: 978-0062315007 | Pages: 208. "
        "A special 25th anniversary edition of the extraordinary international bestseller."
    ),
    "Prestige 5L Pressure Cooker": (
        "Pressure cooker 5L. Good for cooking."
    ),
    "Philips Air Fryer HD9200": (
        "Philips Essential Airfryer HD9200/90 | 1400W | 4.1L | Rapid Air Technology | "
        "Up to 90% less fat vs deep frying | Temperature range: 80-200°C | "
        "Timer: up to 60 min | Dishwasher-safe basket and drawer. "
        "In-box: 1 Air Fryer HD9200, 1 Basket, 1 Drawer. Voltage: 220-240V 50/60Hz. "
        "2 Year Philips India Warranty."
    ),
    "Milton Thermosteel Flip Lid Flask": (
        "Milton Thermosteel Flip Lid Flask 1 Litre, 1 Piece, Silver. "
        "Material: Stainless Steel (food grade) | Double wall insulation | "
        "Keeps hot 24 hours / cold 24 hours | Capacity: 1000ml | "
        "BPA Free | Easy flip lid with press button. Dishwasher safe."
    ),
    "Borosil Glass Water Bottle": (
        "Borosil glass bottle. 500ml."
    ),
    "Lakme Absolute Matte Lipstick": (
        "Lakme lipstick matte finish."
    ),
    "Maybelline Fit Me Foundation": (
        "Maybelline New York Fit Me Matte + Poreless Foundation | 30ml | "
        "Shade: 120 Classic Ivory (for light to fair skin with cool pink undertones). "
        "Oil-free formula, blurs pores, natural matte finish. "
        "Shade range: 20 shades available. SPF 22. Suitable for normal to oily skin. "
        "Dermatologist tested."
    ),
    "Mama Earth Onion Hair Oil": (
        "Mamaearth Onion Hair Oil with Onion & Redensyl for Hair Fall Control | 250ml. "
        "Key Ingredients: Onion Oil, Redensyl, Bhringraj Oil, Castor Oil. "
        "Toxin-free | Made Safe Certified | Dermatologically Tested. "
        "How to use: Apply on scalp and hair, massage for 10 mins, leave for 1-2 hrs, wash."
    ),
    "WOW Skin Science Apple Cider Shampoo": (
        "WOW Apple Cider Vinegar Shampoo with DHT Blocker | Sulfate Free | 300ml. "
        "Contains: Apple Cider Vinegar, Saw Palmetto (DHT blocker), Nettle Leaf Extract. "
        "Benefits: Balances scalp pH, removes buildup, reduces hair fall. "
        "Suitable for: All hair types, color-treated hair safe. No Parabens, Sulfates, or Silicones."
    ),
    "Cosco Champion Cricket Kit": (
        "Cricket kit junior."
    ),
    "Yonex Mavis 10 Badminton Shuttles": (
        "Yonex Mavis 10 Nylon Shuttlecock | Pack of 6 | Speed: Medium (Yellow Feather) | "
        "Suitable for: Recreational and intermediate play | "
        "Durable nylon skirt ensures consistent flight | "
        "Temperature Range: 17-23°C for Medium speed. "
        "Compliant with BWF regulations for leisure play."
    ),
    "Boldfit Gym Gloves": (
        "Gym gloves for workout. Good grip."
    ),
    "Funskool Monopoly Board Game": (
        "Funskool Monopoly Classic Board Game | Age: 8+ | Players: 2-8. "
        "Includes: Gameboard, 6 Tokens, 32 Houses, 12 Hotels, 2 Dice, Chance & Community Chest Cards, "
        "Title Deed Cards, Money Pack, Banker's Tray. "
        "Complete rules included. Language: English. Made in India."
    ),
    "LEGO Classic Creative Bricks": (
        "LEGO Classic Creative Bricks 10692 | 221 Pieces | Ages 4+ | "
        "Contains classic bricks and special elements in 29 different colors. "
        "Brick sizes: 1x1, 1x2, 2x2, 2x4 and more. "
        "Instruction booklet with 3 building ideas included. "
        "Compatible with all LEGO Classic and Duplo sets. CE Certified, BPA-free."
    ),
    "Hamleys Remote Control Car": (
        "RC car toy. Remote control."
    ),
    "Redmi Smart TV 43 inch": (
        "Redmi Smart TV 43 inch Full HD."
    ),
    "Whirlpool 1.5 Ton Split AC": (
        "Whirlpool 1.5 Ton 3 Star Inverter Split AC (Magicool Pro, White). "
        "Capacity: 1.5 Ton | Star Rating: 3 Star | Type: Inverter | "
        "Copper Condenser | Auto Restart | Anti-Bacteria Filter | PM 2.5 Filter | "
        "ISEER Rating: 3.50 W/W | Annual Energy Consumption: 824.87 units. "
        "Warranty: 1 Year Comprehensive + 5 Year Compressor. "
        "Installation not included — charges apply."
    ),
    "Raymond Premium Suit Fabric": (
        "Fabric only, no stitching."
    ),
    "Pepe Jeans Slim Fit Chinos": (
        "Pepe Jeans Men's Slim Fit Chinos | 98% Cotton 2% Elastane | "
        "Color: Khaki | Rise: Mid-Rise | Closure: Zip fly with button. "
        "Sizes: 28W-36W (refer the Pepe Jeans EU size chart on label). "
        "Machine wash cold, do not tumble dry, iron on low."
    ),
    "Crocs Classic Clogs": (
        "Crocs Unisex-Adult Classic Clogs | Material: Croslite foam | "
        "Pivot heel strap for secure fit | Ventilation ports for breathability | "
        "Lightweight, buoyant, easy to clean. "
        "Sizes: UK M4/W6 to UK M14. Colors: 20+ options. "
        "Note: Crocs sizing — if between sizes, go up. "
        "Machine washable or rinse with mild soap and water."
    ),
    "Sparx Men's Running Shoes": (
        "Running shoes. Black color."
    ),
    "The Psychology of Money": (
        "The Psychology of Money by Morgan Housel | Paperback | "
        "Publisher: Jaico Publishing House | Pages: 256 | ISBN: 9788195623570. "
        "Timeless lessons on wealth, greed, and happiness. "
        "This book explores the strange ways people think about money."
    ),
    "Pigeon Non-Stick Dosa Tawa": (
        "Pigeon Aluminium Non-Stick Flat Tawa, 28cm | 2.4mm thick pressed aluminium body | "
        "Non-stick coating: PFOA free, food safe | Compatible with gas and induction. "
        "Color: Black | Handle: Bakelite stay-cool handle. "
        "Hand wash recommended to preserve coating. Capacity: 28cm diameter."
    ),
    "Kent RO Water Purifier 8L": (
        "KENT Supreme RO + UV + UF + TDS Controller Water Purifier | Storage: 8L | "
        "Purification Capacity: 20L/hour | RO Membrane: 60 GPD | "
        "Suitable for TDS up to 2000 ppm | Electric Pump Included. "
        "Warranty: 1 year comprehensive, 4 year free service for RO membrane and filter. "
        "Installation included (within city limits). Voltage: 220-240V, 50Hz."
    ),
    "Himalaya Face Wash Purifying Neem": (
        "Himalaya Purifying Neem Face Wash | 150ml | "
        "Key Ingredients: Neem (antibacterial), Turmeric (antiseptic). "
        "Skin Type: All skin types | Free from Soap, Alcohol, Paraben. "
        "Dermatologically tested. How to use: Apply on wet face, lather, rinse."
    ),
    "Noise ColorFit Ultra 3 Smart Watch": (
        "Smart watch. Black. Good battery."
    ),
    "Fire-Boltt Phoenix Pro Smart Watch": (
        "Fire-Boltt Phoenix Pro Smart Watch."
    ),
    "Wildcraft Rucksack 45 Litre": (
        "Wildcraft Trident 45L Rucksack Trekking Backpack | "
        "Material: 600D Polyester | Waterproof: Yes (with raincover included) | "
        "Frame: External aluminium frame | Padded hip belt and shoulder straps | "
        "Capacity: 45L | Dimensions: 62x36x18cm | Weight: 1.3kg | "
        "Multiple compartments: Main, secondary, laptop sleeve (fits 15.6\"), two side pockets. "
        "Color: Blue/Black. LIFETIME Wildcraft warranty on manufacturing defects."
    ),
    "Rabaul UNO Classic Card Game": (
        "UNO Classic Card Game | 108 Cards | 2-10 Players | Ages 7+. "
        "Includes: 108 UNO cards and instructions. "
        "Objective: Be the first player to get rid of all your cards."
    ),
    "Usha Garment Steamer 1100W": (
        "Garment steamer."
    ),
    "Syska LED Smart Bulb 9W": (
        "Syska 9W Smart LED Bulb (SSK-SBR-9) | Bluetooth + Wi-Fi | 16 Million Colors | "
        "Compatible with: Alexa, Google Assistant | "
        "Lumens: 900lm | Color Temperature: 2700K-6500K tunable white + RGB | "
        "Base: B22 | Voltage: 220-240V 50Hz | Wattage: 9W. "
        "App: SyskaSmartHome (Android & iOS). 1 Year Syska Warranty."
    ),
}

# Mock reviews per product (used for mismatch scoring)
PRODUCT_REVIEWS: Dict[str, List[str]] = {
    "Samsung Galaxy M34 5G 128GB": [
        "Battery drains in 5 hours despite claims of good battery life",
        "Camera quality is much worse than advertised",
        "Product doesn't match description at all",
    ],
    "Fabindia Cotton Handloom Kurta": [
        "Size runs very small, ordered L got XS",
        "Color completely different from images",
        "No size chart available on listing",
        "Fabric is good quality but sizing is off",
    ],
    "Nike Air Max 270 Running Shoes": [
        "Great cushioning, comfortable for long runs",
        "True to size, fits perfectly as per the size chart",
        "Excellent quality and breathable",
        "Exactly as described, very happy with purchase",
    ],
    "Atomic Habits - James Clear": [
        "Excellent book, exactly as described",
        "Life changing read, great condition",
        "Perfect gift, arrived well packaged",
    ],
    "HP 15s Intel i5 Laptop": [
        "RAM is only 8GB not 16GB as shown",
        "Battery backup very poor, 2 hours only",
        "Missing warranty card in box",
        "Product does not match listing description",
    ],
}

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
    """Generate 50 deterministic mock orders with real product descriptions."""
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
            # Real varied product descriptions for NLP analysis
            "description": PRODUCT_DESCRIPTIONS.get(name, f"{name} — {category} product."),
            # Real product reviews for mismatch scoring
            "reviews": PRODUCT_REVIEWS.get(name, []),
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
async def get_order_analysis(order_id: str, request: Request) -> Dict[str, Any]:
    """Full ML analysis for a single order using real NLP and Image models."""
    order = _ORDER_MAP.get(order_id)
    if not order:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")

    # Get model instances from app state (initialized in main.py lifespan)
    nlp_analyzer = getattr(request.app.state, "nlp_analyzer", None)
    image_scorer = getattr(request.app.state, "image_scorer", None)

    return _build_full_analysis(order, nlp_analyzer=nlp_analyzer, image_scorer=image_scorer)


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


@router.get("/{order_id}/explain", response_model=SHAPExplanationResponse)
async def get_order_explanation(order_id: str) -> SHAPExplanationResponse:
    """Explain return probability risk contributions using SHAP explainer values."""
    if order_id not in _ORDER_MAP:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")
        
    order = _ORDER_MAP[order_id]
    from app.utils.forecasting_engine import SHAPExplainer
    
    res = SHAPExplainer.explain_order(order_id, order)
    return SHAPExplanationResponse(**res)



# ---------------------------------------------------------------------------
# Analysis builder — now uses REAL NLP + Image models
# ---------------------------------------------------------------------------

def _build_full_analysis(
    order: Dict[str, Any],
    nlp_analyzer=None,
    image_scorer=None,
) -> Dict[str, Any]:
    """
    Build full ML analysis for an order.
    Uses NLPAnalyzer.analyze_description() and ImageScorer.score_image() when
    available — both initialized from app.state in main.py.
    Falls back to heuristic analysis if models are not available.
    """
    rng = random.Random(hash(order["order_id"]))
    category = order["category"]
    risk_score = order["risk_score"]

    # ---- Description analysis — REAL NLP model ----
    description = order.get("description", "")
    reviews = order.get("reviews", [])

    if nlp_analyzer and nlp_analyzer.is_ready and description:
        # Call the REAL NLPAnalyzer (TF-IDF cosine similarity + rule-based issue detection)
        nlp_result = nlp_analyzer.analyze_description(
            text=description,
            reviews=reviews,
            category=category,
        )
        description_analysis = {
            "original": description,
            "issues": nlp_result.get("issues", []),
            "improved": nlp_result.get("improved_description", description),
            "mismatch_score": nlp_result.get("mismatch_score", 0.3),
            "quality_score": nlp_result.get("quality_score", 0.7),
            "suggestions": nlp_result.get("suggestions", []),
        }
    else:
        # Heuristic fallback if model not initialized
        desc_issues = []
        if len(description) < 100:
            desc_issues.append({"type": "too_short", "description": "Description is too short (<100 chars).", "severity": "High"})
        if category in ["Clothing", "Footwear"] and "size" not in description.lower():
            desc_issues.append({"type": "missing_size_info", "description": "No sizing information found.", "severity": "High"})
        if category == "Electronics" and not any(w in description.lower() for w in ["warranty", "ram", "battery", "processor"]):
            desc_issues.append({"type": "missing_specs", "description": "Key technical specs not mentioned.", "severity": "High"})
        description_analysis = {
            "original": description,
            "issues": desc_issues,
            "improved": description + "\n\n[AI Fix: Add product specifications, size info, and warranty details.]",
            "mismatch_score": round(rng.uniform(0.15, 0.75 if risk_score > 60 else 0.40), 3),
            "quality_score": round(1 - rng.uniform(0.15, 0.75 if risk_score > 60 else 0.40), 3),
            "suggestions": ["Expand product description with specific measurements and specs."],
        }

    # ---- Image analysis — REAL ImageScorer ----
    image_url = order.get("image_url", "")

    if image_scorer and image_scorer.is_ready and image_url:
        # Call the REAL ImageScorer (Pillow-based: brightness, contrast, blur, resolution)
        img_result = image_scorer.score_image(image_url)
        image_analysis = {
            "score": img_result.get("score", 70.0),
            "issues": img_result.get("issues", []),
            "recommendations": img_result.get("recommendations", []),
            "metrics": img_result.get("metrics", {}),
            "note": img_result.get("note"),  # set when mock fallback was used
        }
    else:
        # Heuristic fallback
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
    # Add real complaints from product reviews if available
    real_complaints = [r for r in reviews if len(r) > 10]
    all_complaints = real_complaints + complaints_pool

    word_cloud = [
        {"text": w, "value": rng.randint(5, 50)}
        for w in ["quality", "size", "color", "delivery", "packaging", "value", "material", "fit", "brand", "return"]
    ]

    sentiment_analysis = {
        "positive_pct": positive_pct,
        "negative_pct": negative_pct,
        "neutral_pct": max(0.0, neutral_pct),
        "top_complaints": rng.sample(all_complaints, k=min(3, len(all_complaints))),
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
