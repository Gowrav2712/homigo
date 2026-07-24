import os
import sys
import django
from django.core.files import File

sys.path.append(os.path.join(os.path.dirname(__file__), 'server'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from service.models import Service
from sub_service.models import SubService

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MAIN_IMAGES_DIR = os.path.normpath(os.path.join(BASE_DIR, '../frontend/client/public/service_images'))
SUB_IMAGES_DIR = os.path.normpath(os.path.join(BASE_DIR, '../frontend/client/public/service_images/subservices'))

main_service_map = {
    'Appliance Repair': 'appliance_repair.png',
    'CCTV Install': 'cctv_install.png',
    'Carpenter': 'carpenter.png',
    'Electricians': 'electricians.png',
    'Home Cleaning': 'home_cleaning.png',
    'Packers and Movers': 'packers_movers.png',
    'Painter': 'painter.png',
    'Plumber': 'plumber.png',
    'WiFi Install': 'wifi_install.png',
}

sub_service_map = {
    'AC Repair & Service': 'ac_repair.png',
    'Refrigerator Repair': 'refrigerator_repair.png',
    'Washing Machine Repair': 'washing_machine.png',
    'Bathroom Sanitization': 'bathroom_sanitization.png',
    'Deep Home Cleaning': 'deep_home_cleaning.png',
    'Kitchen Deep Cleaning': 'kitchen_deep_cleaning.png',
    'CCTV Camera Installation': 'cctv_camera_install.png',
    'DVR & NVR Configuration': 'dvr_nvr_config.png',
    'Security Camera Repair': 'security_camera_repair.png',
    'Door & Window Repair': 'door_window_repair.png',
    'Furniture Assembly': 'furniture_assembly.png',
    'Modular Cabinet Making': 'modular_cabinet.png',
    'Fan Repair & Install': 'fan_repair.png',
    'House Wiring & Fitting': 'house_wiring.png',
    'Switchboard Installation': 'switchboard_install.png',
    'Fiber Connection Setup': 'fiber_connection.png',
    'Network Troubleshooting': 'network_troubleshooting.png',
    'Router Setup & Config': 'router_setup.png',
    'Full House Interior Paint': 'full_house_paint.png',
    'Texture & Accent Wall': 'texture_accent_wall.png',
    'Wall Waterproofing': 'wall_waterproofing.png',
    'Intercity Moving': 'intercity_moving.png',
    'Local House Shifting': 'local_house_shifting.png',
    'Office Furniture Relocation': 'office_relocation.png',
    'Pipe Unclogging': 'pipe_unclogging.png',
    'Tap Repair & Leakage Fix': 'tap_repair.png',
    'Water Tank Cleaning': 'water_tank_cleaning.png',
}

print("--- Populating Main Service Images in Django Backend ---")
updated_main = 0
for name, filename in main_service_map.items():
    service = Service.objects.filter(name__icontains=name).first()
    if not service:
        print(f"Main service '{name}' not found in DB!")
        continue

    file_path = os.path.join(MAIN_IMAGES_DIR, filename)
    if os.path.exists(file_path):
        with open(file_path, 'rb') as f:
            service.image.save(filename, File(f), save=True)
        updated_main += 1
        print(f"[OK] Saved image for Main Service: {service.name}")
    else:
        print(f"[FAIL] Image file not found: {file_path}")

print(f"\nTotal Main Services updated with images: {updated_main}")

print("\n--- Populating SubService Images in Django Backend ---")
updated_sub = 0
for name, filename in sub_service_map.items():
    subservice = SubService.objects.filter(name__icontains=name).first()
    if not subservice:
        print(f"SubService '{name}' not found in DB!")
        continue

    file_path = os.path.join(SUB_IMAGES_DIR, filename)
    if os.path.exists(file_path):
        with open(file_path, 'rb') as f:
            subservice.image.save(filename, File(f), save=True)
        updated_sub += 1
        print(f"[OK] Saved image for SubService: {subservice.name}")
    else:
        print(f"[FAIL] Image file not found: {file_path}")

print(f"\nTotal SubServices updated with images: {updated_sub}")
