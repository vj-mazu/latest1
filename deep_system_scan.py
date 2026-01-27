
import os
from datetime import datetime, timedelta

# Search Paths
search_paths = [
    r'C:\Users\maju\AppData',
    r'C:\Users\maju\Downloads'
]
target_recovery_dir = r'c:\Users\maju\Downloads\ashish_personell-main\RECOVERED_FILES'

os.makedirs(target_recovery_dir, exist_ok=True)
now = datetime.now()
four_hours_ago = now - timedelta(hours=4)

print(f"Deep Scanning for files modified after {four_hours_ago.strftime('%H:%M:%S')}...")

found_count = 0

for base in search_paths:
    if not os.path.exists(base): continue
    for root, dirs, files in os.walk(base):
        # Skip node_modules and big binary folders to speed up
        if 'node_modules' in root or 'AppData\\Local\\Microsoft' in root or 'AppData\\Local\\Google' in root:
            continue
            
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts') or file.endswith('.js'):
                p = os.path.join(root, file)
                try:
                    mtime = os.path.getmtime(p)
                    dt = datetime.fromtimestamp(mtime)
                    if dt > four_hours_ago:
                        size = os.path.getsize(p)
                        print(f"FOUND: {p} ({size} bytes, {dt.strftime('%H:%M:%S')})")
                        # Copy to recovery dir if it's a project file
                        if size > 1000: # ignore very small files
                             import shutil
                             shutil.copy2(p, os.path.join(target_recovery_dir, f"DEEP_{dt.strftime('%H%M%S')}_{file}"))
                             found_count += 1
                except:
                    continue

print(f"\nDeep Scan complete. Found {found_count} recent files.")
