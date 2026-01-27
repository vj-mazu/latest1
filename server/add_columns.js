const { sequelize } = require('./config/database');

async function addApprovalColumns() {
    try {
        console.log('Adding approval columns to rice_stock_movements...');

        await sequelize.query(`ALTER TABLE rice_stock_movements ADD COLUMN IF NOT EXISTS approved_by INTEGER`);
        console.log('✅ approved_by column added');

        await sequelize.query(`ALTER TABLE rice_stock_movements ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP`);
        console.log('✅ approved_at column added');

        await sequelize.query(`ALTER TABLE rice_stock_movements ADD COLUMN IF NOT EXISTS rejection_reason TEXT`);
        console.log('✅ rejection_reason column added');

        console.log('\n✅ All columns added successfully!');
        console.log('Please try approving again.');

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await sequelize.close();
        process.exit();
    }
}

addApprovalColumns();
