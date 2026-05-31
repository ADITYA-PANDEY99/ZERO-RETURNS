"""
SupabaseService — wraps Supabase client for database operations.
Returns mock data when Supabase env vars are not configured so the
API works completely offline.
"""
from __future__ import annotations

import logging
import os
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# ---- Mock data store (in-memory for demo) ----
MOCK_USERS: Dict[str, Dict] = {
    "user-001": {
        "id": "user-001",
        "email": "demo@zeroreturns.ai",
        "full_name": "Arjun Mehta",
        "role": "seller",
        "created_at": "2024-01-15T10:00:00Z",
    }
}

MOCK_UPLOAD_JOBS: Dict[str, Dict] = {}


class SupabaseService:
    """Supabase database service with mock fallback."""

    def __init__(self):
        self.url = os.getenv("SUPABASE_URL")
        self.anon_key = os.getenv("SUPABASE_ANON_KEY")
        self.service_key = os.getenv("SUPABASE_SERVICE_KEY")
        self._client = None
        self.available = False

        if self.url and self.service_key:
            self._init_client()

    # ------------------------------------------------------------------
    def _init_client(self):
        try:
            from supabase import create_client
            self._client = create_client(self.url, self.service_key)
            self.available = True
            logger.info("SupabaseService: client initialized")
        except Exception as e:
            logger.warning(f"SupabaseService: init failed — {e}")

    # ------------------------------------------------------------------
    # Orders
    # ------------------------------------------------------------------
    def get_orders(
        self,
        filters: Optional[Dict[str, Any]] = None,
        page: int = 1,
        limit: int = 20,
    ) -> Dict[str, Any]:
        if self.available and self._client:
            try:
                query = self._client.table("orders").select("*")
                if filters:
                    if filters.get("risk_level"):
                        query = query.eq("risk_level", filters["risk_level"])
                    if filters.get("category"):
                        query = query.eq("category", filters["category"])

                offset = (page - 1) * limit
                result = query.range(offset, offset + limit - 1).execute()
                return {"data": result.data, "total": len(result.data), "source": "supabase"}
            except Exception as e:
                logger.error(f"SupabaseService.get_orders error: {e}")

        # Mock fallback — return empty, main router uses mock data
        return {"data": [], "total": 0, "source": "mock"}

    # ------------------------------------------------------------------
    def create_order(self, data: Dict[str, Any]) -> Dict[str, Any]:
        if self.available and self._client:
            try:
                result = self._client.table("orders").insert(data).execute()
                return result.data[0] if result.data else data
            except Exception as e:
                logger.error(f"SupabaseService.create_order error: {e}")

        data["id"] = data.get("id", str(uuid.uuid4()))
        data["created_at"] = datetime.utcnow().isoformat()
        return data

    # ------------------------------------------------------------------
    # Users
    # ------------------------------------------------------------------
    def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        if self.available and self._client:
            try:
                result = self._client.table("profiles").select("*").eq("id", user_id).execute()
                return result.data[0] if result.data else None
            except Exception as e:
                logger.error(f"SupabaseService.get_user error: {e}")

        return MOCK_USERS.get(user_id)

    def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        if self.available and self._client:
            try:
                result = self._client.table("profiles").select("*").eq("email", email).execute()
                return result.data[0] if result.data else None
            except Exception as e:
                logger.error(f"SupabaseService.get_user_by_email error: {e}")

        return next((u for u in MOCK_USERS.values() if u["email"] == email), None)

    def create_user(self, data: Dict[str, Any]) -> Dict[str, Any]:
        user_id = str(uuid.uuid4())
        user = {
            "id": user_id,
            "email": data["email"],
            "full_name": data.get("full_name", "New User"),
            "role": "seller",
            "created_at": datetime.utcnow().isoformat(),
        }
        if self.available and self._client:
            try:
                result = self._client.table("profiles").insert(user).execute()
                return result.data[0] if result.data else user
            except Exception as e:
                logger.error(f"SupabaseService.create_user error: {e}")

        MOCK_USERS[user_id] = user
        return user

    # ------------------------------------------------------------------
    # Upload Jobs
    # ------------------------------------------------------------------
    def create_upload_job(self, filename: str) -> Dict[str, Any]:
        job_id = str(uuid.uuid4())
        job = {
            "id": job_id,
            "filename": filename,
            "status": "pending",
            "rows_total": 0,
            "rows_processed": 0,
            "created_at": datetime.utcnow().isoformat(),
        }
        if self.available and self._client:
            try:
                result = self._client.table("upload_jobs").insert(job).execute()
                return result.data[0] if result.data else job
            except Exception as e:
                logger.error(f"SupabaseService.create_upload_job error: {e}")

        MOCK_UPLOAD_JOBS[job_id] = job
        return job

    def update_upload_job(self, job_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        if self.available and self._client:
            try:
                result = self._client.table("upload_jobs").update(updates).eq("id", job_id).execute()
                return result.data[0] if result.data else updates
            except Exception as e:
                logger.error(f"SupabaseService.update_upload_job error: {e}")

        if job_id in MOCK_UPLOAD_JOBS:
            MOCK_UPLOAD_JOBS[job_id].update(updates)
        return MOCK_UPLOAD_JOBS.get(job_id, updates)

    def get_upload_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        if self.available and self._client:
            try:
                result = self._client.table("upload_jobs").select("*").eq("id", job_id).execute()
                return result.data[0] if result.data else None
            except Exception as e:
                logger.error(f"SupabaseService.get_upload_job error: {e}")

        return MOCK_UPLOAD_JOBS.get(job_id)

    # ------------------------------------------------------------------
    # Chat History
    # ------------------------------------------------------------------
    def save_chat_message(
        self, session_id: str, role: str, content: str
    ) -> Dict[str, Any]:
        record = {
            "id": str(uuid.uuid4()),
            "session_id": session_id,
            "role": role,
            "content": content,
            "created_at": datetime.utcnow().isoformat(),
        }
        if self.available and self._client:
            try:
                self._client.table("chat_history").insert(record).execute()
            except Exception as e:
                logger.debug(f"SupabaseService.save_chat_message error: {e}")
        return record
