
import os
import shutil
from datetime import datetime

history_paths = [
    r'C:\Users\maju\AppData\Roaming\Code\User\History',
    r'C:\Users\maju\AppData\Roaming\Cursor\User\History',
    r'C:\Users\maju\AppData\Local\Cursor\User\History'
]
target_recovery_dir = r'c:\Users\maju\Downloads\ashish_personell-main\RECOVERED_FILES'
target_size = 599252

os.makedirs(target_recovery_dir, exist_ok=True)
print(f"Finding versions close to {target_size} bytes in ALL history paths...")

found = []
for history_path in history_paths:
    if not os.path.exists(history_path): continue
    print(f"Scanning {history_path}...")
    for root, dirs, files in os.walk(history_path):
        for file in files:
            if file == 'entries.json': continue
            p = os.path.join(root, file)
            try:
                size = os.path.getsize(p)
                if 550000 < size < 650000:
                    with open(p, 'r', encoding='utf-8', errors='ignore') as f:
                        header = f.read(1000)
                        if 'import' in header and 'React' in header:
                            mtime = os.path.getmtime(p)
                            dt = datetime.fromtimestamp(mtime)
                            found.append((dt, p, size))
            except:
                continue

found.sort(key=lambda x: x[0], reverse=True)

print(f"\nFound {len(found)} candidate matches:")
for dt, p, size in found[:10]:
    print(f"[{dt.strftime('%H:%M:%S')}] {p} ({size} bytes)")
    shutil.copy2(p, os.path.join(target_recovery_dir, f"RECOVERED_{dt.strftime('%H%M%S')}_Records.tsx"))

print(f"\nCandidates copied to {target_recovery_dir}")
