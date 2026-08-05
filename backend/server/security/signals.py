"""
Django Authentication Signal Receivers.
Automatically listens to user_login_failed and user_logged_in.
"""

from typing import Any, Optional
from django.contrib.auth.signals import user_login_failed, user_logged_in
from django.dispatch import receiver
from django.http import HttpRequest
from django.conf import settings

from .utils import (
    get_client_ip, get_failed_attempts, increment_failed_attempts,
    reset_failed_attempts, set_rate_limit, create_security_event
)


@receiver(user_login_failed)
def handle_user_login_failed(sender: Any, credentials: Optional[dict] = None, request: Optional[HttpRequest] = None, **kwargs: Any) -> None:
    """
    Triggered when a login attempt fails via Django auth or DRF.
    Increments attempt counter; creates SecurityEvent + email alert + 15min lockout on 5th failure.
    """
    if request is None:
        return

    ip = get_client_ip(request)

    raw_username = ''
    if credentials and isinstance(credentials, dict):
        raw_username = credentials.get('username') or credentials.get('email') or ''
    if not raw_username and hasattr(request, 'POST'):
        raw_username = request.POST.get('username') or request.POST.get('email') or ''

    username = str(raw_username)

    increment_failed_attempts(ip, username)
    count = get_failed_attempts(ip, username)

    max_attempts = getattr(settings, 'LOGIN_MAX_ATTEMPTS', 5)
    if count >= max_attempts:
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        create_security_event(ip, username, user_agent, count)
        set_rate_limit(ip)


@receiver(user_logged_in)
def handle_user_logged_in(sender: Any, request: Optional[HttpRequest] = None, user: Any = None, **kwargs: Any) -> None:
    """
    Triggered when a user logs in successfully.
    Resets the failed attempt counter for the source IP.
    """
    if request is None:
        return

    ip = get_client_ip(request)
    username = str(getattr(user, 'email', '') or getattr(user, 'username', ''))
    reset_failed_attempts(ip, username)
