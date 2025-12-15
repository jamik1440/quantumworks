# WebSocket Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
pip install redis[asyncio]
```

### 2. Set Up Redis

```bash
# Using Docker
docker run -d -p 6379:6379 redis:latest

# Or install locally
# Windows: Download from https://redis.io/download
# macOS: brew install redis
# Linux: sudo apt-get install redis-server
```

Set environment variable:
```bash
export REDIS_URL="redis://localhost:6379"
```

### 3. Update main.py

Add to `backend/main.py`:

```python
from backend.websocket.endpoints import websocket_endpoint
from backend.websocket.redis_manager import redis_manager

# WebSocket endpoint
app.websocket("/ws")(websocket_endpoint)

# Initialize Redis on startup
@app.on_event("startup")
async def startup_event():
    try:
        await redis_manager.connect()
        print("✓ Redis connected")
    except Exception as e:
        print(f"⚠ Redis not available: {e}")

@app.on_event("shutdown")
async def shutdown_event():
    await redis_manager.disconnect()
```

### 4. Frontend Integration

```typescript
// In your component
import { useWebSocket } from '../hooks/useWebSocket';

const { isConnected, sendMessage } = useWebSocket({
  onMessage: (data) => {
    if (data.type === 'chat_message') {
      // Handle chat message
    } else if (data.type === 'notification') {
      // Handle notification
    }
  }
});

// Send message
sendMessage({
  type: 'chat_message',
  receiver_id: 123,
  content: 'Hello!'
});
```

## Testing

```bash
# Start Redis
redis-server

# Start FastAPI
uvicorn backend.main:app --reload

# Test WebSocket connection
# Use browser console or websocket testing tool
```

## Production Checklist

- [ ] Redis server configured
- [ ] Redis persistence enabled
- [ ] Redis password authentication
- [ ] WSS (secure WebSocket) enabled
- [ ] Rate limiting implemented
- [ ] Monitoring/logging setup
- [ ] Load testing completed
- [ ] Error handling tested
- [ ] Reconnection logic tested

