
import os
import shutil
from datetime import datetime, date

history_paths = [
    r'C:\Users\maju\AppData\Roaming\Code\User\History',
    r'C:\Users\maju\AppData\Roaming\Cursor\User\History',
    r'C:\Users\maju\AppData\Local\Cursor\User\History',
    r'C:\Users\maju\AppData\Local\Code\User\History'
]
target_recovery_dir = r'c:\Users\maju\Downloads\ashish_personell-main\RECOVERED_FILES'

os.makedirs(target_recovery_dir, exist_ok=True)
today = date.today()

print(f"Finding all files saved TODAY ({today}) in all History paths...")

found = []
for history_path in history_paths:
    if not os.path.exists(history_path): continue
    print(f"Checking {history_path}...")
    for root, dirs, files in os.walk(history_path):
        for file in files:
            if file == 'entries.json': continue
            p = os.path.join(root, file)
            try:
                mtime = os.path.getmtime(p)
                dt = datetime.fromtimestamp(mtime)
                # Check if file was modified today
                if dt.date() == today:
                    size = os.path.getsize(p)
                    found.append((dt, p, size))
            except:
                continue

found.sort(key=lambda x: x[0], reverse=True)

print(f"\nFound {len(found)} entries from today:")
for dt, p, size in found[:50]:
    print(f"[{dt.strftime('%H:%M:%S')}] {p} ({size} bytes)")
    shutil.copy2(p, os.path.join(target_recovery_dir, f"TODAY_{dt.strftime('%H%M%S')}_{size}.file"))

print(f"\nSaved {min(len(found), 50)} files to {target_recovery_dir}")
