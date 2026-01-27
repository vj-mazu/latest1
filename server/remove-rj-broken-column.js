// Remove the rjBroken column that was added by mistake
require('dotenv').config();
const { sequelize } = require('./config/database');

(async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to database');

        console.log('\n🔄 Removing rjBroken column from by_products...');

        // Check if column exists
        const [columns] = await sequelize.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'by_products' AND column_name = 'rjBroken'
        `);

        if (columns.length > 0) {
            await sequelize.query('ALTER TABLE by_products DROP COLUMN IF EXISTS "rjBroken"');
            console.log('✅ Removed rjBroken column');
        } else {
            console.log('ℹ️  rjBroken column does not exist');
        }

        console.log('\n✅ Cleanup completed!');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    }

    await sequelize.close();
    process.exit(0);
})();
