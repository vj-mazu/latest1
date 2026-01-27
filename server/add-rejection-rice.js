// Script to add Rejection Rice product type
// This adds "Rejection Rice" to rice_productions and ensures it syncs to by_products
require('dotenv').config();
const { sequelize } = require('./config/database');

(async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to database');

        console.log('\n🔄 Adding "Rejection Rice" product type...\n');

        // Step 1: Drop the CHECK constraint
        console.log('Step 1: Dropping CHECK constraint...');
        try {
            await sequelize.query('ALTER TABLE rice_productions DROP CONSTRAINT IF EXISTS "rice_productions_producttype_check"');
            console.log('✅ CHECK constraint dropped');
        } catch (e) {
            console.log('ℹ️  DROP constraint result:', e.message);
        }

        // Step 2: Add Rejection Rice to the ENUM type (if not exists)
        console.log('\nStep 2: Adding Rejection Rice to ENUM type...');
        try {
            await sequelize.query(`ALTER TYPE "enum_rice_productions_productType" ADD VALUE IF NOT EXISTS 'Rejection Rice'`);
            console.log('✅ Rejection Rice added to ENUM');
        } catch (e) {
            console.log('ℹ️  Add ENUM value result:', e.message);
        }

        // Step 3: Recreate CHECK constraint with ALL values including Rejection Rice
        console.log('\nStep 3: Recreating CHECK constraint with Rejection Rice...');
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
            console.log('✅ New CHECK constraint created with Rejection Rice');
        } catch (e) {
            console.error('❌ Create constraint error:', e.message);
            throw e;
        }

        // Step 4: Verify the fix
        console.log('\nStep 4: Verifying the fix...');
        const result = await sequelize.query(`
            SELECT conname, pg_get_constraintdef(oid) as definition 
            FROM pg_constraint 
            WHERE conname = 'rice_productions_producttype_check'
        `, { type: sequelize.QueryTypes.SELECT });

        console.log('\n📋 Current CHECK constraint:');
        console.log(result[0].definition);

        // Check if Rejection Rice is in the constraint
        if (result[0].definition.includes('Rejection Rice')) {
            console.log('\n✅ SUCCESS! Rejection Rice is now in the CHECK constraint!');
        } else {
            console.log('\n❌ WARNING: Rejection Rice is NOT in the CHECK constraint!');
        }

        // Step 5: Show ENUM values
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

        console.log('\n📋 All ENUM values:');
        enumValues.forEach(v => console.log(`  - ${v.enumlabel}`));

        console.log('\n✅ Migration completed!');
        console.log('\n📝 Note: "Rejection Rice" will automatically sync to by_products table');
        console.log('   using the existing "rejectionRice" column (already configured in ByProductSyncService)');

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        console.error('Stack:', error.stack);
    }

    await sequelize.close();
    process.exit(0);
})();
