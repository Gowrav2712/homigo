import os
import sys
import django
import random

sys.path.append(os.path.join(os.path.dirname(__file__), 'server'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from service.models import Service
from sub_service.models import SubService
from service_provider.models import ServiceProvider, ProviderService

test_providers_data = [
    # Appliance Repair Providers
    {
        "main_service": "Appliance Repair",
        "first_name": "Priya",
        "last_name": "Sharma",
        "email": "priya.appliance@gmail.com",
        "aadhaar": "990011223344",
        "gender": "F",
        "mobile_number": "9876543210",
        "street_address": "12th Cross, VV Mohalla",
        "city": "Mysore",
        "state": "Karnataka",
        "postal_code": "570002",
        "latitude": 12.3100,
        "longitude": 76.6400,
        "prices": [499.00, 599.00, 449.00]
    },
    {
        "main_service": "Appliance Repair",
        "first_name": "Ananya",
        "last_name": "Rao",
        "email": "ananya.appliances@gmail.com",
        "aadhaar": "990011223355",
        "gender": "F",
        "mobile_number": "9876543211",
        "street_address": "8th Main, Gokulam 3rd Stage",
        "city": "Mysore",
        "state": "Karnataka",
        "postal_code": "570002",
        "latitude": 12.3200,
        "longitude": 76.6300,
        "prices": [449.00, 549.00, 399.00]
    },

    # Home Cleaning Providers
    {
        "main_service": "Home Cleaning",
        "first_name": "Sunita",
        "last_name": "Verma",
        "email": "sunita.clean@gmail.com",
        "aadhaar": "990011223366",
        "gender": "F",
        "mobile_number": "9876543212",
        "street_address": "4th Cross, Jayalakshmipuram",
        "city": "Mysore",
        "state": "Karnataka",
        "postal_code": "570012",
        "latitude": 12.3050,
        "longitude": 76.6250,
        "prices": [349.00, 1299.00, 899.00]
    },
    {
        "main_service": "Home Cleaning",
        "first_name": "Kavitha",
        "last_name": "Nair",
        "email": "kavitha.sanitization@gmail.com",
        "aadhaar": "990011223377",
        "gender": "F",
        "mobile_number": "9876543213",
        "street_address": "15th Main, Saraswathipuram",
        "city": "Mysore",
        "state": "Karnataka",
        "postal_code": "570009",
        "latitude": 12.2980,
        "longitude": 76.6350,
        "prices": [299.00, 1199.00, 799.00]
    },

    # Carpenter Providers
    {
        "main_service": "Carpenter",
        "first_name": "Rajesh",
        "last_name": "Kumar",
        "email": "rajesh.woodworks@gmail.com",
        "aadhaar": "990011223388",
        "gender": "M",
        "mobile_number": "9876543214",
        "street_address": "Station Road, Mandya",
        "city": "Mandya",
        "state": "Karnataka",
        "postal_code": "571401",
        "latitude": 12.5220,
        "longitude": 76.8970,
        "prices": [399.00, 299.00, 1499.00]
    },
    {
        "main_service": "Carpenter",
        "first_name": "Suresh",
        "last_name": "Gowda",
        "email": "suresh.carpentry@gmail.com",
        "aadhaar": "990011223399",
        "gender": "M",
        "mobile_number": "9876543215",
        "street_address": "KRS Main Road, Metagalli",
        "city": "Mysore",
        "state": "Karnataka",
        "postal_code": "570016",
        "latitude": 12.3350,
        "longitude": 76.6200,
        "prices": [349.00, 249.00, 1399.00]
    }
]

created_count = 0
for data in test_providers_data:
    try:
        service = Service.objects.filter(name__icontains=data["main_service"]).first()
        if not service:
            print(f"Service '{data['main_service']}' not found!")
            continue

        provider, created = ServiceProvider.objects.get_or_create(
            email=data["email"],
            defaults={
                "main_service": service,
                "first_name": data["first_name"],
                "last_name": data["last_name"],
                "aadhaar": data["aadhaar"],
                "gender": data["gender"],
                "mobile_number": data["mobile_number"],
                "street_address": data["street_address"],
                "city": data["city"],
                "state": data["state"],
                "postal_code": data["postal_code"],
                "latitude": data["latitude"],
                "longitude": data["longitude"],
                "is_active": True,
            }
        )

        subservices = list(SubService.objects.filter(main_service=service))
        for idx, subservice in enumerate(subservices):
            price = data["prices"][idx % len(data["prices"])]
            ProviderService.objects.get_or_create(
                provider=provider,
                sub_service=subservice,
                defaults={"price": price}
            )
        
        created_count += 1
        print(f"Successfully added/verified provider: {provider.full_name} for {service.name} with {len(subservices)} subservices")

    except Exception as e:
        print(f"Error creating provider {data['email']}: {e}")

print(f"\nTotal test providers added/updated: {created_count}")
