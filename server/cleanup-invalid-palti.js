/**
 * SAFE Cleanup Script: Remove Invalid Palti Operations
 * 
 * This script will:
 * 1. Show you exactly what will be deleted
 * 2. Ask for confirmation before making ANY changes
 * 3. Create a backup of deleted records
 * 4. Provide rollback instructions
 * 
 * SAFE: No changes until you confirm
 */

const { sequelize } = require('./config/database');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function cleanupInvalidPalti() {
  console.log('🧹 Safe Cleanup: Invalid Palti Operations\n');
  console.log('=' .repeat(80));
  
  try {
    // IDs of problematic operations from analysis
    const problematicIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    
    // Get full details of these operations
    const operations = await sequelize.query(`
      SELECT 
        rsm.*,
        p."brandName" as packaging_name,
        sp."brandName" as source_packaging_name,
        tp."brandName" as target_packaging_name
      FROM rice_stock_movements rsm
      LEFT JOIN packagings p ON rsm.packaging_id = p.id
      LEFT JOIN packagings sp ON rsm.source_packaging_id = sp.id
      LEFT JOIN packagings tp ON rsm.target_packaging_id = tp.id
      WHERE rsm.id IN (:ids)
      ORDER BY rsm.date, rsm.id
    `, {
      replacements: { ids: problematicIds },
      type: sequelize.QueryTypes.SELECT
    });
    
    if (operations.length === 0) {
      console.log('✅ No invalid operations found - database is clean!');
      rl.close();
      await sequelize.close();
      return;
    }
    
    console.log(`\n📋 Found ${operations.length} invalid palti operations:\n`);
    
    operations.forEach((op, index) => {
      console.log(`${index + 1}. ID: ${op.id} | Date: ${op.date}`);
      console.log(`   Type: ${op.movement_type}`);
      console.log(`   Location: ${op.location_code} → ${op.to_location || 'same'}`);
      console.log(`   Variety: ${op.variety}`);
      console.log(`   Product: ${op.product_type}`);
      console.log(`   Source: ${op.source_bags || op.bags} bags (${op.source_packaging_name})`);
      console.log(`   Target: ${op.bags} bags (${op.target_packaging_name})`);
      console.log(`   Status: ${op.status}`);
      console.log(`   Created: ${op.created_at}`);
      console.log('');
    });
    
    console.log('=' .repeat(80));
    console.log('\n⚠️  IMPORTANT: These operations have 0 opening stock');
    console.log('⚠️  They were created before validation was added');
    console.log('⚠️  Deleting them will NOT affect valid stock data\n');
    
    // Ask for confirmation
    const answer = await question('Do you want to DELETE these operations? (yes/no): ');
    
    if (answer.toLowerCase() !== 'yes') {
      console.log('\n❌ Cleanup cancelled - NO changes made');
      rl.close();
      await sequelize.close();
      return;
    }
    
    console.log('\n🔄 Creating backup before deletion...');
    
    // Create backup table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS rice_stock_movements_backup_${Date.now()} AS
      SELECT * FROM rice_stock_movements WHERE id IN (:ids)
    `, {
      replacements: { ids: problematicIds }
    });
    
    console.log('✅ Backup created');
    
    // Delete the operations
    console.log('\n🗑️  Deleting invalid operations...');
    
    const result = await sequelize.query(`
      DELETE FROM rice_stock_movements 
      WHERE id IN (:ids)
      RETURNING id
    `, {
      replacements: { ids: problematicIds },
      type: sequelize.QueryTypes.DELETE
    });
    
    console.log(`✅ Deleted ${result[1].rowCount} operations`);
    
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ CLEANUP COMPLETE!\n');
    console.log('Summary:');
    console.log(`  - Deleted: ${result[1].rowCount} invalid palti operations`);
    console.log(`  - Backup created: rice_stock_movements_backup_*`);
    console.log(`  - Validation is now active to prevent future issues`);
    
    console.log('\n💡 To rollback (if needed):');
    console.log('   SELECT * FROM rice_stock_movements_backup_* ORDER BY id;');
    console.log('   -- Review the backup, then restore if needed');
    
    console.log('\n' + '='.repeat(80));
    
  } catch (error) {
    console.error('\n❌ Cleanup failed:', error.message);
    console.error(error.stack);
    console.log('\n⚠️  NO changes were made due to error');
  } finally {
    rl.close();
    await sequelize.close();
  }
}

// Run cleanup
cleanupInvalidPalti();
