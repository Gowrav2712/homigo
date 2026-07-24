from django.core.management.base import BaseCommand
from service.models import Service
from sub_service.models import SubService

class Command(BaseCommand):
    help = 'Seeds main services and sub services into the database, removing any extra services'

    def handle(self, *args, **options):
        services_data = [
            {
                'name': 'Appliance Repair',
                'sub_services': [
                    'AC Repair & Service',
                    'Refrigerator Repair',
                    'Washing Machine Repair'
                ]
            },
            {
                'name': 'Home Cleaning',
                'sub_services': [
                    'Bathroom Sanitization',
                    'Deep Home Cleaning',
                    'Kitchen Deep Cleaning'
                ]
            },
            {
                'name': 'CCTV Install',
                'sub_services': [
                    'CCTV Camera Installation',
                    'DVR & NVR Configuration',
                    'Security Camera Repair'
                ]
            },
            {
                'name': 'Carpenter',
                'sub_services': [
                    'Door & Window Repair',
                    'Furniture Assembly',
                    'Modular Cabinet Making'
                ]
            },
            {
                'name': 'Electricians',
                'sub_services': [
                    'Fan Repair & Install',
                    'House Wiring & Fitting',
                    'Switchboard Installation'
                ]
            },
            {
                'name': 'WiFi Install',
                'sub_services': [
                    'Fiber Connection Setup',
                    'Network Troubleshooting',
                    'Router Setup & Config'
                ]
            },
            {
                'name': 'Painter',
                'sub_services': [
                    'Full House Interior Paint',
                    'Texture & Accent Wall',
                    'Wall Waterproofing'
                ]
            },
            {
                'name': 'Packers and Movers',
                'sub_services': [
                    'Intercity Moving',
                    'Local House Shifting',
                    'Office Furniture Relocation'
                ]
            },
            {
                'name': 'Plumber',
                'sub_services': [
                    'Pipe Unclogging',
                    'Tap Repair & Leakage Fix',
                    'Water Tank Cleaning'
                ]
            }
        ]

        self.stdout.write('Updating database services and removing extra sub-services...')
        
        valid_service_names = [s['name'] for s in services_data]
        
        # Delete services not in valid_service_names
        Service.objects.exclude(name__in=valid_service_names).delete()

        for s_data in services_data:
            service_obj, created = Service.objects.get_or_create(name=s_data['name'])
            
            # Delete extra sub-services for this main service
            SubService.objects.filter(main_service=service_obj).exclude(name__in=s_data['sub_services']).delete()

            for sub_name in s_data['sub_services']:
                sub_obj, sub_created = SubService.objects.get_or_create(
                    name=sub_name,
                    main_service=service_obj
                )
                self.stdout.write(f'  [{service_obj.name}] -> {sub_obj.name}')

        self.stdout.write(self.style.SUCCESS('Successfully updated to 9 main services and 27 sub-services!'))
