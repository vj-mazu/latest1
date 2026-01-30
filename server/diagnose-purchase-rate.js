/**
 * Comprehensive Diagnostic Script for Purchase Rate Calculation
 * 
 * This script will help identify the exact issue by testing different scenarios
 */

const { sequelize } = require('./config/database');
const Arrival = require('./models/Arrival');
const PurchaseRate = require('./models/PurchaseRate');

async function diagnosePurchaseRate() {
  try {
    console.log('🔍 Purchase Rate Calculation Diagnostic\n');
    console.log('=' .repeat(80));

    // Find the specific arrival record from the screenshot
    // Looking for: Date 29/01/2026, Broker MANJUNATH, From MANVI
    const arrival = await Arrival.findOne({
      where: {
        date: '2026-01-29',
        broker: 'MANJUNATH'
      },
      order: [['id', 'DESC']],
      limit: 1
    });

    if (!arrival) {
      console.log('\n❌ Could not find the arrival record');
      console.log('   Please check the date and broker name');
      process.exit(1);
    }

    console.log('\n📋 Arrival Record Found:');
    console.log(`   ID: ${arrival.id}`);
    console.log(`   Date: ${arrival.date}`);
    console.log(`   Broker: ${arrival.broker}`);
    console.log(`   Bags: ${arrival.bags}`);
    console.log(`   Gross Weight: ${arrival.grossWeight} kg`);
    console.log(`   Tare Weight: ${arrival.tareWeight} kg`);
    console.log(`   Net Weight: ${arrival.netWeight} kg`);
    console.log(`   Net Weight in Q: ${(parseFloat(arrival.netWeight) / 100).toFixed(2)} Q`);

    // Check if there's already a purchase rate for this arrival
    const existingRate = await PurchaseRate.findOne({
      where: { arrivalId: arrival.id }
    });

    if (existingRate) {
      console.log('\n📊 Existing Purchase Rate:');
      console.log(`   Sute: ${existingRate.sute} (${existingRate.suteCalculationMethod})`);
      console.log(`   Base Rate: ${existingRate.baseRate} (${existingRate.baseRateCalculationMethod})`);
      console.log(`   Rate Type: ${existingRate.rateType}`);
      console.log(`   H: ${existingRate.h} (${existingRate.hCalculationMethod})`);
      console.log(`   B: ${existingRate.b} (${existingRate.bCalculationMethod})`);
      console.log(`   LF: ${existingRate.lf} (${existingRate.lfCalculationMethod})`);
      console.log(`   EGB: ${existingRate.egb}`);
      console.log(`   Total Amount: ₹${existingRate.totalAmount}`);
      console.log(`   Average Rate: ₹${existingRate.averageRate}/Q`);
    } else {
      console.log('\n⚠️ No existing purchase rate found for this arrival');
    }

    console.log('\n' + '-'.repeat(80));
    console.log('\n🧪 Testing Calculation with Screenshot Values:\n');

    // Test data from screenshot
    const testData = {
      sute: 5,
      suteCalculationMethod: 'per_quintal',
      baseRate: 1600,
      baseRateCalculationMethod: 'per_bag',
      rateType: 'MDWB',
      h: -5,
      hCalculationMethod: 'per_bag',
      b: 10,
      bCalculationMethod: 'per_quintal',
      lf: 0,
      lfCalculationMethod: 'per_bag',
      egb: 0
    };

    const bags = parseFloat(arrival.bags);
    const actualNetWeight = parseFloat(arrival.netWeight);

    console.log(`Input Values:`);
    console.log(`  Bags: ${bags}`);
    console.log(`  Actual Net Weight: ${actualNetWeight} kg = ${(actualNetWeight / 100).toFixed(2)} Q`);
    console.log(`  Sute: ${testData.sute} (${testData.suteCalculationMethod})`);
    console.log(`  Base Rate: ${testData.baseRate} (${testData.baseRateCalculationMethod})`);
    console.log(`  Rate Type: ${testData.rateType}`);
    console.log(`  H: ${testData.h} (${testData.hCalculationMethod})`);
    console.log(`  B: ${testData.b} (${testData.bCalculationMethod})`);

    // Calculate step by step
    console.log(`\nCalculation Steps:`);

    // 1. Sute Weight
    let suteWeightKg = 0;
    if (testData.sute > 0) {
      if (testData.suteCalculationMethod === 'per_bag') {
        suteWeightKg = testData.sute * bags;
      } else {
        suteWeightKg = (actualNetWeight / 100) * testData.sute;
      }
    }
    console.log(`  1. Sute Weight: ${suteWeightKg} kg`);

    // 2. Sute Net Weight
    const suteNetWeight = actualNetWeight - suteWeightKg;
    console.log(`  2. Sute Net Weight: ${suteNetWeight} kg = ${(suteNetWeight / 100).toFixed(2)} Q`);

    // 3. Base Rate Amount
    const baseDivisor = testData.baseRateCalculationMethod === 'per_bag' ? 75 : 100;
    const baseRateAmount = (suteNetWeight / baseDivisor) * testData.baseRate;
    console.log(`  3. Base Rate Amount: (${suteNetWeight} ÷ ${baseDivisor}) × ${testData.baseRate} = ₹${baseRateAmount.toFixed(2)}`);

    // 4. H Amount
    let hAmount;
    if (testData.hCalculationMethod === 'per_bag') {
      hAmount = bags * testData.h;
    } else {
      hAmount = (actualNetWeight / 100) * testData.h;
    }
    console.log(`  4. H Amount: ${bags} × ${testData.h} = ₹${hAmount.toFixed(2)}`);

    // 5. B Amount
    let bAmount;
    if (testData.bCalculationMethod === 'per_bag') {
      bAmount = bags * testData.b;
    } else {
      bAmount = (actualNetWeight / 100) * testData.b;
    }
    console.log(`  5. B Amount: (${actualNetWeight} ÷ 100) × ${testData.b} = ₹${bAmount.toFixed(2)}`);

    // 6. LF Amount
    let effectiveLf = testData.lf;
    if (['MDL', 'MDWB'].includes(testData.rateType)) {
      effectiveLf = 0;
    }
    let lfAmount;
    if (testData.lfCalculationMethod === 'per_bag') {
      lfAmount = bags * effectiveLf;
    } else {
      lfAmount = (actualNetWeight / 100) * effectiveLf;
    }
    console.log(`  6. LF Amount: ₹${lfAmount.toFixed(2)}`);

    // 7. EGB Amount
    const showEGB = ['CDL', 'MDL'].includes(testData.rateType);
    const egbAmount = showEGB ? bags * testData.egb : 0;
    console.log(`  7. EGB Amount: ₹${egbAmount.toFixed(2)}`);

    // 8. H Contribution (FIXED)
    const hContribution = ['MDL', 'MDWB'].includes(testData.rateType) ? -Math.abs(hAmount) : Math.abs(hAmount);
    console.log(`  8. H Contribution (with Math.abs fix): ₹${hContribution.toFixed(2)}`);

    // 9. Total Amount
    const totalAmount = baseRateAmount + hContribution + bAmount + lfAmount + egbAmount;
    console.log(`  9. Total Amount: ₹${totalAmount.toFixed(2)}`);

    // 10. Average Rate
    const averageRate = (totalAmount / actualNetWeight) * 75;
    console.log(`  10. Average Rate: ₹${averageRate.toFixed(2)}/Q`);

    console.log('\n' + '='.repeat(80));
    console.log('\n📊 Summary:');
    console.log(`   Our Calculation: ₹${totalAmount.toFixed(2)}`);
    console.log(`   Screenshot Shows: ₹2925541.67`);
    console.log(`   Difference: ₹${Math.abs(totalAmount - 2925541.67).toFixed(2)}`);

    if (Math.abs(totalAmount - 2925541.67) > 1) {
      console.log('\n⚠️ MISMATCH - Possible Issues:');
      console.log('   1. Check if net weight in database matches screenshot');
      console.log('   2. Check if sute calculation method is correct');
      console.log('   3. Check if base rate calculation is using correct weight');
      console.log('   4. Check if there are any rounding differences');
    } else {
      console.log('\n✅ Calculation matches!');
    }

    console.log('\n' + '='.repeat(80));

    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

diagnosePurchaseRate();
