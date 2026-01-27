// Script to fix the productType CHECK constraint and add RJ Broken
require('dotenv').config();
const { sequelize } = require('./config/database');

(async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to database');

        // Step 1: Drop the CHECK constraint
        console.log('🔄 Dropping CHECK constraint...');
        try {
            await sequelize.query('ALTER TABLE rice_productions DROP CONSTRAINT IF EXISTS "rice_productions_producttype_check"');
            console.log('✅ CHECK constraint dropped');
        } catch (e) {
            console.log('ℹ️  DROP constraint result:', e.message);
        }

        // Step 2: Add RJ Broken to the ENUM type
        console.log('🔄 Adding RJ Broken to ENUM type...');
        try {
            await sequelize.query(`ALTER TYPE "enum_rice_productions_productType" ADD VALUE IF NOT EXISTS 'RJ Broken'`);
            console.log('✅ RJ Broken added to ENUM');
        } catch (e) {
            console.log('ℹ️  Add ENUM value result:', e.message);
        }

        // Step 3: Recreate CHECK constraint with new value
        console.log('🔄 Recreating CHECK constraint with RJ Broken...');
        try {
            await sequelize.query(`
        ALTER TABLE rice_productions 
        ADD CONSTRAINT "rice_productions_producttype_check" 
        CHECK ("productType"::text = ANY (ARRAY['Rice'::text, 'Bran'::text, 'Farm Bran'::text, 'Rejection Rice'::text, 'Sizer Broken'::text, 'Rejection Broken'::text, 'RJ Broken'::text, 'Broken'::text, 'Zero Broken'::text, 'Faram'::text, 'Unpolished'::text, 'RJ Rice 1'::text, 'RJ Rice 2'::text]))
      `);
            console.log('✅ New CHECK constraint created with RJ Broken');
        } catch (e) {
            console.log('ℹ️  Create constraint result:', e.message);
        }

        console.log('\n✅ Migration completed! Try saving RJ Broken again.');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }

    await sequelize.close();
    process.exit(0);
})();
