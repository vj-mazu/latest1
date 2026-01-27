// Run the migration to add rjBroken column
require('dotenv').config();
const { sequelize } = require('./config/database');

(async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to database');

        // Run the migration
        const migration = require('./migrations/add_rj_broken_column_to_byproducts');
        await migration.up(sequelize.getQueryInterface(), sequelize.Sequelize);

        console.log('\n✅ Migration completed successfully!');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    }

    await sequelize.close();
    process.exit(0);
})();
