const { sequelize } = require('./config/database');

async function addColumns() {
  try {
    console.log('Adding rate and amount columns to rice_hamali_entries...');
    console.log('');

    // Check if columns already exist
    const checkQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'rice_hamali_entries'
        AND column_name IN ('rate', 'amount')
    `;
    
    const existing = await sequelize.query(checkQuery, { type: sequelize.QueryTypes.SELECT });
    const hasRate = existing.some(col => col.column_name === 'rate');
    const hasAmount = existing.some(col => col.column_name === 'amount');

    console.log('Current status:');
    if (hasRate) {
      console.log('  Rate column: EXISTS');
    } else {
      console.log('  Rate column: MISSING');
    }
    if (hasAmount) {
      console.log('  Amount column: EXISTS');
    } else {
      console.log('  Amount column: MISSING');
    }
    console.log('');

    if (hasRate && hasAmount) {
      console.log('Columns already exist! No action needed.');
      return;
    }

    // Add rate column if missing
    if (!hasRate) {
      console.log('Adding rate column...');
      await sequelize.query(`
        ALTER TABLE rice_hamali_entries
        ADD COLUMN rate DECIMAL(10, 2)
      `);
      console.log('Rate column added');
    }

    // Add amount column if missing
    if (!hasAmount) {
      console.log('Adding amount column...');
      await sequelize.query(`
        ALTER TABLE rice_hamali_entries
        ADD COLUMN amount DECIMAL(10, 2)
      `);
      console.log('Amount column added');
    }

    // Backfill existing entries
    console.log('');
    console.log('Backfilling existing entries with rates...');
    const result = await sequelize.query(`
      UPDATE rice_hamali_entries rhe
      SET 
        rate = rhr.rate_24_27,
        amount = (rhe.bags * rhr.rate_24_27)
      FROM rice_hamali_rates rhr
      WHERE rhe.rice_hamali_rate_id = rhr.id
        AND (rhe.rate IS NULL OR rhe.amount IS NULL)
    `);
    console.log('Backfilled entries');

    // Make columns NOT NULL
    console.log('');
    console.log('Making columns NOT NULL...');
    await sequelize.query(`
      ALTER TABLE rice_hamali_entries
      ALTER COLUMN rate SET NOT NULL
    `);
    await sequelize.query(`
      ALTER TABLE rice_hamali_entries
      ALTER COLUMN amount SET NOT NULL
    `);
    console.log('Columns set to NOT NULL');

    // Add indexes if they don't exist
    console.log('');
    console.log('Adding indexes...');
    try {
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_rice_hamali_entries_rate 
        ON rice_hamali_entries(rate)
      `);
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_rice_hamali_entries_amount 
        ON rice_hamali_entries(amount)
      `);
      console.log('Indexes added');
    } catch (indexError) {
      console.log('Indexes might already exist (this is OK)');
    }

    console.log('');
    console.log('Migration completed successfully!');
    console.log('');
    console.log('Summary:');
    console.log('  - Added rate column to rice_hamali_entries');
    console.log('  - Added amount column to rice_hamali_entries');
    console.log('  - Backfilled existing entries with current rates');
    console.log('  - Historical rates are now preserved!');

  } catch (error) {
    console.error('');
    console.error('Error:', error.message);
    console.error(error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

addColumns();
