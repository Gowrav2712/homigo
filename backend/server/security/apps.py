from django.apps import AppConfig


class SecurityConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'  # type: ignore[assignment]
    name = 'security'
    verbose_name = 'Security'

    def ready(self) -> None:
        """
        Hook up Django authentication signals and monkey-patch admin site context.
        """
        import security.signals  # noqa: F401
        from .admin_site import patch_default_admin_site
        patch_default_admin_site()
