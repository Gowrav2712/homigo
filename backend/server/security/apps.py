from django.apps import AppConfig


class SecurityConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'  # type: ignore[assignment]
    name = 'security'
    verbose_name = 'Security'

    def ready(self):
        """
        Patch the default admin site to use HomigoAdminSite.
        This injects security context into the admin home page
        without modifying any existing admin.py files.
        """
        from .admin_site import patch_default_admin_site
        patch_default_admin_site()
