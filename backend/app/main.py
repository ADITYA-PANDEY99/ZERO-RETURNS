import os
import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from app.routers import dashboard, orders, analytics, upload, chatbot, auth, enterprise
from app.services.websocket_service import WebSocketManager
from app.models.return_predictor import ReturnPredictor
from app.models.nlp_analyzer import NLPAnalyzer
from app.models.image_scorer import ImageScorer
from app.models.anomaly_detector import AnomalyDetector
from app.utils.security import check_rate_limit, audit_environment

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global instances
ws_manager = WebSocketManager()
predictor = ReturnPredictor()
nlp_analyzer = NLPAnalyzer()
image_scorer = ImageScorer()
anomaly_detector = AnomalyDetector()


async def broadcast_demo_events():
    """Broadcast mock new_order events every 30 seconds for demo purposes."""
    import random
    from datetime import datetime

    demo_orders = [
        {"order_id": f"ORD-DEMO-{i:04d}", "product_name": name, "category": cat, "risk_score": score}
        for i, (name, cat, score) in enumerate([
            ("Samsung Galaxy M34 5G", "Electronics", 72),
            ("Fabindia Cotton Kurta", "Clothing", 45),
            ("Bata Men's Formal Shoes", "Footwear", 38),
            ("Prestige Pressure Cooker", "Home", 61),
            ("Lakme Absolute Foundation", "Beauty", 29),
            ("Atomic Habits - James Clear", "Books", 12),
            ("OnePlus Nord CE 3", "Electronics", 85),
            ("W Brand Printed Saree", "Clothing", 68),
        ])
    ]

    while True:
        await asyncio.sleep(30)
        order = random.choice(demo_orders)
        order["timestamp"] = datetime.now().isoformat()
        order["risk_level"] = (
            "Critical" if order["risk_score"] >= 80
            else "High" if order["risk_score"] >= 60
            else "Medium" if order["risk_score"] >= 40
            else "Low"
        )
        await ws_manager.broadcast("new_order", order)
        logger.info(f"Broadcasted demo new_order event for {order['order_id']}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize ML models and start background tasks on startup."""
    logger.info("🚀 ZeroReturn backend starting up...")
    
    # Audit env vars
    audit_environment()
    
    # Initialize models
    try:
        predictor.initialize()
        logger.info("✅ ReturnPredictor initialized")
    except Exception as e:
        logger.warning(f"ReturnPredictor init warning: {e}")

    try:
        nlp_analyzer.initialize()
        logger.info("✅ NLPAnalyzer initialized")
    except Exception as e:
        logger.warning(f"NLPAnalyzer init warning: {e}")

    try:
        image_scorer.initialize()
        logger.info("✅ ImageScorer initialized")
    except Exception as e:
        logger.warning(f"ImageScorer init warning: {e}")

    try:
        anomaly_detector.initialize()
        logger.info("✅ AnomalyDetector initialized")
    except Exception as e:
        logger.warning(f"AnomalyDetector init warning: {e}")

    # Start demo broadcast task
    broadcast_task = asyncio.create_task(broadcast_demo_events())
    logger.info("✅ Demo WebSocket broadcast task started")
    
    # Store instances in app state
    app.state.ws_manager = ws_manager
    app.state.predictor = predictor
    app.state.nlp_analyzer = nlp_analyzer
    app.state.image_scorer = image_scorer
    app.state.anomaly_detector = anomaly_detector

    logger.info("🎉 ZeroReturn backend ready!")
    yield

    # Cleanup
    broadcast_task.cancel()
    try:
        await broadcast_task
    except asyncio.CancelledError:
        pass
    logger.info("👋 ZeroReturn backend shutting down...")


app = FastAPI(
    title="ZeroReturn API",
    description="AI-powered e-commerce return prediction platform",
    version="1.0.0",
    lifespan=lifespan,
)

# Global rate limiting middleware
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    client_ip = request.client.host if request.client else "unknown"
    if not request.url.path.startswith("/health") and not request.url.path.startswith("/docs") and not request.url.path.startswith("/openapi.json"):
        if not check_rate_limit(client_ip):
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please try again later."}
            )
    return await call_next(request)

# Global secure exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"UNHANDLED EXCEPTION: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal operational error occurred. Please contact system support."}
    )

# CORS Middleware
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url, "http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all routers
app.include_router(auth.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(orders.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(upload.router, prefix="/api")
app.include_router(chatbot.router, prefix="/api")
app.include_router(enterprise.router, prefix="/api")


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "ZeroReturn API",
        "version": "1.0.0",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "models": {
            "return_predictor": predictor.is_ready,
            "nlp_analyzer": nlp_analyzer.is_ready,
            "image_scorer": image_scorer.is_ready,
            "anomaly_detector": anomaly_detector.is_ready,
        },
        "groq_available": bool(os.getenv("GROQ_API_KEY")),
        "supabase_available": bool(os.getenv("SUPABASE_URL")),
    }


@app.websocket("/ws/live-updates")
async def websocket_endpoint(websocket: WebSocket, client_id: str = "anonymous"):
    """WebSocket endpoint for live dashboard updates."""
    await ws_manager.connect(websocket, client_id)
    try:
        # Send welcome message
        await ws_manager.send_personal(client_id, {
            "event": "connected",
            "message": "Connected to ZeroReturn live updates",
            "client_id": client_id,
        })
        while True:
            # Keep connection alive, listen for pings
            data = await websocket.receive_text()
            if data == "ping":
                await ws_manager.send_personal(client_id, {"event": "pong"})
    except WebSocketDisconnect:
        ws_manager.disconnect(client_id)
        logger.info(f"Client {client_id} disconnected from WebSocket")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
