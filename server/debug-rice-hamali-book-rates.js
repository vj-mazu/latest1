const { sequelize } = require('./config/database');

async function debugRiceHamaliBookRates() {
  try {
    console.log('🔍 DEBUG: Checking Rice Hamali Book Rate Issue\n');
    console.log('=' .repeat(80));

    // 1. Check rice_hamali_entries table structure and sample data
    console.log('\n📋 Step 1: Checking rice_hamali_entries table...\n');
    const entriesQuery = `
      SELECT 
        rhe.id,
        rhe.rice_production_id,
        rhe.rice_stock_movement_id,
        rhe.entry_type,
        rhe.rice_hamali_rate_id,
        rhe.bags,
        rhe.remarks,
        rhe.created_at
      FROM rice_hamali_entries rhe
      ORDER BY rhe.created_at DESC
      LIMIT 5
    `;
    
    const entries = await sequelize.query(entriesQuery, { type: sequelize.QueryTypes.SELECT });
    console.log(`Found ${entries.length} recent rice hamali entries:`);
    entries.forEach((entry, i) => {
      console.log(`\nEntry ${i + 1}:`);
      console.log(`  ID: ${entry.id}`);
      console.log(`  Production ID: ${entry.rice_production_id}`);
      console.log(`  Stock Movement ID: ${entry.rice_stock_movement_id}`);
      console.log(`  Entry Type: ${entry.entry_type}`);
      console.log(`  Rate ID: ${entry.rice_hamali_rate_id}`);
      console.log(`  Bags: ${entry.bags}`);
      console.log(`  Remarks: ${entry.remarks?.substring(0, 100)}...`);
    });

    // 2. Check rice_hamali_rates table
    console.log('\n\n📋 Step 2: Checking rice_hamali_rates table...\n');
    const ratesQuery = `
      SELECT 
        id,
        work_type,
        work_detail,
        rate_18_21,
        rate_21_24,
        rate_24_27,
        rate_27_30,
        rate_30_plus,
        is_active
      FROM rice_hamali_rates
      WHERE is_active = true
      ORDER BY display_order, id
    `;
    
    const rates = await sequelize.query(ratesQuery, { type: sequelize.QueryTypes.SELECT });
    console.log(`Found ${rates.length} active rice hamali rates:`);
    rates.forEach((rate, i) => {
      console.log(`\nRate ${i + 1}:`);
      console.log(`  ID: ${rate.id}`);
      console.log(`  Work Type: ${rate.work_type}`);
      console.log(`  Work Detail: ${rate.work_detail}`);
      console.log(`  Rate 18-21: ₹${rate.rate_18_21}`);
      console.log(`  Rate 21-24: ₹${rate.rate_21_24} ← USED IN QUERY`);
      console.log(`  Rate 24-27: ₹${rate.rate_24_27}`);
      console.log(`  Rate 27-30: ₹${rate.rate_27_30}`);
      console.log(`  Rate 30+: ₹${rate.rate_30_plus}`);
    });

    // 3. Check JOIN between entries and rates
    console.log('\n\n📋 Step 3: Checking JOIN between entries and rates...\n');
    const joinQuery = `
      SELECT 
        rhe.id as entry_id,
        rhe.bags,
        rhe.rice_hamali_rate_id,
        rhr.id as rate_id,
        rhr.work_type,
        rhr.work_detail,
        rhr.rate_21_24,
        (rhe.bags * rhr.rate_21_24) as calculated_amount,
        rhe.remarks
      FROM rice_hamali_entries rhe
      LEFT JOIN rice_hamali_rates rhr ON rhe.rice_hamali_rate_id = rhr.id
      ORDER BY rhe.created_at DESC
      LIMIT 10
    `;
    
    const joinResults = await sequelize.query(joinQuery, { type: sequelize.QueryTypes.SELECT });
    console.log(`Checking ${joinResults.length} recent entries with rate JOIN:`);
    joinResults.forEach((result, i) => {
      console.log(`\nEntry ${i + 1}:`);
      console.log(`  Entry ID: ${result.entry_id}`);
      console.log(`  Bags: ${result.bags}`);
      console.log(`  Rate ID (from entry): ${result.rice_hamali_rate_id}`);
      console.log(`  Rate ID (from JOIN): ${result.rate_id}`);
      console.log(`  Work Type: ${result.work_type || 'NULL - RATE NOT FOUND!'}`);
      console.log(`  Work Detail: ${result.work_detail || 'NULL - RATE NOT FOUND!'}`);
      console.log(`  Rate 21-24: ₹${result.rate_21_24 || '0 - NULL!'}`);
      console.log(`  Calculated Amount: ₹${result.calculated_amount || '0'}`);
      console.log(`  Remarks: ${result.remarks?.substring(0, 80)}...`);
      
      if (!result.rate_id) {
        console.log(`  ⚠️  WARNING: Rate ID ${result.rice_hamali_rate_id} not found in rice_hamali_rates table!`);
      }
      if (!result.rate_21_24 || parseFloat(result.rate_21_24) === 0) {
        console.log(`  ⚠️  WARNING: Rate 21-24 is NULL or 0!`);
      }
    });

    // 4. Check for orphaned entries (entries with invalid rate_id)
    console.log('\n\n📋 Step 4: Checking for orphaned entries...\n');
    const orphanedQuery = `
      SELECT 
        rhe.id,
        rhe.rice_hamali_rate_id,
        rhe.bags,
        rhe.remarks
      FROM rice_hamali_entries rhe
      LEFT JOIN rice_hamali_rates rhr ON rhe.rice_hamali_rate_id = rhr.id
      WHERE rhr.id IS NULL
      LIMIT 10
    `;
    
    const orphaned = await sequelize.query(orphanedQuery, { type: sequelize.QueryTypes.SELECT });
    if (orphaned.length > 0) {
      console.log(`⚠️  Found ${orphaned.length} orphaned entries (rate_id doesn't exist):`);
      orphaned.forEach((entry, i) => {
        console.log(`\nOrphaned Entry ${i + 1}:`);
        console.log(`  Entry ID: ${entry.id}`);
        console.log(`  Invalid Rate ID: ${entry.rice_hamali_rate_id}`);
        console.log(`  Bags: ${entry.bags}`);
        console.log(`  Remarks: ${entry.remarks?.substring(0, 80)}...`);
      });
    } else {
      console.log('✅ No orphaned entries found - all rate_ids are valid');
    }

    // 5. Check for entries with rate_21_24 = 0
    console.log('\n\n📋 Step 5: Checking for entries with rate_21_24 = 0...\n');
    const zeroRateQuery = `
      SELECT 
        rhe.id,
        rhe.bags,
        rhr.work_type,
        rhr.work_detail,
        rhr.rate_21_24
      FROM rice_hamali_entries rhe
      LEFT JOIN rice_hamali_rates rhr ON rhe.rice_hamali_rate_id = rhr.id
      WHERE rhr.rate_21_24 = 0 OR rhr.rate_21_24 IS NULL
      LIMIT 10
    `;
    
    const zeroRates = await sequelize.query(zeroRateQuery, { type: sequelize.QueryTypes.SELECT });
    if (zeroRates.length > 0) {
      console.log(`⚠️  Found ${zeroRates.length} entries with rate_21_24 = 0 or NULL:`);
      zeroRates.forEach((entry, i) => {
        console.log(`\nZero Rate Entry ${i + 1}:`);
        console.log(`  Entry ID: ${entry.id}`);
        console.log(`  Bags: ${entry.bags}`);
        console.log(`  Work Type: ${entry.work_type}`);
        console.log(`  Work Detail: ${entry.work_detail}`);
        console.log(`  Rate 21-24: ₹${entry.rate_21_24 || 'NULL'}`);
      });
    } else {
      console.log('✅ No entries with zero or NULL rate_21_24 found');
    }

    // 6. Test the actual hamali-book query
    console.log('\n\n📋 Step 6: Testing actual hamali-book query...\n');
    const today = new Date().toISOString().split('T')[0];
    const testQuery = `
      SELECT 
        rhe.id,
        COALESCE(rp.date, rsm.date) as date,
        rhe.bags,
        rhr.rate_21_24 as rateperbag,
        (rhe.bags * rhr.rate_21_24) as totalamount,
        rhr.work_type as worktype,
        rhr.work_detail as workdetail,
        COALESCE(rhe.remarks, '') as remarks
      FROM rice_hamali_entries rhe
      LEFT JOIN rice_productions rp ON rhe.rice_production_id = rp.id
      LEFT JOIN rice_stock_movements rsm ON rhe.rice_stock_movement_id = rsm.id
      LEFT JOIN rice_hamali_rates rhr ON rhe.rice_hamali_rate_id = rhr.id
      WHERE (rhe.rice_production_id IS NOT NULL OR rhe.rice_stock_movement_id IS NOT NULL)
      AND rhe.remarks NOT ILIKE '%Auto-created%'
      ORDER BY COALESCE(rp.date, rsm.date) DESC
      LIMIT 5
    `;
    
    const testResults = await sequelize.query(testQuery, { type: sequelize.QueryTypes.SELECT });
    console.log(`Testing hamali-book query (${testResults.length} results):`);
    testResults.forEach((result, i) => {
      console.log(`\nResult ${i + 1}:`);
      console.log(`  ID: ${result.id}`);
      console.log(`  Date: ${result.date}`);
      console.log(`  Bags: ${result.bags}`);
      console.log(`  Rate Per Bag: ₹${result.rateperbag || '0 - NULL!'}`);
      console.log(`  Total Amount: ₹${result.totalamount || '0'}`);
      console.log(`  Work Type: ${result.worktype || 'NULL'}`);
      console.log(`  Work Detail: ${result.workdetail || 'NULL'}`);
      
      if (!result.rateperbag || parseFloat(result.rateperbag) === 0) {
        console.log(`  ❌ PROBLEM: Rate is NULL or 0 - this will show ₹0 in frontend!`);
      } else {
        console.log(`  ✅ Rate is valid`);
      }
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Diagnostic complete!\n');

  } catch (error) {
    console.error('❌ Error during diagnostic:', error);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

// Run the diagnostic
debugRiceHamaliBookRates();
