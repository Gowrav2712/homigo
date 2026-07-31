import os
import sys
import glob
import shutil
import django
from django.core.files import File

# Initialize Django
sys.path.append(os.path.join(os.path.dirname(__file__), 'server'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'server.settings')
django.setup()

from service.models import Service
from sub_service.models import SubService

BRAIN_DIR = r"C:\Users\HP\.gemini\antigravity-ide\brain\c2331cb8-3c8d-4f9e-8c45-e0aa6a042afb"
FRONTEND_MAIN_DIR = r"c:\Users\HP\OneDrive\Documents\antigravity\fixNGo-main\fixNGo-main\frontend\client\public\service_images"
FRONTEND_SUB_DIR = os.path.join(FRONTEND_MAIN_DIR, "subservices")

BACKEND_MEDIA_DIR = r"c:\Users\HP\OneDrive\Documents\antigravity\fixNGo-main\fixNGo-main\backend\server\images"
BACKEND_SERVICES_MEDIA = os.path.join(BACKEND_MEDIA_DIR, "services")
BACKEND_SUB_MEDIA = os.path.join(BACKEND_MEDIA_DIR, "sub_service")

# 1. Clean up ALL old images in backend media directories
print("--- 1. Cleaning old backend media files ---")
if os.path.exists(BACKEND_SERVICES_MEDIA):
    for f in glob.glob(os.path.join(BACKEND_SERVICES_MEDIA, "*")):
        try:
            os.remove(f)
            print(f"[REMOVED OLD MEDIA] {os.path.basename(f)}")
        except Exception as e:
            print(f"Error removing {f}: {e}")

if os.path.exists(BACKEND_SUB_MEDIA):
    for f in glob.glob(os.path.join(BACKEND_SUB_MEDIA, "*")):
        try:
            os.remove(f)
            print(f"[REMOVED OLD SUB MEDIA] {os.path.basename(f)}")
        except Exception as e:
            print(f"Error removing {f}: {e}")

# 2. Update frontend static public files with clean new female images only
print("\n--- 2. Updating Frontend Public Service Images ---")

# Generated female images mapping
generated_main = {
    'carpenter.png': 'carpenter_main_1785320874444.png',
    'electricians.png': 'electricians_main_1785320887794.png',
    'wifi_install.png': 'wifi_install_main_1785320901692.png',
    'painter.png': 'painter_main_1785320918512.png',
    'packers_movers.png': 'packers_movers_main_1785320931968.png',
    'plumber.png': 'plumber_main_1785320946939.png',
}

generated_sub = {
    'washing_machine.png': 'washing_machine_sub_1785320961987.png',
    'furniture_assembly.png': 'furniture_assembly_sub_1785320977083.png',
    'tap_repair.png': 'tap_repair_sub_1785320993110.png',
    'fan_repair.png': 'fan_repair_sub_1785321006303.png',
}

for target_name, brain_name in generated_main.items():
    src = os.path.join(BRAIN_DIR, brain_name)
    dst = os.path.join(FRONTEND_MAIN_DIR, target_name)
    if os.path.exists(src):
        shutil.copy2(src, dst)
        print(f"[FRONTEND MAIN UPDATED] {target_name}")

for target_name, brain_name in generated_sub.items():
    src = os.path.join(BRAIN_DIR, brain_name)
    dst = os.path.join(FRONTEND_SUB_DIR, target_name)
    if os.path.exists(src):
        shutil.copy2(src, dst)
        print(f"[FRONTEND SUB UPDATED] {target_name}")

# Map remaining subservices to female technician images
sub_service_female_mappings = {
    'door_window_repair.png': 'carpenter.png',
    'modular_cabinet.png': 'carpenter.png',
    'house_wiring.png': 'electricians.png',
    'switchboard_install.png': 'electricians.png',
    'fiber_connection.png': 'wifi_install.png',
    'network_troubleshooting.png': 'wifi_install.png',
    'router_setup.png': 'wifi_install.png',
    'full_house_paint.png': 'painter.png',
    'texture_accent_wall.png': 'painter.png',
    'wall_waterproofing.png': 'painter.png',
    'intercity_moving.png': 'packers_movers.png',
    'local_house_shifting.png': 'packers_movers.png',
    'office_relocation.png': 'packers_movers.png',
    'pipe_unclogging.png': 'plumber.png',
    'water_tank_cleaning.png': 'plumber.png',
    'cctv_camera_install.png': 'cctv_install.png',
    'dvr_nvr_config.png': 'cctv_install.png',
    'security_camera_repair.png': 'cctv_install.png',
    'bathroom_sanitization.png': 'home_cleaning.png',
    'deep_home_cleaning.png': 'home_cleaning.png',
    'kitchen_deep_cleaning.png': 'home_cleaning.png',
}

for sub_target, main_src in sub_service_female_mappings.items():
    src = os.path.join(FRONTEND_MAIN_DIR, main_src)
    dst = os.path.join(FRONTEND_SUB_DIR, sub_target)
    if os.path.exists(src):
        shutil.copy2(src, dst)
        print(f"[FRONTEND SUB MAPPED] {sub_target} from {main_src}")

# 3. Reset Django DB Service and SubService Image fields and populate with clean files
print("\n--- 3. Resetting & Populating Django DB Models ---")
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

for sname, filename in main_db_map.items():
    svc = Service.objects.filter(name__icontains=sname).first()
    if svc:
        if svc.image:
            svc.image.delete(save=False)
        filePath = os.path.join(FRONTEND_MAIN_DIR, filename)
        if os.path.exists(filePath):
            with open(filePath, 'rb') as f:
                svc.image.save(filename, File(f), save=True)
            print(f"[DB SERVICE CLEANED & SAVED] {svc.name} -> {svc.image.name}")

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

for subname, filename in sub_db_map.items():
    sub = SubService.objects.filter(name__icontains=subname).first()
    if sub:
        if sub.image:
            sub.image.delete(save=False)
        filePath = os.path.join(FRONTEND_SUB_DIR, filename)
        if os.path.exists(filePath):
            with open(filePath, 'rb') as f:
                sub.image.save(filename, File(f), save=True)
            print(f"[DB SUBSERVICE CLEANED & SAVED] {sub.name} -> {sub.image.name}")

print("\nSUCCESS: All old images removed and DB/frontend fully updated with female technician images!")
