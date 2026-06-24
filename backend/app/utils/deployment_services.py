import os
import logging
import sqlite3
import sys
from typing import Dict, Any, Tuple
import requests

# ---------------------------------------------------------------------------
# Centralized Production Logging Layer
# ---------------------------------------------------------------------------
LOG_FORMAT = "%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s"
logging.basicConfig(
    level=logging.INFO,
    format=LOG_FORMAT,
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

# Custom loggers for isolated streams
api_logger = logging.getLogger("zeroreturn.api")
error_logger = logging.getLogger("zeroreturn.error")
auth_logger = logging.getLogger("zeroreturn.auth")
analytics_logger = logging.getLogger("zeroreturn.analytics")
copilot_logger = logging.getLogger("zeroreturn.copilot")
rag_logger = logging.getLogger("zeroreturn.rag")

# ---------------------------------------------------------------------------
# Production Health & Readiness Services
# ---------------------------------------------------------------------------
class DeploymentValidationServices:
    
    @staticmethod
    def validate_environment_variables() -> Tuple[bool, list[str]]:
        """Verify that all mandatory production environment variables are configured."""
        required_vars = [
            "SUPABASE_URL",
            "SUPABASE_SERVICE_KEY",
            "GROQ_API_KEY",
            "SECRET_KEY",
            "DATABASE_URL"
        ]
        missing = []
        for var in required_vars:
            val = os.environ.get(var)
            if not val or val.startswith("your-") or val.startswith("gsk_your"):
                missing.append(var)
        
        if missing:
            error_logger.warning(f"Production Environment Missing variables: {', '.join(missing)}")
            return False, missing
        return True, []

    @staticmethod
    def check_database_connectivity() -> Tuple[bool, str]:
        """Verify the operational status of the PostgreSQL or SQLite analytical warehouse."""
        from app.routers.analytics import _get_populated_analytics_db
        try:
            conn = _get_populated_analytics_db()
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM orders")
            count = cursor.fetchone()[0]
            conn.close()
            return True, f"Warehouse Active. Records count: {count}"
        except Exception as e:
            msg = f"Database warehouse connection failure: {str(e)}"
            error_logger.error(msg)
            return False, msg

    @staticmethod
    def check_ai_provider_connectivity() -> Tuple[bool, str]:
        """Verify connectivity to the LLM backend provider (Groq API)."""
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            return False, "Groq API Key is not set"
        
        # Make a quick ping to Groq models endpoint to check auth & connectivity
        url = "https://api.groq.com/openai/v1/models"
        headers = {"Authorization": f"Bearer {api_key}"}
        try:
            res = requests.get(url, headers=headers, timeout=5)
            if res.status_code == 200:
                return True, "Groq API communication verified."
            else:
                return False, f"Groq API returned status: {res.status_code}"
        except Exception as e:
            return False, f"Groq API communication exception: {str(e)}"
