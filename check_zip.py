
import zipfile
import sys

zip_path = r'C:\Users\maju\Downloads\ashish_personell-main (3).zip'
search_pattern = 'Records/tabs'

try:
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        found = False
        for member in zip_ref.namelist():
            if member.endswith('.md'):
                print(member)
                found = True
        if not found:
            print("No files found in " + search_pattern)
except Exception as e:
    print(f"Error: {e}")
