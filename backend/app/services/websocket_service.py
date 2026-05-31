"""
WebSocketManager — manages WebSocket connections and broadcasts events
to all connected clients for live dashboard updates.
"""
from __future__ import annotations

import json
import logging
from datetime import datetime
from typing import Any, Dict, Optional

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class WebSocketManager:
    """Manages active WebSocket connections and message broadcasting."""

    def __init__(self):
        # client_id → WebSocket
        self._connections: Dict[str, WebSocket] = {}

    # ------------------------------------------------------------------
    async def connect(self, websocket: WebSocket, client_id: str) -> None:
        """Accept a new WebSocket connection."""
        await websocket.accept()
        self._connections[client_id] = websocket
        logger.info(f"WebSocket client connected: {client_id} (total: {len(self._connections)})")

    # ------------------------------------------------------------------
    def disconnect(self, client_id: str) -> None:
        """Remove a disconnected client."""
        self._connections.pop(client_id, None)
        logger.info(f"WebSocket client disconnected: {client_id} (total: {len(self._connections)})")

    # ------------------------------------------------------------------
    async def broadcast(self, event_type: str, data: Dict[str, Any]) -> None:
        """Send an event to ALL connected clients."""
        if not self._connections:
            return

        payload = json.dumps({
            "event": event_type,
            "data": data,
            "timestamp": datetime.utcnow().isoformat(),
        })

        dead_clients = []
        for client_id, websocket in self._connections.items():
            try:
                await websocket.send_text(payload)
            except Exception as e:
                logger.warning(f"WebSocket send failed for {client_id}: {e}")
                dead_clients.append(client_id)

        for client_id in dead_clients:
            self.disconnect(client_id)

    # ------------------------------------------------------------------
    async def send_personal(self, client_id: str, data: Dict[str, Any]) -> None:
        """Send a message to a specific client."""
        websocket = self._connections.get(client_id)
        if not websocket:
            logger.debug(f"WebSocket send_personal: client {client_id} not found")
            return

        payload = json.dumps({
            **data,
            "timestamp": datetime.utcnow().isoformat(),
        })

        try:
            await websocket.send_text(payload)
        except Exception as e:
            logger.warning(f"WebSocket personal send failed for {client_id}: {e}")
            self.disconnect(client_id)

    # ------------------------------------------------------------------
    async def broadcast_new_order(self, order: Dict[str, Any]) -> None:
        """Convenience: broadcast a new order event."""
        await self.broadcast("new_order", order)

    async def broadcast_anomaly(self, anomaly: Dict[str, Any]) -> None:
        """Convenience: broadcast an anomaly detected event."""
        await self.broadcast("anomaly_detected", anomaly)

    async def broadcast_return_prevented(self, info: Dict[str, Any]) -> None:
        """Convenience: broadcast a return prevented event."""
        await self.broadcast("return_prevented", info)

    # ------------------------------------------------------------------
    @property
    def active_connections(self) -> int:
        return len(self._connections)

    @property
    def connected_clients(self):
        return list(self._connections.keys())
