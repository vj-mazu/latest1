const { sequelize } = require('./config/database');

async function checkMigrationStatus() {
  try {
    console.log('🔍 Checking rice_hamali_entries table schema...');
    console.log('');

    // Check if table exists
    const [tableExists] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'rice_hamali_entries'
    `);

    if (tableExists.length === 0) {
      console.log('❌ rice_hamali_entries table does NOT exist!');
      console.log('');
      process.exit(1);
    }

    console.log('✅ rice_hamali_entries table exists');
    console.log('');

    // Check columns
    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'rice_hamali_entries'
      ORDER BY ordinal_position
    `);

    console.log('📋 Table columns:');
    console.log('');
    
    let hasRate = false;
    let hasAmount = false;

    columns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
      if (col.column_name === 'rate') hasRate = true;
      if (col.column_name === 'amount') hasAmount = true;
    });

    console.log('');
    console.log('🎯 Migration Status:');
    console.log('');

    if (hasRate && hasAmount) {
      console.log('  ✅ rate column: EXISTS');
      console.log('  ✅ amount column: EXISTS');
      console.log('');
      console.log('🎉 Migration completed successfully!');
      console.log('');
      console.log('The columns exist but the error persists.');
      console.log('This means the issue is in the code, not the database.');
    } else {
      console.log(`  ${hasRate ? '✅' : '❌'} rate column: ${hasRate ? 'EXISTS' : 'MISSING'}`);
      console.log(`  ${hasAmount ? '✅' : '❌'} amount column: ${hasAmount ? 'EXISTS' : 'MISSING'}`);
      console.log('');
      console.log('❌ Migration NOT completed!');
      console.log('');
      console.log('The migration script did not run successfully.');
      console.log('Please run: node add-rate-amount-columns-safe.js');
    }

    console.log('');

  } catch (error) {
    console.error('❌ Error checking migration status:', error.message);
    console.error(error);
  } finally {
    await sequelize.close();
  }
}

checkMigrationStatus();
