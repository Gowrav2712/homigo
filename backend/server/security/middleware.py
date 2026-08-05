"""
Security Rate Limit Middleware.
Intercepts login endpoints and enforces a 15-minute rate limit when an IP is blocked.
"""

from typing import Any, Callable
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.urls import resolve
from .utils import get_client_ip, is_rate_limited


class SecurityRateLimitMiddleware:
    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]) -> None:
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        path = request.path.lower()

        # Check if the request is hitting a login path
        is_login_path = any(
            sub in path for sub in ['/login', '/token', '/admin/login']
        )

        if is_login_path and request.method == 'POST':
            ip = get_client_ip(request)
            if is_rate_limited(ip):
                # Return JSON response for API or HTML for admin login
                accept_header = request.META.get('HTTP_ACCEPT', '')
                if 'json' in accept_header or getattr(request, 'content_type', '') == 'application/json':
                    return JsonResponse(
                        {
                            'status': False,
                            'message': 'Too many failed attempts. Try again in 15 minutes.',
                            'error': 'Too many failed attempts. Try again in 15 minutes.',
                        },
                        status=429,
                        headers={'Retry-After': '900'},
                    )
                else:
                    return HttpResponse(
                        "<div style='font-family:sans-serif; text-align:center; padding:50px;'>"
                        "<h1 style='color:#c62828;'>429 Too Many Requests</h1>"
                        "<p style='color:#555; font-size:16px;'>Too many failed login attempts. Please try again in 15 minutes.</p>"
                        "</div>",
                        status=429,
                        headers={'Retry-After': '900'},
                    )

        return self.get_response(request)
