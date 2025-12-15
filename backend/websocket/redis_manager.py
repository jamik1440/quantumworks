"""
Redis Pub/Sub Manager for WebSocket message distribution.
"""
try:
    import redis.asyncio as redis
except ImportError:
    # Fallback for older redis versions
    import redis
    import asyncio
    redis = None

import json
import asyncio
from typing import Callable, Dict, Set, Optional
import os

class RedisManager:
    """Manages Redis pub/sub for message distribution."""
    
    def __init__(self):
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        if redis:
            self.redis_client = redis.from_url(redis_url, decode_responses=True)
        else:
            # Fallback: use sync redis (not recommended for production)
            self.redis_client = None
        self.pubsub = None
        self.subscribed_channels: Set[str] = set()
        self.message_handlers: Dict[str, Callable] = {}
        self._running = False
        self._listener_task: Optional[asyncio.Task] = None
    
    async def connect(self):
        """Initialize Redis connection."""
        if not self.redis_client:
            raise RuntimeError("Redis not available. Install redis[asyncio] package.")
        await self.redis_client.ping()
        self.pubsub = self.redis_client.pubsub()
        self._running = True
    
    async def disconnect(self):
        """Close Redis connection."""
        self._running = False
        if self._listener_task:
            self._listener_task.cancel()
            try:
                await self._listener_task
            except asyncio.CancelledError:
                pass
        
        if self.pubsub:
            await self.pubsub.unsubscribe()
            await self.pubsub.close()
        
        if self.redis_client:
            await self.redis_client.close()
    
    async def publish(self, channel: str, message: dict):
        """Publish message to Redis channel."""
        if not self.redis_client:
            return  # Silently fail if Redis not available
        await self.redis_client.publish(channel, json.dumps(message))
    
    async def subscribe(self, channel: str, handler: Callable):
        """Subscribe to Redis channel with handler."""
        if not self.pubsub:
            return
        
        if channel not in self.subscribed_channels:
            await self.pubsub.subscribe(channel)
            self.subscribed_channels.add(channel)
            self.message_handlers[channel] = handler
            
            # Start listener if not running
            if self._running and not self._listener_task:
                self._listener_task = asyncio.create_task(self._listen())
    
    async def unsubscribe(self, channel: str):
        """Unsubscribe from Redis channel."""
        if not self.pubsub:
            return
        
        if channel in self.subscribed_channels:
            await self.pubsub.unsubscribe(channel)
            self.subscribed_channels.discard(channel)
            if channel in self.message_handlers:
                del self.message_handlers[channel]
    
    async def _listen(self):
        """Listen for messages from subscribed channels."""
        while self._running and self.pubsub:
            try:
                message = await self.pubsub.get_message(
                    ignore_subscribe_messages=True, 
                    timeout=1.0
                )
                if message:
                    channel = message['channel']
                    data = json.loads(message['data'])
                    
                    if channel in self.message_handlers:
                        handler = self.message_handlers[channel]
                        try:
                            await handler(channel, data)
                        except Exception as e:
                            print(f"Error in message handler for {channel}: {e}")
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                print(f"Redis listen error: {e}")
                await asyncio.sleep(1)

# Global Redis manager instance
redis_manager = RedisManager()

