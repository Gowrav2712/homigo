import os
import urllib.request

base_dir = r"c:\Users\HP\OneDrive\Documents\antigravity\fixNGo-main\fixNGo-main\frontend\client\public\service_images"
sub_dir = os.path.join(base_dir, "subservices")
os.makedirs(sub_dir, exist_ok=True)

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

images = {
    # Main Services
    "carpenter.png": "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=600&q=80",
    "electricians.png": "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80",
    "wifi_install.png": "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80",
    "painter.png": "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80",
    "packers_movers.png": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80",
    "plumber.png": "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80",

    # Subservices
    "subservices/washing_machine.png": "https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=400&q=80",
    "subservices/bathroom_sanitization.png": "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80",
    "subservices/deep_home_cleaning.png": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=400&q=80",
    "subservices/kitchen_deep_cleaning.png": "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80",
    "subservices/cctv_camera_install.png": "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=400&q=80",
    "subservices/dvr_nvr_config.png": "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=400&q=80",
    "subservices/security_camera_repair.png": "https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=400&q=80",
    "subservices/door_window_repair.png": "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=400&q=80",
    "subservices/furniture_assembly.png": "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=400&q=80",
    "subservices/modular_cabinet.png": "https://images.unsplash.com/photo-1556909212-d5b604d0c90d?auto=format&fit=crop&w=400&q=80",
    "subservices/fan_repair.png": "https://images.unsplash.com/photo-1544725121-be3bf52e2dc8?auto=format&fit=crop&w=400&q=80",
    "subservices/house_wiring.png": "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&q=80",
    "subservices/switchboard_install.png": "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?auto=format&fit=crop&w=400&q=80",
    "subservices/fiber_connection.png": "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=400&q=80",
    "subservices/network_troubleshooting.png": "https://images.unsplash.com/photo-1551808525-51a94da548ce?auto=format&fit=crop&w=400&q=80",
    "subservices/router_setup.png": "https://images.unsplash.com/photo-1563770660941-20978e870e26?auto=format&fit=crop&w=400&q=80",
    "subservices/full_house_paint.png": "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=400&q=80",
    "subservices/texture_accent_wall.png": "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=400&q=80",
    "subservices/wall_waterproofing.png": "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=400&q=80",
    "subservices/intercity_moving.png": "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80",
    "subservices/local_house_shifting.png": "https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=400&q=80",
    "subservices/office_relocation.png": "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80",
    "subservices/pipe_unclogging.png": "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=400&q=80",
    "subservices/tap_repair.png": "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?auto=format&fit=crop&w=400&q=80",
    "subservices/water_tank_cleaning.png": "https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=400&q=80"
}

for rel_path, url in images.items():
    out_path = os.path.join(base_dir, rel_path)
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req) as resp, open(out_path, 'wb') as f:
            f.write(resp.read())
        print(f"DOWNLOADED: {rel_path}")
    except Exception as e:
        print(f"FAILED: {rel_path} -> {e}")
