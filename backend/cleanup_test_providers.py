import os
import sys
import django

sys.path.append(os.path.join(os.path.dirname(__file__), 'server'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from service_provider.models import ServiceProvider, ProviderService
from orders.models import Orders

test_emails = [
    "priya.appliance@gmail.com",
    "ananya.appliances@gmail.com",
    "sunita.clean@gmail.com",
    "kavitha.sanitization@gmail.com",
    "rajesh.woodworks@gmail.com",
    "suresh.carpentry@gmail.com",
]

print("Starting cleanup of test duplicate data...")

deleted_providers = 0
for email in test_emails:
    providers = ServiceProvider.objects.filter(email=email)
    for provider in providers:
        # Delete associated provider services and orders if test
        ProviderService.objects.filter(provider=provider).delete()
        Orders.objects.filter(provider=provider).delete()
        provider.delete()
        deleted_providers += 1
        print(f"Removed test provider: {email}")

print(f"\nCleanup complete. Total test duplicate providers removed: {deleted_providers}")
