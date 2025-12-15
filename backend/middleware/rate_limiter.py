"""
Rate Limiting Middleware for FastAPI
Protects against brute force and API abuse
"""
from fastapi import Request, HTTPException
from datetime import datetime, timedelta
from collections import defaultdict
from typing import Dict, List
import asyncio


class RateLimiter:
    """
    In-memory rate limiter using sliding window algorithm.
    For production, use Redis-based implementation.
    """
    
    def __init__(self):
        self.requests: Dict[str, List[datetime]] = defaultdict(list)
        self.blocked_until: Dict[str, datetime] = {}
        self.cleanup_task = None
    
    async def check_rate_limit(
        self,
        key: str,
        max_requests: int,
        window_seconds: int,
        block_duration_seconds: int = 300
    ) -> bool:
        """
        Check if request is within rate limit.
        
        Args:
            key: Unique identifier (IP, user_id, etc.)
            max_requests: Maximum requests allowed in window
            window_seconds: Time window in seconds
            block_duration_seconds: How long to block after exceeding limit
        
        Raises:
            HTTPException: If rate limit exceeded
        
        Returns:
            True if request is allowed
        """
        now = datetime.utcnow()
        
        # Check if currently blocked
        if key in self.blocked_until:
            if now < self.blocked_until[key]:
                remaining = int((self.blocked_until[key] - now).total_seconds())
                raise HTTPException(
                    status_code=429,
                    detail=f"Too many requests. Blocked for {remaining} more seconds.",
                    headers={"Retry-After": str(remaining)}
                )
            else:
                # Unblock
                del self.blocked_until[key]
                self.requests[key] = []
        
        # Clean old requests outside the window
        window_start = now - timedelta(seconds=window_seconds)
        self.requests[key] = [
            req_time for req_time in self.requests[key]
            if req_time > window_start
        ]
        
        # Check if limit exceeded
        if len(self.requests[key]) >= max_requests:
            # Block the key
            self.blocked_until[key] = now + timedelta(seconds=block_duration_seconds)
            
            raise HTTPException(
                status_code=429,
                detail=f"Rate limit exceeded. Max {max_requests} requests per {window_seconds} seconds. Blocked for {block_duration_seconds} seconds.",
                headers={"Retry-After": str(block_duration_seconds)}
            )
        
        # Add current request
        self.requests[key].append(now)
        return True
    
    async def cleanup_old_entries(self):
        """Periodic cleanup of old entries to prevent memory leak"""
        while True:
            await asyncio.sleep(300)  # Every 5 minutes
            now = datetime.utcnow()
            
            # Clean old request records
            keys_to_delete = []
            for key, times in self.requests.items():
                # Remove entries older than 1 hour
                cutoff = now - timedelta(hours=1)
                self.requests[key] = [t for t in times if t > cutoff]
                
                if not self.requests[key]:
                    keys_to_delete.append(key)
            
            for key in keys_to_delete:
                del self.requests[key]
            
            # Clean expired blocks
            expired_blocks = [
                key for key, until in self.blocked_until.items()
                if now > until
            ]
            for key in expired_blocks:
                del self.blocked_until[key]
    
    def start_cleanup_task(self):
        """Start background cleanup task"""
        if self.cleanup_task is None:
            self.cleanup_task = asyncio.create_task(self.cleanup_old_entries())


# Global rate limiter instance
rate_limiter = RateLimiter()


# Dependency functions for different rate limits

async def general_rate_limit(request: Request):
    """General rate limit: 100 requests per minute per IP"""
    client_ip = request.client.host
    await rate_limiter.check_rate_limit(
        key=f"general:{client_ip}",
        max_requests=100,
        window_seconds=60
    )


async def login_rate_limit(request: Request):
    """Strict rate limit for login: 5 attempts per 5 minutes per IP"""
    client_ip = request.client.host
    await rate_limiter.check_rate_limit(
        key=f"login:{client_ip}",
        max_requests=5,
        window_seconds=300,
        block_duration_seconds=900  # Block for 15 minutes
    )


async def register_rate_limit(request: Request):
    """Rate limit for registration: 3 accounts per hour per IP"""
    client_ip = request.client.host
    await rate_limiter.check_rate_limit(
        key=f"register:{client_ip}",
        max_requests=3,
        window_seconds=3600,
        block_duration_seconds=3600
    )


async def ai_rate_limit(request: Request):
    """Rate limit for AI endpoints: 10 requests per hour per IP"""
    client_ip = request.client.host
    await rate_limiter.check_rate_limit(
        key=f"ai:{client_ip}",
        max_requests=10,
        window_seconds=3600,
        block_duration_seconds=1800
    )


async def admin_rate_limit(request: Request):
    """Rate limit for admin endpoints: 50 requests per minute per IP"""
    client_ip = request.client.host
    await rate_limiter.check_rate_limit(
        key=f"admin:{client_ip}",
        max_requests=50,
        window_seconds=60
    )
