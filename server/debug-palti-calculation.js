const { sequelize } = require('./config/database');

(async () => {
    try {
        console.log('🔍 Debugging Palti calculation issue...\n');
        
        // Check all palti movements for SUM25 RNR STEAM at O2
        console.log('📦 All Palti movements for SUM25 RNR STEAM at O2:');
        const paltiMovements = await sequelize.query(`
            SELECT 
                id,
                date,
                location_code,
                from_location,
                to_location,
                variety,
                product_type,
                movement_type,
                bags,
                source_bags,
                quantity_quintals,
                bag_size_kg,
                packaging_id,
                source_packaging_id,
                target_packaging_id,
                conversion_shortage_kg,
                conversion_shortage_bags,
                status,
                bill_number
            FROM rice_stock_movements
            WHERE movement_type = 'palti'
            AND UPPER(variety) LIKE '%SUM25%RNR%STEAM%'
            AND (location_code = 'O2' OR from_location = 'O2' OR to_location = 'O2')
            ORDER BY date DESC, id DESC
        `, { 
            type: sequelize.QueryTypes.SELECT 
        });
        
        console.log(`Found ${paltiMovements.length} palti movements:`);
        console.log(JSON.stringify(paltiMovements, null, 2));
        
        // Get packaging details
        console.log('\n📦 Packaging details:');
        const packagings = await sequelize.query(`
            SELECT id, "brandName", "allottedKg"
            FROM packagings
            WHERE "brandName" IN ('mi green', 'mi blue', 'MI GREEN', 'MI BLUE')
            ORDER BY "brandName", "allottedKg"
        `, { 
            type: sequelize.QueryTypes.SELECT 
        });
        
        console.log(JSON.stringify(packagings, null, 2));
        
        // Calculate stock impact of each palti
        console.log('\n📊 Stock impact analysis:');
        for (const palti of paltiMovements) {
            const sourcePackaging = packagings.find(p => p.id === palti.source_packaging_id);
            const targetPackaging = packagings.find(p => p.id === palti.target_packaging_id);
            
            console.log(`\n--- Palti ID ${palti.id} (${palti.date}) ---`);
            console.log(`Bill: ${palti.bill_number}`);
            console.log(`Location: ${palti.location_code}, From: ${palti.from_location}, To: ${palti.to_location}`);
            console.log(`Source: ${palti.source_bags || palti.bags} bags × ${sourcePackaging?.brandName} (${sourcePackaging?.allottedKg}kg)`);
            console.log(`Target: ${palti.bags} bags × ${targetPackaging?.brandName} (${targetPackaging?.allottedKg}kg)`);
            console.log(`Quantity: ${palti.quantity_quintals} QTL`);
            console.log(`Shortage: ${palti.conversion_shortage_kg}kg (${palti.conversion_shortage_bags} bags)`);
            
            // Calculate what should happen
            const sourceBagsUsed = palti.source_bags || palti.bags;
            const sourceKg = sourceBagsUsed * (sourcePackaging?.allottedKg || 30);
            const targetKg = palti.bags * (targetPackaging?.allottedKg || 26);
            const actualShortage = sourceKg - targetKg;
            
            console.log(`\n🔍 Verification:`);
            console.log(`  Source weight: ${sourceBagsUsed} × ${sourcePackaging?.allottedKg}kg = ${sourceKg}kg`);
            console.log(`  Target weight: ${palti.bags} × ${targetPackaging?.allottedKg}kg = ${targetKg}kg`);
            console.log(`  Calculated shortage: ${actualShortage}kg`);
            console.log(`  Recorded shortage: ${palti.conversion_shortage_kg}kg`);
            console.log(`  Match: ${Math.abs(actualShortage - palti.conversion_shortage_kg) < 0.01 ? '✅' : '❌'}`);
        }
        
        // Calculate net stock at O2
        console.log('\n\n📊 Net stock calculation at O2:');
        const stockCalc = await sequelize.query(`
            SELECT 
                rsm.variety,
                rsm.product_type,
                p."brandName" as packaging,
                p."allottedKg" as bag_size,
                SUM(CASE 
                    WHEN rsm.movement_type IN ('production', 'purchase') THEN rsm.bags
                    WHEN rsm.movement_type = 'sale' THEN -rsm.bags
                    WHEN rsm.movement_type = 'palti' AND rsm.location_code = 'O2' AND rsm.source_packaging_id IS NOT NULL THEN -COALESCE(rsm.source_bags, rsm.bags)
                    WHEN rsm.movement_type = 'palti' AND rsm.location_code = 'O2' AND rsm.target_packaging_id IS NOT NULL THEN rsm.bags
                    WHEN rsm.movement_type = 'palti' AND rsm.from_location = 'O2' THEN -COALESCE(rsm.source_bags, rsm.bags)
                    WHEN rsm.movement_type = 'palti' AND rsm.to_location = 'O2' THEN rsm.bags
                    ELSE 0
                END) as net_bags,
                SUM(CASE 
                    WHEN rsm.movement_type IN ('production', 'purchase') THEN rsm.quantity_quintals
                    WHEN rsm.movement_type = 'sale' THEN -rsm.quantity_quintals
                    WHEN rsm.movement_type = 'palti' AND rsm.location_code = 'O2' AND rsm.source_packaging_id IS NOT NULL THEN -rsm.quantity_quintals
                    WHEN rsm.movement_type = 'palti' AND rsm.location_code = 'O2' AND rsm.target_packaging_id IS NOT NULL THEN rsm.quantity_quintals
                    WHEN rsm.movement_type = 'palti' AND rsm.from_location = 'O2' THEN -rsm.quantity_quintals
                    WHEN rsm.movement_type = 'palti' AND rsm.to_location = 'O2' THEN rsm.quantity_quintals
                    ELSE 0
                END) as net_qtls
            FROM rice_stock_movements rsm
            LEFT JOIN packagings p ON COALESCE(rsm.target_packaging_id, rsm.packaging_id) = p.id
            WHERE rsm.status = 'approved'
            AND UPPER(rsm.variety) LIKE '%SUM25%RNR%STEAM%'
            AND rsm.product_type = 'Rice'
            AND (rsm.location_code = 'O2' OR rsm.from_location = 'O2' OR rsm.to_location = 'O2')
            GROUP BY rsm.variety, rsm.product_type, p."brandName", p."allottedKg"
            HAVING SUM(CASE 
                WHEN rsm.movement_type IN ('production', 'purchase') THEN rsm.bags
                WHEN rsm.movement_type = 'sale' THEN -rsm.bags
                WHEN rsm.movement_type = 'palti' AND rsm.location_code = 'O2' AND rsm.source_packaging_id IS NOT NULL THEN -COALESCE(rsm.source_bags, rsm.bags)
                WHEN rsm.movement_type = 'palti' AND rsm.location_code = 'O2' AND rsm.target_packaging_id IS NOT NULL THEN rsm.bags
                WHEN rsm.movement_type = 'palti' AND rsm.from_location = 'O2' THEN -COALESCE(rsm.source_bags, rsm.bags)
                WHEN rsm.movement_type = 'palti' AND rsm.to_location = 'O2' THEN rsm.bags
                ELSE 0
            END) != 0
            ORDER BY p."brandName", p."allottedKg"
        `, { 
            type: sequelize.QueryTypes.SELECT 
        });
        
        console.log('Net stock by packaging:');
        console.log(JSON.stringify(stockCalc, null, 2));
        
        await sequelize.close();
        console.log('\n✅ Done!');
    } catch(e) {
        console.error('❌ Error:', e.message);
        console.error(e.stack);
        process.exit(1);
    }
})();
