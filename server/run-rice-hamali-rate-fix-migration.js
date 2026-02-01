/**
 * Run migration to add rate and amount columns to rice_hamali_entries
 * This fixes the issue where editing rates in Location tab changes past records
 */

const { sequelize } = require('./config/database');
const migration = require('./migrations/63_add_rate_amount_to_rice_hamali_entries');

async function runMigration() {
  try {
    console.log('🚀 Starting Rice Hamali Rate Fix Migration...\n');
    console.log('=' .repeat(80));
    console.log('\n📋 This migration will:');
    console.log('  1. Add rate column to rice_hamali_entries');
    console.log('  2. Add amount column to rice_hamali_entries');
    console.log('  3. Backfill existing entries with current rates');
    console.log('  4. Add indexes for performance');
    console.log('\n⚠️  This ensures historical rates remain accurate when rates are updated\n');
    console.log('=' .repeat(80));
    console.log('\n');

    // Run the migration
    await migration.up();

    console.log('\n' + '=' .repeat(80));
    console.log('\n✅ Migration completed successfully!');
    console.log('\n📊 What changed:');
    console.log('  - rice_hamali_entries now stores rate and amount at time of entry');
    console.log('  - Past records will NOT change when rates are edited');
    console.log('  - Works like Paddy Hamali (historical accuracy preserved)');
    console.log('\n🚀 Next steps:');
    console.log('  1. Restart the server');
    console.log('  2. Test by editing a rate in Location tab');
    console.log('  3. Verify past records still show old rates');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the migration
runMigration();
