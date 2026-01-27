const { sequelize } = require('./config/database');

(async () => {
    try {
        console.log('🔧 Fixing palti variety names to match source productions...\n');
        
        // Find the problematic palti movement
        const paltiMovement = await sequelize.query(`
            SELECT id, variety, location_code, product_type, bags, date
            FROM rice_stock_movements
            WHERE location_code = 'O2'
            AND movement_type = 'palti'
            AND product_type = 'Rice'
            AND variety LIKE '%Raw%'
            AND date = '2026-01-29'
        `, { type: sequelize.QueryTypes.SELECT });
        
        console.log('📦 Found palti movement with wrong variety:');
        console.log(JSON.stringify(paltiMovement, null, 2));
        
        if (paltiMovement.length > 0) {
            // Update the variety to match the source production
            const result = await sequelize.query(`
                UPDATE rice_stock_movements
                SET variety = 'SUM25 RNR STEAM'
                WHERE id = :id
            `, {
                replacements: { id: paltiMovement[0].id },
                type: sequelize.QueryTypes.UPDATE
            });
            
            console.log('\n✅ Updated palti variety from "Sum25 RNR Raw" to "SUM25 RNR STEAM"');
            console.log(`   Affected rows: ${result[1]}`);
        }
        
        // Verify the fix
        const verification = await sequelize.query(`
            SELECT 
                location_code,
                product_type,
                variety,
                SUM(CASE 
                    WHEN movement_type IN ('production', 'purchase') THEN bags
                    WHEN movement_type = 'sale' THEN -bags
                    WHEN movement_type = 'palti' AND from_location = location_code THEN -bags
                    WHEN movement_type = 'palti' AND to_location = location_code THEN bags
                    ELSE 0
                END) as net_bags
            FROM rice_stock_movements
            WHERE location_code = 'O2'
            AND product_type = 'Rice'
            AND variety LIKE '%SUM25 RNR%'
            AND status = 'approved'
            GROUP BY location_code, product_type, variety
        `, { type: sequelize.QueryTypes.SELECT });
        
        console.log('\n📊 Stock after fix:');
        console.log(JSON.stringify(verification, null, 2));
        
        await sequelize.close();
        console.log('\n✅ Done!');
    } catch(e) {
        console.error('❌ Error:', e.message);
        console.error(e.stack);
        process.exit(1);
    }
})();
