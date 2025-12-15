"""
Brute Force Protection Middleware
Protects against password guessing and account enumeration attacks
"""
from datetime import datetime, timedelta
from collections import defaultdict
from typing import Dict, List
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)


class BruteForceProtection:
    """
    Tracks failed login attempts and blocks suspicious activity.
    Implements progressive delays and temporary account locks.
    """
    
    def __init__(self):
        # Track failed attempts: {identifier: [timestamps]}
        self.failed_attempts: Dict[str, List[datetime]] = defaultdict(list)
        
        # Track blocked identifiers: {identifier: unblock_time}
        self.blocked_until: Dict[str, datetime] = {}
        
        # Track suspicious IPs (multiple account attempts)
        self.suspicious_ips: Dict[str, set] = defaultdict(set)
    
    def record_failed_login(
        self,
        email: str,
        ip_address: str,
        max_attempts: int = 5,
        window_minutes: int = 15,
        block_duration_minutes: int = 30
    ) -> bool:
        """
        Record a failed login attempt.
        
        Args:
            email: Email address attempted
            ip_address: IP address of request
            max_attempts: Maximum failed attempts before blocking
            window_minutes: Time window to count attempts
            block_duration_minutes: How long to block after max attempts
        
        Returns:
            True if account/IP should be blocked, False otherwise
        """
        now = datetime.utcnow()
        identifier = f"{ip_address}:{email}"
        
        # Clean old attempts
        cutoff = now - timedelta(minutes=window_minutes)
        self.failed_attempts[identifier] = [
            attempt for attempt in self.failed_attempts[identifier]
            if attempt > cutoff
        ]
        
        # Add new attempt
        self.failed_attempts[identifier].append(now)
        
        # Track suspicious IP (trying multiple accounts)
        self.suspicious_ips[ip_address].add(email)
        
        # Check if should block
        attempts_count = len(self.failed_attempts[identifier])
        
        if attempts_count >= max_attempts:
            # Block the identifier
            self.blocked_until[identifier] = now + timedelta(minutes=block_duration_minutes)
            
            # Log security event
            logger.warning(
                f"Brute force detected: {email} from {ip_address}. "
                f"{attempts_count} failed attempts. Blocked for {block_duration_minutes} minutes."
            )
            
            return True
        
        # Check if IP is trying too many different accounts
        if len(self.suspicious_ips[ip_address]) >= 10:
            # Block the IP entirely
            self.blocked_until[f"ip:{ip_address}"] = now + timedelta(minutes=60)
            
            logger.warning(
                f"Account enumeration detected from {ip_address}. "
                f"Tried {len(self.suspicious_ips[ip_address])} different accounts. "
                f"IP blocked for 60 minutes."
            )
            
            return True
        
        return False
    
    def is_blocked(self, email: str, ip_address: str) -> tuple[bool, int]:
        """
        Check if email/IP combination is currently blocked.
        
        Returns:
            (is_blocked, seconds_remaining)
        """
        now = datetime.utcnow()
        identifier = f"{ip_address}:{email}"
        
        # Check specific identifier block
        if identifier in self.blocked_until:
            if now < self.blocked_until[identifier]:
                remaining = int((self.blocked_until[identifier] - now).total_seconds())
                return True, remaining
            else:
                # Unblock
                del self.blocked_until[identifier]
                if identifier in self.failed_attempts:
                    del self.failed_attempts[identifier]
        
        # Check IP-wide block
        ip_identifier = f"ip:{ip_address}"
        if ip_identifier in self.blocked_until:
            if now < self.blocked_until[ip_identifier]:
                remaining = int((self.blocked_until[ip_identifier] - now).total_seconds())
                return True, remaining
            else:
                # Unblock
                del self.blocked_until[ip_identifier]
                if ip_address in self.suspicious_ips:
                    del self.suspicious_ips[ip_address]
        
        return False, 0
    
    def clear_failed_attempts(self, email: str, ip_address: str):
        """Clear failed attempts after successful login"""
        identifier = f"{ip_address}:{email}"
        
        if identifier in self.failed_attempts:
            del self.failed_attempts[identifier]
        
        if identifier in self.blocked_until:
            del self.blocked_until[identifier]
        
        # Remove from suspicious IPs
        if ip_address in self.suspicious_ips:
            self.suspicious_ips[ip_address].discard(email)
            if not self.suspicious_ips[ip_address]:
                del self.suspicious_ips[ip_address]
    
    def get_attempt_count(self, email: str, ip_address: str) -> int:
        """Get number of failed attempts for email/IP combination"""
        identifier = f"{ip_address}:{email}"
        return len(self.failed_attempts.get(identifier, []))
    
    def get_remaining_attempts(self, email: str, ip_address: str, max_attempts: int = 5) -> int:
        """Get number of remaining attempts before block"""
        current_attempts = self.get_attempt_count(email, ip_address)
        return max(0, max_attempts - current_attempts)


# Global instance
brute_force_protection = BruteForceProtection()


def check_brute_force(email: str, ip_address: str):
    """
    Dependency function to check brute force protection.
    Raises HTTPException if blocked.
    """
    is_blocked, remaining_seconds = brute_force_protection.is_blocked(email, ip_address)
    
    if is_blocked:
        remaining_minutes = remaining_seconds // 60
        raise HTTPException(
            status_code=403,
            detail=f"Too many failed login attempts. Account temporarily locked for {remaining_minutes} more minutes.",
            headers={"Retry-After": str(remaining_seconds)}
        )
