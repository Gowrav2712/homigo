import os
import sys
import shutil
import django
from django.core.files import File

# Initialize Django environment
sys.path.append(os.path.join(os.path.dirname(__file__), 'server'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from service.models import Service
from sub_service.models import SubService

BRAIN_DIR = r"C:\Users\HP\.gemini\antigravity-ide\brain\c2331cb8-3c8d-4f9e-8c45-e0aa6a042afb"
FRONTEND_IMAGES_DIR = r"c:\Users\HP\OneDrive\Documents\antigravity\fixNGo-main\fixNGo-main\frontend\client\public\service_images"
FRONTEND_SUB_IMAGES_DIR = os.path.join(FRONTEND_IMAGES_DIR, "subservices")

os.makedirs(FRONTEND_SUB_IMAGES_DIR, exist_ok=True)

# 1. Main Service Generated Images mapping
generated_main_mapping = {
    'carpenter.png': 'carpenter_main_1785320874444.png',
    'electricians.png': 'electricians_main_1785320887794.png',
    'wifi_install.png': 'wifi_install_main_1785320901692.png',
    'painter.png': 'painter_main_1785320918512.png',
    'packers_movers.png': 'packers_movers_main_1785320931968.png',
    'plumber.png': 'plumber_main_1785320946939.png',
}

# 2. Subservice Specific Generated Images
generated_sub_mapping = {
    'washing_machine.png': 'washing_machine_sub_1785320961987.png',
    'furniture_assembly.png': 'furniture_assembly_sub_1785320977083.png',
    'tap_repair.png': 'tap_repair_sub_1785320993110.png',
    'fan_repair.png': 'fan_repair_sub_1785321006303.png',
}

print("=== 1. Copying Generated Female Technician Images to Frontend Static Assets ===")
for target_name, src_name in generated_main_mapping.items():
    src_path = os.path.join(BRAIN_DIR, src_name)
    dst_path = os.path.join(FRONTEND_IMAGES_DIR, target_name)
    if os.path.exists(src_path):
        shutil.copy2(src_path, dst_path)
        print(f"[COPY MAIN] {src_name} -> {target_name}")

for target_name, src_name in generated_sub_mapping.items():
    src_path = os.path.join(BRAIN_DIR, src_name)
    dst_path = os.path.join(FRONTEND_SUB_IMAGES_DIR, target_name)
    if os.path.exists(src_path):
        shutil.copy2(src_path, dst_path)
        print(f"[COPY SUB] {src_name} -> subservices/{target_name}")

# 3. Map remaining subservices to female technician images of their category
sub_service_female_defaults = {
    # Carpenter subservices
    'door_window_repair.png': 'carpenter.png',
    'modular_cabinet.png': 'carpenter.png',
    # Electricians subservices
    'house_wiring.png': 'electricians.png',
    'switchboard_install.png': 'electricians.png',
    # WiFi Install subservices
    'fiber_connection.png': 'wifi_install.png',
    'network_troubleshooting.png': 'wifi_install.png',
    'router_setup.png': 'wifi_install.png',
    # Painter subservices
    'full_house_paint.png': 'painter.png',
    'texture_accent_wall.png': 'painter.png',
    'wall_waterproofing.png': 'painter.png',
    # Packers Movers subservices
    'intercity_moving.png': 'packers_movers.png',
    'local_house_shifting.png': 'packers_movers.png',
    'office_relocation.png': 'packers_movers.png',
    # Plumber subservices
    'pipe_unclogging.png': 'plumber.png',
    'water_tank_cleaning.png': 'plumber.png',
    # CCTV Install subservices
    'cctv_camera_install.png': 'cctv_install.png',
    'dvr_nvr_config.png': 'cctv_install.png',
    'security_camera_repair.png': 'cctv_install.png',
    # Home Cleaning subservices
    'bathroom_sanitization.png': 'home_cleaning.png',
    'deep_home_cleaning.png': 'home_cleaning.png',
    'kitchen_deep_cleaning.png': 'home_cleaning.png',
}

for sub_target, main_src_file in sub_service_female_defaults.items():
    src_path = os.path.join(FRONTEND_IMAGES_DIR, main_src_file)
    dst_path = os.path.join(FRONTEND_SUB_IMAGES_DIR, sub_target)
    if os.path.exists(src_path):
        shutil.copy2(src_path, dst_path)
        print(f"[MAP SUB] {main_src_file} -> subservices/{sub_target}")

# 4. Populate Django Database Services and SubServices with these female images
print("\n=== 2. Updating Django Database Service Models ===")
main_db_map = {
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

for service_name, image_file in main_db_map.items():
    service = Service.objects.filter(name__icontains=service_name).first()
    if service:
        file_path = os.path.join(FRONTEND_IMAGES_DIR, image_file)
        if os.path.exists(file_path):
            with open(file_path, 'rb') as f:
                service.image.save(image_file, File(f), save=True)
            print(f"[DB SERVICE OK] Updated {service.name} with {image_file}")

sub_db_map = {
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

for sub_name, image_file in sub_db_map.items():
    sub = SubService.objects.filter(name__icontains=sub_name).first()
    if sub:
        file_path = os.path.join(FRONTEND_SUB_IMAGES_DIR, image_file)
        if os.path.exists(file_path):
            with open(file_path, 'rb') as f:
                sub.image.save(image_file, File(f), save=True)
            print(f"[DB SUB OK] Updated {sub.name} with subservices/{image_file}")

print("\nAll main services and subservices have been updated with female professional technician images!")
