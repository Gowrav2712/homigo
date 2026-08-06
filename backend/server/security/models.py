from django.db import models
from django.utils.translation import gettext_lazy as _


class SecurityEvent(models.Model):
    """
    Records suspicious login activity.
    Created when a source IP accumulates LOGIN_MAX_ATTEMPTS failed
    login attempts within the configured sliding window.

    NEVER stores: passwords, GPS coordinates, device fingerprints, session tokens.
    """

    ip_address = models.GenericIPAddressField(
        help_text=_("Source IP address of the failed login attempts")
    )
    attempted_username = models.CharField(
        max_length=254,
        blank=True,
        default='',
        help_text=_("Email address or username used in the login attempt")
    )
    timestamp = models.DateTimeField(
        auto_now_add=True,
        help_text=_("When the security event was created")
    )
    user_agent = models.TextField(
        blank=True,
        default='',
        help_text=_("HTTP User-Agent header from the request")
    )
    failed_attempt_count = models.PositiveSmallIntegerField(
        help_text=_("Number of consecutive failed attempts at the time of this event")
    )
    is_resolved = models.BooleanField(
        default=False,
        help_text=_("Admin can mark the event as reviewed / resolved")
    )
    email_sent = models.BooleanField(
        default=False,
        help_text=_("Whether the admin alert email was successfully sent")
    )

    objects = models.Manager()

    class Meta:
        ordering = ['-timestamp']
        verbose_name = _("Security Event")
        verbose_name_plural = _("Security Events")

    def __str__(self) -> str:
        return f"[{self.timestamp:%Y-%m-%d %H:%M}] {self.ip_address} — {self.attempted_username} ({self.failed_attempt_count} attempts)"
