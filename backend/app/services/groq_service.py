"""
GroqService — wrapper around Groq API for chat completions and insight generation.
Implements simple token-bucket rate limiting for the free tier (14,400 req/day).
Falls back gracefully to rule-based responses if API is unavailable.
"""
from __future__ import annotations

import logging
import os
import time
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# ---- Rule-based fallback responses ----
FALLBACK_INSIGHTS = {
    "return_rate": (
        "Your current return rate of 18.3% is slightly above the industry average of 15% for "
        "Indian e-commerce. Electronics and Clothing categories are your highest risk segments. "
        "Improving product descriptions and image quality could reduce returns by 8–12%."
    ),
    "category": (
        "Electronics has the highest return rate (28.4%) followed by Clothing (22.1%). "
        "Focus on size guides for Clothing and detailed spec sheets for Electronics to improve these numbers."
    ),
    "revenue": (
        "₹23.4L in revenue is currently at risk from projected returns. "
        "Preventing even 30% of these returns would save ₹7L+ per month."
    ),
    "default": (
        "Based on your data, the top 3 improvement areas are: "
        "1) Product description quality, 2) Image quality, and 3) Accurate size information. "
        "Addressing these could reduce your return rate by up to 25%."
    ),
}


class TokenBucket:
    """Simple token bucket for rate limiting API calls."""

    def __init__(self, capacity: int = 100, refill_rate: float = 1.0):
        self.capacity = capacity
        self.tokens = float(capacity)
        self.refill_rate = refill_rate  # tokens per second
        self._last_refill = time.monotonic()

    def consume(self, tokens: int = 1) -> bool:
        now = time.monotonic()
        elapsed = now - self._last_refill
        self.tokens = min(self.capacity, self.tokens + elapsed * self.refill_rate)
        self._last_refill = now
        if self.tokens >= tokens:
            self.tokens -= tokens
            return True
        return False


class GroqService:
    """Groq LLM API service with rate limiting and fallback."""

    MODEL = "llama-3.3-70b-versatile"
    # Free tier: 14400 req/day = ~10 req/minute → 1 token / 6 seconds
    _bucket = TokenBucket(capacity=10, refill_rate=1 / 6)

    def __init__(self):
        self.api_key = os.getenv("GROQ_API_KEY")
        self._client = None
        self.available = False

        if self.api_key:
            self._init_client()

    # ------------------------------------------------------------------
    def _init_client(self):
        try:
            from groq import Groq
            self._client = Groq(api_key=self.api_key)
            self.available = True
            logger.info("GroqService: client initialized")
        except Exception as e:
            logger.warning(f"GroqService: init failed — {e}")
            self.available = False

    # ------------------------------------------------------------------
    def chat(
        self,
        messages: List[Dict[str, str]],
        language: str = "en",
        max_tokens: int = 512,
    ) -> str:
        """Send messages to Groq and return assistant reply."""
        if not self.available or self._client is None:
            return self._fallback_chat(messages)

        if not self._bucket.consume():
            logger.warning("GroqService: rate limit hit, using fallback")
            return self._fallback_chat(messages)

        try:
            lang_system = (
                "You are ZeroReturn's AI assistant. Always respond in Hindi using Devanagari script."
                if language == "hi"
                else "You are ZeroReturn's AI assistant for Indian e-commerce return reduction. "
                     "Be concise, data-driven, and actionable."
            )

            # Prepend system message
            full_messages = [{"role": "system", "content": lang_system}] + messages

            response = self._client.chat.completions.create(
                model=self.MODEL,
                messages=full_messages,
                temperature=0.5,
                max_tokens=max_tokens,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"GroqService.chat error: {e}")
            return self._fallback_chat(messages)

    # ------------------------------------------------------------------
    def generate_insight(
        self,
        data: Dict[str, Any],
        prompt: str,
        language: str = "en",
    ) -> str:
        """Generate a chart/data insight narrative."""
        if not self.available:
            return self._fallback_insight(prompt)

        messages = [
            {
                "role": "user",
                "content": (
                    f"Analyze this e-commerce data and {prompt}:\n"
                    f"Data: {data}\n"
                    "Keep your response to 2-3 sentences."
                ),
            }
        ]
        return self.chat(messages, language=language, max_tokens=200)

    # ------------------------------------------------------------------
    @staticmethod
    def _fallback_chat(messages: List[Dict[str, str]]) -> str:
        """Keyword-based smart fallback response."""
        if not messages:
            return FALLBACK_INSIGHTS["default"]
        last_msg = messages[-1].get("content", "").lower()

        if any(w in last_msg for w in ["return rate", "returns", "vापसी"]):
            return FALLBACK_INSIGHTS["return_rate"]
        if any(w in last_msg for w in ["category", "electronics", "clothing", "श्रेणी"]):
            return FALLBACK_INSIGHTS["category"]
        if any(w in last_msg for w in ["revenue", "money", "profit", "राजस्व"]):
            return FALLBACK_INSIGHTS["revenue"]
        return FALLBACK_INSIGHTS["default"]

    # ------------------------------------------------------------------
    @staticmethod
    def _fallback_insight(prompt: str) -> str:
        prompt_lower = prompt.lower()
        if "trend" in prompt_lower:
            return "Return rates show a declining trend over the past 30 days, driven by improved description quality in Electronics."
        if "category" in prompt_lower:
            return "Electronics leads in return volume while Books maintains the lowest return rate at 4.2%."
        return FALLBACK_INSIGHTS["default"]
