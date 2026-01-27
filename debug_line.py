
with open(r'c:\Users\maju\Downloads\ashish_personell-main\ashish_personell-main\ashish_personell-main\ashish_personell-main\client\src\pages\Records.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()
    line_9360 = lines[9359] # 0-indexed
    print(f"Line 9360: {repr(line_9360)}")
    print(f"Hex: {line_9360.encode('utf-8').hex()}")
