"""
NLPAnalyzer — TF-IDF based description vs review mismatch scorer,
issue detector, and rule-based description improver.
Works entirely with scikit-learn — no external APIs needed.
"""
from __future__ import annotations

import logging
import re
from typing import Any, Dict, List, Optional

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

logger = logging.getLogger(__name__)


class NLPAnalyzer:
    """Analyzes product descriptions against reviews for quality/mismatch."""

    def __init__(self):
        self.vectorizer: Optional[TfidfVectorizer] = None
        self.is_ready: bool = False

    # ------------------------------------------------------------------
    def initialize(self):
        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            max_features=5000,
            stop_words="english",
            min_df=1,
        )
        self.is_ready = True
        logger.info("NLPAnalyzer initialized")

    # ------------------------------------------------------------------
    def analyze_description(
        self,
        text: str,
        reviews: Optional[List[str]] = None,
        category: str = "General",
    ) -> Dict[str, Any]:
        """
        Analyze a product description against its reviews.

        Returns:
            mismatch_score (0-1, higher = more mismatch)
            issues: list of detected problems
            improved_description: rule-based enhanced text
            suggestions: list of improvement tips
        """
        reviews = reviews or []
        issues = self._detect_issues(text, category)
        mismatch_score = self._compute_mismatch(text, reviews)
        improved = self._improve_description(text, issues, category)
        suggestions = self._generate_suggestions(issues, mismatch_score)

        return {
            "mismatch_score": round(mismatch_score, 3),
            "quality_score": round(1 - mismatch_score, 3),
            "issues": issues,
            "improved_description": improved,
            "suggestions": suggestions,
            "original_length": len(text),
            "improved_length": len(improved),
        }

    # ------------------------------------------------------------------
    def _compute_mismatch(self, description: str, reviews: List[str]) -> float:
        """TF-IDF cosine similarity between description and combined reviews."""
        if not reviews or not description.strip():
            return 0.3  # Default moderate mismatch when no reviews

        try:
            combined_review = " ".join(reviews[:20])  # cap at 20 reviews
            corpus = [description, combined_review]
            tfidf_matrix = self.vectorizer.fit_transform(corpus)
            similarity = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
            # Mismatch = 1 - similarity, clipped to [0.05, 0.95]
            mismatch = float(np.clip(1 - similarity, 0.05, 0.95))
            return mismatch
        except Exception as e:
            logger.warning(f"NLPAnalyzer._compute_mismatch error: {e}")
            return 0.3

    # ------------------------------------------------------------------
    def _detect_issues(self, text: str, category: str) -> List[Dict[str, str]]:
        issues = []
        text_lower = text.lower()

        # Length check
        if len(text) < 100:
            issues.append({
                "type": "too_short",
                "description": "Description is too short (< 100 characters). Customers need more detail.",
                "severity": "High",
            })
        elif len(text) < 250:
            issues.append({
                "type": "slightly_short",
                "description": "Description could be more detailed (< 250 characters).",
                "severity": "Medium",
            })

        # Missing size/dimensions for relevant categories
        if category in ["Clothing", "Footwear"] and not re.search(
            r"\b(size|sizes?|xs|s\b|m\b|l\b|xl|xxl|small|medium|large|eu\s*\d|uk\s*\d)",
            text_lower,
        ):
            issues.append({
                "type": "missing_size_info",
                "description": "No sizing information found. 38% of clothing returns are size-related.",
                "severity": "High",
            })

        # Missing material for clothing
        if category in ["Clothing", "Footwear"] and not re.search(
            r"\b(cotton|polyester|nylon|wool|silk|linen|leather|synthetic|fabric|material|blend)",
            text_lower,
        ):
            issues.append({
                "type": "missing_material",
                "description": "Material/fabric type not mentioned.",
                "severity": "Medium",
            })

        # Electronics: missing specs
        if category == "Electronics" and not re.search(
            r"\b(ram|storage|battery|processor|display|screen|camera|warranty|\d+\s*gb|\d+\s*mp)",
            text_lower,
        ):
            issues.append({
                "type": "missing_specs",
                "description": "Key technical specifications (RAM, battery, storage) are missing.",
                "severity": "High",
            })

        # Vague language
        vague_words = ["good", "nice", "great", "best", "amazing", "awesome", "perfect", "excellent"]
        vague_found = [w for w in vague_words if w in text_lower]
        if len(vague_found) >= 3:
            issues.append({
                "type": "vague_language",
                "description": f"Description uses too many vague adjectives: {', '.join(vague_found[:3])}. Use specific facts.",
                "severity": "Medium",
            })

        # Missing warranty/return policy mention for electronics
        if category == "Electronics" and "warranty" not in text_lower:
            issues.append({
                "type": "missing_warranty",
                "description": "Warranty information not mentioned. Builds trust and reduces return disputes.",
                "severity": "Low",
            })

        # Missing color mention for visual products
        if category in ["Clothing", "Footwear", "Home"] and not re.search(
            r"\b(red|blue|green|black|white|yellow|pink|purple|grey|gray|brown|beige|navy|maroon|orange|multicolor|printed)",
            text_lower,
        ):
            issues.append({
                "type": "missing_color",
                "description": "Color not mentioned — visual mismatch is a top return reason.",
                "severity": "Medium",
            })

        return issues

    # ------------------------------------------------------------------
    def _improve_description(
        self, text: str, issues: List[Dict], category: str
    ) -> str:
        """Rule-based description enhancer that appends missing sections."""
        improved = text.strip()

        # Add size chart note for clothing
        if any(i["type"] == "missing_size_info" for i in issues):
            improved += (
                "\n\n📏 Size Guide: Available in XS, S, M, L, XL, XXL. "
                "Refer to the size chart in images for exact measurements in cm/inches."
            )

        # Add material note
        if any(i["type"] == "missing_material" for i in issues):
            improved += (
                "\n\n🧵 Material: Please check product images or Q&A section for detailed material composition."
            )

        # Add warranty note for electronics
        if any(i["type"] == "missing_warranty" for i in issues):
            improved += (
                "\n\n🛡️ Warranty: Includes manufacturer warranty. "
                "Register your product within 7 days of purchase for extended coverage."
            )

        # Add color accuracy disclaimer
        if any(i["type"] == "missing_color" for i in issues):
            improved += (
                "\n\n🎨 Color Note: The actual color may slightly vary due to monitor display settings. "
                "Our product images are shot under professional studio lighting for accuracy."
            )

        # Add electronics spec highlight
        if any(i["type"] == "missing_specs" for i in issues):
            improved += (
                "\n\n⚙️ Key Specifications: Please review the technical specifications table on this page "
                "for complete details on processor, RAM, storage, and display."
            )

        return improved

    # ------------------------------------------------------------------
    @staticmethod
    def _generate_suggestions(issues: List[Dict], mismatch_score: float) -> List[str]:
        suggestions = []
        for issue in issues:
            if issue["type"] == "too_short":
                suggestions.append("Expand your description to at least 300 characters with specific product details.")
            elif issue["type"] == "missing_size_info":
                suggestions.append("Add a size guide table with measurements in both cm and inches.")
            elif issue["type"] == "missing_material":
                suggestions.append("List exact fabric/material composition (e.g., '100% Organic Cotton').")
            elif issue["type"] == "missing_specs":
                suggestions.append("Include a structured specs table: RAM, Battery, Storage, Camera resolution.")
            elif issue["type"] == "vague_language":
                suggestions.append("Replace vague adjectives with specific claims and measurements.")
            elif issue["type"] == "missing_warranty":
                suggestions.append("State warranty duration and coverage clearly.")
            elif issue["type"] == "missing_color":
                suggestions.append("Mention all available color variants and add a color accuracy disclaimer.")

        if mismatch_score > 0.5:
            suggestions.append(
                "⚠️ High mismatch detected between description and customer reviews — "
                "review recent feedback and update the description to align with actual customer experience."
            )

        return suggestions
