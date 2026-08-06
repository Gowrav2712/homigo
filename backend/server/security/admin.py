from django.contrib import admin
from django.utils.translation import gettext_lazy as _

from .models import SecurityEvent


@admin.register(SecurityEvent)
class SecurityEventAdmin(admin.ModelAdmin):
    """Admin interface for reviewing suspicious login events."""

    list_display = (  # type: ignore[assignment]
        'ip_address', 'attempted_username',
        'timestamp', 'failed_attempt_count', 'email_sent', 'is_resolved',
    )
    list_filter = ('is_resolved', 'email_sent', 'timestamp')
    search_fields = ('ip_address', 'attempted_username')
    ordering = ('-timestamp',)

    readonly_fields = (
        'ip_address', 'attempted_username',
        'timestamp', 'user_agent', 'failed_attempt_count', 'email_sent',
    )

    fieldsets = (
        (_('Event Details'), {
            'fields': (
                'ip_address', 'attempted_username',
                'timestamp', 'user_agent', 'failed_attempt_count',
            )
        }),
        (_('Status'), {
            'fields': ('is_resolved', 'email_sent'),
        }),
    )

    actions = ('mark_resolved',)  # type: ignore[assignment]

    @admin.action(description=_("Mark selected events as resolved"))
    def mark_resolved(self, request, queryset):
        updated = queryset.update(is_resolved=True)
        self.message_user(
            request,
            _(f"{updated} security event(s) marked as resolved."),
        )

    def has_add_permission(self, request):
        """SecurityEvents are created automatically, not manually."""
        return False

    def has_delete_permission(self, request, obj=None):
        """Prevent accidental deletion of security audit trail."""
        return request.user.is_superuser
