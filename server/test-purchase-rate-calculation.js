/**
 * Test Purchase Rate Calculation Fix
 * 
 * This script tests the H (Hamali) calculation fix for MDL and MDWB rate types.
 * It verifies that H is SUBTRACTED for MDL/MDWB and ADDED for CDL/CDWB.
 */

// Test data
const testCases = [
  {
    name: 'MDL - H should be SUBTRACTED',
    rateType: 'MDL',
    bags: 100,
    actualNetWeight: 28500,
    sute: 0.5,
    suteCalculationMethod: 'per_bag',
    baseRate: 2000,
    baseRateCalculationMethod: 'per_quintal',
    h: 5,
    hCalculationMethod: 'per_bag',
    b: 10,
    bCalculationMethod: 'per_quintal',
    lf: 0,
    lfCalculationMethod: 'per_bag',
    egb: 1,
    expectedHContribution: -500, // Should be negative
    expectedTotal: 571450
  },
  {
    name: 'MDWB - H should be SUBTRACTED',
    rateType: 'MDWB',
    bags: 100,
    actualNetWeight: 28500,
    sute: 0.5,
    suteCalculationMethod: 'per_bag',
    baseRate: 2000,
    baseRateCalculationMethod: 'per_quintal',
    h: 5,
    hCalculationMethod: 'per_bag',
    b: 10,
    bCalculationMethod: 'per_quintal',
    lf: 0,
    lfCalculationMethod: 'per_bag',
    egb: 0,
    expectedHContribution: -500, // Should be negative
    expectedTotal: 571350 // 569000 - 500 + 2850 + 0 + 0
  },
  {
    name: 'CDL - H should be ADDED',
    rateType: 'CDL',
    bags: 100,
    actualNetWeight: 28500,
    sute: 0.5,
    suteCalculationMethod: 'per_bag',
    baseRate: 2000,
    baseRateCalculationMethod: 'per_quintal',
    h: 5,
    hCalculationMethod: 'per_bag',
    b: 10,
    bCalculationMethod: 'per_quintal',
    lf: 2,
    lfCalculationMethod: 'per_bag',
    egb: 1,
    expectedHContribution: 500, // Should be positive
    expectedTotal: 572650 // 569000 + 500 + 2850 + 200 + 100
  },
  {
    name: 'CDWB - H should be ADDED',
    rateType: 'CDWB',
    bags: 100,
    actualNetWeight: 28500,
    sute: 0.5,
    suteCalculationMethod: 'per_bag',
    baseRate: 2000,
    baseRateCalculationMethod: 'per_quintal',
    h: 5,
    hCalculationMethod: 'per_bag',
    b: 10,
    bCalculationMethod: 'per_quintal',
    lf: 2,
    lfCalculationMethod: 'per_bag',
    egb: 0,
    expectedHContribution: 500, // Should be positive
    expectedTotal: 572550 // 569000 + 500 + 2850 + 200 + 0
  }
];

// Calculation function (matches server logic)
function calculatePurchaseRate(testCase) {
  const {
    rateType,
    bags,
    actualNetWeight,
    sute,
    suteCalculationMethod,
    baseRate,
    baseRateCalculationMethod,
    h,
    hCalculationMethod,
    b,
    bCalculationMethod,
    lf,
    lfCalculationMethod,
    egb
  } = testCase;

  // 1. Calculate Sute Weight (Deduction in Kg)
  let suteWeightKg = 0;
  if (sute > 0) {
    if (suteCalculationMethod === 'per_bag') {
      suteWeightKg = sute * bags;
    } else {
      suteWeightKg = (actualNetWeight / 100) * sute;
    }
  }

  // 2. Sute Net Weight (Remaining weight after deduction)
  const suteNetWeight = actualNetWeight - suteWeightKg;

  // 3. Base Rate Amount (Calculated ONLY on Sute Net Weight)
  const baseDivisor = baseRateCalculationMethod === 'per_bag' ? 75 : 100;
  const baseRateAmount = (suteNetWeight / baseDivisor) * baseRate;

  // 4. H Calculation (uses Actual Net Weight)
  let hAmount;
  if (hCalculationMethod === 'per_bag') {
    hAmount = bags * h;
  } else {
    hAmount = (actualNetWeight / 100) * h;
  }

  // 5. B Calculation (uses Actual Net Weight)
  let bAmount;
  if (bCalculationMethod === 'per_bag') {
    bAmount = bags * b;
  } else {
    bAmount = (actualNetWeight / 100) * b;
  }

  // 6. LF Calculation with column-type specific rules
  let effectiveLf = lf;
  if (['MDL', 'MDWB'].includes(rateType)) {
    effectiveLf = 0; // Force LF to 0 for MDL and MDWB
  }

  let lfAmount;
  if (lfCalculationMethod === 'per_bag') {
    lfAmount = bags * effectiveLf;
  } else {
    lfAmount = (actualNetWeight / 100) * effectiveLf;
  }

  // 7. EGB Calculation with column-type specific rules
  const showEGB = ['CDL', 'MDL'].includes(rateType);
  const egbAmount = showEGB ? bags * egb : 0;

  // 8. Total Amount - THE FIX IS HERE
  // For MDL and MDWB: H is SUBTRACTED from total (negative contribution)
  // For CDL and CDWB: H is ADDED to total (positive contribution)
  const hContribution = ['MDL', 'MDWB'].includes(rateType) ? -hAmount : hAmount;
  const totalAmount = baseRateAmount + hContribution + bAmount + lfAmount + egbAmount;

  // 9. Average Rate Calculation (per 75kg)
  const averageRate = (totalAmount / actualNetWeight) * 75;

  return {
    suteWeightKg,
    suteNetWeight,
    baseRateAmount,
    hAmount,
    hContribution,
    bAmount,
    lfAmount,
    egbAmount,
    totalAmount,
    averageRate
  };
}

// Run tests
console.log('🧪 Testing Purchase Rate Calculation Fix\n');
console.log('=' .repeat(80));

let passedTests = 0;
let failedTests = 0;

testCases.forEach((testCase, index) => {
  console.log(`\n📋 Test ${index + 1}: ${testCase.name}`);
  console.log('-'.repeat(80));

  const result = calculatePurchaseRate(testCase);

  console.log('\n📊 Calculation Breakdown:');
  console.log(`  Sute Weight: ${result.suteWeightKg.toFixed(2)} kg`);
  console.log(`  Sute Net Weight: ${result.suteNetWeight.toFixed(2)} kg`);
  console.log(`  Base Rate Amount: ₹${result.baseRateAmount.toFixed(2)}`);
  console.log(`  H Amount: ₹${result.hAmount.toFixed(2)}`);
  console.log(`  H Contribution: ₹${result.hContribution.toFixed(2)} ${result.hContribution < 0 ? '(SUBTRACTED)' : '(ADDED)'}`);
  console.log(`  B Amount: ₹${result.bAmount.toFixed(2)}`);
  console.log(`  LF Amount: ₹${result.lfAmount.toFixed(2)}`);
  console.log(`  EGB Amount: ₹${result.egbAmount.toFixed(2)}`);
  console.log(`  Total Amount: ₹${result.totalAmount.toFixed(2)}`);
  console.log(`  Average Rate: ₹${result.averageRate.toFixed(2)}/Q`);

  // Verify H contribution
  const hContributionCorrect = Math.abs(result.hContribution - testCase.expectedHContribution) < 0.01;
  const totalCorrect = Math.abs(result.totalAmount - testCase.expectedTotal) < 0.01;

  console.log('\n✅ Verification:');
  console.log(`  H Contribution: ${hContributionCorrect ? '✅ PASS' : '❌ FAIL'} (Expected: ₹${testCase.expectedHContribution}, Got: ₹${result.hContribution.toFixed(2)})`);
  console.log(`  Total Amount: ${totalCorrect ? '✅ PASS' : '❌ FAIL'} (Expected: ₹${testCase.expectedTotal}, Got: ₹${result.totalAmount.toFixed(2)})`);

  if (hContributionCorrect && totalCorrect) {
    console.log('\n🎉 Test PASSED');
    passedTests++;
  } else {
    console.log('\n❌ Test FAILED');
    failedTests++;
  }
});

console.log('\n' + '='.repeat(80));
console.log(`\n📊 Test Summary:`);
console.log(`  Total Tests: ${testCases.length}`);
console.log(`  Passed: ${passedTests} ✅`);
console.log(`  Failed: ${failedTests} ${failedTests > 0 ? '❌' : ''}`);

if (failedTests === 0) {
  console.log('\n🎉 All tests passed! The fix is working correctly.');
} else {
  console.log('\n⚠️ Some tests failed. Please review the calculations.');
}

console.log('\n' + '='.repeat(80));
