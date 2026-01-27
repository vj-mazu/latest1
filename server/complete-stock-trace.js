const { sequelize } = require('./config/database');

(async () => {
    try {
        console.log('🔍 Complete stock trace for SUM25 RNR STEAM Rice...\n');
        
        // Get ALL movements across all locations
        console.log('📦 ALL movements for SUM25 RNR STEAM Rice (all locations):');
        const movements = await sequelize.query(`
            SELECT 
                rsm.id,
                rsm.date,
                rsm.movement_type,
                rsm.location_code,
                rsm.from_location,
                rsm.to_location,
                rsm.variety,
                rsm.product_type,
                rsm.bags,
                rsm.source_bags,
                rsm.quantity_quintals,
                rsm.status,
                rsm.bill_number,
                rsm.packaging_id,
                rsm.source_packaging_id,
                rsm.target_packaging_id,
                p."brandName" as packaging,
                p."allottedKg" as bag_size,
                sp."brandName" as source_packaging,
                sp."allottedKg" as source_bag_size,
                tp."brandName" as target_packaging,
                tp."allottedKg" as target_bag_size
            FROM rice_stock_movements rsm
            LEFT JOIN packagings p ON rsm.packaging_id = p.id
            LEFT JOIN packagings sp ON rsm.source_packaging_id = sp.id
            LEFT JOIN packagings tp ON rsm.target_packaging_id = tp.id
            WHERE rsm.status = 'approved'
            AND UPPER(rsm.variety) LIKE '%SUM25%RNR%STEAM%'
            AND rsm.product_type = 'Rice'
            AND rsm.date <= '2026-01-29'
            ORDER BY rsm.date ASC, rsm.id ASC
        `, { 
            type: sequelize.QueryTypes.SELECT 
        });
        
        console.log(`Found ${movements.length} movements:\n`);
        
        // Track stock by location and packaging
        const stock = {};
        
        const getKey = (loc, pkg, size) => `${loc}|${pkg}|${size}`;
        
        console.log('📊 Movement-by-movement trace:');
        console.log('='.repeat(140));
        
        for (const m of movements) {
            console.log(`\n[${m.date}] ID ${m.id} - ${m.movement_type.toUpperCase()}`);
            console.log(`  Location: ${m.location_code}, From: ${m.from_location || 'N/A'}, To: ${m.to_location || 'N/A'}`);
            console.log(`  Bill: ${m.bill_number || 'N/A'}`);
            
            if (m.movement_type === 'production' || m.movement_type === 'purchase') {
                const key = getKey(m.location_code, m.packaging, m.bag_size);
                stock[key] = (stock[key] || 0) + m.bags;
                console.log(`  ➕ ADD: ${m.bags} bags × ${m.packaging} (${m.bag_size}kg) at ${m.location_code}`);
                console.log(`  📊 Stock at ${m.location_code} ${m.packaging} ${m.bag_size}kg: ${stock[key]} bags`);
                
            } else if (m.movement_type === 'sale') {
                const key = getKey(m.location_code, m.packaging, m.bag_size);
                stock[key] = (stock[key] || 0) - m.bags;
                console.log(`  ➖ REMOVE: ${m.bags} bags × ${m.packaging} (${m.bag_size}kg) from ${m.location_code}`);
                console.log(`  📊 Stock at ${m.location_code} ${m.packaging} ${m.bag_size}kg: ${stock[key]} bags`);
                
            } else if (m.movement_type === 'palti') {
                const sourceBags = m.source_bags || m.bags;
                const sourceKey = getKey(m.from_location || m.location_code, m.source_packaging, m.source_bag_size);
                const targetKey = getKey(m.to_location || m.location_code, m.target_packaging, m.target_bag_size);
                
                // Deduct source
                stock[sourceKey] = (stock[sourceKey] || 0) - sourceBags;
                console.log(`  ➖ SOURCE: ${sourceBags} bags × ${m.source_packaging} (${m.source_bag_size}kg) from ${m.from_location || m.location_code}`);
                console.log(`  📊 Stock at ${m.from_location || m.location_code} ${m.source_packaging} ${m.source_bag_size}kg: ${stock[sourceKey]} bags`);
                
                // Add target
                stock[targetKey] = (stock[targetKey] || 0) + m.bags;
                console.log(`  ➕ TARGET: ${m.bags} bags × ${m.target_packaging} (${m.target_bag_size}kg) to ${m.to_location || m.location_code}`);
                console.log(`  📊 Stock at ${m.to_location || m.location_code} ${m.target_packaging} ${m.target_bag_size}kg: ${stock[targetKey]} bags`);
            }
        }
        
        console.log('\n' + '='.repeat(140));
        console.log('\n📊 FINAL STOCK BY LOCATION:');
        console.log('='.repeat(140));
        
        const stockByLocation = {};
        for (const [key, bags] of Object.entries(stock)) {
            const [loc, pkg, size] = key.split('|');
            if (!stockByLocation[loc]) stockByLocation[loc] = [];
            stockByLocation[loc].push({ packaging: pkg, bagSize: size, bags });
        }
        
        for (const [loc, items] of Object.entries(stockByLocation)) {
            console.log(`\n📍 ${loc}:`);
            for (const item of items) {
                if (item.bags !== 0) {
                    console.log(`  ${item.packaging} ${item.bagSize}kg: ${item.bags} bags`);
                }
            }
        }
        
        console.log('\n' + '='.repeat(140));
        console.log('\n🔍 ANALYSIS OF THE 86 BAGS ISSUE:');
        console.log('The opening stock display shows 86 bags of MI GREEN at O2.');
        console.log('This is the TARGET of Palti ID 1 (100 mi blue → 86 mi green from O1 to O2).');
        console.log('But then Palti ID 2 used 150 bags of MI GREEN as source!');
        console.log('\n⚠️ PROBLEM: Where did the extra 64 bags come from? (150 - 86 = 64)');
        console.log('This suggests there might be missing production/purchase records at O2.');
        
        await sequelize.close();
        console.log('\n✅ Done!');
    } catch(e) {
        console.error('❌ Error:', e.message);
        console.error(e.stack);
        process.exit(1);
    }
})();
