"""
Pydantic schemas / models for ZeroReturn API request/response validation.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, EmailStr


# ---------------------------------------------------------------------------
# Order schemas
# ---------------------------------------------------------------------------

class OrderBase(BaseModel):
    order_id: str
    product_name: str
    category: str
    price: float
    customer_name: str
    seller_name: str
    order_date: str
    image_url: Optional[str] = None
    description_quality_score: Optional[float] = None
    review_sentiment_score: Optional[float] = None


class OrderCreate(OrderBase):
    description: Optional[str] = None
    reviews: Optional[List[str]] = []


class OrderResponse(OrderBase):
    risk_score: float
    risk_level: str  # Low | Medium | High | Critical
    reason: str

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Prediction schemas
# ---------------------------------------------------------------------------

class PredictionResponse(BaseModel):
    order_id: str
    probability: float
    risk_level: str
    risk_factors: List[str]
    estimated_return_reduction: Optional[float] = None


# ---------------------------------------------------------------------------
# Chat schemas
# ---------------------------------------------------------------------------

class ChatMessage(BaseModel):
    message: str
    language: str = "en"
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    reply: str
    language: str
    session_id: Optional[str] = None
    suggestions: Optional[List[str]] = []
    data_context: Optional[Dict[str, Any]] = None


# ---------------------------------------------------------------------------
# Upload schemas
# ---------------------------------------------------------------------------

class UploadJobResponse(BaseModel):
    job_id: str
    status: str          # pending | processing | completed | failed
    filename: str
    rows_processed: Optional[int] = None
    rows_total: Optional[int] = None
    progress_pct: Optional[float] = None
    result_summary: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    created_at: str


# ---------------------------------------------------------------------------
# Dashboard schemas
# ---------------------------------------------------------------------------

class DashboardKPIs(BaseModel):
    total_orders: int
    return_rate: float
    revenue_at_risk: float
    returns_prevented: int
    trend_total_orders: float
    trend_return_rate: float
    trend_revenue_at_risk: float
    trend_returns_prevented: float


class HeatmapItem(BaseModel):
    category: str
    risk_score: float
    orders: int
    returns: int
    revenue_at_risk: float


class TrendDataPoint(BaseModel):
    date: str
    orders_count: int
    returns_count: int
    revenue: float


# ---------------------------------------------------------------------------
# Analysis schemas
# ---------------------------------------------------------------------------

class DescriptionAnalysis(BaseModel):
    original: str
    issues: List[Dict[str, str]]
    improved: str
    mismatch_score: float


class ImageAnalysis(BaseModel):
    score: float
    issues: List[str]
    recommendations: List[str]


class SentimentAnalysis(BaseModel):
    positive_pct: float
    negative_pct: float
    neutral_pct: float
    top_complaints: List[str]
    word_cloud_data: List[Dict[str, Any]]


class AISuggestionItem(BaseModel):
    priority: str        # High | Medium | Low
    action: str
    reason: str
    estimated_reduction: float
    apply_possible: bool


class AISuggestions(BaseModel):
    items: List[AISuggestionItem]


class AnalysisResponse(BaseModel):
    order_id: str
    description_analysis: DescriptionAnalysis
    image_analysis: ImageAnalysis
    sentiment_analysis: SentimentAnalysis
    ai_suggestions: AISuggestions
    overall_risk_score: float
    generated_at: str


# ---------------------------------------------------------------------------
# What-If schemas
# ---------------------------------------------------------------------------

class WhatIfRequest(BaseModel):
    description_quality_improvement: float = Field(0.0, ge=0, le=100)
    image_quality_improvement: float = Field(0.0, ge=0, le=100)
    price_optimization: float = Field(0.0, ge=-50, le=50)


class WhatIfResponse(BaseModel):
    estimated_return_reduction: float
    estimated_revenue_saved: float
    new_return_rate: float
    breakdown: Dict[str, float]


# ---------------------------------------------------------------------------
# Auth schemas
# ---------------------------------------------------------------------------

class LoginRequest(BaseModel):
    email: str
    password: str


class SignupRequest(BaseModel):
    email: str
    password: str
    full_name: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    created_at: str


# ---------------------------------------------------------------------------
# Report schemas
# ---------------------------------------------------------------------------

class ReportRequest(BaseModel):
    report_type: str = "full"   # full | summary | category
    categories: Optional[List[str]] = None
    date_range_days: int = 30
    include_charts: bool = True
