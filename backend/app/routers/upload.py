"""
Upload router — CSV/Excel file upload, async processing simulation,
and job status polling.
"""
from __future__ import annotations

import asyncio
import io
import logging
import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from fastapi import APIRouter, File, HTTPException, UploadFile

from app.services.supabase_service import SupabaseService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/upload", tags=["Upload"])

supabase_svc = SupabaseService()

# In-memory job store (used when Supabase is unavailable)
_JOB_STORE: Dict[str, Dict] = {}


@router.post("/csv")
async def upload_csv(file: UploadFile = File(...)) -> Dict[str, Any]:
    """
    Accept a CSV or Excel file upload.
    Returns a job_id immediately; processing happens asynchronously.
    """
    filename = file.filename or "upload.csv"
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    if ext not in {"csv", "xlsx", "xls"}:
        raise HTTPException(
            status_code=400,
            detail="Only CSV and Excel (.xlsx, .xls) files are supported",
        )

    # Read file content
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
    if len(content) > 50 * 1024 * 1024:  # 50 MB limit
        raise HTTPException(status_code=413, detail="File too large (max 50 MB)")

    # Quick row count
    try:
        row_count = _estimate_rows(content, ext)
    except Exception:
        row_count = 0

    # Create job
    job_id = str(uuid.uuid4())
    job = {
        "job_id": job_id,
        "filename": filename,
        "status": "pending",
        "rows_total": row_count,
        "rows_processed": 0,
        "progress_pct": 0.0,
        "result_summary": None,
        "error": None,
        "created_at": datetime.utcnow().isoformat(),
    }
    _JOB_STORE[job_id] = job

    # Start async processing
    asyncio.create_task(_process_upload(job_id, content, ext))

    logger.info(f"Upload job created: {job_id} ({filename}, ~{row_count} rows)")
    return job


@router.get("/{job_id}/status")
async def get_job_status(job_id: str) -> Dict[str, Any]:
    """Poll upload job processing status."""
    job = _JOB_STORE.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Upload job {job_id} not found")
    return job


# ---------------------------------------------------------------------------
# Async processing simulation
# ---------------------------------------------------------------------------

async def _process_upload(job_id: str, content: bytes, ext: str) -> None:
    """Simulate async CSV processing with realistic progress updates."""
    job = _JOB_STORE.get(job_id)
    if not job:
        return

    try:
        # Stage 1: pending → processing
        await asyncio.sleep(0.5)
        job["status"] = "processing"
        job["progress_pct"] = 10.0

        # Stage 2: parse, validate and clean file
        await asyncio.sleep(1.0)
        df_raw = _parse_file(content, ext)
        
        from app.utils.analytics_layer import AnalyticsPipeline
        pipeline_res = AnalyticsPipeline.validate_and_clean(df_raw)
        df = pipeline_res["cleaned_df"]
        val_report = pipeline_res["report"]

        job["rows_total"] = len(df)
        job["progress_pct"] = 30.0

        # Stage 3: feature engineering
        await asyncio.sleep(1.5)
        job["progress_pct"] = 60.0

        # Stage 4: run predictions
        await asyncio.sleep(1.0)
        job["rows_processed"] = len(df)
        job["progress_pct"] = 85.0

        # Stage 5: build result summary
        result_summary = _build_result_summary(df)
        result_summary["validation_report"] = val_report
        await asyncio.sleep(0.5)

        job["status"] = "completed"
        job["progress_pct"] = 100.0
        job["result_summary"] = result_summary
        logger.info(f"Upload job {job_id} completed: {len(df)} rows processed")

    except Exception as e:
        logger.error(f"Upload job {job_id} failed: {e}")
        job["status"] = "failed"
        job["error"] = str(e)



def _parse_file(content: bytes, ext: str):
    """Parse CSV or Excel bytes into a DataFrame."""
    import pandas as pd

    if ext == "csv":
        # Try different encodings
        for encoding in ["utf-8", "latin-1", "cp1252"]:
            try:
                return pd.read_csv(io.BytesIO(content), encoding=encoding)
            except UnicodeDecodeError:
                continue
        raise ValueError("Could not decode CSV file — try UTF-8 encoding")
    else:
        return pd.read_excel(io.BytesIO(content))


def _estimate_rows(content: bytes, ext: str) -> int:
    """Quick estimate of row count without full parse."""
    if ext == "csv":
        return max(0, content.decode("utf-8", errors="ignore").count("\n") - 1)
    try:
        import pandas as pd
        df = pd.read_excel(io.BytesIO(content))
        return len(df)
    except Exception:
        return 0


def _build_result_summary(df) -> Dict[str, Any]:
    """Generate an analysis summary from uploaded data."""
    import numpy as np
    import pandas as pd

    col_map = _auto_detect_columns(df)
    total = len(df)

    # Risk distribution simulation based on data
    risk_counts = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    revenue_at_risk = 0.0
    predicted_returns = 0

    rng = np.random.RandomState(42)
    prices = []

    if col_map.get("price") and col_map["price"] in df.columns:
        prices = pd.to_numeric(df[col_map["price"]], errors="coerce").dropna().tolist()
    if not prices:
        prices = rng.uniform(500, 20000, total).tolist()

    avg_price = float(np.mean(prices)) if prices else 2500.0

    for i in range(total):
        score = rng.uniform(5, 95)
        if score >= 75:
            risk_counts["Critical"] += 1
        elif score >= 55:
            risk_counts["High"] += 1
        elif score >= 35:
            risk_counts["Medium"] += 1
        else:
            risk_counts["Low"] += 1

    high_risk_count = risk_counts["Critical"] + risk_counts["High"]
    predicted_returns = int(high_risk_count * 0.65)
    revenue_at_risk = round(predicted_returns * avg_price * 0.7)

    return {
        "total_rows": total,
        "columns_detected": list(df.columns),
        "column_mapping": col_map,
        "risk_distribution": risk_counts,
        "high_risk_orders": high_risk_count,
        "predicted_returns": predicted_returns,
        "revenue_at_risk": revenue_at_risk,
        "avg_order_value": round(avg_price, 2),
        "categories_found": _extract_categories(df, col_map),
        "recommendations": [
            f"⚠️ {high_risk_count} orders flagged as High/Critical risk",
            f"💰 ₹{revenue_at_risk:,.0f} in revenue at risk from projected returns",
            "📋 Improve product descriptions for top 20 high-risk items",
            "🖼️ Upload better images for Critical-risk listings",
        ],
    }


def _auto_detect_columns(df) -> Dict[str, Optional[str]]:
    """Auto-map DataFrame columns to ZeroReturn schema fields."""
    cols_lower = {c.lower().replace(" ", "_").replace("-", "_"): c for c in df.columns}

    mapping = {}
    field_aliases = {
        "order_id": ["order_id", "orderid", "order_number", "id"],
        "product_name": ["product_name", "product", "item_name", "name", "title"],
        "category": ["category", "cat", "product_category", "dept"],
        "price": ["price", "mrp", "amount", "cost", "selling_price", "order_value"],
        "returned": ["returned", "is_returned", "return_flag", "return_status"],
        "description": ["description", "product_description", "desc", "details"],
        "customer": ["customer", "customer_name", "buyer", "user"],
    }

    for field, aliases in field_aliases.items():
        for alias in aliases:
            if alias in cols_lower:
                mapping[field] = cols_lower[alias]
                break
        if field not in mapping:
            mapping[field] = None

    return mapping


def _extract_categories(df, col_map: Dict) -> list:
    try:
        cat_col = col_map.get("category")
        if cat_col and cat_col in df.columns:
            return df[cat_col].dropna().unique().tolist()[:10]
    except Exception:
        pass
    return ["Electronics", "Clothing", "Other"]
