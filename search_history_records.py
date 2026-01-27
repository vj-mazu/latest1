
import os
import json
import shutil
from datetime import datetime

history_paths = [
    r'C:\Users\maju\AppData\Roaming\Code\User\History',
    r'C:\Users\maju\AppData\Roaming\Cursor\User\History',
    r'C:\Users\maju\AppData\Local\Cursor\User\History',
    r'C:\Users\maju\AppData\Local\Code\User\History'
]
target_recovery_dir = r'c:\Users\maju\Downloads\ashish_personell-main\RECOVERED_FILES'
target_filename = 'Records.tsx'

os.makedirs(target_recovery_dir, exist_ok=True)
print(f"Searching for all versions of {target_filename} in multiple history paths...")

found_files = []

for history_path in history_paths:
    if not os.path.exists(history_path): continue
    print(f"Checking {history_path}...")
    for folder in os.listdir(history_path):
        folder_path = os.path.join(history_path, folder)
        if not os.path.isdir(folder_path): continue
        
        entries_file = os.path.join(folder_path, 'entries.json')
        if not os.path.exists(entries_file): continue
        
        try:
            with open(entries_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                resource_uri = data.get('resource', '')
                
                if target_filename.lower() in resource_uri.lower():
                    entries = data.get('entries', [])
                    for entry in entries:
                        ts = entry.get('timestamp', 0) / 1000
                        dt = datetime.fromtimestamp(ts)
                        file_id = entry.get('id')
                        src = os.path.join(folder_path, file_id)
                        if os.path.exists(src):
                            size = os.path.getsize(src)
                            found_files.append((dt, resource_uri, src, size))
        except:
            continue

found_files.sort(key=lambda x: x[0], reverse=True)

print(f"Found {len(found_files)} versions:")
for dt, uri, src, size in found_files:
    # Print everything so I can find the 599KB version
    print(f"[{dt.strftime('%m-%d %H:%M:%S')}] {size} bytes - {uri}")
    safe_name = f"REV_{dt.strftime('%m%d_%H%M%S')}_{size}_{os.path.basename(uri)}"
    shutil.copy2(src, os.path.join(target_recovery_dir, safe_name))

print(f"\nResults copied to: {target_recovery_dir}")
