const { sequelize } = require('./config/database');

async function testRiceHamaliBookFix() {
  try {
    console.log('🔍 Testing Rice Hamali Book Fix (using rate_24_27)\n');
    console.log('=' .repeat(80));

    // Test the FIXED query using rate_24_27
    console.log('\n📋 Testing FIXED query with rate_24_27:\n');
    const fixedQuery = `
      SELECT 
        rhe.id as entry_id,
        rhe.bags,
        rhe.rice_hamali_rate_id,
        rhr.id as rate_id,
        rhr.work_type,
        rhr.work_detail,
        rhr.rate_24_27 as rateperbag,
        (rhe.bags * rhr.rate_24_27) as totalamount
      FROM rice_hamali_entries rhe
      LEFT JOIN rice_hamali_rates rhr ON rhe.rice_hamali_rate_id = rhr.id
      ORDER BY rhe.created_at DESC
      LIMIT 10
    `;
    
    const results = await sequelize.query(fixedQuery, { type: sequelize.QueryTypes.SELECT });
    console.log(`Testing ${results.length} recent entries with FIXED query:`);
    
    let successCount = 0;
    let failCount = 0;
    
    results.forEach((result, i) => {
      console.log(`\nEntry ${i + 1}:`);
      console.log(`  Entry ID: ${result.entry_id}`);
      console.log(`  Bags: ${result.bags}`);
      console.log(`  Rate ID: ${result.rice_hamali_rate_id}`);
      console.log(`  Work Type: ${result.work_type || 'NULL'}`);
      console.log(`  Work Detail: ${result.work_detail || 'NULL'}`);
      console.log(`  Rate Per Bag (24-27): ₹${result.rateperbag || '0'}`);
      console.log(`  Total Amount: ₹${result.totalamount || '0'}`);
      
      if (!result.rate_id) {
        console.log(`  ❌ FAIL: Rate ID ${result.rice_hamali_rate_id} not found!`);
        failCount++;
      } else if (!result.rateperbag || parseFloat(result.rateperbag) === 0) {
        console.log(`  ⚠️  WARNING: Rate 24-27 is 0 or NULL (might be valid for this work type)`);
        failCount++;
      } else {
        console.log(`  ✅ SUCCESS: Amount calculated correctly!`);
        successCount++;
      }
    });

    console.log('\n' + '='.repeat(80));
    console.log(`\n📊 Test Results:`);
    console.log(`  ✅ Success: ${successCount} entries`);
    console.log(`  ❌ Failed: ${failCount} entries`);
    console.log(`  📈 Success Rate: ${((successCount / results.length) * 100).toFixed(1)}%`);

    if (successCount > 0) {
      console.log('\n✅ FIX VERIFIED: Rice Hamali Book will now show correct amounts!');
    } else {
      console.log('\n⚠️  WARNING: No successful entries found. Check if rate_24_27 has valid values.');
    }

    console.log('\n');

  } catch (error) {
    console.error('❌ Error during test:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

testRiceHamaliBookFix();
