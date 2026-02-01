const { sequelize } = require('./config/database');

async function checkSchema() {
  try {
    console.log('🔍 Checking rice_hamali_entries table schema...\n');

    // Get table schema
    const schemaQuery = `
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'rice_hamali_entries'
      ORDER BY ordinal_position
    `;
    
    const schema = await sequelize.query(schemaQuery, { type: sequelize.QueryTypes.SELECT });
    console.log('Table columns:');
    schema.forEach((col) => {
      const highlight = (col.column_name === 'rate' || col.column_name === 'amount') ? ' ← NEW!' : '';
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}${highlight}`);
    });

    // Check if rate and amount columns exist
    const hasRate = schema.some(col => col.column_name === 'rate');
    const hasAmount = schema.some(col => col.column_name === 'amount');

    console.log('\n📊 Status:');
    console.log(`  Rate column: ${hasRate ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`  Amount column: ${hasAmount ? '✅ EXISTS' : '❌ MISSING'}`);

    if (hasRate && hasAmount) {
      // Check sample data
      console.log('\n📋 Sample data:');
      const dataQuery = `
        SELECT 
          id,
          bags,
          rate,
          amount,
          rice_hamali_rate_id
        FROM rice_hamali_entries
        ORDER BY created_at DESC
        LIMIT 5
      `;
      
      const data = await sequelize.query(dataQuery, { type: sequelize.QueryTypes.SELECT });
      data.forEach((row, i) => {
        console.log(`\nEntry ${i + 1}:`);
        console.log(`  ID: ${row.id}`);
        console.log(`  Bags: ${row.bags}`);
        console.log(`  Rate: ₹${row.rate || '0'}`);
        console.log(`  Amount: ₹${row.amount || '0'}`);
        console.log(`  Rate ID: ${row.rice_hamali_rate_id}`);
      });

      console.log('\n✅ Migration successful! Columns added and backfilled.');
    } else {
      console.log('\n⚠️  Migration incomplete - columns missing.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkSchema();
