"""
Security utilities for brute-force login detection.

Responsibilities:
  - Extract the real client IP (safely — never blindly trusts X-Forwarded-For)
  - Track failed login attempts via Django's DB cache
  - Rate-limit IPs after too many failures
  - Create SecurityEvent records
  - Fetch approximate city via ip-api.com (async, in background thread)
  - Send email alerts to the admin (async, in background thread)

NEVER logs, stores, or processes submitted passwords.
"""

import logging
import threading

import requests as http_requests
from django.conf import settings
from django.core.cache import cache
from django.core.mail import send_mail
from django.utils import timezone

logger = logging.getLogger(__name__)


# ─── IP Extraction ────────────────────────────────────────────────────────────

def get_client_ip(request):
    """
    Return the client's IP address from REMOTE_ADDR.
    Only reads X-Forwarded-For when SECURITY_TRUSTED_PROXY is True in settings.
    """
    trusted_proxy = getattr(settings, 'SECURITY_TRUSTED_PROXY', False)

    if trusted_proxy:
        xff = request.META.get('HTTP_X_FORWARDED_FOR', '')
        if xff:
            # Take the first (leftmost) IP — set by the first proxy in the chain
            return xff.split(',')[0].strip()

    return request.META.get('REMOTE_ADDR', '127.0.0.1')


# ─── Cache Key Helpers ────────────────────────────────────────────────────────

def _make_attempt_key(ip, username=''):
    """Build a cache key for tracking failed attempts per IP + username."""
    safe_username = (username or 'unknown').replace(' ', '_')[:100]
    return f"security_attempt:{ip}:{safe_username}"


def _make_block_key(ip):
    """Build a cache key for the rate-limit block per IP."""
    return f"security_blocked:{ip}"


# ─── Failed Attempt Tracking ─────────────────────────────────────────────────

def get_failed_attempts(ip, username=''):
    """Return the current number of failed attempts for this IP + username."""
    key = _make_attempt_key(ip, username)
    return cache.get(key, 0)


def increment_failed_attempts(ip, username=''):
    """
    Increment the failed attempt counter.
    The key has a TTL of LOGIN_ATTEMPT_WINDOW (default 10 minutes).
    Each new failure refreshes the TTL so the window slides.
    """
    key = _make_attempt_key(ip, username)
    window = getattr(settings, 'LOGIN_ATTEMPT_WINDOW', 600)

    current = cache.get(key, 0)
    cache.set(key, current + 1, timeout=window)


def reset_failed_attempts(ip, username=''):
    """Delete the attempt counter on successful login."""
    key = _make_attempt_key(ip, username)
    cache.delete(key)


# ─── Rate Limiting ────────────────────────────────────────────────────────────

def is_rate_limited(ip):
    """Return True if this IP is currently blocked."""
    return cache.get(_make_block_key(ip)) is not None


def set_rate_limit(ip):
    """Block this IP for LOGIN_RATE_LIMIT_DURATION (default 15 minutes)."""
    duration = getattr(settings, 'LOGIN_RATE_LIMIT_DURATION', 900)
    cache.set(_make_block_key(ip), True, timeout=duration)


# ─── Email Alert ──────────────────────────────────────────────────────────────

def send_security_alert_email(event):
    """
    Send a security alert email to the admin.
    Uses Django's send_mail with the already-configured Gmail SMTP.
    """
    alert_email = getattr(settings, 'SECURITY_ALERT_EMAIL', None)
    if not alert_email:
        logger.warning("SECURITY_ALERT_EMAIL not configured — skipping email.")
        return False

    subject = "🔐 Security Alert — Suspicious Login Activity Detected"

    message = (
        "══════════════════════════════════════════════════\n"
        "⚠️  SUSPICIOUS LOGIN ACTIVITY DETECTED\n"
        "══════════════════════════════════════════════════\n\n"
        "A source has made {count} failed login attempts within the configured window.\n\n"
        "Details:\n"
        "  • IP Address       : {ip}\n"
        "  • Approximate City : {city}\n"
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
        city=event.city or '(resolving...)',
        username=event.attempted_username or '(unknown)',
        timestamp=event.timestamp.strftime('%Y-%m-%d %H:%M:%S %Z') if event.timestamp else 'N/A',
        ua=event.user_agent[:200] if event.user_agent else '(none)',
        count=event.failed_attempt_count,
        admin_url=(
            f"{settings.CSRF_TRUSTED_ORIGINS[2] if hasattr(settings, 'CSRF_TRUSTED_ORIGINS') and getattr(settings, 'CSRF_TRUSTED_ORIGINS') and len(getattr(settings, 'CSRF_TRUSTED_ORIGINS')) > 2 else 'http://127.0.0.1:8000'}/admin/security/securityevent/"
        ),
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


# ─── IP Geolocation (Async) ──────────────────────────────────────────────────

def _fetch_city(ip):
    """
    Call ip-api.com to get the approximate city for an IP address.
    Returns the city name string, or empty string on failure.
    Free tier, no API key needed. Only returns city-level data.
    """
    # Don't geolocate localhost / private IPs in development
    if ip in ('127.0.0.1', '::1', 'localhost'):
        return 'localhost'

    try:
        resp = http_requests.get(
            f"http://ip-api.com/json/{ip}",
            params={'fields': 'status,city,regionName,country'},
            timeout=5,
        )
        if resp.status_code == 200:
            data = resp.json()
            if data.get('status') == 'success':
                parts = filter(None, [data.get('city'), data.get('regionName'), data.get('country')])
                return ', '.join(parts)
    except Exception as e:
        logger.warning(f"IP geolocation failed for {ip}: {e}")

    return ''


# ─── Background Task (Geolocation + Email) ───────────────────────────────────

def _background_task(ip, event_id):
    """
    Daemon thread target:
      1. Fetch city from ip-api.com
      2. Re-fetch clean SecurityEvent instance
      3. Send alert email to admin
      4. Update event record in DB
    """
    from django.db import close_old_connections
    from .models import SecurityEvent

    close_old_connections()

    try:
        # Step 1: Geolocation (network call)
        city = _fetch_city(ip)

        # Step 2: Fetch clean instance in worker thread
        event = None
        for attempt in range(5):
            try:
                event = SecurityEvent.objects.get(pk=event_id)  # type: ignore[attr-defined]
                break
            except SecurityEvent.DoesNotExist:  # type: ignore[attr-defined]
                import time
                time.sleep(0.2)

        if not event:
            logger.error(f"SecurityEvent {event_id} not found in worker thread.")
            return

        if city:
            event.city = city

        # Step 3: Send alert email
        email_ok = send_security_alert_email(event)
        if email_ok:
            event.email_sent = True

        event.save()
        logger.info(f"Security alert background task completed for event {event.id} (IP: {ip}, Email Sent: {email_ok})")

    except Exception as err:
        logger.error(f"Error in security background task: {err}")
    finally:
        close_old_connections()


# ─── Create Security Event ────────────────────────────────────────────────────

def create_security_event(ip, username, user_agent, count):
    """
    Save a SecurityEvent record and spawn a daemon thread to:
      - resolve the city via IP geolocation
      - send an alert email to the admin
    """
    from .models import SecurityEvent

    event = SecurityEvent.objects.create(  # type: ignore[attr-defined]
        ip_address=ip,
        attempted_username=username,
        user_agent=user_agent,
        failed_attempt_count=count,
    )

    # Fire background thread for IP geolocation & admin email dispatch
    thread = threading.Thread(
        target=_background_task,
        args=(ip, event.pk),
        daemon=False,
    )
    thread.start()

    return event



