// Simple migration for RJ Broken ENUM
require('dotenv').config();
const { sequelize } = require('./config/database');

(async () => {
    try {
        await sequelize.authenticate();
        console.log('Connected to database');

        // Add RJ Broken to ENUM
        await sequelize.query('ALTER TYPE "enum_rice_productions_productType" ADD VALUE IF NOT EXISTS \'RJ Broken\'');
        console.log('SUCCESS: RJ Broken added to ENUM');

    } catch (e) {
        console.log('Error:', e.message);
        if (e.message && e.message.includes('already exists')) {
            console.log('RJ Broken already exists - this is OK');
        }
    }
    await sequelize.close();
    process.exit(0);
})();
