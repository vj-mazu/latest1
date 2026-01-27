const { sequelize } = require('./config/database');

(async () => {
    try {
        console.log('🔍 Checking for ALL "Raw" variety entries...\n');
        
        // 1. Check rice_stock_movements
        console.log('📦 Checking rice_stock_movements table:');
        const movements = await sequelize.query(`
            SELECT DISTINCT variety, product_type, COUNT(*) as count
            FROM rice_stock_movements
            WHERE LOWER(variety) LIKE '%raw%'
            GROUP BY variety, product_type
            ORDER BY variety
        `, { type: sequelize.QueryTypes.SELECT });
        
        console.log('Found movements with "Raw":');
        console.log(JSON.stringify(movements, null, 2));
        
        // 2. Check rice_productions (should get variety from outturns)
        console.log('\n📦 Checking rice_productions with outturns:');
        const productions = await sequelize.query(`
            SELECT 
                o."allottedVariety",
                o.type,
                CONCAT(o."allottedVariety", ' ', o.type) as full_variety,
                COUNT(*) as count
            FROM rice_productions rp
            JOIN outturns o ON rp."outturnId" = o.id
            WHERE o.type IS NOT NULL
            GROUP BY o."allottedVariety", o.type
            ORDER BY o."allottedVariety", o.type
        `, { type: sequelize.QueryTypes.SELECT });
        
        console.log('Production varieties from outturns:');
        console.log(JSON.stringify(productions, null, 2));
        
        // 3. Check what varieties should exist based on outturns
        console.log('\n📊 Checking outturns table for correct varieties:');
        const outturns = await sequelize.query(`
            SELECT 
                "allottedVariety",
                type,
                CASE 
                    WHEN type IS NULL THEN "allottedVariety"
                    ELSE CONCAT("allottedVariety", ' ', type)
                END as full_variety,
                COUNT(*) as count
            FROM outturns
            WHERE "allottedVariety" LIKE '%SUM25%' OR "allottedVariety" LIKE '%Sum25%'
            GROUP BY "allottedVariety", type
            ORDER BY "allottedVariety", type
        `, { type: sequelize.QueryTypes.SELECT });
        
        console.log('Outturns with SUM25 varieties:');
        console.log(JSON.stringify(outturns, null, 2));
        
        // 4. Fix movements - Update "Raw" to "STEAM" for SUM25 RNR
        console.log('\n🔧 Fixing rice_stock_movements...');
        const fixResult = await sequelize.query(`
            UPDATE rice_stock_movements
            SET variety = 'SUM25 RNR STEAM'
            WHERE (
                LOWER(variety) LIKE '%sum25%rnr%raw%'
                OR LOWER(variety) LIKE '%sum25 rnr raw%'
            )
            AND product_type = 'Rice'
        `, { type: sequelize.QueryTypes.UPDATE });
        
        console.log(`✅ Updated ${fixResult[1]} movement records from "Raw" to "STEAM"`);
        
        // 5. Verify the fix
        console.log('\n✅ Verification - All SUM25 RNR varieties after fix:');
        const verification = await sequelize.query(`
            SELECT DISTINCT variety, product_type, COUNT(*) as count
            FROM rice_stock_movements
            WHERE LOWER(variety) LIKE '%sum25%rnr%'
            GROUP BY variety, product_type
            ORDER BY variety
        `, { type: sequelize.QueryTypes.SELECT });
        
        console.log(JSON.stringify(verification, null, 2));
        
        // 6. Check stock availability for SUM25 RNR STEAM
        console.log('\n📊 Stock check for SUM25 RNR STEAM:');
        const stockCheck = await sequelize.query(`
            WITH stock_calc AS (
                SELECT 
                    location_code,
                    variety,
                    product_type,
                    SUM(CASE 
                        WHEN movement_type IN ('production', 'purchase') THEN quantity_quintals
                        WHEN movement_type = 'sale' THEN -quantity_quintals
                        WHEN movement_type = 'palti' AND source_packaging_id IS NOT NULL THEN -quantity_quintals
                        WHEN movement_type = 'palti' AND target_packaging_id IS NOT NULL THEN quantity_quintals
                        ELSE 0
                    END) as stock_qtls,
                    SUM(CASE 
                        WHEN movement_type IN ('production', 'purchase') THEN bags
                        WHEN movement_type = 'sale' THEN -bags
                        WHEN movement_type = 'palti' AND source_packaging_id IS NOT NULL THEN -COALESCE(source_bags, bags)
                        WHEN movement_type = 'palti' AND target_packaging_id IS NOT NULL THEN bags
                        ELSE 0
                    END) as stock_bags
                FROM rice_stock_movements
                WHERE status = 'approved'
                AND LOWER(variety) LIKE '%sum25%rnr%steam%'
                GROUP BY location_code, variety, product_type
            )
            SELECT * FROM stock_calc
            WHERE stock_qtls > 0
            ORDER BY location_code, variety
        `, { type: sequelize.QueryTypes.SELECT });
        
        console.log('Available stock for SUM25 RNR STEAM:');
        console.log(JSON.stringify(stockCheck, null, 2));
        
        await sequelize.close();
        console.log('\n✅ Done!');
    } catch(e) {
        console.error('❌ Error:', e.message);
        console.error(e.stack);
        process.exit(1);
    }
})();
