// Verify RJ Broken is now allowed
require('dotenv').config();
const { sequelize } = require('./config/database');

(async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to database');

        // Check the constraint definition
        const result = await sequelize.query(`
            SELECT conname, pg_get_constraintdef(oid) as definition 
            FROM pg_constraint 
            WHERE conname = 'rice_productions_producttype_check'
        `, { type: sequelize.QueryTypes.SELECT });

        console.log('\n📋 Current CHECK constraint:');
        console.log(result[0].definition);

        // Check ENUM values
        const enumValues = await sequelize.query(`
            SELECT enumlabel 
            FROM pg_enum 
            WHERE enumtypid = (
                SELECT oid 
                FROM pg_type 
                WHERE typname = 'enum_rice_productions_productType'
            )
            ORDER BY enumsortorder
        `, { type: sequelize.QueryTypes.SELECT });

        console.log('\n📋 ENUM values:');
        enumValues.forEach(v => console.log(`  - ${v.enumlabel}`));

        console.log('\n✅ Verification complete!');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    await sequelize.close();
    process.exit(0);
})();
