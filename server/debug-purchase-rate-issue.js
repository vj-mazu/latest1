/**
 * Debug Purchase Rate Calculation Issue
 * 
 * This script debugs the actual calculation from the user's screenshot
 */

// User's actual data from screenshot
const testCase = {
  name: 'User Screenshot - CDL Rate Type',
  rateType: 'CDL',
  bags: 1500,
  actualNetWeight: 12500,
  sute: 0.5,
  suteCalculationMethod: 'per_bag',
  baseRate: 1600,
  baseRateCalculationMethod: 'per_bag', // Per Bag (/75)
  h: 5,
  hCalculationMethod: 'per_bag',
  b: 10,
  bCalculationMethod: 'per_quintal', // CORRECTED: per quintal, not per bag
  lf: 0,
  lfCalculationMethod: 'per_bag',
  egb: 0
};

console.log('🔍 Debugging Purchase Rate Calculation Issue\n');
console.log('=' .repeat(80));
console.log('\n📋 Input Data:');
console.log(`  Rate Type: ${testCase.rateType}`);
console.log(`  Bags: ${testCase.bags}`);
console.log(`  Actual Net Weight: ${testCase.actualNetWeight} kg`);
console.log(`  Sute: ${testCase.sute} (${testCase.suteCalculationMethod})`);
console.log(`  Base Rate: ${testCase.baseRate} (${testCase.baseRateCalculationMethod})`);
console.log(`  H: ${testCase.h} (${testCase.hCalculationMethod})`);
console.log(`  B: ${testCase.b} (${testCase.bCalculationMethod})`);
console.log(`  LF: ${testCase.lf} (${testCase.lfCalculationMethod})`);
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
    suteWeightKg = (testCase.actualNetWeight / 100) * testCase.sute;
    console.log(`1. Sute Weight (per quintal):`);
    console.log(`   (${testCase.actualNetWeight} ÷ 100) × ${testCase.sute} = ${suteWeightKg} kg`);
  }
}

// 2. Sute Net Weight (Remaining weight after deduction)
const suteNetWeight = testCase.actualNetWeight - suteWeightKg;
console.log(`\n2. Sute Net Weight:`);
console.log(`   ${testCase.actualNetWeight} - ${suteWeightKg} = ${suteNetWeight} kg`);

// 3. Base Rate Amount (Calculated ONLY on Sute Net Weight)
const baseDivisor = testCase.baseRateCalculationMethod === 'per_bag' ? 75 : 100;
const baseRateAmount = (suteNetWeight / baseDivisor) * testCase.baseRate;
console.log(`\n3. Base Rate Amount (uses Sute Net Weight):`);
console.log(`   (${suteNetWeight} ÷ ${baseDivisor}) × ${testCase.baseRate} = ₹${baseRateAmount.toFixed(2)}`);

// 4. H Calculation (uses Actual Net Weight)
let hAmount;
if (testCase.hCalculationMethod === 'per_bag') {
  hAmount = testCase.bags * testCase.h;
  console.log(`\n4. H Amount (uses Actual Net Weight - per bag):`);
  console.log(`   ${testCase.bags} bags × ${testCase.h} = ₹${hAmount.toFixed(2)}`);
} else {
  hAmount = (testCase.actualNetWeight / 100) * testCase.h;
  console.log(`\n4. H Amount (uses Actual Net Weight - per quintal):`);
  console.log(`   (${testCase.actualNetWeight} ÷ 100) × ${testCase.h} = ₹${hAmount.toFixed(2)}`);
}

// 5. B Calculation (uses Actual Net Weight)
let bAmount;
if (testCase.bCalculationMethod === 'per_bag') {
  bAmount = testCase.bags * testCase.b;
  console.log(`\n5. B Amount (uses Actual Net Weight - per bag):`);
  console.log(`   ${testCase.bags} bags × ${testCase.b} = ₹${bAmount.toFixed(2)}`);
} else {
  bAmount = (testCase.actualNetWeight / 100) * testCase.b;
  console.log(`\n5. B Amount (uses Actual Net Weight - per quintal):`);
  console.log(`   (${testCase.actualNetWeight} ÷ 100) × ${testCase.b} = ₹${bAmount.toFixed(2)}`);
}

// 6. LF Calculation with column-type specific rules
let effectiveLf = testCase.lf;
if (['MDL', 'MDWB'].includes(testCase.rateType)) {
  effectiveLf = 0; // Force LF to 0 for MDL and MDWB
}

let lfAmount;
if (testCase.lfCalculationMethod === 'per_bag') {
  lfAmount = testCase.bags * effectiveLf;
  console.log(`\n6. LF Amount (uses Actual Net Weight - per bag):`);
  console.log(`   ${testCase.bags} bags × ${effectiveLf} = ₹${lfAmount.toFixed(2)}`);
} else {
  lfAmount = (testCase.actualNetWeight / 100) * effectiveLf;
  console.log(`\n6. LF Amount (uses Actual Net Weight - per quintal):`);
  console.log(`   (${testCase.actualNetWeight} ÷ 100) × ${effectiveLf} = ₹${lfAmount.toFixed(2)}`);
}

// 7. EGB Calculation with column-type specific rules
const showEGB = ['CDL', 'MDL'].includes(testCase.rateType);
const egbAmount = showEGB ? testCase.bags * testCase.egb : 0;
console.log(`\n7. EGB Amount (per bag only):`);
console.log(`   ${testCase.bags} bags × ${testCase.egb} = ₹${egbAmount.toFixed(2)}`);

// 8. Total Amount
const hContribution = ['MDL', 'MDWB'].includes(testCase.rateType) ? -hAmount : hAmount;
const totalAmount = baseRateAmount + hContribution + bAmount + lfAmount + egbAmount;

console.log(`\n8. H Contribution:`);
console.log(`   ${testCase.rateType} rate type: H is ${hContribution < 0 ? 'SUBTRACTED' : 'ADDED'}`);
console.log(`   H Contribution = ${hContribution < 0 ? '-' : '+'}₹${Math.abs(hContribution).toFixed(2)}`);

console.log(`\n9. Total Amount:`);
console.log(`   Base Rate: ₹${baseRateAmount.toFixed(2)}`);
console.log(`   ${hContribution < 0 ? '-' : '+'} H: ₹${Math.abs(hContribution).toFixed(2)}`);
console.log(`   + B: ₹${bAmount.toFixed(2)}`);
console.log(`   + LF: ₹${lfAmount.toFixed(2)}`);
console.log(`   + EGB: ₹${egbAmount.toFixed(2)}`);
console.log(`   ─────────────────────────`);
console.log(`   = ₹${totalAmount.toFixed(2)}`);

// 10. Average Rate Calculation (per 75kg)
const averageRate = (totalAmount / testCase.actualNetWeight) * 75;
console.log(`\n10. Average Rate (per 75kg):`);
console.log(`   (₹${totalAmount.toFixed(2)} ÷ ${testCase.actualNetWeight}) × 75 = ₹${averageRate.toFixed(2)}/Q`);

console.log('\n' + '='.repeat(80));
console.log('\n📋 COMPARISON WITH SCREENSHOT:\n');
console.log(`  Screenshot shows:`);
console.log(`    Base Rate Amount: 262665.6667`);
console.log(`    Sut Amount: 1000`);
console.log(`    Hamali Amount: 7500`);
console.log(`    Brokerage Amount: 1250`);
console.log(`    Total: 259416.667`);
console.log(`\n  Our calculation:`);
console.log(`    Base Rate Amount: ₹${baseRateAmount.toFixed(2)}`);
console.log(`    Sute Weight: ${suteWeightKg} kg`);
console.log(`    H Amount: ₹${hAmount.toFixed(2)}`);
console.log(`    B Amount: ₹${bAmount.toFixed(2)}`);
console.log(`    Total: ₹${totalAmount.toFixed(2)}`);

console.log('\n' + '='.repeat(80));

// Check if there's a mismatch
const expectedTotal = 259416.667;
const difference = Math.abs(totalAmount - expectedTotal);

if (difference > 1) {
  console.log('\n⚠️ MISMATCH DETECTED!');
  console.log(`   Expected: ₹${expectedTotal.toFixed(2)}`);
  console.log(`   Got: ₹${totalAmount.toFixed(2)}`);
  console.log(`   Difference: ₹${difference.toFixed(2)}`);
  
  console.log('\n🔍 Possible Issues:');
  console.log('   1. Check if B calculation method is correct (per bag vs per quintal)');
  console.log('   2. Check if the frontend is using the correct weight for calculations');
  console.log('   3. Check if there are any rounding differences');
} else {
  console.log('\n✅ Calculation matches screenshot!');
}

console.log('\n' + '='.repeat(80));
