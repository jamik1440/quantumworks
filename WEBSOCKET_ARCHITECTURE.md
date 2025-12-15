# 🔌 Real-Time WebSocket Architecture Design

## Executive Summary

This document provides a production-ready WebSocket architecture for QuantumWorks platform supporting chat, notifications, and live task status updates with scalability, security, and reliability guarantees.

---

## 1. 🏗️ Architecture Diagram (Text-Based)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │  React App   │  │  React App   │  │  React App   │            │
│  │  (User A)    │  │  (User B)    │  │  (User C)    │            │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘            │
│         │                  │                  │                     │
│         │ WebSocket        │ WebSocket        │ WebSocket           │
│         │ (wss://)         │ (wss://)         │ (wss://)            │
│         │ + JWT Token      │ + JWT Token      │ + JWT Token         │
└─────────┼──────────────────┼──────────────────┼─────────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FASTAPI WEBSOCKET LAYER                          │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │              WebSocket Manager                               │  │
│  │  - Connection Pool (user_id → WebSocket)                    │  │
│  │  - Authentication (JWT validation)                          │  │
│  │  - Message Router                                           │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │   Handler    │  │   Handler    │  │   Handler    │            │
│  │   Chat       │  │ Notification │  │ Task Update  │            │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘            │
│         │                  │                  │                     │
│         │ Publish          │ Publish          │ Publish             │
└─────────┼──────────────────┼──────────────────┼─────────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      REDIS PUB/SUB LAYER                            │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │   Channel    │  │   Channel    │  │   Channel    │            │
│  │ user:{id}    │  │ user:{id}    │  │ user:{id}    │            │
│  │ task:{id}    │  │ project:{id} │  │              │            │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘            │
│         │                  │                  │                     │
│         │ Subscribe        │ Subscribe        │ Subscribe           │
└─────────┼──────────────────┼──────────────────┼─────────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                                │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐            │
│  │   Service    │  │   Service    │  │   Service    │            │
│  │   Chat       │  │ Notification │  │   Task       │            │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘            │
│         │                  │                  │                     │
│         │ Write            │ Write            │ Write               │
│         ▼                  ▼                  ▼                     │
└─────────────────────────────────────────────────────────────────────┘
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                                 │
│                                                                     │
│                    PostgreSQL Database                              │
│              (chat_messages, tasks, notifications)                  │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                    MESSAGE FLOW EXAMPLE                             │
│                                                                     │
│  User A sends message →                                            │
│  → WebSocket Handler receives                                      │
│  → Validates & stores in DB                                        │
│  → Publishes to Redis: user:{receiver_id}                          │
│  → All subscribers (User B's connection) receive                   │
│  → WebSocket Manager sends to User B's WebSocket                   │
│  → User B receives message                                         │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. 📨 Message Flow Lifecycle

### 2.1 Connection Lifecycle

```
┌─────────────────────────────────────────────────────────────────────┐
│                    WEBSOCKET CONNECTION LIFECYCLE                   │
└─────────────────────────────────────────────────────────────────────┘

1. CLIENT INITIATES CONNECTION
   ↓
   Client: new WebSocket('wss://api.com/ws?token=jwt_token')
   ↓
2. SERVER ACCEPTS & AUTHENTICATES
   ↓
   Server: Verify JWT token
   ↓
   Server: Extract user_id from token
   ↓
   Server: Check user.is_active
   ↓
   Server: Register connection in ConnectionManager
   ↓
   Server: Subscribe to Redis channels (user:{id}, task:*)
   ↓
   Server: Send 'authenticated' message
   ↓
3. CLIENT CONFIRMS AUTHENTICATION
   ↓
   Client: Receives 'authenticated' → set isConnected = true
   ↓
4. ACTIVE CONNECTION STATE
   ↓
   ├─→ Client sends messages
   ├─→ Server receives messages
   ├─→ Server processes messages
   ├─→ Server publishes to Redis
   ├─→ Redis subscribers receive
   ├─→ Server forwards to recipients
   └─→ Client receives messages
   ↓
5. DISCONNECTION SCENARIOS
   ↓
   ├─→ Normal: Client closes connection
   │   └─→ Server: Unregister connection
   │   └─→ Server: Unsubscribe from Redis
   │
   ├─→ Network Error: Connection drops
   │   └─→ Server: Detect via heartbeat timeout
   │   └─→ Server: Cleanup connection
   │
   └─→ Token Expiry: Re-authenticate needed
       └─→ Server: Close connection with code 1008
       └─→ Client: Refresh token & reconnect
   ↓
6. RECONNECTION (if dropped)
   ↓
   Client: Auto-reconnect with exponential backoff
   ↓
   Server: Handle reconnection (may have pending messages)
   ↓
   Server: Send queued messages if any
```

### 2.2 Message Delivery Flow (Chat Example)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CHAT MESSAGE DELIVERY FLOW                       │
└─────────────────────────────────────────────────────────────────────┘

STEP 1: CLIENT SENDS MESSAGE
   ↓
   Client A: socket.send({
     type: 'chat_message',
     receiver_id: 123,
     content: 'Hello!'
   })
   ↓
STEP 2: SERVER RECEIVES & VALIDATES
   ↓
   WebSocket Handler:
   - Validate sender_id from JWT
   - Validate receiver_id exists
   - Validate message format
   - Rate limit check
   ↓
STEP 3: PERSIST TO DATABASE
   ↓
   Database: INSERT INTO chat_messages
   - sender_id, receiver_id, content, created_at
   ↓
STEP 4: PUBLISH TO REDIS
   ↓
   Redis: PUBLISH user:123 {
     type: 'chat_message',
     message_id: 456,
     sender_id: 789,
     content: 'Hello!',
     timestamp: '2024-01-01T12:00:00Z'
   }
   ↓
STEP 5: REDIS SUBSCRIBERS NOTIFY
   ↓
   All WebSocket handlers subscribed to user:123 receive message
   ↓
STEP 6: DELIVER TO RECIPIENT
   ↓
   If User B (id: 123) is connected:
     → WebSocket Manager finds User B's connection
     → Send message via WebSocket
     → User B receives message
   ↓
   If User B is offline:
     → Message stored in DB (already done)
     → Will be delivered on next connection
     → Or fetched via REST API
   ↓
STEP 7: DELIVERY CONFIRMATION (Optional)
   ↓
   Client B: socket.send({
     type: 'message_received',
     message_id: 456
   })
   ↓
   Server: UPDATE chat_messages SET read_at = NOW() WHERE id = 456
```

### 2.3 Notification Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    NOTIFICATION DELIVERY FLOW                       │
└─────────────────────────────────────────────────────────────────────┘

STEP 1: EVENT OCCURS
   ↓
   Application: Task status changed, new project posted, etc.
   ↓
STEP 2: CREATE NOTIFICATION
   ↓
   Service: Create notification in DB
   - user_id, type, title, message, link
   ↓
STEP 3: PUBLISH TO REDIS
   ↓
   Redis: PUBLISH user:{user_id} {
     type: 'notification',
     notification_id: 789,
     notification_type: 'task_status_changed',
     title: 'Task Updated',
     message: 'Your task "Build API" is now in progress',
     link: '/tasks/123',
     created_at: '2024-01-01T12:00:00Z'
   }
   ↓
STEP 4: DELIVER TO USER
   ↓
   If user is connected:
     → WebSocket Manager sends notification
     → Client shows toast/banner
   ↓
   If user is offline:
     → Notification stored in DB
     → Shown when user connects or visits notifications page
```

### 2.4 Task Status Update Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                  TASK STATUS UPDATE FLOW                            │
└─────────────────────────────────────────────────────────────────────┘

STEP 1: STATUS CHANGE
   ↓
   API Endpoint: PATCH /tasks/123/status
   - Update task.status = 'in_progress'
   ↓
STEP 2: PUBLISH TO MULTIPLE CHANNELS
   ↓
   Redis: PUBLISH task:123 {
     type: 'task_status_update',
     task_id: 123,
     status: 'in_progress',
     updated_by: 456,
     timestamp: '2024-01-01T12:00:00Z'
   }
   ↓
   Redis: PUBLISH user:{freelancer_id} {
     type: 'task_status_update',
     task_id: 123,
     status: 'in_progress',
     ...
   }
   ↓
   Redis: PUBLISH user:{project_author_id} {
     type: 'task_status_update',
     task_id: 123,
     status: 'in_progress',
     ...
   }
   ↓
STEP 3: NOTIFY INTERESTED PARTIES
   ↓
   - Freelancer working on task
   - Project author
   - Admin users watching project
   ↓
STEP 4: CLIENT UPDATES UI
   ↓
   React components listening to task updates
   → Update task status in UI
   → Show notification
   → Refresh task list if needed
```

---

## 3. 💻 FastAPI WebSocket Code Structure

### 3.1 Connection Manager

```python
# backend/websocket/connection_manager.py

from typing import Dict, Set, List
from fastapi import WebSocket
import json
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
                        print(f"Error sending message: {e}")
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
```

### 3.2 Redis Pub/Sub Manager

```python
# backend/websocket/redis_manager.py

import redis.asyncio as redis
import json
import asyncio
from typing import Callable, Optional
import os

class RedisManager:
    """Manages Redis pub/sub for message distribution."""
    
    def __init__(self):
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.redis_client = redis.from_url(redis_url, decode_responses=True)
        self.pubsub = None
        self.subscribed_channels: Set[str] = set()
        self.message_handlers: Dict[str, Callable] = {}
        self._running = False
    
    async def connect(self):
        """Initialize Redis connection."""
        await self.redis_client.ping()
        self.pubsub = self.redis_client.pubsub()
        self._running = True
    
    async def disconnect(self):
        """Close Redis connection."""
        self._running = False
        if self.pubsub:
            await self.pubsub.unsubscribe()
            await self.pubsub.close()
        await self.redis_client.close()
    
    async def publish(self, channel: str, message: dict):
        """Publish message to Redis channel."""
        await self.redis_client.publish(channel, json.dumps(message))
    
    async def subscribe(self, channel: str, handler: Callable):
        """Subscribe to Redis channel with handler."""
        if channel not in self.subscribed_channels:
            await self.pubsub.subscribe(channel)
            self.subscribed_channels.add(channel)
            self.message_handlers[channel] = handler
            
            # Start listener if not running
            if self._running and not hasattr(self, '_listener_task'):
                self._listener_task = asyncio.create_task(self._listen())
    
    async def unsubscribe(self, channel: str):
        """Unsubscribe from Redis channel."""
        if channel in self.subscribed_channels:
            await self.pubsub.unsubscribe(channel)
            self.subscribed_channels.discard(channel)
            if channel in self.message_handlers:
                del self.message_handlers[channel]
    
    async def _listen(self):
        """Listen for messages from subscribed channels."""
        while self._running:
            try:
                message = await self.pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                if message:
                    channel = message['channel']
                    data = json.loads(message['data'])
                    
                    if channel in self.message_handlers:
                        handler = self.message_handlers[channel]
                        await handler(channel, data)
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                print(f"Redis listen error: {e}")
                await asyncio.sleep(1)

# Global Redis manager instance
redis_manager = RedisManager()
```

### 3.3 WebSocket Authentication

```python
# backend/websocket/auth.py

from fastapi import WebSocket, WebSocketDisconnect, status
from jose import jwt
from sqlalchemy.orm import Session
from backend import auth, models, database

async def authenticate_websocket(
    websocket: WebSocket,
    token: str
) -> models.User:
    """Authenticate WebSocket connection using JWT token."""
    
    try:
        # Verify token
        payload = jwt.decode(
            token, 
            auth.SECRET_KEY, 
            algorithms=[auth.ALGORITHM]
        )
        
        # Validate token type
        if payload.get("type") != "access":
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            raise ValueError("Invalid token type")
        
        email = payload.get("sub")
        if not email:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            raise ValueError("Invalid token")
        
        # Get user from database
        db = next(database.get_db())
        try:
            user = db.query(models.User).filter(
                models.User.email == email
            ).first()
            
            if not user or not user.is_active:
                await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
                raise ValueError("User not found or inactive")
            
            return user
        finally:
            db.close()
            
    except jwt.ExpiredSignatureError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        raise ValueError("Token expired")
    except jwt.JWTError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        raise ValueError("Invalid token")
```

### 3.4 WebSocket Router/Handler

```python
# backend/websocket/router.py

from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict
import json
from backend.websocket.connection_manager import manager
from backend.websocket.redis_manager import redis_manager
from backend.websocket.auth import authenticate_websocket
from backend.websocket.handlers import (
    handle_chat_message,
    handle_typing_indicator,
    handle_heartbeat
)

class WebSocketRouter:
    """Routes WebSocket messages to appropriate handlers."""
    
    def __init__(self):
        self.handlers: Dict[str, callable] = {
            'chat_message': handle_chat_message,
            'typing': handle_typing_indicator,
            'heartbeat': handle_heartbeat,
            'read_receipt': self._handle_read_receipt,
        }
    
    async def route_message(self, websocket: WebSocket, user_id: int, message: dict):
        """Route incoming message to appropriate handler."""
        message_type = message.get('type')
        
        if message_type in self.handlers:
            handler = self.handlers[message_type]
            await handler(websocket, user_id, message)
        else:
            # Unknown message type
            await websocket.send_json({
                'type': 'error',
                'message': f'Unknown message type: {message_type}'
            })
    
    async def _handle_read_receipt(self, websocket: WebSocket, user_id: int, message: dict):
        """Handle read receipt confirmation."""
        message_id = message.get('message_id')
        if message_id:
            # Update message as read in database
            from backend import database, models
            db = next(database.get_db())
            try:
                msg = db.query(models.ChatMessage).filter(
                    models.ChatMessage.id == message_id,
                    models.ChatMessage.receiver_id == user_id
                ).first()
                if msg:
                    from datetime import datetime
                    msg.read_at = datetime.utcnow()
                    db.commit()
            finally:
                db.close()

# Global router instance
router = WebSocketRouter()
```

### 3.5 Message Handlers

```python
# backend/websocket/handlers.py

from fastapi import WebSocket
from sqlalchemy.orm import Session
from datetime import datetime
from backend import database, models
from backend.websocket.connection_manager import manager
from backend.websocket.redis_manager import redis_manager

async def handle_chat_message(websocket: WebSocket, sender_id: int, message: dict):
    """Handle incoming chat message."""
    receiver_id = message.get('receiver_id')
    content = message.get('content')
    
    if not receiver_id or not content:
        await websocket.send_json({
            'type': 'error',
            'message': 'Invalid message format'
        })
        return
    
    # Validate receiver exists
    db = next(database.get_db())
    try:
        receiver = db.query(models.User).filter(
            models.User.id == receiver_id,
            models.User.is_active == True
        ).first()
        
        if not receiver:
            await websocket.send_json({
                'type': 'error',
                'message': 'Receiver not found'
            })
            return
        
        # Store message in database
        db_message = models.ChatMessage(
            sender_id=sender_id,
            receiver_id=receiver_id,
            content=content,
            message_type='text',
            created_at=datetime.utcnow()
        )
        db.add(db_message)
        db.commit()
        db.refresh(db_message)
        
        # Prepare message for delivery
        message_data = {
            'type': 'chat_message',
            'message_id': db_message.id,
            'sender_id': sender_id,
            'receiver_id': receiver_id,
            'content': content,
            'timestamp': db_message.created_at.isoformat()
        }
        
        # Publish to Redis for distribution
        await redis_manager.publish(f'user:{receiver_id}', message_data)
        
        # Send confirmation to sender
        await websocket.send_json({
            'type': 'message_sent',
            'message_id': db_message.id
        })
        
    except Exception as e:
        db.rollback()
        await websocket.send_json({
            'type': 'error',
            'message': f'Failed to send message: {str(e)}'
        })
    finally:
        db.close()

async def handle_typing_indicator(websocket: WebSocket, user_id: int, message: dict):
    """Handle typing indicator."""
    receiver_id = message.get('receiver_id')
    is_typing = message.get('is_typing', True)
    
    if receiver_id:
        # Forward typing indicator to receiver
        await manager.send_personal_message({
            'type': 'typing_indicator',
            'sender_id': user_id,
            'is_typing': is_typing
        }, receiver_id)

async def handle_heartbeat(websocket: WebSocket, user_id: int, message: dict):
    """Handle heartbeat/ping message."""
    await websocket.send_json({
        'type': 'pong',
        'timestamp': datetime.utcnow().isoformat()
    })
```

### 3.6 Main WebSocket Endpoint

```python
# backend/websocket/endpoints.py

from fastapi import WebSocket, WebSocketDisconnect, status, Query
from backend.websocket.connection_manager import manager
from backend.websocket.redis_manager import redis_manager
from backend.websocket.router import router
from backend.websocket.auth import authenticate_websocket
import asyncio

async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...)
):
    """Main WebSocket endpoint for real-time communication."""
    
    try:
        # Authenticate user
        user = await authenticate_websocket(websocket, token)
        user_id = user.id
        
        # Connect to connection manager
        await manager.connect(websocket, user_id)
        
        # Subscribe to user's Redis channels
        async def user_message_handler(channel: str, message: dict):
            """Handle messages from Redis for this user."""
            await manager.send_personal_message(message, user_id)
        
        user_channel = f'user:{user_id}'
        await redis_manager.subscribe(user_channel, user_message_handler)
        
        # Subscribe to task updates if user has active tasks
        # (This would be more sophisticated in production)
        task_channels = await _get_user_task_channels(user_id)
        for channel in task_channels:
            async def task_handler(ch: str, msg: dict):
                await manager.send_personal_message(msg, user_id)
            await redis_manager.subscribe(channel, task_handler)
        
        # Send authentication confirmation
        await websocket.send_json({
            'type': 'authenticated',
            'user_id': user_id,
            'timestamp': datetime.utcnow().isoformat()
        })
        
        # Start heartbeat task
        heartbeat_task = asyncio.create_task(_heartbeat_loop(websocket, user_id))
        
        # Message loop
        try:
            while True:
                data = await websocket.receive_json()
                
                # Handle heartbeat
                if data.get('type') == 'ping':
                    await websocket.send_json({'type': 'pong'})
                    continue
                
                # Route message
                await router.route_message(websocket, user_id, data)
                
        except WebSocketDisconnect:
            pass
        finally:
            # Cleanup
            heartbeat_task.cancel()
            await manager.disconnect(websocket)
            await redis_manager.unsubscribe(user_channel)
            for channel in task_channels:
                await redis_manager.unsubscribe(channel)
    
    except Exception as e:
        print(f"WebSocket error: {e}")
        try:
            await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        except:
            pass

async def _heartbeat_loop(websocket: WebSocket, user_id: int):
    """Send periodic heartbeat to keep connection alive."""
    try:
        while True:
            await asyncio.sleep(30)  # Send every 30 seconds
            await websocket.send_json({
                'type': 'heartbeat',
                'timestamp': datetime.utcnow().isoformat()
            })
    except asyncio.CancelledError:
        pass
    except Exception:
        pass

async def _get_user_task_channels(user_id: int) -> list:
    """Get Redis channels for user's active tasks."""
    # In production, query database for user's active tasks
    # For now, return empty list
    return []
```

### 3.7 Integration with FastAPI App

```python
# backend/main.py (ADD THIS)

from fastapi import FastAPI
from backend.websocket.endpoints import websocket_endpoint
from backend.websocket.redis_manager import redis_manager

app = FastAPI()

# Initialize Redis on startup
@app.on_event("startup")
async def startup_event():
    await redis_manager.connect()

@app.on_event("shutdown")
async def shutdown_event():
    await redis_manager.disconnect()

# WebSocket endpoint
app.websocket("/ws")(websocket_endpoint)
```

---

## 4. 🔄 Reconnection Strategy (Frontend)

### 4.1 React WebSocket Hook

```typescript
// hooks/useWebSocket.ts

import { useEffect, useRef, useState, useCallback } from 'react';
import { tokenStorage } from '../services/authStorage';

interface WebSocketMessage {
  type: string;
  [key: string]: any;
}

interface UseWebSocketOptions {
  onMessage?: (message: WebSocketMessage) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  onClose?: () => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const {
    onMessage,
    onError,
    onOpen,
    onClose,
    reconnectInterval = 3000,
    maxReconnectAttempts = 10
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageQueueRef = useRef<WebSocketMessage[]>([]);

  const connect = useCallback(() => {
    const token = tokenStorage.getAccessToken();
    if (!token) {
      console.warn('No token available for WebSocket connection');
      return;
    }

    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${wsProtocol}//${window.location.host}/ws?token=${encodeURIComponent(token)}`;

    try {
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setReconnectAttempts(0);
        
        // Send queued messages
        while (messageQueueRef.current.length > 0) {
          const msg = messageQueueRef.current.shift();
          if (msg) socket.send(JSON.stringify(msg));
        }
        
        onOpen?.();
      };

      socket.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          
          // Handle authentication
          if (data.type === 'authenticated') {
            console.log('WebSocket authenticated');
            return;
          }
          
          // Handle heartbeat
          if (data.type === 'heartbeat' || data.type === 'pong') {
            return;
          }
          
          onMessage?.(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        onError?.(error);
      };

      socket.onclose = (event) => {
        console.log('WebSocket closed', event.code, event.reason);
        setIsConnected(false);
        onClose?.();
        
        // Reconnect logic
        if (reconnectAttempts < maxReconnectAttempts) {
          const delay = Math.min(
            reconnectInterval * Math.pow(2, reconnectAttempts),
            30000 // Max 30 seconds
          );
          
          console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, delay);
        } else {
          console.error('Max reconnection attempts reached');
        }
      };

      socketRef.current = socket;
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
    }
  }, [token, reconnectAttempts, maxReconnectAttempts, reconnectInterval, onMessage, onError, onOpen, onClose]);

  const sendMessage = useCallback((message: WebSocketMessage) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      // Queue message for when connection is established
      messageQueueRef.current.push(message);
      
      // Try to reconnect if not already connecting
      if (!isConnected && reconnectAttempts < maxReconnectAttempts) {
        connect();
      }
    }
  }, [isConnected, reconnectAttempts, maxReconnectAttempts, connect]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
    setIsConnected(false);
    setReconnectAttempts(maxReconnectAttempts); // Prevent reconnection
  }, [maxReconnectAttempts]);

  useEffect(() => {
    connect();
    
    // Heartbeat to keep connection alive
    const heartbeatInterval = setInterval(() => {
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        sendMessage({ type: 'ping' });
      }
    }, 30000); // Every 30 seconds

    return () => {
      clearInterval(heartbeatInterval);
      disconnect();
    };
  }, []); // Only on mount

  return {
    isConnected,
    sendMessage,
    disconnect,
    reconnect: connect
  };
};
```

### 4.2 Updated Chat Context

```typescript
// contexts/ChatContext.tsx (UPDATED)

import { useWebSocket } from '../hooks/useWebSocket';

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<ChatContact[]>([]);

  const { isConnected, sendMessage } = useWebSocket({
    onMessage: (data) => {
      if (data.type === 'chat_message') {
        const newMessage: Message = {
          id: data.message_id.toString(),
          senderId: data.sender_id.toString(),
          receiverId: data.receiver_id.toString(),
          content: data.content,
          timestamp: data.timestamp,
          read: false
        };
        setMessages(prev => [...prev, newMessage]);
      } else if (data.type === 'typing_indicator') {
        // Handle typing indicator
      }
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
    }
  });

  const handleSendMessage = (content: string) => {
    if (!activeContactId) return;

    sendMessage({
      type: 'chat_message',
      receiver_id: parseInt(activeContactId),
      content: content
    });
  };

  // ... rest of component
};
```

---

## 5. 📊 Scalability Plan

### 5.1 Horizontal Scaling with Redis

```
┌─────────────────────────────────────────────────────────────┐
│              MULTI-SERVER ARCHITECTURE                      │
└─────────────────────────────────────────────────────────────┘

Server 1 (FastAPI)        Server 2 (FastAPI)        Server 3 (FastAPI)
     │                          │                          │
     │                          │                          │
     └──────────┬───────────────┴───────────────┬─────────┘
                │                               │
                ▼                               ▼
        ┌───────────────────────────────────────────┐
        │          Redis Pub/Sub                    │
        │  - Single source of truth                 │
        │  - Message distribution                   │
        │  - Connection-agnostic                    │
        └───────────────────────────────────────────┘
                │
                ▼
        ┌───────────────────────────────────────────┐
        │       PostgreSQL Database                 │
        └───────────────────────────────────────────┘

Benefits:
- Load balancing across multiple servers
- WebSocket connections distributed
- All servers receive messages via Redis
- No single point of failure
```

### 5.2 Redis Channel Strategy

```python
# Channel naming conventions
user:{user_id}          # Personal messages, notifications
task:{task_id}          # Task status updates
project:{project_id}    # Project updates
room:{room_id}          # Group chat rooms (future)
broadcast               # System-wide announcements
```

### 5.3 Connection Pooling

```python
# backend/database.py (UPDATED)

from sqlalchemy.pool import QueuePool

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=3600
)
```

---

## 6. ✅ Message Delivery Guarantees

### 6.1 Delivery Levels

1. **At-Least-Once Delivery:**
   - Messages stored in database
   - Redis pub/sub for distribution
   - If delivery fails, message remains in DB
   - Client fetches missed messages on reconnect

2. **Read Receipts:**
   - Client sends read_receipt on message display
   - Server updates read_at timestamp
   - Enables "read" status indicators

3. **Offline Message Queue:**
   - Messages queued in ConnectionManager
   - Delivered on next connection
   - Also available via REST API

### 6.2 Message Ordering

- Messages ordered by `created_at` timestamp
- Database enforces chronological order
- Redis pub/sub maintains order per channel
- Clients sort by timestamp for display

---

## 7. 🔒 Security Considerations

1. **Authentication:**
   - JWT token validation on connection
   - Token expiry handling
   - User active status check

2. **Authorization:**
   - Validate sender can send to receiver
   - Validate user can subscribe to channels
   - Rate limiting per user

3. **Message Validation:**
   - Sanitize message content
   - Size limits (e.g., 10KB per message)
   - Type validation

4. **Rate Limiting:**
   ```python
   # Rate limit: 100 messages per minute per user
   from collections import defaultdict
   from datetime import datetime, timedelta
   
   message_counts = defaultdict(list)
   
   async def check_rate_limit(user_id: int) -> bool:
       now = datetime.utcnow()
       minute_ago = now - timedelta(minutes=1)
       
       # Clean old entries
       message_counts[user_id] = [
           ts for ts in message_counts[user_id] 
           if ts > minute_ago
       ]
       
       if len(message_counts[user_id]) >= 100:
           return False
       
       message_counts[user_id].append(now)
       return True
   ```

---

## 8. 📋 Implementation Checklist

- [ ] Set up Redis instance
- [ ] Implement ConnectionManager
- [ ] Implement RedisManager
- [ ] Create WebSocket authentication
- [ ] Implement message handlers
- [ ] Create WebSocket endpoint
- [ ] Frontend: Create useWebSocket hook
- [ ] Frontend: Implement reconnection logic
- [ ] Add rate limiting
- [ ] Add message validation
- [ ] Test with multiple concurrent connections
- [ ] Monitor performance and optimize
- [ ] Add logging and error handling
- [ ] Document API for frontend team

---

**Document Version:** 1.0  
**Last Updated:** 2024

