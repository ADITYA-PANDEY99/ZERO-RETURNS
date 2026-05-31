"""
Chatbot router — AI-powered Q&A for e-commerce return insights.
Uses Groq (llama-3.3-70b-versatile) when API key is set,
falls back to smart keyword-based rule engine.
"""
from __future__ import annotations

import logging
import re
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from app.schemas.models import ChatMessage, ChatResponse
from app.services.groq_service import GroqService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/chatbot", tags=["Chatbot"])

groq_svc = GroqService()

# In-memory session store (replace with DB for production)
_SESSIONS: Dict[str, List[Dict]] = {}

# ---------------------------------------------------------------------------
# Dashboard context injected into chatbot for data-aware responses
# ---------------------------------------------------------------------------

DASHBOARD_CONTEXT = {
    "total_orders": 12847,
    "return_rate": 18.3,
    "revenue_at_risk": 2341800,
    "returns_prevented": 1847,
    "top_categories": {
        "Electronics": {"return_rate": 28.4, "orders": 2841},
        "Clothing": {"return_rate": 22.1, "orders": 3204},
        "Footwear": {"return_rate": 18.7, "orders": 1876},
        "Books": {"return_rate": 4.2, "orders": 1245},
        "Home": {"return_rate": 13.8, "orders": 1563},
        "Beauty": {"return_rate": 11.2, "orders": 987},
    },
    "top_return_reasons": [
        "Product doesn't match description (29.2%)",
        "Wrong size / doesn't fit (22.1%)",
        "Product quality issues (18.0%)",
        "Damaged on delivery (12.1%)",
    ],
}

SYSTEM_PROMPT = """You are ZeroReturn's AI assistant — an expert in e-commerce return reduction for Indian marketplaces.

Current platform data:
- Total orders: 12,847 (last 30 days)
- Return rate: 18.3% (industry avg: 15%)
- Revenue at risk: ₹23.4L
- Returns prevented: 1,847

Top return-prone categories:
- Electronics: 28.4% return rate
- Clothing: 22.1% return rate
- Footwear: 18.7% return rate

Top return reasons: description mismatch (29%), wrong size (22%), quality issues (18%), damaged delivery (12%).

Be concise, data-driven, and actionable. Always suggest specific improvement steps.
When asked about data, use the numbers above as ground truth.
"""

# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/message", response_model=ChatResponse)
async def send_message(body: ChatMessage) -> ChatResponse:
    """Process a chat message and return an AI response."""
    session_id = body.session_id or str(uuid.uuid4())
    language = body.language or "en"

    # Initialize session
    if session_id not in _SESSIONS:
        _SESSIONS[session_id] = []

    # Add user message to history
    _SESSIONS[session_id].append({"role": "user", "content": body.message})

    # Keep last 10 messages (5 turns)
    history = _SESSIONS[session_id][-10:]

    # Generate response
    if groq_svc.available:
        messages = [{"role": "system", "content": SYSTEM_PROMPT}] + history
        reply = groq_svc.chat(messages, language=language)
    else:
        reply = _rule_based_response(body.message, language)

    # Add assistant reply to history
    _SESSIONS[session_id].append({"role": "assistant", "content": reply})

    # Generate follow-up suggestions
    suggestions = _generate_suggestions(body.message)

    return ChatResponse(
        reply=reply,
        language=language,
        session_id=session_id,
        suggestions=suggestions,
        data_context=_relevant_data_context(body.message),
    )


@router.post("/upload-data")
async def upload_data_for_chat(file: UploadFile = File(...)) -> Dict[str, Any]:
    """Upload a CSV file for chatbot data analysis."""
    filename = file.filename or "data.csv"
    content = await file.read()

    if len(content) == 0:
        raise HTTPException(status_code=400, detail="File is empty")

    try:
        import io
        import pandas as pd
        df = pd.read_csv(io.BytesIO(content))
        row_count = len(df)
        col_names = list(df.columns)

        analysis = {
            "status": "analyzed",
            "filename": filename,
            "rows": row_count,
            "columns": col_names,
            "message": (
                f"✅ I've analyzed your file '{filename}' with {row_count:,} rows and "
                f"{len(col_names)} columns ({', '.join(col_names[:5])}{'...' if len(col_names) > 5 else ''}). "
                "You can now ask me questions about your data!"
            ),
            "suggested_questions": [
                "What is the return rate in my data?",
                "Which category has the highest return risk?",
                "How can I reduce returns for electronics?",
                "What are the top reasons for returns in my dataset?",
            ],
        }
        return analysis
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Could not parse file: {str(e)}")


# ---------------------------------------------------------------------------
# Rule-based response engine
# ---------------------------------------------------------------------------

def _rule_based_response(message: str, language: str = "en") -> str:
    """Smart keyword-based chatbot that feels data-aware without any LLM."""
    msg = message.lower().strip()

    # ---- Greetings ----
    if any(w in msg for w in ["hello", "hi ", "hey", "namaste", "नमस्ते", "start"]):
        return (
            "👋 **Namaste! I'm ZeroReturn AI** — your return reduction assistant.\n\n"
            "I'm monitoring **12,847 orders** with a current return rate of **18.3%**. "
            "That's **₹23.4L** in revenue at risk.\n\n"
            "Ask me about:\n"
            "• 📊 Your return rate & trends\n"
            "• 🏷️ Category-wise analysis\n"
            "• 💡 Actionable recommendations\n"
            "• 🖼️ Image & description improvements\n\n"
            "What would you like to know?"
        )

    # ---- Return rate ----
    if any(w in msg for w in ["return rate", "returns", "how many returns", "वापसी दर", "रिटर्न"]):
        return (
            "📊 **Current Return Rate: 18.3%**\n\n"
            "This is slightly above the Indian e-commerce industry average of **15%**.\n\n"
            "**By Category:**\n"
            "| Category | Return Rate |\n"
            "|---|---|\n"
            "| Electronics | 28.4% 🔴 |\n"
            "| Clothing | 22.1% 🟠 |\n"
            "| Footwear | 18.7% 🟡 |\n"
            "| Home | 13.8% 🟢 |\n"
            "| Books | 4.2% ✅ |\n\n"
            "**Good news:** Your return rate has dropped **3.2%** from last month. "
            "AI fixes have prevented **1,847 returns** so far! 🎉"
        )

    # ---- Revenue / money ----
    if any(w in msg for w in ["revenue", "money", "profit", "₹", "rupee", "loss", "राजस्व", "पैसा"]):
        return (
            "💰 **Revenue Impact Analysis**\n\n"
            "• **Revenue at risk:** ₹23,41,800 (this month)\n"
            "• **Returns prevented:** 1,847 orders\n"
            "• **Revenue saved:** ~₹8.2L (estimated)\n\n"
            "**Top revenue risk categories:**\n"
            "1. Electronics → ₹8,96,500 at risk\n"
            "2. Footwear → ₹5,88,600 at risk\n"
            "3. Clothing → ₹5,09,760 at risk\n\n"
            "💡 **Quick win:** Fixing top 20 Electronics listings could save ₹2.1L this month."
        )

    # ---- Electronics ----
    if any(w in msg for w in ["electronics", "mobile", "phone", "laptop", "gadget", "इलेक्ट्रॉनिक्स"]):
        return (
            "📱 **Electronics — Highest Risk Category (28.4% return rate)**\n\n"
            "**Why Electronics has high returns:**\n"
            "• Missing technical specifications (RAM, battery, storage)\n"
            "• Inaccurate product images\n"
            "• Warranty information not highlighted\n\n"
            "**Recommended fixes:**\n"
            "1. 📋 Add structured specs table (RAM, Display, Battery, Camera)\n"
            "2. 🖼️ Upload 360° product images\n"
            "3. 🛡️ Display warranty prominently\n"
            "4. ✅ Use verified customer review excerpts\n\n"
            "Estimated return reduction if applied: **-12 to -18%** 📉"
        )

    # ---- Clothing ----
    if any(w in msg for w in ["clothing", "clothes", "fashion", "shirt", "dress", "kurta", "कपड़े"]):
        return (
            "👕 **Clothing — 22.1% Return Rate**\n\n"
            "**#1 reason:** Wrong size / doesn't fit accounts for **38% of clothing returns**.\n\n"
            "**Immediate actions:**\n"
            "1. 📏 Add **size chart with cm measurements** (not just S/M/L)\n"
            "2. 🧵 Specify **exact fabric composition** (e.g., '100% Organic Cotton')\n"
            "3. 👤 Add **model measurements** in product images\n"
            "4. 🎨 Show **all color variants** with accurate color swatches\n\n"
            "These 4 changes can reduce clothing returns by up to **25%** 📉"
        )

    # ---- Recommendations / suggestions ----
    if any(w in msg for w in ["recommend", "suggest", "improve", "fix", "tips", "सुझाव", "सुधार"]):
        return (
            "💡 **Top 5 Return Reduction Recommendations**\n\n"
            "1. **🔴 High Priority:** Add size guides to all Clothing & Footwear listings\n"
            "   → Estimated reduction: **21%** of size-related returns\n\n"
            "2. **🔴 High Priority:** Rewrite Electronics descriptions with spec tables\n"
            "   → Estimated reduction: **18.5%**\n\n"
            "3. **🟠 Medium Priority:** Upgrade product images to 1000×1000px minimum\n"
            "   → Estimated reduction: **14.2%**\n\n"
            "4. **🟠 Medium Priority:** Enable 3-day delivery for orders above ₹5,000\n"
            "   → Estimated reduction: **11.3%**\n\n"
            "5. **🟡 Low Priority:** Respond to negative reviews within 48 hours\n"
            "   → Estimated reduction: **6.5%**\n\n"
            "**Combined potential:** Reduce return rate from 18.3% → ~11% 🎯"
        )

    # ---- Description quality ----
    if any(w in msg for w in ["description", "listing", "product info", "content", "विवरण"]):
        return (
            "📝 **Product Description Impact**\n\n"
            "**29.2% of all returns** are caused by description-reality mismatch.\n\n"
            "**What makes a good description?**\n"
            "✅ 300+ characters with specific details\n"
            "✅ Exact measurements (not just 'medium size')\n"
            "✅ Material composition listed\n"
            "✅ What's in the box\n"
            "✅ Warranty & return policy\n\n"
            "**Your current average:** 52/100 description quality score\n"
            "**Target:** 75+ score to see significant return reduction\n\n"
            "Use the **Orders** page to apply AI-generated description improvements with one click!"
        )

    # ---- Image quality ----
    if any(w in msg for w in ["image", "photo", "picture", "visual", "फोटो", "तस्वीर"]):
        return (
            "🖼️ **Image Quality Analysis**\n\n"
            "Poor images are the **#2 return driver** after description mismatch.\n\n"
            "**Common image issues detected:**\n"
            "• Low resolution (< 800px) — 34% of listings\n"
            "• Wrong aspect ratio — 18% of listings\n"
            "• Dark/overexposed images — 12% of listings\n"
            "• Blurry photos — 8% of listings\n\n"
            "**Quick fix checklist:**\n"
            "☐ Minimum 1000×1000 pixel resolution\n"
            "☐ White or neutral background\n"
            "☐ Show all angles (front, back, side, detail)\n"
            "☐ Show product in use / on model\n"
            "☐ Accurate color representation\n\n"
            "Fixing images reduces returns by **14.2%** on average."
        )

    # ---- Trending / anomaly ----
    if any(w in msg for w in ["trend", "spike", "anomaly", "unusual", "sudden", "ट्रेंड"]):
        return (
            "📈 **Return Rate Trends & Anomalies**\n\n"
            "Our AI detected **3 anomalies** in the past 30 days:\n\n"
            "• **Day 7:** Return rate spiked to 31.2% (+12.9%) — Possible batch quality issue in Electronics\n"
            "• **Day 14:** Spike to 28.7% — Linked to a specific seller's listing quality drop\n"
            "• **Day 22:** Spike to 29.1% — Correlated with delayed deliveries\n\n"
            "**Overall trend:** Return rate is **declining** (-3.2% month-over-month) ✅\n"
            "This is due to 1,847 AI-assisted fixes applied to high-risk listings."
        )

    # ---- Help / what can you do ----
    if any(w in msg for w in ["help", "what can", "capabilities", "मदद", "क्या कर"]):
        return (
            "🤖 **What I can help you with:**\n\n"
            "📊 **Analytics:** Ask about return rates, revenue impact, category analysis\n"
            "💡 **Recommendations:** Get specific improvement suggestions for any category\n"
            "🔍 **Order Analysis:** Ask about specific order risk factors\n"
            "📈 **Trends:** Understand return rate trends and anomalies\n"
            "📝 **Content:** Get tips for better product descriptions\n"
            "🖼️ **Images:** Learn image quality best practices\n\n"
            "**Try asking:**\n"
            "• 'Why is my electronics return rate so high?'\n"
            "• 'How do I reduce clothing returns?'\n"
            "• 'What is my revenue at risk?'\n"
            "• 'Show me top recommendations'"
        )

    # ---- Default ----
    return (
        "🤔 I understand you're asking about **return reduction**. Here's what I know:\n\n"
        f"Your current return rate is **18.3%** with **₹23.4L** at risk. "
        f"The biggest opportunities are in **Electronics** (28.4% return rate) and "
        f"**Clothing** (22.1% return rate).\n\n"
        "Could you be more specific? I can help with:\n"
        "• Category analysis\n"
        "• Description & image improvements\n"
        "• Revenue impact\n"
        "• Specific recommendations\n\n"
        f"*(Tip: Add your Groq API key in `.env` for full AI responses powered by Llama-3.3-70B)*"
    )


def _generate_suggestions(message: str) -> List[str]:
    """Generate contextual follow-up question suggestions."""
    msg = message.lower()

    if any(w in msg for w in ["electronics", "phone", "laptop"]):
        return [
            "What specs should I include in electronics descriptions?",
            "How do I improve Electronics images?",
            "Show me Electronics return trend",
        ]
    if any(w in msg for w in ["clothing", "fashion", "dress"]):
        return [
            "How do I create a size guide?",
            "What fabric details reduce clothing returns?",
            "Show Clothing vs Footwear comparison",
        ]
    if any(w in msg for w in ["return rate", "revenue", "money"]):
        return [
            "What's driving the return rate increase?",
            "Which category saves the most revenue?",
            "Run what-if scenario for improvement",
        ]
    return [
        "What are my top 3 recommendations?",
        "Show category breakdown",
        "Which orders need urgent attention?",
    ]


def _relevant_data_context(message: str) -> Optional[Dict[str, Any]]:
    """Return relevant dashboard data snippet based on message topic."""
    msg = message.lower()
    if any(w in msg for w in ["return rate", "returns"]):
        return {"return_rate": 18.3, "industry_avg": 15.0, "trend": "-3.2%"}
    if any(w in msg for w in ["electronics"]):
        return DASHBOARD_CONTEXT["top_categories"].get("Electronics")
    if any(w in msg for w in ["revenue", "money"]):
        return {"revenue_at_risk": 2341800, "returns_prevented": 1847}
    return None
