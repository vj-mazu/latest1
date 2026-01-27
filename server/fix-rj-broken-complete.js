// Complete fix for RJ Broken - Add to both ENUM and CHECK constraint
require('dotenv').config();
const { sequelize } = require('./config/database');

(async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to database');

        // Step 1: Drop the CHECK constraint
        console.log('\n🔄 Step 1: Dropping CHECK constraint...');
        try {
            await sequelize.query('ALTER TABLE rice_productions DROP CONSTRAINT IF EXISTS "rice_productions_producttype_check"');
            console.log('✅ CHECK constraint dropped');
        } catch (e) {
            console.log('ℹ️  DROP constraint result:', e.message);
        }

        // Step 2: Add RJ Broken to the ENUM type
        console.log('\n🔄 Step 2: Adding RJ Broken to ENUM type...');
        try {
            await sequelize.query(`ALTER TYPE "enum_rice_productions_productType" ADD VALUE IF NOT EXISTS 'RJ Broken'`);
            console.log('✅ RJ Broken added to ENUM');
        } catch (e) {
            console.log('ℹ️  Add ENUM value result:', e.message);
        }

        // Step 3: Recreate CHECK constraint with ALL values including RJ Broken
        console.log('\n🔄 Step 3: Recreating CHECK constraint with ALL values including RJ Broken...');
        try {
            await sequelize.query(`
                ALTER TABLE rice_productions 
                ADD CONSTRAINT "rice_productions_producttype_check" 
                CHECK ("productType"::text = ANY (ARRAY[
                    'Rice'::text, 
                    'Bran'::text, 
                    'Farm Bran'::text, 
                    'Rejection Rice'::text, 
                    'Sizer Broken'::text, 
                    'Rejection Broken'::text, 
                    'RJ Broken'::text,
                    'Broken'::text, 
                    'Zero Broken'::text, 
                    'Faram'::text, 
                    'Unpolished'::text, 
                    'RJ Rice 1'::text, 
                    'RJ Rice 2'::text
                ]))
            `);
            console.log('✅ New CHECK constraint created with RJ Broken included');
        } catch (e) {
            console.error('❌ Create constraint error:', e.message);
            throw e;
        }

        // Step 4: Verify the fix
        console.log('\n🔄 Step 4: Verifying the fix...');
        const result = await sequelize.query(`
            SELECT conname, pg_get_constraintdef(oid) as definition 
            FROM pg_constraint 
            WHERE conname = 'rice_productions_producttype_check'
        `, { type: sequelize.QueryTypes.SELECT });

        console.log('\n📋 Current CHECK constraint:');
        console.log(result[0].definition);

        // Check if RJ Broken is in the constraint
        if (result[0].definition.includes('RJ Broken')) {
            console.log('\n✅ SUCCESS! RJ Broken is now in the CHECK constraint!');
        } else {
            console.log('\n❌ WARNING: RJ Broken is NOT in the CHECK constraint!');
        }

        console.log('\n✅ Migration completed! Try saving RJ Broken production again.');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('Stack:', error.stack);
    }

    await sequelize.close();
    process.exit(0);
})();
