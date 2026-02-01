const { sequelize } = require('./config/database');

async function checkRiceHamaliRatesSchema() {
  try {
    console.log('🔍 Checking rice_hamali_rates table schema...\n');

    // Get table schema
    const schemaQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'rice_hamali_rates'
      ORDER BY ordinal_position
    `;
    
    const schema = await sequelize.query(schemaQuery, { type: sequelize.QueryTypes.SELECT });
    console.log('Table columns:');
    schema.forEach((col) => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // Get sample data
    console.log('\n📋 Sample data from rice_hamali_rates:\n');
    const dataQuery = `
      SELECT *
      FROM rice_hamali_rates
      WHERE is_active = true
      ORDER BY display_order, id
      LIMIT 5
    `;
    
    const data = await sequelize.query(dataQuery, { type: sequelize.QueryTypes.SELECT });
    console.log(`Found ${data.length} active rates:`);
    data.forEach((rate, i) => {
      console.log(`\nRate ${i + 1}:`);
      console.log(`  ID: ${rate.id}`);
      console.log(`  Work Type: ${rate.work_type}`);
      console.log(`  Work Detail: ${rate.work_detail}`);
      console.log(`  Rate 18-21: ₹${rate.rate_18_21}`);
      console.log(`  Rate 21-24: ₹${rate.rate_21_24}`);
      console.log(`  Rate 24-27: ₹${rate.rate_24_27}`);
      console.log(`  Display Order: ${rate.display_order}`);
    });

    // Now check the actual JOIN with rice_hamali_entries
    console.log('\n\n📋 Checking JOIN with rice_hamali_entries:\n');
    const joinQuery = `
      SELECT 
        rhe.id as entry_id,
        rhe.bags,
        rhe.rice_hamali_rate_id,
        rhr.id as rate_id,
        rhr.work_type,
        rhr.work_detail,
        rhr.rate_21_24,
        (rhe.bags * rhr.rate_21_24) as calculated_amount
      FROM rice_hamali_entries rhe
      LEFT JOIN rice_hamali_rates rhr ON rhe.rice_hamali_rate_id = rhr.id
      ORDER BY rhe.created_at DESC
      LIMIT 10
    `;
    
    const joinResults = await sequelize.query(joinQuery, { type: sequelize.QueryTypes.SELECT });
    console.log(`Checking ${joinResults.length} recent entries:`);
    joinResults.forEach((result, i) => {
      console.log(`\nEntry ${i + 1}:`);
      console.log(`  Entry ID: ${result.entry_id}`);
      console.log(`  Bags: ${result.bags}`);
      console.log(`  Rate ID (from entry): ${result.rice_hamali_rate_id}`);
      console.log(`  Rate ID (from JOIN): ${result.rate_id || 'NULL - NOT FOUND!'}`);
      console.log(`  Work Type: ${result.work_type || 'NULL'}`);
      console.log(`  Work Detail: ${result.work_detail || 'NULL'}`);
      console.log(`  Rate 21-24: ₹${result.rate_21_24 || '0'}`);
      console.log(`  Calculated Amount: ₹${result.calculated_amount || '0'}`);
      
      if (!result.rate_id) {
        console.log(`  ❌ PROBLEM: Rate ID ${result.rice_hamali_rate_id} not found!`);
      } else if (!result.rate_21_24 || parseFloat(result.rate_21_24) === 0) {
        console.log(`  ❌ PROBLEM: Rate is 0 or NULL!`);
      } else {
        console.log(`  ✅ OK`);
      }
    });

    console.log('\n✅ Schema check complete!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

checkRiceHamaliRatesSchema();
