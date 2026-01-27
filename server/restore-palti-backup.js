/**
 * URGENT: Restore Palti Entries from Backup
 */

const { sequelize } = require('./config/database');

async function restorePaltiBackup() {
  console.log('🔄 RESTORING Palti Entries from Backup\n');
  console.log('=' .repeat(80));
  
  try {
    // Find the backup table
    const backupTables = await sequelize.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE tablename LIKE 'rice_stock_movements_backup_%'
      ORDER BY tablename DESC
      LIMIT 1
    `, { type: sequelize.QueryTypes.SELECT });
    
    if (backupTables.length === 0) {
      console.log('❌ No backup table found!');
      await sequelize.close();
      return;
    }
    
    const backupTable = backupTables[0].tablename;
    console.log(`\n✅ Found backup table: ${backupTable}`);
    
    // Check what's in the backup
    const backupData = await sequelize.query(`
      SELECT * FROM ${backupTable} ORDER BY id
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log(`\n📦 Backup contains ${backupData.length} records`);
    
    // Restore the data
    console.log('\n🔄 Restoring data...');
    
    const result = await sequelize.query(`
      INSERT INTO rice_stock_movements 
      SELECT * FROM ${backupTable}
      ON CONFLICT (id) DO NOTHING
      RETURNING id
    `, { type: sequelize.QueryTypes.INSERT });
    
    console.log(`✅ Restored ${result[1].rowCount} records`);
    
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ RESTORE COMPLETE!');
    console.log(`\nRestored ${result[1].rowCount} palti entries from backup`);
    console.log(`Backup table ${backupTable} is still available if needed`);
    console.log('\n' + '='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ Restore failed:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

// Run restore
restorePaltiBackup();
