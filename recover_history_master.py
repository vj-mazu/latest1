
import os
import json
import shutil
from datetime import datetime, timedelta

history_path = r'C:\Users\maju\AppData\Roaming\Code\User\History'
target_recovery_dir = r'c:\Users\maju\Downloads\ashish_personell-main\RECOVERED_FILES'

os.makedirs(target_recovery_dir, exist_ok=True)
print(f"Searching VS Code History at {history_path}...")

found_files = []
now = datetime.now()
limit = now - timedelta(days=7)

if not os.path.exists(history_path):
    print("History path not found.")
    exit(1)

for folder in os.listdir(history_path):
    folder_path = os.path.join(history_path, folder)
    if not os.path.isdir(folder_path): continue
    
    entries_file = os.path.join(folder_path, 'entries.json')
    if not os.path.exists(entries_file): continue
    
    try:
        with open(entries_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
            uri = data.get('resource', '')
            
            entries = data.get('entries', [])
            for entry in entries:
                ts = entry.get('timestamp', 0) / 1000
                dt = datetime.fromtimestamp(ts)
                
                if dt > limit:
                    file_id = entry.get('id')
                    src = os.path.join(folder_path, file_id)
                    if os.path.exists(src):
                        found_files.append((dt, uri, src))
    except:
        continue

found_files.sort(key=lambda x: x[0], reverse=True)

print(f"Found {len(found_files)} entries from the last 7 days.")
for dt, uri, src in found_files[:100]:
    basename = os.path.basename(uri)
    print(f"[{dt.strftime('%m-%d %H:%M')}] {basename}  ({uri})")
    
    safe_name = f"{dt.strftime('%m%d_%H%M%S')}_{basename}"
    shutil.copy2(src, os.path.join(target_recovery_dir, safe_name))

print(f"\nSearch complete. Files are in: {target_recovery_dir}")
