
import os
import json
import shutil
from datetime import datetime

history_path = r'C:\Users\maju\AppData\Roaming\Code\User\History'
target_recovery_dir = r'c:\Users\maju\Downloads\ashish_personell-main\RECOVERED_FILES'

if not os.path.exists(history_path):
    print(f"Path not found: {history_path}")
    exit(1)

os.makedirs(target_recovery_dir, exist_ok=True)

print(f"Searching VS Code History at {history_path}...")

found_files = []

for folder in os.listdir(history_path):
    folder_path = os.path.join(history_path, folder)
    if not os.path.isdir(folder_path): continue
    
    entries_file = os.path.join(folder_path, 'entries.json')
    if not os.path.exists(entries_file): continue
    
    try:
        with open(entries_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            resource_uri = data.get('resource')
            
                # Just list all unique project URIs found to help identify the correct one
                if resource_uri not in [x[1] for x in found_files]:
                     entries = data.get('entries', [])
                     if entries:
                         latest = max(entries, key=lambda x: x.get('timestamp', 0))
                         ts = latest.get('timestamp') / 1000
                         dt = datetime.fromtimestamp(ts)
                         file_id = latest.get('id')
                         source_file = os.path.join(folder_path, file_id)
                         if os.path.exists(source_file):
                             found_files.append((dt, resource_uri, source_file))

# Sort by most recent
found_files.sort(key=lambda x: x[0], reverse=True)

print(f"\nFound {len(found_files)} unique project files in History:")
for dt, uri, src in found_files[:50]:
    basename = os.path.basename(uri)
    print(f"[{dt.strftime('%Y-%m-%d %H:%M:%S')}] {basename} ({uri})")
    
    # Copy to recovery dir
    safe_name = f"{dt.strftime('%Y%m%d_%H%M%S')}_{basename}"
    shutil.copy2(src, os.path.join(target_recovery_dir, safe_name))

print(f"\nBroad search complete. {len(found_files)} files copied.")
