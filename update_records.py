
import os

file_path = r'c:\Users\maju\Downloads\ashish_personell-main\ashish_personell-main\ashish_personell-main\ashish_personell-main\client\src\pages\Records.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_logic = [
    "                                             // 1. Calculate Sute Weight and Sute Net Weight\n",
    "                                             let suteWeightKg = 0;\n",
    "                                             const suteValue = parseFloat(rateFormData.sute || '0');\n",
    "                                             if (suteValue > 0) {\n",
    "                                               if (rateFormData.suteCalculationMethod === 'per_bag') {\n",
    "                                                 suteWeightKg = suteValue * bags;\n",
    "                                               } else {\n",
    "                                                 // Sute per quintal means (Actual Net Weight / 100) * SuteValue\n",
    "                                                 suteWeightKg = (actualNetWeight / 100) * suteValue;\n",
    "                                               }\n",
    "                                             }\n",
    "                                             const suteNetWeight = actualNetWeight - suteWeightKg;\n",
    "\n",
    "                                             // 2. Base Rate Calculation (Always on Sute Net Weight)\n",
    "                                             let baseRateAmount = 0;\n",
    "                                             const baseRateValue = parseFloat(rateFormData.baseRate || '0');\n",
    "                                             if (rateFormData.baseRateCalculationMethod === 'per_bag') {\n",
    "                                               // Per Bag: (Sute Net Weight ÷ 75) × Base Rate\n",
    "                                               baseRateAmount = (suteNetWeight / 75) * baseRateValue;\n",
    "                                             } else {\n",
    "                                               // Per Quintal: (Sute Net Weight ÷ 100) × Base Rate\n",
    "                                               baseRateAmount = (suteNetWeight / 100) * baseRateValue;\n",
    "                                             }\n",
    "\n",
    "                                             // 3. Charges calculation (Added as entered)\n",
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
    "                                             const showEGB = ['CDL', 'MDL'].includes(rateFormData.rateType);\n",
    "                                             const egbAmount = showEGB ? bags * parseFloat(rateFormData.egb || '0') : 0;\n",
    "\n",
    "                                             const totalAmount = baseRateAmount + hAmount + bAmount + lfAmount + egbAmount;\n",
    "                                             return totalAmount.toFixed(2);\n"
]

# Replace lines 9307 to 9361 (0-indexed: 9306 to 9360)
lines[9306:9361] = new_logic

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Successfully updated Records.tsx")
