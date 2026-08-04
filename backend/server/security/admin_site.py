"""
Custom Django AdminSite behavior that injects security alert context
into the default admin index page (home page).
"""

from typing import Any, Dict
from django.http import HttpRequest
from .models import SecurityEvent


def patch_default_admin_site() -> None:
    """
    Monkey-patch django.contrib.admin.site to inject security alert data
    into each_context. This ensures all existing @admin.register() decorators work unchanged.
    Called from SecurityConfig.ready().
    """
    from django.contrib import admin

    original_each_context = admin.site.each_context

    def custom_each_context(request: HttpRequest) -> Dict[str, Any]:
        ctx = original_each_context(request)
        try:
            unresolved = SecurityEvent.objects.filter(is_resolved=False)  # type: ignore[attr-defined]
            ctx['security_unresolved_count'] = unresolved.count()
            ctx['security_latest_event'] = unresolved.order_by('-timestamp').first()
        except Exception:
            # Graceful fallback if table doesn't exist yet (before migration)
            ctx['security_unresolved_count'] = 0
            ctx['security_latest_event'] = None
        return ctx

    original_login = admin.site.login

    def custom_login(request: HttpRequest, extra_context: Any = None) -> Any:
        from .utils import (
            get_client_ip, get_failed_attempts, increment_failed_attempts,
            reset_failed_attempts, is_rate_limited, set_rate_limit, create_security_event
        )
        from django.conf import settings
        from django.http import HttpResponse

        ip = get_client_ip(request)

        if is_rate_limited(ip):
            return HttpResponse(
                "<div style='font-family:sans-serif; text-align:center; padding:50px;'>"
                "<h1 style='color:#c62828;'>429 Too Many Requests</h1>"
                "<p style='color:#555; font-size:16px;'>Too many failed login attempts. Please try again in 15 minutes.</p>"
                "</div>",
                status=429,
            )

        username = request.POST.get('username', '') if request.method == 'POST' else ''

        response = original_login(request, extra_context=extra_context)

        if request.method == 'POST':
            if getattr(request, 'user', None) and request.user.is_authenticated:
                reset_failed_attempts(ip, username)
            else:
                increment_failed_attempts(ip, username)
                count = get_failed_attempts(ip, username)
                if count >= getattr(settings, 'LOGIN_MAX_ATTEMPTS', 5):
                    user_agent = request.META.get('HTTP_USER_AGENT', '')
                    create_security_event(ip, username, user_agent, count)
                    set_rate_limit(ip)
                    return HttpResponse(
                        "<div style='font-family:sans-serif; text-align:center; padding:50px;'>"
                        "<h1 style='color:#c62828;'>429 Too Many Requests</h1>"
                        "<p style='color:#555; font-size:16px;'>Too many failed login attempts. Please try again in 15 minutes.</p>"
                        "</div>",
                        status=429,
                    )

        return response

    admin.site.each_context = custom_each_context  # type: ignore[assignment]
    admin.site.login = custom_login  # type: ignore[assignment]
    admin.site.site_header = "Homigo Admin"  # type: ignore[assignment]
    admin.site.site_title = "Homigo Admin Portal"  # type: ignore[assignment]
    admin.site.index_title = "Welcome to Homigo Admin Portal"  # type: ignore[assignment]


