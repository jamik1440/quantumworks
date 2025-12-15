"""
Security Middleware Package
Provides rate limiting, brute force protection, AI quota management, and security monitoring
"""

from .rate_limiter import (
    rate_limiter,
    general_rate_limit,
    login_rate_limit,
    register_rate_limit,
    ai_rate_limit,
    admin_rate_limit
)

from .brute_force_protection import (
    brute_force_protection,
    check_brute_force
)

from .ai_protection import (
    ai_protection,
    ai_quota_check,
    get_operation_cost,
    AI_OPERATION_COSTS
)

from .security_monitor import (
    security_monitor,
    SecurityEventType,
    SecurityEventSeverity,
    log_failed_login,
    log_successful_login,
    log_admin_action,
    log_unauthorized_access
)

__all__ = [
    # Rate Limiter
    'rate_limiter',
    'general_rate_limit',
    'login_rate_limit',
    'register_rate_limit',
    'ai_rate_limit',
    'admin_rate_limit',
    
    # Brute Force Protection
    'brute_force_protection',
    'check_brute_force',
    
    # AI Protection
    'ai_protection',
    'ai_quota_check',
    'get_operation_cost',
    'AI_OPERATION_COSTS',
    
    # Security Monitor
    'security_monitor',
    'SecurityEventType',
    'SecurityEventSeverity',
    'log_failed_login',
    'log_successful_login',
    'log_admin_action',
    'log_unauthorized_access',
]
