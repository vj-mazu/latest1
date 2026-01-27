
import zipfile
import os

zip_path = r'C:\Users\maju\Downloads\ashish_personell-main (2).zip'
search_file = 'client/src/pages/Records.tsx'

try:
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        for member in zip_ref.infolist():
            if member.filename.endswith(search_file):
                print(f"File: {member.filename}")
                print(f"Size: {member.file_size}")
                print(f"Date: {member.date_time}")
except Exception as e:
    print(f"Error: {e}")
