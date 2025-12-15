"""
AI Endpoint Protection
Prevents abuse of expensive AI API calls
"""
from datetime import datetime, timedelta
from collections import defaultdict
from typing import Dict
from fastapi import HTTPException, Depends
from backend import models, auth
import logging

logger = logging.getLogger(__name__)


class AIEndpointProtection:
    """
    Tracks and limits AI API usage to prevent cost abuse.
    Implements per-user quotas and cost tracking.
    """
    
    def __init__(self):
        # Track usage: {user_id: {'count': int, 'cost': float, 'reset_time': datetime}}
        self.usage_tracking: Dict[int, dict] = defaultdict(lambda: {
            'count': 0,
            'cost': 0.0,
            'reset_time': datetime.utcnow() + timedelta(hours=1)
        })
        
        # Track daily limits separately
        self.daily_usage: Dict[int, dict] = defaultdict(lambda: {
            'count': 0,
            'cost': 0.0,
            'reset_time': datetime.utcnow() + timedelta(days=1)
        })
    
    async def check_ai_quota(
        self,
        user_id: int,
        user_role: str = "user",
        endpoint_type: str = "general"
    ):
        """
        Check if user has exceeded AI usage quota.
        
        Args:
            user_id: User ID
            user_role: User role (affects limits)
            endpoint_type: Type of AI endpoint (parse, match, suggest, etc.)
        
        Raises:
            HTTPException: If quota exceeded
        """
        now = datetime.utcnow()
        
        # Define limits based on user role
        hourly_limits = {
            "admin": {"count": 100, "cost": 10.0},
            "employer": {"count": 20, "cost": 2.0},
            "freelancer": {"count": 10, "cost": 1.0},
            "user": {"count": 5, "cost": 0.5}
        }
        
        daily_limits = {
            "admin": {"count": 1000, "cost": 100.0},
            "employer": {"count": 100, "cost": 10.0},
            "freelancer": {"count": 50, "cost": 5.0},
            "user": {"count": 20, "cost": 2.0}
        }
        
        user_hourly_limit = hourly_limits.get(user_role, hourly_limits["user"])
        user_daily_limit = daily_limits.get(user_role, daily_limits["user"])
        
        # Reset hourly tracking if window expired
        if now > self.usage_tracking[user_id]['reset_time']:
            self.usage_tracking[user_id] = {
                'count': 0,
                'cost': 0.0,
                'reset_time': now + timedelta(hours=1)
            }
        
        # Reset daily tracking if window expired
        if now > self.daily_usage[user_id]['reset_time']:
            self.daily_usage[user_id] = {
                'count': 0,
                'cost': 0.0,
                'reset_time': now + timedelta(days=1)
            }
        
        # Check hourly limits
        if self.usage_tracking[user_id]['count'] >= user_hourly_limit['count']:
            remaining_seconds = int((self.usage_tracking[user_id]['reset_time'] - now).total_seconds())
            raise HTTPException(
                status_code=429,
                detail=f"Hourly AI quota exceeded. Limit: {user_hourly_limit['count']} requests/hour. Resets in {remaining_seconds // 60} minutes.",
                headers={"Retry-After": str(remaining_seconds)}
            )
        
        if self.usage_tracking[user_id]['cost'] >= user_hourly_limit['cost']:
            remaining_seconds = int((self.usage_tracking[user_id]['reset_time'] - now).total_seconds())
            raise HTTPException(
                status_code=429,
                detail=f"Hourly AI cost quota exceeded. Limit: ${user_hourly_limit['cost']}/hour. Resets in {remaining_seconds // 60} minutes.",
                headers={"Retry-After": str(remaining_seconds)}
            )
        
        # Check daily limits
        if self.daily_usage[user_id]['count'] >= user_daily_limit['count']:
            remaining_seconds = int((self.daily_usage[user_id]['reset_time'] - now).total_seconds())
            raise HTTPException(
                status_code=429,
                detail=f"Daily AI quota exceeded. Limit: {user_daily_limit['count']} requests/day. Resets in {remaining_seconds // 3600} hours.",
                headers={"Retry-After": str(remaining_seconds)}
            )
        
        if self.daily_usage[user_id]['cost'] >= user_daily_limit['cost']:
            remaining_seconds = int((self.daily_usage[user_id]['reset_time'] - now).total_seconds())
            raise HTTPException(
                status_code=429,
                detail=f"Daily AI cost quota exceeded. Limit: ${user_daily_limit['cost']}/day. Resets in {remaining_seconds // 3600} hours.",
                headers={"Retry-After": str(remaining_seconds)}
            )
    
    def record_ai_usage(
        self,
        user_id: int,
        endpoint_type: str,
        estimated_cost: float = 0.01,
        tokens_used: int = 0
    ):
        """
        Record AI API usage.
        
        Args:
            user_id: User ID
            endpoint_type: Type of endpoint used
            estimated_cost: Estimated cost of the API call
            tokens_used: Number of tokens used (if applicable)
        """
        # Update hourly tracking
        self.usage_tracking[user_id]['count'] += 1
        self.usage_tracking[user_id]['cost'] += estimated_cost
        
        # Update daily tracking
        self.daily_usage[user_id]['count'] += 1
        self.daily_usage[user_id]['cost'] += estimated_cost
        
        # Log usage
        logger.info(
            f"AI usage recorded: user_id={user_id}, endpoint={endpoint_type}, "
            f"cost=${estimated_cost:.4f}, tokens={tokens_used}"
        )
    
    def get_usage_stats(self, user_id: int) -> dict:
        """Get current usage statistics for a user"""
        now = datetime.utcnow()
        
        hourly = self.usage_tracking[user_id]
        daily = self.daily_usage[user_id]
        
        return {
            "hourly": {
                "count": hourly['count'],
                "cost": round(hourly['cost'], 4),
                "resets_in_seconds": int((hourly['reset_time'] - now).total_seconds()) if now < hourly['reset_time'] else 0
            },
            "daily": {
                "count": daily['count'],
                "cost": round(daily['cost'], 4),
                "resets_in_seconds": int((daily['reset_time'] - now).total_seconds()) if now < daily['reset_time'] else 0
            }
        }


# Global instance
ai_protection = AIEndpointProtection()


# Dependency for AI endpoints
async def ai_quota_check(current_user: models.User = Depends(auth.get_current_user)):
    """
    Dependency to check AI quota before processing request.
    """
    await ai_protection.check_ai_quota(
        user_id=current_user.id,
        user_role=current_user.role
    )
    return current_user


# Cost estimation for different AI operations
AI_OPERATION_COSTS = {
    "task_parse": 0.02,      # Parse user input
    "task_questions": 0.01,  # Generate questions
    "task_suggest": 0.03,    # Suggest budget/deadline
    "task_generate": 0.04,   # Generate final JSON
    "match_freelancers": 0.05,  # Match freelancers to project
}


def get_operation_cost(operation: str) -> float:
    """Get estimated cost for an AI operation"""
    return AI_OPERATION_COSTS.get(operation, 0.01)
