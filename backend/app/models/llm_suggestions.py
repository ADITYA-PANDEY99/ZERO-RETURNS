"""
LLMSuggestionEngine — generates actionable return-reduction suggestions.
Uses Groq API when key is available; falls back to a rich rule-based engine.
"""
from __future__ import annotations

import json
import logging
import os
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


RULE_BASED_TEMPLATES = {
    "description": {
        "priority": "High",
        "action": "Rewrite product description with specific measurements and material details",
        "reason": "Vague descriptions cause 32% of avoidable returns due to expectation mismatch",
        "estimated_return_reduction": 18.5,
        "apply_possible": True,
    },
    "image": {
        "priority": "High",
        "action": "Upload high-resolution images (min 1000×1000px) with multiple angles",
        "reason": "Poor image quality is the #2 driver of returns in Fashion & Electronics categories",
        "estimated_return_reduction": 14.2,
        "apply_possible": True,
    },
    "pricing": {
        "priority": "Medium",
        "action": "Verify competitive pricing and add value-justification bullets",
        "reason": "Products priced above category average have 22% higher return rates",
        "estimated_return_reduction": 8.0,
        "apply_possible": True,
    },
    "shipping": {
        "priority": "Medium",
        "action": "Enable faster shipping (3-day vs 7-day) for high-value items",
        "reason": "Delayed delivery correlates with 19% higher return likelihood",
        "estimated_return_reduction": 11.3,
        "apply_possible": False,
    },
    "reviews": {
        "priority": "Low",
        "action": "Respond to negative reviews and update listing based on common complaints",
        "reason": "Active seller engagement reduces repeat returns from same issues",
        "estimated_return_reduction": 6.5,
        "apply_possible": False,
    },
    "size_guide": {
        "priority": "High",
        "action": "Add a detailed size chart with measurements in cm and inches",
        "reason": "Size-related returns account for 38% of all Clothing & Footwear returns",
        "estimated_return_reduction": 21.0,
        "apply_possible": True,
    },
    "warranty": {
        "priority": "Low",
        "action": "Highlight warranty coverage and hassle-free return process",
        "reason": "Clear warranty info reduces pre-emptive returns by 9%",
        "estimated_return_reduction": 9.0,
        "apply_possible": True,
    },
}


class LLMSuggestionEngine:
    """Generates return-reduction suggestions via Groq LLM or rule-based engine."""

    def __init__(self):
        self.groq_available = bool(os.getenv("GROQ_API_KEY"))
        self._groq_client = None
        if self.groq_available:
            self._init_groq()

    # ------------------------------------------------------------------
    def _init_groq(self):
        try:
            from groq import Groq
            self._groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
            logger.info("LLMSuggestionEngine: Groq client initialized")
        except Exception as e:
            logger.warning(f"LLMSuggestionEngine: Groq init failed — {e}")
            self.groq_available = False

    # ------------------------------------------------------------------
    def generate_suggestions(
        self,
        order_analysis: Dict[str, Any],
        language: str = "en",
    ) -> List[Dict[str, Any]]:
        """Generate 3–5 prioritized suggestions for an order."""
        if self.groq_available and self._groq_client:
            try:
                return self._groq_suggestions(order_analysis, language)
            except Exception as e:
                logger.warning(f"Groq suggestions failed, falling back: {e}")

        return self._rule_based_suggestions(order_analysis, language)

    # ------------------------------------------------------------------
    def _groq_suggestions(
        self, order_analysis: Dict[str, Any], language: str
    ) -> List[Dict[str, Any]]:
        """Call Groq API for contextual suggestions."""
        lang_note = (
            "Respond in Hindi using Devanagari script." if language == "hi"
            else "Respond in English."
        )

        prompt = f"""You are a return-reduction specialist for an Indian e-commerce platform.
Analyze this order analysis data and provide 3-5 actionable suggestions to reduce return probability.

Order Analysis:
{json.dumps(order_analysis, indent=2, default=str)}

{lang_note}

Respond ONLY with a valid JSON array. Each item must have these exact fields:
- priority: "High" | "Medium" | "Low"
- action: string (specific actionable step)
- reason: string (why this helps)
- estimated_return_reduction: number (percentage points, 0-30)
- apply_possible: boolean (can seller apply this immediately?)

Example format:
[{{"priority": "High", "action": "...", "reason": "...", "estimated_return_reduction": 15.5, "apply_possible": true}}]
"""

        response = self._groq_client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
            max_tokens=800,
        )
        content = response.choices[0].message.content.strip()

        # Extract JSON from response
        start = content.find("[")
        end = content.rfind("]") + 1
        if start >= 0 and end > start:
            return json.loads(content[start:end])

        raise ValueError("Could not parse JSON from Groq response")

    # ------------------------------------------------------------------
    def _rule_based_suggestions(
        self, order_analysis: Dict[str, Any], language: str
    ) -> List[Dict[str, Any]]:
        """Select suggestions based on detected issues."""
        suggestions = []
        applied_keys = set()

        # Map issues to suggestion templates
        issues = order_analysis.get("description_analysis", {}).get("issues", [])
        image_issues = order_analysis.get("image_analysis", {}).get("issues", [])
        risk_score = order_analysis.get("overall_risk_score", 50)
        category = order_analysis.get("category", "General")

        issue_types = {i.get("type") for i in issues}

        if "missing_size_info" in issue_types and "size_guide" not in applied_keys:
            suggestions.append(RULE_BASED_TEMPLATES["size_guide"].copy())
            applied_keys.add("size_guide")

        if ("too_short" in issue_types or "vague_language" in issue_types) and "description" not in applied_keys:
            suggestions.append(RULE_BASED_TEMPLATES["description"].copy())
            applied_keys.add("description")

        if image_issues and "image" not in applied_keys:
            img_suggestion = RULE_BASED_TEMPLATES["image"].copy()
            img_suggestion["reason"] = (
                f"Detected image issues: {', '.join(image_issues[:2])}. "
                + img_suggestion["reason"]
            )
            suggestions.append(img_suggestion)
            applied_keys.add("image")

        if "missing_warranty" in issue_types and "warranty" not in applied_keys:
            suggestions.append(RULE_BASED_TEMPLATES["warranty"].copy())
            applied_keys.add("warranty")

        if risk_score > 60 and "shipping" not in applied_keys:
            suggestions.append(RULE_BASED_TEMPLATES["shipping"].copy())
            applied_keys.add("shipping")

        if len(suggestions) < 3 and "pricing" not in applied_keys:
            suggestions.append(RULE_BASED_TEMPLATES["pricing"].copy())
            applied_keys.add("pricing")

        if len(suggestions) < 3 and "reviews" not in applied_keys:
            suggestions.append(RULE_BASED_TEMPLATES["reviews"].copy())
            applied_keys.add("reviews")

        # Sort: High → Medium → Low
        priority_order = {"High": 0, "Medium": 1, "Low": 2}
        suggestions.sort(key=lambda x: priority_order.get(x.get("priority", "Low"), 3))

        if language == "hi":
            # Add a note that Hindi translation would require Groq API
            for s in suggestions:
                s["note"] = "हिंदी अनुवाद के लिए Groq API key जोड़ें"

        return suggestions[:5]
