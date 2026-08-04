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

    admin.site.each_context = custom_each_context  # type: ignore[assignment]
    admin.site.site_header = "Homigo Admin"  # type: ignore[assignment]
    admin.site.site_title = "Homigo Admin Portal"  # type: ignore[assignment]
    admin.site.index_title = "Welcome to Homigo Admin Portal"  # type: ignore[assignment]

