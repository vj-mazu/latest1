/**
 * Test Case: Sale After Palti Validation
 * 
 * Scenario: Verify that sale is BLOCKED when palti consumes all stock on the same date
 * 
 * Test Data:
 * - Date: 29 Jan 2026
 * - Opening Stock: 150 bags SUM25 RNR STEAM, MI GREEN 30kg @ O2
 * - Palti: 150 bags converted to MI BLUE
 * - Sale Attempt: 100 bags (should be BLOCKED)
 */

const { sequelize } = require('./config/database');
const LocationBifurcationService = require('./services/LocationBifurcationService');

async function testSaleAfterPalti() {
  console.log('🧪 Testing Sale After Palti Validation\n');
  console.log('=' .repeat(80));
  
  try {
    // Test parameters matching your scenario
    const testParams = {
      locationCode: 'O2',
      variety: 'SUM25 RNR STEAM',
      productType: 'Rice',
      packagingBrand: 'mi green',
      bagSizeKg: 30,
      requestedBags: 100,
      saleDate: '2026-01-29',
      debugMode: true
    };
    
    console.log('\n📋 Test Scenario:');
    console.log('  Location: O2');
    console.log('  Variety: SUM25 RNR STEAM');
    console.log('  Packaging: mi green 30kg');
    console.log('  Date: 29 Jan 2026');
    console.log('  Requested Sale: 100 bags');
    console.log('\n' + '='.repeat(80));
    
    // Get packaging ID
    const [packaging] = await sequelize.query(`
      SELECT id FROM packagings 
      WHERE "brandName" = :brand AND "allottedKg" = :kg
      LIMIT 1
    `, {
      replacements: { brand: 'mi green', kg: 30 },
      type: sequelize.QueryTypes.SELECT
    });
    
    if (!packaging) {
      console.log('❌ Packaging not found. Please check packaging data.');
      return;
    }
    
    console.log(`\n✅ Found packaging ID: ${packaging.id}`);
    
    // Run validation
    console.log('\n🔍 Running Sale Validation...\n');
    
    const validation = await LocationBifurcationService.validateSaleAfterPalti({
      ...testParams,
      packagingId: packaging.id
    });
    
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 VALIDATION RESULT:\n');
    console.log(`  Opening Stock: ${validation.openingStock} bags`);
    console.log(`  Palti Deductions (same date): ${validation.paltiDeductions} bags`);
    console.log(`  Remaining Stock: ${validation.remainingStock} bags`);
    console.log(`  Requested: ${validation.requestedBags} bags`);
    console.log(`  Shortfall: ${validation.shortfall} bags`);
    console.log(`\n  Status: ${validation.isValid ? '✅ ALLOWED' : '❌ BLOCKED'}`);
    console.log(`  Message: ${validation.message}`);
    console.log(`  Group Key: ${validation.groupKey}`);
    
    console.log('\n' + '='.repeat(80));
    
    // Verify expected behavior
    console.log('\n🎯 EXPECTED BEHAVIOR:');
    console.log('  - Opening stock should be calculated from operations BEFORE 29 Jan');
    console.log('  - Palti operations ON 29 Jan should be deducted separately');
    console.log('  - If palti consumed all stock, sale should be BLOCKED');
    console.log('  - Remaining = Opening - Palti');
    
    console.log('\n✅ TEST ANALYSIS:');
    
    if (validation.remainingStock < validation.requestedBags) {
      console.log('  ✅ CORRECT: Sale is blocked because remaining stock is insufficient');
      console.log(`  ✅ CORRECT: ${validation.remainingStock} bags < ${validation.requestedBags} bags requested`);
    } else {
      console.log('  ⚠️  WARNING: Sale would be allowed');
      console.log(`  ⚠️  ${validation.remainingStock} bags >= ${validation.requestedBags} bags requested`);
    }
    
    if (validation.paltiDeductions > 0) {
      console.log(`  ✅ CORRECT: Palti operations detected on same date (${validation.paltiDeductions} bags)`);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n🎉 Test completed successfully!\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

// Run test
testSaleAfterPalti();
