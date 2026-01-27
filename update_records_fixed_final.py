
import os

file_path = r'c:\Users\maju\Downloads\ashish_personell-main\ashish_personell-main\ashish_personell-main\ashish_personell-main\client\src\pages\Records.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_logic = [
    "                                             // 1. Calculate Sute Weight (Deduction based on Physical Bags or Weight)\n",
    "                                             const suteValue = parseFloat(rateFormData.sute || '0');\n",
    "                                             const suteWeightKg = rateFormData.suteCalculationMethod === 'per_bag'\n",
    "                                               ? suteValue * bags\n",
    "                                               : (actualNetWeight / 100) * suteValue;\n",
    "\n",
    "                                             // 2. Sute Net Weight (Weight left after Sute is subtracted)\n",
    "                                             const suteNetWeight = actualNetWeight - suteWeightKg;\n",
    "\n",
    "                                             // 3. Base Rate Amount (Calculated ONLY on Sute Net Weight)\n",
    "                                             const baseDivisor = rateFormData.baseRateCalculationMethod === 'per_bag' ? 75 : 100;\n",
    "                                             const baseRateValue = parseFloat(rateFormData.baseRate || '0');\n",
    "                                             const baseRateAmount = (suteNetWeight / baseDivisor) * baseRateValue;\n",
    "\n",
    "                                             // 4. Other Charges (H, B, LF)\n",
    "                                             // If Per Bag: Always use Physical Bags\n",
    "                                             // If Per Quintal: Always use Original Net Weight\n",
    "                                             const hValue = parseFloat(rateFormData.h || '0');\n",
    "                                             const hAmount = rateFormData.hCalculationMethod === 'per_bag'\n",
    "                                               ? hValue * bags\n",
    "                                               : hValue * (actualNetWeight / 100);\n",
    "\n",
    "                                             const bValue = parseFloat(rateFormData.b || '0');\n",
    "                                             const bAmount = rateFormData.bCalculationMethod === 'per_bag'\n",
    "                                               ? bValue * bags\n",
    "                                               : bValue * (actualNetWeight / 100);\n",
    "\n",
    "                                             let lfValue = parseFloat(rateFormData.lf || '0');\n",
    "                                             if (['MDL', 'MDWB'].includes(rateFormData.rateType)) {\n",
    "                                               lfValue = 0;\n",
    "                                             }\n",
    "                                             const lfAmount = rateFormData.lfCalculationMethod === 'per_bag'\n",
    "                                               ? lfValue * bags\n",
    "                                               : lfValue * (actualNetWeight / 100);\n",
    "\n",
    "                                             // 5. EGB (Always uses Physical Bags)\n",
    "                                             const showEGB = ['CDL', 'MDL'].includes(rateFormData.rateType);\n",
    "                                             const egbAmount = showEGB ? bags * parseFloat(rateFormData.egb || '0') : 0;\n",
    "\n",
    "                                             // 6. Total = Base Amount + All Adjustments\n",
    "                                             const totalAmount = baseRateAmount + hAmount + bAmount + lfAmount + egbAmount;\n",
    "                                             return totalAmount.toFixed(2);\n"
]

# Robust replacement logic
start_line = -1
for i, line in enumerate(lines):
    if "// 1. Calculate Sute Weight" in line and i > 9000:
        start_line = i
        break

if start_line != -1:
    end_line = -1
    for i in range(start_line, start_line + 60):
        if "return totalAmount.toFixed(2);" in lines[i]:
            end_line = i
            break
    
    if end_line != -1:
        lines[start_line:end_line+1] = new_logic
        with open(file_path, 'w', encoding='utf-8') as f:
            f.writelines(lines)
        print(f"Successfully updated Records.tsx starting at line {start_line+1}")
    else:
        print("Could not find end of logic block")
else:
    print("Could not find start of logic block")
