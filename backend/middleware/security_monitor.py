"""
Security Monitoring and Alerting System
Tracks security events and sends alerts for suspicious activity
"""
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional
from collections import defaultdict
import logging
import json

logger = logging.getLogger("security")


class SecurityEventType(Enum):
    """Types of security events to monitor"""
    FAILED_LOGIN = "failed_login"
    SUCCESSFUL_LOGIN = "successful_login"
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded"
    BRUTE_FORCE_DETECTED = "brute_force_detected"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"
    ADMIN_ACTION = "admin_action"
    AI_QUOTA_EXCEEDED = "ai_quota_exceeded"
    UNAUTHORIZED_ACCESS = "unauthorized_access"
    ACCOUNT_CREATED = "account_created"
    ACCOUNT_DELETED = "account_deleted"
    PASSWORD_CHANGED = "password_changed"
    ROLE_CHANGED = "role_changed"
    DATA_EXPORT = "data_export"
    WEBSOCKET_ABUSE = "websocket_abuse"


class SecurityEventSeverity(Enum):
    """Severity levels for security events"""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class SecurityMonitor:
    """
    Monitors security events and triggers alerts.
    Implements anomaly detection and threat intelligence.
    """
    
    def __init__(self):
        self.events: List[dict] = []
        self.event_counts: Dict[str, List[datetime]] = defaultdict(list)
        self.alerts_sent: Dict[str, datetime] = {}
        
        # Alert thresholds (event_type: max_count_per_hour)
        self.alert_thresholds = {
            SecurityEventType.FAILED_LOGIN: 10,
            SecurityEventType.RATE_LIMIT_EXCEEDED: 5,
            SecurityEventType.BRUTE_FORCE_DETECTED: 1,
            SecurityEventType.UNAUTHORIZED_ACCESS: 1,
            SecurityEventType.AI_QUOTA_EXCEEDED: 3,
            SecurityEventType.ADMIN_ACTION: 50,
            SecurityEventType.WEBSOCKET_ABUSE: 3,
        }
    
    def log_security_event(
        self,
        event_type: SecurityEventType,
        severity: SecurityEventSeverity = SecurityEventSeverity.MEDIUM,
        user_id: Optional[int] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        endpoint: Optional[str] = None,
        details: Optional[dict] = None
    ):
        """
        Log a security event.
        
        Args:
            event_type: Type of security event
            severity: Severity level
            user_id: User ID if applicable
            ip_address: IP address of request
            user_agent: User agent string
            endpoint: API endpoint accessed
            details: Additional details
        """
        event = {
            "timestamp": datetime.utcnow().isoformat(),
            "event_type": event_type.value,
            "severity": severity.value,
            "user_id": user_id,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "endpoint": endpoint,
            "details": details or {}
        }
        
        # Store event
        self.events.append(event)
        
        # Keep only last 10000 events in memory
        if len(self.events) > 10000:
            self.events = self.events[-10000:]
        
        # Log to file
        logger.warning(f"Security Event: {json.dumps(event, indent=2)}")
        
        # Track event count for alerting
        event_key = f"{event_type.value}:{ip_address or 'unknown'}"
        self.event_counts[event_key].append(datetime.utcnow())
        
        # Check if alert should be sent
        self.check_alert_threshold(event_type, ip_address)
        
        # Immediate alert for critical events
        if severity == SecurityEventSeverity.CRITICAL:
            self.send_immediate_alert(event)
    
    def check_alert_threshold(
        self,
        event_type: SecurityEventType,
        ip_address: Optional[str]
    ):
        """
        Check if alert threshold has been exceeded.
        """
        if event_type not in self.alert_thresholds:
            return
        
        event_key = f"{event_type.value}:{ip_address or 'unknown'}"
        now = datetime.utcnow()
        
        # Clean old events (older than 1 hour)
        cutoff = now - timedelta(hours=1)
        self.event_counts[event_key] = [
            event_time for event_time in self.event_counts[event_key]
            if event_time > cutoff
        ]
        
        # Check threshold
        threshold = self.alert_thresholds[event_type]
        event_count = len(self.event_counts[event_key])
        
        if event_count >= threshold:
            # Check if we already sent an alert recently (avoid spam)
            last_alert = self.alerts_sent.get(event_key)
            if last_alert and (now - last_alert) < timedelta(hours=1):
                return  # Don't send duplicate alert
            
            # Send alert
            self.send_alert(event_type, ip_address, event_count)
            self.alerts_sent[event_key] = now
    
    def send_alert(
        self,
        event_type: SecurityEventType,
        ip_address: Optional[str],
        count: int
    ):
        """
        Send security alert.
        In production, integrate with email, Slack, PagerDuty, etc.
        """
        alert_message = f"""
        🚨 SECURITY ALERT 🚨
        
        Event Type: {event_type.value}
        IP Address: {ip_address or 'Unknown'}
        Event Count: {count} (last hour)
        Threshold: {self.alert_thresholds.get(event_type, 'N/A')}
        Time: {datetime.utcnow().isoformat()}
        
        Action Required: Investigate immediately
        
        Recent Events:
        {self._get_recent_events(event_type, ip_address, limit=5)}
        """
        
        # Log alert
        logger.critical(alert_message)
        
        # TODO: Send to external alerting system
        # - Email (SendGrid, AWS SES)
        # - Slack webhook
        # - Discord webhook
        # - PagerDuty
        # - SMS (Twilio)
        
        print(alert_message)
    
    def send_immediate_alert(self, event: dict):
        """Send immediate alert for critical events"""
        alert_message = f"""
        🔴 CRITICAL SECURITY EVENT 🔴
        
        Event: {event['event_type']}
        Time: {event['timestamp']}
        User ID: {event.get('user_id', 'N/A')}
        IP: {event.get('ip_address', 'N/A')}
        Endpoint: {event.get('endpoint', 'N/A')}
        
        Details: {json.dumps(event.get('details', {}), indent=2)}
        
        IMMEDIATE ACTION REQUIRED
        """
        
        logger.critical(alert_message)
        print(alert_message)
    
    def _get_recent_events(
        self,
        event_type: SecurityEventType,
        ip_address: Optional[str],
        limit: int = 5
    ) -> str:
        """Get recent events for alert context"""
        matching_events = [
            e for e in self.events[-100:]
            if e['event_type'] == event_type.value
            and (not ip_address or e.get('ip_address') == ip_address)
        ]
        
        recent = matching_events[-limit:]
        return json.dumps(recent, indent=2)
    
    def get_security_summary(self, hours: int = 24) -> dict:
        """Get security summary for the last N hours"""
        now = datetime.utcnow()
        cutoff = now - timedelta(hours=hours)
        
        recent_events = [
            e for e in self.events
            if datetime.fromisoformat(e['timestamp']) > cutoff
        ]
        
        # Count by event type
        event_type_counts = defaultdict(int)
        for event in recent_events:
            event_type_counts[event['event_type']] += 1
        
        # Count by severity
        severity_counts = defaultdict(int)
        for event in recent_events:
            severity_counts[event['severity']] += 1
        
        # Top IPs
        ip_counts = defaultdict(int)
        for event in recent_events:
            if event.get('ip_address'):
                ip_counts[event['ip_address']] += 1
        
        top_ips = sorted(ip_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        
        return {
            "period_hours": hours,
            "total_events": len(recent_events),
            "event_types": dict(event_type_counts),
            "severity_counts": dict(severity_counts),
            "top_ips": [{"ip": ip, "count": count} for ip, count in top_ips],
            "alerts_sent": len(self.alerts_sent)
        }
    
    def export_events(
        self,
        start_time: Optional[datetime] = None,
        end_time: Optional[datetime] = None,
        event_types: Optional[List[SecurityEventType]] = None
    ) -> List[dict]:
        """Export security events for analysis"""
        filtered_events = self.events
        
        if start_time:
            filtered_events = [
                e for e in filtered_events
                if datetime.fromisoformat(e['timestamp']) >= start_time
            ]
        
        if end_time:
            filtered_events = [
                e for e in filtered_events
                if datetime.fromisoformat(e['timestamp']) <= end_time
            ]
        
        if event_types:
            event_type_values = [et.value for et in event_types]
            filtered_events = [
                e for e in filtered_events
                if e['event_type'] in event_type_values
            ]
        
        return filtered_events


# Global security monitor instance
security_monitor = SecurityMonitor()


# Helper functions for common security events

def log_failed_login(email: str, ip_address: str, reason: str = "Invalid credentials"):
    """Log failed login attempt"""
    security_monitor.log_security_event(
        event_type=SecurityEventType.FAILED_LOGIN,
        severity=SecurityEventSeverity.MEDIUM,
        ip_address=ip_address,
        details={"email": email, "reason": reason}
    )


def log_successful_login(user_id: int, email: str, ip_address: str):
    """Log successful login"""
    security_monitor.log_security_event(
        event_type=SecurityEventType.SUCCESSFUL_LOGIN,
        severity=SecurityEventSeverity.LOW,
        user_id=user_id,
        ip_address=ip_address,
        details={"email": email}
    )


def log_admin_action(user_id: int, action: str, target: str, ip_address: str):
    """Log admin action"""
    security_monitor.log_security_event(
        event_type=SecurityEventType.ADMIN_ACTION,
        severity=SecurityEventSeverity.HIGH,
        user_id=user_id,
        ip_address=ip_address,
        details={"action": action, "target": target}
    )


def log_unauthorized_access(user_id: Optional[int], endpoint: str, ip_address: str):
    """Log unauthorized access attempt"""
    security_monitor.log_security_event(
        event_type=SecurityEventType.UNAUTHORIZED_ACCESS,
        severity=SecurityEventSeverity.HIGH,
        user_id=user_id,
        ip_address=ip_address,
        endpoint=endpoint,
        details={"attempted_endpoint": endpoint}
    )
