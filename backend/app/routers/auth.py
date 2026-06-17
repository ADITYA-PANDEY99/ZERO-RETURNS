"""
Auth router — login, signup, current user, and logout.
Delegates to Supabase when configured; returns mock JWT tokens otherwise.
"""
from __future__ import annotations

import hashlib
import logging
import os
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.schemas.models import LoginRequest, SignupRequest, TokenResponse, UserResponse
from app.services.supabase_service import SupabaseService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/auth", tags=["Auth"])

supabase_svc = SupabaseService()
security = HTTPBearer(auto_error=False)

# In-memory token store for demo (replace with Redis / JWT verify in production)
_TOKEN_STORE: Dict[str, Dict] = {}

MOCK_USER = {
    "id": "user-001",
    "email": "demo@zeroreturns.ai",
    "full_name": "Arjun Mehta",
    "role": "seller",
    "created_at": "2024-01-15T10:00:00Z",
}


def _make_mock_token(user_id: str) -> str:
    """Generate a deterministic mock token (not a real JWT)."""
    secret = os.getenv("SECRET_KEY", "zeroreturns-dev-secret-2024")
    raw = f"{user_id}:{secret}:{datetime.now().date()}"
    return "mock_" + hashlib.sha256(raw.encode()).hexdigest()[:40]


def _get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Dict[str, Any]:
    """Extract user from bearer token."""
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = credentials.credentials
    # Check in-memory store
    if token in _TOKEN_STORE:
        return _TOKEN_STORE[token]

    # Check if it's the demo token
    demo_token = _make_mock_token("user-001")
    if token == demo_token or token.startswith("mock_"):
        return MOCK_USER

    raise HTTPException(status_code=401, detail="Invalid or expired token")


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest) -> TokenResponse:
    """Authenticate user and return access token."""

    # Try Supabase auth first
    if supabase_svc.available and supabase_svc._client:
        try:
            result = supabase_svc._client.auth.sign_in_with_password({
                "email": body.email,
                "password": body.password,
            })
            if result.user:
                token = result.session.access_token
                user_data = {
                    "id": result.user.id,
                    "email": result.user.email,
                    "full_name": result.user.user_metadata.get("full_name", "User"),
                    "role": result.user.user_metadata.get("role", "seller"),
                    "created_at": str(result.user.created_at),
                }
                _TOKEN_STORE[token] = user_data
                return TokenResponse(access_token=token, user=user_data)
        except Exception as e:
            logger.warning(f"Supabase auth failed, falling back to mock: {e}")

    # Mock auth fallback
    if body.email == "demo@zeroreturns.ai":
        if body.password == "demo1234":
            token = _make_mock_token("user-001")
            _TOKEN_STORE[token] = MOCK_USER
            return TokenResponse(access_token=token, user=MOCK_USER)
        else:
            raise HTTPException(status_code=401, detail="Invalid email or password")

    # For development — accept any other valid-looking credentials
    if "@" in body.email and len(body.password) >= 4:
        user_id = str(uuid.uuid4())
        user = {
            "id": user_id,
            "email": body.email,
            "full_name": body.email.split("@")[0].title(),
            "role": "seller",
            "created_at": datetime.utcnow().isoformat(),
        }
        token = _make_mock_token(user_id)
        _TOKEN_STORE[token] = user
        return TokenResponse(access_token=token, user=user)

    raise HTTPException(status_code=401, detail="Invalid email or password")


@router.post("/signup", response_model=TokenResponse)
async def signup(body: SignupRequest) -> TokenResponse:
    """Register a new user."""

    if supabase_svc.available and supabase_svc._client:
        try:
            result = supabase_svc._client.auth.sign_up({
                "email": body.email,
                "password": body.password,
                "options": {"data": {"full_name": body.full_name}},
            })
            if result.user:
                token = result.session.access_token if result.session else _make_mock_token(result.user.id)
                user_data = {
                    "id": result.user.id,
                    "email": result.user.email,
                    "full_name": body.full_name,
                    "role": "seller",
                    "created_at": str(result.user.created_at),
                }
                _TOKEN_STORE[token] = user_data
                return TokenResponse(access_token=token, user=user_data)
        except Exception as e:
            logger.warning(f"Supabase signup failed, falling back to mock: {e}")

    # Mock signup
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "email": body.email,
        "full_name": body.full_name,
        "role": "seller",
        "created_at": datetime.utcnow().isoformat(),
    }
    token = _make_mock_token(user_id)
    _TOKEN_STORE[token] = user
    return TokenResponse(access_token=token, user=user)


@router.get("/me", response_model=UserResponse)
async def get_me(
    current_user: Dict = Depends(_get_current_user),
) -> UserResponse:
    """Return the currently authenticated user's profile."""
    return UserResponse(
        id=current_user["id"],
        email=current_user["email"],
        full_name=current_user.get("full_name", "User"),
        role=current_user.get("role", "seller"),
        created_at=current_user.get("created_at", datetime.utcnow().isoformat()),
    )


@router.post("/logout")
async def logout(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Dict[str, str]:
    """Invalidate the current session token."""
    if credentials:
        token = credentials.credentials
        _TOKEN_STORE.pop(token, None)

        if supabase_svc.available and supabase_svc._client:
            try:
                supabase_svc._client.auth.sign_out()
            except Exception:
                pass

    return {"status": "logged_out", "message": "Successfully logged out"}
