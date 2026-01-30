/**
 * Debug Actual Purchase Rate Issue from Latest Screenshot
 */

// User's actual data from latest screenshot
const testCase = {
  name: 'User Screenshot - MDWB Rate Type',
  rateType: 'MDWB',
  bags: 1500,
  actualNetWeight: 137500, // 1375.00 Q
  sute: 5, // 5 quintals
  suteCalculationMethod: 'per_quintal',
  baseRate: 1600,
  baseRateCalculationMethod: 'per_bag', // Per Bag (/75)
  h: -5, // User entered -5
  hCalculationMethod: 'per_bag',
  b: 10,
  bCalculationMethod: 'per_quintal',
  lf: 0,
  lfCalculationMethod: 'per_bag',
  egb: 0
};

console.log('🔍 Debugging Actual Purchase Rate Issue\n');
console.log('=' .repeat(80));
console.log('\n📋 Input Data from Screenshot:');
console.log(`  Rate Type: ${testCase.rateType}`);
console.log(`  Bags: ${testCase.bags}`);
console.log(`  Actual Net Weight: ${testCase.actualNetWeight} kg = ${testCase.actualNetWeight / 100} Q`);
console.log(`  Sute: ${testCase.sute} (${testCase.suteCalculationMethod})`);
console.log(`  Base Rate: ${testCase.baseRate} (${testCase.baseRateCalculationMethod})`);
console.log(`  H: ${testCase.h} (${testCase.hCalculationMethod})`);
console.log(`  B: ${testCase.b} (${testCase.bCalculationMethod})`);
console.log(`  LF: ${testCase.lf}`);
console.log(`  EGB: ${testCase.egb}`);

console.log('\n' + '-'.repeat(80));
console.log('\n📊 Step-by-Step Calculation:\n');

// 1. Calculate Sute Weight (Deduction in Kg)
let suteWeightKg = 0;
if (testCase.sute > 0) {
  if (testCase.suteCalculationMethod === 'per_bag') {
    suteWeightKg = testCase.sute * testCase.bags;
    console.log(`1. Sute Weight (per bag):`);
    console.log(`   ${testCase.sute} × ${testCase.bags} bags = ${suteWeightKg} kg`);
  } else {
    // Per quintal: (net weight in quintals) × sute
    suteWeightKg = (testCase.actualNetWeight / 100) * testCase.sute;
    console.log(`1. Sute Weight (per quintal):`);
    console.log(`   (${testCase.actualNetWeight} ÷ 100) × ${testCase.sute}`);
    console.log(`   = ${testCase.actualNetWeight / 100} Q × ${testCase.sute}`);
    console.log(`   = ${suteWeightKg} kg`);
  }
}

// 2. Sute Net Weight (Remaining weight after deduction)
const suteNetWeight = testCase.actualNetWeight - suteWeightKg;
console.log(`\n2. Sute Net Weight:`);
console.log(`   ${testCase.actualNetWeight} kg - ${suteWeightKg} kg = ${suteNetWeight} kg`);
console.log(`   = ${(suteNetWeight / 100).toFixed(2)} Q`);

// 3. Base Rate Amount (Calculated ONLY on Sute Net Weight)
const baseDivisor = testCase.baseRateCalculationMethod === 'per_bag' ? 75 : 100;
const baseRateAmount = (suteNetWeight / baseDivisor) * testCase.baseRate;
console.log(`\n3. Base Rate Amount (uses Sute Net Weight):`);
console.log(`   Method: ${testCase.baseRateCalculationMethod} (divisor = ${baseDivisor})`);
console.log(`   (${suteNetWeight} ÷ ${baseDivisor}) × ${testCase.baseRate}`);
console.log(`   = ${(suteNetWeight / baseDivisor).toFixed(2)} × ${testCase.baseRate}`);
console.log(`   = ₹${baseRateAmount.toFixed(2)}`);

// 4. H Calculation (uses Actual Net Weight)
let hAmount;
if (testCase.hCalculationMethod === 'per_bag') {
  hAmount = testCase.bags * testCase.h;
  console.log(`\n4. H Amount (uses Actual Net Weight - per bag):`);
  console.log(`   ${testCase.bags} bags × ${testCase.h}`);
  console.log(`   = ₹${hAmount.toFixed(2)}`);
} else {
  hAmount = (testCase.actualNetWeight / 100) * testCase.h;
  console.log(`\n4. H Amount (uses Actual Net Weight - per quintal):`);
  console.log(`   (${testCase.actualNetWeight} ÷ 100) × ${testCase.h}`);
  console.log(`   = ₹${hAmount.toFixed(2)}`);
}

// 5. B Calculation (uses Actual Net Weight)
let bAmount;
if (testCase.bCalculationMethod === 'per_bag') {
  bAmount = testCase.bags * testCase.b;
  console.log(`\n5. B Amount (uses Actual Net Weight - per bag):`);
  console.log(`   ${testCase.bags} bags × ${testCase.b}`);
  console.log(`   = ₹${bAmount.toFixed(2)}`);
} else {
  bAmount = (testCase.actualNetWeight / 100) * testCase.b;
  console.log(`\n5. B Amount (uses Actual Net Weight - per quintal):`);
  console.log(`   (${testCase.actualNetWeight} ÷ 100) × ${testCase.b}`);
  console.log(`   = ${testCase.actualNetWeight / 100} Q × ${testCase.b}`);
  console.log(`   = ₹${bAmount.toFixed(2)}`);
}

// 6. LF Calculation
let effectiveLf = testCase.lf;
if (['MDL', 'MDWB'].includes(testCase.rateType)) {
  effectiveLf = 0;
}

let lfAmount;
if (testCase.lfCalculationMethod === 'per_bag') {
  lfAmount = testCase.bags * effectiveLf;
  console.log(`\n6. LF Amount:`);
  console.log(`   ${testCase.bags} bags × ${effectiveLf} = ₹${lfAmount.toFixed(2)}`);
} else {
  lfAmount = (testCase.actualNetWeight / 100) * effectiveLf;
  console.log(`\n6. LF Amount:`);
  console.log(`   (${testCase.actualNetWeight} ÷ 100) × ${effectiveLf} = ₹${lfAmount.toFixed(2)}`);
}

// 7. EGB Calculation
const showEGB = ['CDL', 'MDL'].includes(testCase.rateType);
const egbAmount = showEGB ? testCase.bags * testCase.egb : 0;
console.log(`\n7. EGB Amount:`);
console.log(`   ${testCase.bags} bags × ${testCase.egb} = ₹${egbAmount.toFixed(2)}`);

// 8. H Contribution (FIXED: Use Math.abs for MDL/MDWB)
const hContribution = ['MDL', 'MDWB'].includes(testCase.rateType) ? -Math.abs(hAmount) : Math.abs(hAmount);
console.log(`\n8. H Contribution (FIXED with Math.abs):`);
console.log(`   Rate Type: ${testCase.rateType}`);
console.log(`   H Amount calculated: ₹${hAmount.toFixed(2)}`);
console.log(`   Math.abs(H Amount): ₹${Math.abs(hAmount).toFixed(2)}`);
console.log(`   For ${testCase.rateType}: H is SUBTRACTED`);
console.log(`   H Contribution = -₹${Math.abs(hAmount).toFixed(2)} = ₹${hContribution.toFixed(2)}`);

// 9. Total Amount
const totalAmount = baseRateAmount + hContribution + bAmount + lfAmount + egbAmount;

console.log(`\n9. Total Amount:`);
console.log(`   Base Rate: ₹${baseRateAmount.toFixed(2)}`);
console.log(`   ${hContribution < 0 ? '-' : '+'} H: ₹${Math.abs(hContribution).toFixed(2)}`);
console.log(`   + B: ₹${bAmount.toFixed(2)}`);
console.log(`   + LF: ₹${lfAmount.toFixed(2)}`);
console.log(`   + EGB: ₹${egbAmount.toFixed(2)}`);
console.log(`   ─────────────────────────`);
console.log(`   = ₹${totalAmount.toFixed(2)}`);

// 10. Average Rate
const averageRate = (totalAmount / testCase.actualNetWeight) * 75;
console.log(`\n10. Average Rate (per 75kg):`);
console.log(`   (₹${totalAmount.toFixed(2)} ÷ ${testCase.actualNetWeight}) × 75`);
console.log(`   = ₹${averageRate.toFixed(2)}/Q`);

console.log('\n' + '='.repeat(80));
console.log('\n📋 COMPARISON WITH SCREENSHOT:\n');
console.log(`  Screenshot shows:`);
console.log(`    Net Weight: 1375.00 Q`);
console.log(`    Total Amount: ₹2925541.67`);
console.log(`\n  Our calculation:`);
console.log(`    Net Weight: ${(testCase.actualNetWeight / 100).toFixed(2)} Q`);
console.log(`    Sute Weight: ${suteWeightKg} kg`);
console.log(`    Sute Net Weight: ${suteNetWeight} kg`);
console.log(`    Base Rate Amount: ₹${baseRateAmount.toFixed(2)}`);
console.log(`    H Contribution: ₹${hContribution.toFixed(2)}`);
console.log(`    B Amount: ₹${bAmount.toFixed(2)}`);
console.log(`    Total: ₹${totalAmount.toFixed(2)}`);

console.log('\n' + '='.repeat(80));

const expectedTotal = 2925541.67;
const difference = Math.abs(totalAmount - expectedTotal);

if (difference > 1) {
  console.log('\n⚠️ MISMATCH DETECTED!');
  console.log(`   Expected from screenshot: ₹${expectedTotal.toFixed(2)}`);
  console.log(`   Our calculation: ₹${totalAmount.toFixed(2)}`);
  console.log(`   Difference: ₹${difference.toFixed(2)}`);
} else {
  console.log('\n✅ Calculation matches screenshot!');
}

console.log('\n' + '='.repeat(80));
