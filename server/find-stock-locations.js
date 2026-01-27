const { sequelize } = require('./config/database');

(async () => {
    try {
        console.log('🔍 Finding all locations with Rice stock...\n');
        
        const date = '2026-01-29';
        
        // Check all locations with stock
        console.log('📊 All locations with Rice stock:');
        const locations = await sequelize.query(`
            WITH combined_stock AS (
                -- From movements
                SELECT 
                    location_code,
                    UPPER(TRIM(variety)) as variety_name,
                    product_type,
                    SUM(CASE 
                        WHEN movement_type IN ('production', 'purchase') THEN quantity_quintals
                        WHEN movement_type = 'sale' THEN -quantity_quintals
                        WHEN movement_type = 'palti' AND source_packaging_id IS NOT NULL THEN -quantity_quintals
                        WHEN movement_type = 'palti' AND target_packaging_id IS NOT NULL THEN quantity_quintals
                        ELSE 0
                    END) as stock_qtls
                FROM rice_stock_movements
                WHERE status = 'approved'
                AND product_type = 'Rice'
                AND date <= :date
                GROUP BY location_code, UPPER(TRIM(variety)), product_type
                
                UNION ALL
                
                -- From productions
                SELECT 
                    rp."locationCode" as location_code,
                    UPPER(TRIM(o."allottedVariety" || ' ' || o.type)) as variety_name,
                    rp."productType" as product_type,
                    SUM(rp."quantityQuintals") as stock_qtls
                FROM rice_productions rp
                JOIN outturns o ON rp."outturnId" = o.id
                WHERE rp.status = 'approved'
                AND rp."productType" = 'Rice'
                AND rp.date <= :date
                GROUP BY rp."locationCode", UPPER(TRIM(o."allottedVariety" || ' ' || o.type)), rp."productType"
            )
            SELECT 
                location_code,
                variety_name,
                product_type,
                SUM(stock_qtls) as total_stock
            FROM combined_stock
            GROUP BY location_code, variety_name, product_type
            HAVING SUM(stock_qtls) > 0.01
            ORDER BY location_code, variety_name
        `, { 
            replacements: { date },
            type: sequelize.QueryTypes.SELECT 
        });
        
        console.log(`Found ${locations.length} location-variety combinations with stock:`);
        console.log(JSON.stringify(locations, null, 2));
        
        // Check with packaging details
        console.log('\n📦 Stock with packaging details:');
        const detailedStock = await sequelize.query(`
            WITH combined_stock AS (
                -- From movements
                SELECT 
                    rsm.location_code,
                    UPPER(TRIM(rsm.variety)) as variety_name,
                    rsm.product_type,
                    p."brandName" as packaging,
                    p."allottedKg" as bag_size,
                    SUM(CASE 
                        WHEN rsm.movement_type IN ('production', 'purchase') THEN rsm.bags
                        WHEN rsm.movement_type = 'sale' THEN -rsm.bags
                        WHEN rsm.movement_type = 'palti' AND rsm.source_packaging_id IS NOT NULL THEN -COALESCE(rsm.source_bags, rsm.bags)
                        WHEN rsm.movement_type = 'palti' AND rsm.target_packaging_id IS NOT NULL THEN rsm.bags
                        ELSE 0
                    END) as stock_bags,
                    SUM(CASE 
                        WHEN rsm.movement_type IN ('production', 'purchase') THEN rsm.quantity_quintals
                        WHEN rsm.movement_type = 'sale' THEN -rsm.quantity_quintals
                        WHEN rsm.movement_type = 'palti' AND rsm.source_packaging_id IS NOT NULL THEN -rsm.quantity_quintals
                        WHEN rsm.movement_type = 'palti' AND rsm.target_packaging_id IS NOT NULL THEN rsm.quantity_quintals
                        ELSE 0
                    END) as stock_qtls
                FROM rice_stock_movements rsm
                LEFT JOIN packagings p ON rsm.packaging_id = p.id
                WHERE rsm.status = 'approved'
                AND rsm.product_type = 'Rice'
                AND rsm.date <= :date
                GROUP BY rsm.location_code, UPPER(TRIM(rsm.variety)), rsm.product_type, p."brandName", p."allottedKg"
                
                UNION ALL
                
                -- From productions
                SELECT 
                    rp."locationCode" as location_code,
                    UPPER(TRIM(o."allottedVariety" || ' ' || o.type)) as variety_name,
                    rp."productType" as product_type,
                    p."brandName" as packaging,
                    p."allottedKg" as bag_size,
                    SUM(rp.bags) as stock_bags,
                    SUM(rp."quantityQuintals") as stock_qtls
                FROM rice_productions rp
                JOIN outturns o ON rp."outturnId" = o.id
                LEFT JOIN packagings p ON rp."packagingId" = p.id
                WHERE rp.status = 'approved'
                AND rp."productType" = 'Rice'
                AND rp.date <= :date
                GROUP BY rp."locationCode", UPPER(TRIM(o."allottedVariety" || ' ' || o.type)), rp."productType", p."brandName", p."allottedKg"
            )
            SELECT 
                location_code,
                variety_name,
                product_type,
                packaging,
                bag_size,
                SUM(stock_bags) as total_bags,
                SUM(stock_qtls) as total_qtls
            FROM combined_stock
            WHERE packaging IS NOT NULL
            GROUP BY location_code, variety_name, product_type, packaging, bag_size
            HAVING SUM(stock_qtls) > 0.01
            ORDER BY location_code, variety_name, packaging
        `, { 
            replacements: { date },
            type: sequelize.QueryTypes.SELECT 
        });
        
        console.log(`Found ${detailedStock.length} location-variety-packaging combinations:`);
        console.log(JSON.stringify(detailedStock, null, 2));
        
        await sequelize.close();
        console.log('\n✅ Done!');
    } catch(e) {
        console.error('❌ Error:', e.message);
        console.error(e.stack);
        process.exit(1);
    }
})();
