
import os

paths = [
    r'C:\Users\maju\AppData\Roaming\Code\User\History',
    r'C:\Users\maju\AppData\Roaming\Cursor\User\History',
    r'C:\Users\maju\AppData\Local\Code\User\History',
    r'C:\Users\maju\AppData\Local\Cursor\User\History'
]

# Multiple search terms to catch different files
search_terms = ["inline palti", "paltimodal", "enhancedpalti", "palti entries"]
found = []

print("Starting deep history search for code fragments...")

for base in paths:
    if not os.path.exists(base): continue
    print(f"Scanning {base}...")
    for root, dirs, files in os.walk(base):
        for file in files:
            if file == 'entries.json' or file.endswith('.png') or file.endswith('.jpg'): 
                continue
            
            p = os.path.join(root, file)
            try:
                with open(p, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read().lower()
                    for term in search_terms:
                        if term in content:
                            found.append((root, file, term))
                            print(f"MATCH [{term}]: {p}")
                            break
            except:
                continue

print(f"\nFound {len(found)} potential history matches.")
