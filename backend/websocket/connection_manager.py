"""
WebSocket Connection Manager
Manages active WebSocket connections per user.
"""
from typing import Dict, Set, List
from fastapi import WebSocket
import asyncio
from datetime import datetime

class ConnectionManager:
    """Manages WebSocket connections per user."""
    
    def __init__(self):
        # Active connections: user_id -> Set[WebSocket]
        self.active_connections: Dict[int, Set[WebSocket]] = {}
        # WebSocket -> user_id mapping
        self.websocket_to_user: Dict[WebSocket, int] = {}
        # Message queue for offline users: user_id -> List[messages]
        self.message_queues: Dict[int, List[dict]] = {}
        # Lock for thread-safe operations
        self._lock = asyncio.Lock()
    
    async def connect(self, websocket: WebSocket, user_id: int):
        """Register a new WebSocket connection."""
        await websocket.accept()
        
        async with self._lock:
            if user_id not in self.active_connections:
                self.active_connections[user_id] = set()
            
            self.active_connections[user_id].add(websocket)
            self.websocket_to_user[websocket] = user_id
        
        # Send queued messages if any
        await self._send_queued_messages(user_id, websocket)
    
    async def disconnect(self, websocket: WebSocket):
        """Unregister a WebSocket connection."""
        async with self._lock:
            user_id = self.websocket_to_user.pop(websocket, None)
            if user_id and user_id in self.active_connections:
                self.active_connections[user_id].discard(websocket)
                
                # Clean up if no more connections
                if not self.active_connections[user_id]:
                    del self.active_connections[user_id]
    
    async def send_personal_message(self, message: dict, user_id: int):
        """Send message to specific user."""
        async with self._lock:
            connections = self.active_connections.get(user_id, set())
            
            if connections:
                # User is online - send immediately
                disconnected = set()
                for connection in connections:
                    try:
                        await connection.send_json(message)
                    except Exception as e:
                        print(f"Error sending message to user {user_id}: {e}")
                        disconnected.add(connection)
                
                # Clean up disconnected connections
                for conn in disconnected:
                    await self.disconnect(conn)
            else:
                # User is offline - queue message
                if user_id not in self.message_queues:
                    self.message_queues[user_id] = []
                self.message_queues[user_id].append({
                    **message,
                    'queued_at': datetime.utcnow().isoformat()
                })
    
    async def send_to_multiple_users(self, message: dict, user_ids: List[int]):
        """Send message to multiple users."""
        for user_id in user_ids:
            await self.send_personal_message(message, user_id)
    
    async def broadcast(self, message: dict, exclude_user_ids: Set[int] = None):
        """Broadcast message to all connected users."""
        exclude_user_ids = exclude_user_ids or set()
        
        async with self._lock:
            for user_id, connections in self.active_connections.items():
                if user_id not in exclude_user_ids:
                    await self.send_personal_message(message, user_id)
    
    async def _send_queued_messages(self, user_id: int, websocket: WebSocket):
        """Send queued messages when user reconnects."""
        if user_id in self.message_queues:
            messages = self.message_queues[user_id]
            for message in messages:
                try:
                    await websocket.send_json(message)
                except Exception:
                    pass  # If fails, message stays in queue
            del self.message_queues[user_id]
    
    def is_connected(self, user_id: int) -> bool:
        """Check if user has active connections."""
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0

# Global connection manager instance
manager = ConnectionManager()

