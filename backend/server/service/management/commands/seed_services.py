import os
from django.core.management.base import BaseCommand
from django.core.files import File
from django.conf import settings
from service.models import Service
from sub_service.models import SubService


class Command(BaseCommand):
    help = 'Seeds 9 main services and 27 sub-services with images into the database'

    SERVICE_IMAGE_MAP = {
        'Appliance Repair': 'services/appliance_repair.png',
        'Home Cleaning':    'services/home_cleaning.png',
        'CCTV Install':     'services/cctv_install.png',
        'Carpenter':        'services/carpenter.png',
        'Electricians':     'services/electricians.png',
        'WiFi Install':     'services/wifi_install.png',
        'Painter':          'services/painter.png',
        'Packers and Movers': 'services/packers_movers.png',
        'Plumber':          'services/plumber.png',
    }

    SUBSERVICE_IMAGE_MAP = {
        'AC Repair & Service':        'sub_service/ac_repair.png',
        'Refrigerator Repair':        'sub_service/refrigerator_repair.png',
        'Washing Machine Repair':     'sub_service/washing_machine.png',
        'Bathroom Sanitization':      'sub_service/bathroom_sanitization.png',
        'Deep Home Cleaning':         'sub_service/deep_home_cleaning.png',
        'Kitchen Deep Cleaning':      'sub_service/kitchen_deep_cleaning.png',
        'CCTV Camera Installation':   'sub_service/cctv_camera_install.png',
        'DVR & NVR Configuration':    'sub_service/dvr_nvr_config.png',
        'Security Camera Repair':     'sub_service/security_camera_repair.png',
        'Door & Window Repair':       'sub_service/door_window_repair.png',
        'Furniture Assembly':         'sub_service/furniture_assembly.png',
        'Modular Cabinet Making':     'sub_service/modular_cabinet.png',
        'Fan Repair & Install':       'sub_service/fan_repair.png',
        'House Wiring & Fitting':     'sub_service/house_wiring.png',
        'Switchboard Installation':   'sub_service/switchboard_install.png',
        'Fiber Connection Setup':     'sub_service/fiber_connection.png',
        'Network Troubleshooting':    'sub_service/network_troubleshooting.png',
        'Router Setup & Config':      'sub_service/router_setup.png',
        'Full House Interior Paint':  'sub_service/full_house_paint.png',
        'Texture & Accent Wall':      'sub_service/texture_accent_wall.png',
        'Wall Waterproofing':         'sub_service/wall_waterproofing.png',
        'Intercity Moving':           'sub_service/intercity_moving.png',
        'Local House Shifting':       'sub_service/local_house_shifting.png',
        'Office Furniture Relocation': 'sub_service/office_relocation.png',
        'Pipe Unclogging':            'sub_service/pipe_unclogging.png',
        'Tap Repair & Leakage Fix':   'sub_service/tap_repair.png',
        'Water Tank Cleaning':        'sub_service/water_tank_cleaning.png',
    }

    SERVICES_DATA = [
        {
            'name': 'Appliance Repair',
            'sub_services': ['AC Repair & Service', 'Refrigerator Repair', 'Washing Machine Repair']
        },
        {
            'name': 'Home Cleaning',
            'sub_services': ['Bathroom Sanitization', 'Deep Home Cleaning', 'Kitchen Deep Cleaning']
        },
        {
            'name': 'CCTV Install',
            'sub_services': ['CCTV Camera Installation', 'DVR & NVR Configuration', 'Security Camera Repair']
        },
        {
            'name': 'Carpenter',
            'sub_services': ['Door & Window Repair', 'Furniture Assembly', 'Modular Cabinet Making']
        },
        {
            'name': 'Electricians',
            'sub_services': ['Fan Repair & Install', 'House Wiring & Fitting', 'Switchboard Installation']
        },
        {
            'name': 'WiFi Install',
            'sub_services': ['Fiber Connection Setup', 'Network Troubleshooting', 'Router Setup & Config']
        },
        {
            'name': 'Painter',
            'sub_services': ['Full House Interior Paint', 'Texture & Accent Wall', 'Wall Waterproofing']
        },
        {
            'name': 'Packers and Movers',
            'sub_services': ['Intercity Moving', 'Local House Shifting', 'Office Furniture Relocation']
        },
        {
            'name': 'Plumber',
            'sub_services': ['Pipe Unclogging', 'Tap Repair & Leakage Fix', 'Water Tank Cleaning']
        },
    ]

    def _attach_image(self, obj, field_name, relative_path):
        """Attach an image from MEDIA_ROOT to a model's ImageField."""
        abs_path = os.path.join(settings.MEDIA_ROOT, relative_path)
        if not os.path.exists(abs_path):
            self.stdout.write(self.style.WARNING(f'    Image not found: {abs_path}'))
            return
        # Only update if no image is set yet
        field = getattr(obj, field_name)
        if field and field.name == relative_path:
            return  # already set, skip
        with open(abs_path, 'rb') as f:
            filename = os.path.basename(abs_path)
            field.save(filename, File(f), save=True)

    def handle(self, *args, **options):
        self.stdout.write('Seeding 9 services and 27 sub-services with images...')

        valid_service_names = [s['name'] for s in self.SERVICES_DATA]
        Service.objects.exclude(name__in=valid_service_names).delete()

        for s_data in self.SERVICES_DATA:
            service_obj, created = Service.objects.get_or_create(name=s_data['name'])
            action = 'Created' if created else 'Found'
            self.stdout.write(f'  {action} service: {service_obj.name}')

            # Attach service image
            img_path = self.SERVICE_IMAGE_MAP.get(s_data['name'])
            if img_path:
                self._attach_image(service_obj, 'image', img_path)

            # Remove stale sub-services
            SubService.objects.filter(main_service=service_obj).exclude(
                name__in=s_data['sub_services']
            ).delete()

            for sub_name in s_data['sub_services']:
                sub_obj, sub_created = SubService.objects.get_or_create(
                    name=sub_name,
                    main_service=service_obj
                )
                sub_action = 'Created' if sub_created else 'Found'
                self.stdout.write(f'    {sub_action} sub-service: {sub_obj.name}')

                # Attach sub-service image
                sub_img_path = self.SUBSERVICE_IMAGE_MAP.get(sub_name)
                if sub_img_path:
                    self._attach_image(sub_obj, 'image', sub_img_path)

        self.stdout.write(self.style.SUCCESS(
            'Successfully seeded 9 main services and 27 sub-services with images!'
        ))
