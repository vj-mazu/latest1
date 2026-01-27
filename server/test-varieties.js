const { sequelize } = require('./config/database');

(async () => {
    try {
        console.log('🔍 Checking ALL stock at location O2...\n');
        
        // Check all movements at O2
        const allMovements = await sequelize.query(`
            SELECT 
                location_code, 
                product_type, 
                variety, 
                movement_type,
                bags,
                quantity_quintals,
                packaging_id,
                date,
                status
            FROM rice_stock_movements 
            WHERE location_code = 'O2'
            AND status = 'approved'
            ORDER BY date DESC
            LIMIT 50
        `, { type: sequelize.QueryTypes.SELECT });
        
        console.log('📦 All movements at O2:');
        console.log(JSON.stringify(allMovements, null, 2));
        
        // Check all productions at O2
        const allProductions = await sequelize.query(`
            SELECT 
                rp."locationCode",
                rp."productType",
                o."allottedVariety",
                o.type,
                rp.bags,
                rp."quantityQuintals",
                rp."packagingId",
                rp.date,
                rp.status
            FROM rice_productions rp
            JOIN outturns o ON rp."outturnId" = o.id
            WHERE rp."locationCode" = 'O2'
            AND rp.status = 'approved'
            ORDER BY rp.date DESC
            LIMIT 50
        `, { type: sequelize.QueryTypes.SELECT });
        
        console.log('\n🏭 All productions at O2:');
        console.log(JSON.stringify(allProductions, null, 2));
        
        // Calculate net stock
        const netStock = await sequelize.query(`
            SELECT 
                location_code,
                product_type,
                variety,
                p."brandName" as packaging,
                p."allottedKg" as bag_size,
                SUM(CASE 
                    WHEN movement_type IN ('production', 'purchase') THEN bags
                    WHEN movement_type = 'sale' THEN -bags
                    WHEN movement_type = 'palti' THEN 0
                    ELSE 0
                END) as net_bags,
                SUM(CASE 
                    WHEN movement_type IN ('production', 'purchase') THEN quantity_quintals
                    WHEN movement_type = 'sale' THEN -quantity_quintals
                    WHEN movement_type = 'palti' THEN 0
                    ELSE 0
                END) as net_qtls
            FROM rice_stock_movements rsm
            LEFT JOIN packagings p ON rsm.packaging_id = p.id
            WHERE location_code = 'O2'
            AND status = 'approved'
            GROUP BY location_code, product_type, variety, p."brandName", p."allottedKg"
            HAVING SUM(CASE 
                WHEN movement_type IN ('production', 'purchase') THEN bags
                WHEN movement_type = 'sale' THEN -bags
                ELSE 0
            END) > 0
        `, { type: sequelize.QueryTypes.SELECT });
        
        console.log('\n📊 Net stock at O2:');
        console.log(JSON.stringify(netStock, null, 2));
        
        await sequelize.close();
    } catch(e) {
        console.error('❌ Error:', e.message);
        console.error(e.stack);
        process.exit(1);
    }
})();
