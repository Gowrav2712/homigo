"""
Security utilities for brute-force login detection.

Responsibilities:
  - Extract the real client IP (safely — never blindly trusts X-Forwarded-For)
  - Track failed login attempts via Django's DB cache
  - Rate-limit IPs after too many failures
  - Create SecurityEvent records
  - Fetch approximate city via ip-api.com (async, in background worker thread)
  - Send email alerts to the admin (async, in background worker thread)

NEVER logs, stores, or processes submitted passwords.
"""

import logging
import threading
from typing import Any, Optional

import requests as http_requests
from django.conf import settings
from django.core.cache import cache
from django.core.mail import send_mail
from django.http import HttpRequest

logger = logging.getLogger(__name__)


# ─── IP Extraction ────────────────────────────────────────────────────────────

def get_client_ip(request: HttpRequest) -> str:
    """
    Return the client's IP address from HttpRequest.
    Reads X-Forwarded-For, X-Real-IP, and CF-Connecting-IP when SECURITY_TRUSTED_PROXY is True.
    """
    trusted_proxy = getattr(settings, 'SECURITY_TRUSTED_PROXY', False)

    if trusted_proxy:
        # Check Cloudflare IP header
        cf_ip = request.META.get('HTTP_CF_CONNECTING_IP')
        if cf_ip:
            return cf_ip.strip()

        # Check X-Real-IP header
        real_ip = request.META.get('HTTP_X_REAL_IP')
        if real_ip:
            return real_ip.strip()

        # Check X-Forwarded-For header
        xff = request.META.get('HTTP_X_FORWARDED_FOR', '')
        if xff:
            return xff.split(',')[0].strip()

    return request.META.get('REMOTE_ADDR', '127.0.0.1') or '127.0.0.1'


# ─── Cache Key Helpers ────────────────────────────────────────────────────────

def _make_attempt_key(ip: str, username: str = '') -> str:
    """Build a cache key for tracking failed attempts per IP + username."""
    safe_username = (username or 'unknown').replace(' ', '_')[:100]
    return f"security_attempt:{ip}:{safe_username}"


def _make_block_key(ip: str) -> str:
    """Build a cache key for the rate-limit block per IP."""
    return f"security_blocked:{ip}"


# ─── Failed Attempt Tracking ─────────────────────────────────────────────────

def get_failed_attempts(ip: str, username: str = '') -> int:
    """Return the current number of failed attempts for this IP + username."""
    try:
        key = _make_attempt_key(ip, username)
        return cache.get(key, 0) or 0
    except Exception as e:
        logger.warning(f"Cache get_failed_attempts failed: {e}")
        return 0


def increment_failed_attempts(ip: str, username: str = '') -> None:
    """
    Increment the failed attempt counter.
    The key has a TTL of LOGIN_ATTEMPT_WINDOW (default 10 minutes).
    Each new failure refreshes the TTL so the window slides.
    """
    try:
        key = _make_attempt_key(ip, username)
        window = getattr(settings, 'LOGIN_ATTEMPT_WINDOW', 600)
        current = cache.get(key, 0) or 0
        cache.set(key, current + 1, timeout=window)
    except Exception as e:
        logger.warning(f"Cache increment_failed_attempts failed: {e}")


def reset_failed_attempts(ip: str, username: str = '') -> None:
    """Delete the attempt counter on successful login."""
    try:
        key = _make_attempt_key(ip, username)
        cache.delete(key)
    except Exception as e:
        logger.warning(f"Cache reset_failed_attempts failed: {e}")


# ─── Rate Limiting ────────────────────────────────────────────────────────────

def is_rate_limited(ip: str) -> bool:
    """Return True if this IP is currently blocked."""
    try:
        return cache.get(_make_block_key(ip)) is not None
    except Exception as e:
        logger.warning(f"Cache is_rate_limited failed: {e}")
        return False


def set_rate_limit(ip: str) -> None:
    """Block this IP for LOGIN_RATE_LIMIT_DURATION (default 15 minutes)."""
    try:
        duration = getattr(settings, 'LOGIN_RATE_LIMIT_DURATION', 900)
        cache.set(_make_block_key(ip), True, timeout=duration)
    except Exception as e:
        logger.warning(f"Cache set_rate_limit failed: {e}")


# ─── Email Alert ──────────────────────────────────────────────────────────────

def send_security_alert_email(event: Any) -> bool:
    """
    Send a security alert email to the admin using Django's send_mail.
    """
    alert_email = getattr(settings, 'SECURITY_ALERT_EMAIL', None)
    if not alert_email:
        logger.warning("SECURITY_ALERT_EMAIL not configured — skipping email.")
        return False

    trusted_origins = getattr(settings, 'CSRF_TRUSTED_ORIGINS', [])
    base_url = trusted_origins[2] if trusted_origins and len(trusted_origins) > 2 else 'http://127.0.0.1:8000'

    subject = "🔐 Security Alert — Suspicious Login Activity Detected"

    message = (
        "══════════════════════════════════════════════════\n"
        "⚠️  SUSPICIOUS LOGIN ACTIVITY DETECTED\n"
        "══════════════════════════════════════════════════\n\n"
        "A source has made {count} failed login attempts within the configured window.\n\n"
        "Details:\n"
        "  • IP Address       : {ip}\n"
        "  • Attempted Email  : {username}\n"
        "  • Timestamp        : {timestamp}\n"
        "  • User-Agent       : {ua}\n"
        "  • Failed Attempts  : {count}\n\n"
        "Action Taken:\n"
        "  This IP has been automatically rate-limited for 15 minutes.\n\n"
        "Review in Admin:\n"
        "  {admin_url}\n\n"
        "══════════════════════════════════════════════════\n"
        "This is an automated security alert from Homigo.\n"
    ).format(
        ip=event.ip_address,
        username=event.attempted_username or '(unknown)',
        timestamp=event.timestamp.strftime('%Y-%m-%d %H:%M:%S %Z') if event.timestamp else 'N/A',
        ua=event.user_agent[:200] if event.user_agent else '(none)',
        count=event.failed_attempt_count,
        admin_url=f"{base_url}/admin/security/securityevent/",
    )

    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=None,  # uses DEFAULT_FROM_EMAIL from settings
            recipient_list=[alert_email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        logger.error(f"Failed to send security alert email: {e}")
        return False


# ─── Create Security Event ────────────────────────────────────────────────────

def create_security_event(ip: str, username: str, user_agent: str, count: int) -> Any:
    """
    Save a SecurityEvent record and send alert email to admin immediately.
    """
    from .models import SecurityEvent

    event = SecurityEvent.objects.create(  # type: ignore[attr-defined]
        ip_address=ip,
        attempted_username=username,
        user_agent=user_agent,
        failed_attempt_count=count,
    )

    # Send alert email immediately to guarantee fast delivery
    email_ok = send_security_alert_email(event)
    if email_ok:
        event.email_sent = True
        event.save(update_fields=['email_sent'])

    return event
