const { sequelize } = require('./config/database');

(async () => {
    try {
        console.log('🔍 Debugging stock availability for sale...\n');
        
        const date = '2026-01-29';
        const locationCode = 'A3';
        const productType = 'Rice';
        
        console.log('Parameters:', { date, locationCode, productType });
        
        // 1. Check rice_productions
        console.log('\n📦 Rice Productions:');
        const productions = await sequelize.query(`
            SELECT 
                rp.id,
                rp.date,
                rp."locationCode",
                rp."productType",
                rp.bags,
                rp."quantityQuintals",
                rp.status,
                o."allottedVariety",
                o.type,
                CONCAT(o."allottedVariety", ' ', o.type) as full_variety,
                p."brandName",
                p."allottedKg"
            FROM rice_productions rp
            JOIN outturns o ON rp."outturnId" = o.id
            LEFT JOIN packagings p ON rp."packagingId" = p.id
            WHERE rp."locationCode" = :locationCode
            AND rp."productType" = :productType
            AND rp.status = 'approved'
            AND rp.date <= :date
            ORDER BY rp.date DESC
        `, { 
            replacements: { locationCode, productType, date },
            type: sequelize.QueryTypes.SELECT 
        });
        
        console.log(`Found ${productions.length} productions:`);
        console.log(JSON.stringify(productions, null, 2));
        
        // 2. Check rice_stock_movements
        console.log('\n📦 Rice Stock Movements:');
        const movements = await sequelize.query(`
            SELECT 
                id,
                date,
                movement_type,
                location_code,
                product_type,
                variety,
                bags,
                source_bags,
                quantity_quintals,
                status,
                packaging_id,
                source_packaging_id,
                target_packaging_id
            FROM rice_stock_movements
            WHERE location_code = :locationCode
            AND product_type = :productType
            AND status = 'approved'
            AND date <= :date
            ORDER BY date DESC
        `, { 
            replacements: { locationCode, productType, date },
            type: sequelize.QueryTypes.SELECT 
        });
        
        console.log(`Found ${movements.length} movements:`);
        console.log(JSON.stringify(movements, null, 2));
        
        // 3. Calculate stock using the same logic as varieties-with-stock endpoint
        console.log('\n📊 Stock Calculation (Combined):');
        const stockCalc = await sequelize.query(`
            WITH combined_stock AS (
                -- From movements
                SELECT 
                    UPPER(TRIM(variety)) as variety_name,
                    SUM(CASE 
                        WHEN movement_type IN ('production', 'purchase') THEN quantity_quintals
                        WHEN movement_type = 'sale' THEN -quantity_quintals
                        WHEN movement_type = 'palti' AND source_packaging_id IS NOT NULL THEN -quantity_quintals
                        WHEN movement_type = 'palti' AND target_packaging_id IS NOT NULL THEN quantity_quintals
                        ELSE 0
                    END) as stock_qtls
                FROM rice_stock_movements
                WHERE status = 'approved'
                AND location_code = :locationCode
                AND product_type = :productType
                AND date <= :date
                GROUP BY UPPER(TRIM(variety))
                
                UNION ALL
                
                -- From productions
                SELECT 
                    UPPER(TRIM(o."allottedVariety" || ' ' || o.type)) as variety_name,
                    SUM(rp."quantityQuintals") as stock_qtls
                FROM rice_productions rp
                JOIN outturns o ON rp."outturnId" = o.id
                WHERE rp.status = 'approved'
                AND rp."locationCode" = :locationCode
                AND rp."productType" = :productType
                AND rp.date <= :date
                GROUP BY UPPER(TRIM(o."allottedVariety" || ' ' || o.type))
            )
            SELECT 
                variety_name,
                SUM(stock_qtls) as total_stock
            FROM combined_stock
            GROUP BY variety_name
            HAVING SUM(stock_qtls) > 0.01
            ORDER BY variety_name
        `, { 
            replacements: { locationCode, productType, date },
            type: sequelize.QueryTypes.SELECT 
        });
        
        console.log('Stock by variety:');
        console.log(JSON.stringify(stockCalc, null, 2));
        
        // 4. Check with packaging filter
        console.log('\n📦 Stock with Packaging Filter (mi green 30kg):');
        const stockWithPackaging = await sequelize.query(`
            WITH combined_stock AS (
                -- From movements
                SELECT 
                    UPPER(TRIM(rsm.variety)) as variety_name,
                    p."brandName" as packaging,
                    p."allottedKg" as bag_size,
                    SUM(CASE 
                        WHEN rsm.movement_type IN ('production', 'purchase') THEN rsm.quantity_quintals
                        WHEN rsm.movement_type = 'sale' THEN -rsm.quantity_quintals
                        WHEN rsm.movement_type = 'palti' AND rsm.source_packaging_id IS NOT NULL THEN -rsm.quantity_quintals
                        WHEN rsm.movement_type = 'palti' AND rsm.target_packaging_id IS NOT NULL THEN rsm.quantity_quintals
                        ELSE 0
                    END) as stock_qtls,
                    SUM(CASE 
                        WHEN rsm.movement_type IN ('production', 'purchase') THEN rsm.bags
                        WHEN rsm.movement_type = 'sale' THEN -rsm.bags
                        WHEN rsm.movement_type = 'palti' AND rsm.source_packaging_id IS NOT NULL THEN -COALESCE(rsm.source_bags, rsm.bags)
                        WHEN rsm.movement_type = 'palti' AND rsm.target_packaging_id IS NOT NULL THEN rsm.bags
                        ELSE 0
                    END) as stock_bags
                FROM rice_stock_movements rsm
                LEFT JOIN packagings p ON rsm.packaging_id = p.id
                WHERE rsm.status = 'approved'
                AND rsm.location_code = :locationCode
                AND rsm.product_type = :productType
                AND rsm.date <= :date
                AND p."brandName" = 'mi green'
                AND p."allottedKg" = 30
                GROUP BY UPPER(TRIM(rsm.variety)), p."brandName", p."allottedKg"
                
                UNION ALL
                
                -- From productions
                SELECT 
                    UPPER(TRIM(o."allottedVariety" || ' ' || o.type)) as variety_name,
                    p."brandName" as packaging,
                    p."allottedKg" as bag_size,
                    SUM(rp."quantityQuintals") as stock_qtls,
                    SUM(rp.bags) as stock_bags
                FROM rice_productions rp
                JOIN outturns o ON rp."outturnId" = o.id
                LEFT JOIN packagings p ON rp."packagingId" = p.id
                WHERE rp.status = 'approved'
                AND rp."locationCode" = :locationCode
                AND rp."productType" = :productType
                AND rp.date <= :date
                AND p."brandName" = 'mi green'
                AND p."allottedKg" = 30
                GROUP BY UPPER(TRIM(o."allottedVariety" || ' ' || o.type)), p."brandName", p."allottedKg"
            )
            SELECT 
                variety_name,
                packaging,
                bag_size,
                SUM(stock_qtls) as total_stock_qtls,
                SUM(stock_bags) as total_stock_bags
            FROM combined_stock
            GROUP BY variety_name, packaging, bag_size
            HAVING SUM(stock_qtls) > 0.01
            ORDER BY variety_name
        `, { 
            replacements: { locationCode, productType, date },
            type: sequelize.QueryTypes.SELECT 
        });
        
        console.log('Stock with mi green 30kg packaging:');
        console.log(JSON.stringify(stockWithPackaging, null, 2));
        
        await sequelize.close();
        console.log('\n✅ Done!');
    } catch(e) {
        console.error('❌ Error:', e.message);
        console.error(e.stack);
        process.exit(1);
    }
})();
