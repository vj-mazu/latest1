const { sequelize } = require('./config/database');

(async () => {
    try {
        console.log('🔍 Checking ALL sources of stock (productions + movements)...\n');
        
        // Check productions
        console.log('📦 Rice Productions for SUM25 RNR STEAM:');
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
            WHERE rp.status = 'approved'
            AND o."allottedVariety" LIKE '%SUM25%RNR%'
            AND o.type = 'Steam'
            AND rp."productType" = 'Rice'
            AND rp.date <= '2026-01-29'
            ORDER BY rp.date ASC, rp.id ASC
        `, { 
            type: sequelize.QueryTypes.SELECT 
        });
        
        console.log(`Found ${productions.length} productions:`);
        console.log(JSON.stringify(productions, null, 2));
        
        // Calculate complete stock including productions
        console.log('\n\n📊 COMPLETE STOCK CALCULATION (Productions + Movements):');
        console.log('='.repeat(140));
        
        const stock = {};
        const getKey = (loc, pkg, size) => `${loc}|${pkg}|${size}`;
        
        // Add productions
        console.log('\n1️⃣ PRODUCTIONS:');
        for (const prod of productions) {
            const key = getKey(prod.locationCode, prod.brandName, prod.allottedKg);
            stock[key] = (stock[key] || 0) + prod.bags;
            console.log(`  [${prod.date}] +${prod.bags} bags × ${prod.brandName} (${prod.allottedKg}kg) at ${prod.locationCode}`);
            console.log(`    Running total: ${stock[key]} bags`);
        }
        
        // Add movements
        console.log('\n2️⃣ MOVEMENTS:');
        const movements = await sequelize.query(`
            SELECT 
                rsm.id,
                rsm.date,
                rsm.movement_type,
                rsm.location_code,
                rsm.from_location,
                rsm.to_location,
                rsm.bags,
                rsm.source_bags,
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
        
        for (const m of movements) {
            if (m.movement_type === 'purchase') {
                const key = getKey(m.location_code, m.packaging, m.bag_size);
                stock[key] = (stock[key] || 0) + m.bags;
                console.log(`  [${m.date}] PURCHASE: +${m.bags} bags × ${m.packaging} (${m.bag_size}kg) at ${m.location_code}`);
                console.log(`    Running total: ${stock[key]} bags`);
                
            } else if (m.movement_type === 'sale') {
                const key = getKey(m.location_code, m.packaging, m.bag_size);
                const before = stock[key] || 0;
                stock[key] = before - m.bags;
                console.log(`  [${m.date}] SALE: -${m.bags} bags × ${m.packaging} (${m.bag_size}kg) from ${m.location_code}`);
                console.log(`    Before: ${before} bags, After: ${stock[key]} bags ${stock[key] < 0 ? '⚠️ NEGATIVE!' : ''}`);
                
            } else if (m.movement_type === 'palti') {
                const sourceBags = m.source_bags || m.bags;
                const sourceKey = getKey(m.from_location || m.location_code, m.source_packaging, m.source_bag_size);
                const targetKey = getKey(m.to_location || m.location_code, m.target_packaging, m.target_bag_size);
                
                const sourceBefore = stock[sourceKey] || 0;
                stock[sourceKey] = sourceBefore - sourceBags;
                console.log(`  [${m.date}] PALTI SOURCE: -${sourceBags} bags × ${m.source_packaging} (${m.source_bag_size}kg) from ${m.from_location || m.location_code}`);
                console.log(`    Before: ${sourceBefore} bags, After: ${stock[sourceKey]} bags ${stock[sourceKey] < 0 ? '⚠️ NEGATIVE!' : ''}`);
                
                const targetBefore = stock[targetKey] || 0;
                stock[targetKey] = targetBefore + m.bags;
                console.log(`  [${m.date}] PALTI TARGET: +${m.bags} bags × ${m.target_packaging} (${m.target_bag_size}kg) to ${m.to_location || m.location_code}`);
                console.log(`    Before: ${targetBefore} bags, After: ${stock[targetKey]} bags`);
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
                const status = item.bags < 0 ? '⚠️ NEGATIVE STOCK!' : item.bags === 0 ? '(zero)' : '✅';
                console.log(`  ${item.packaging} ${item.bagSize}kg: ${item.bags} bags ${status}`);
            }
        }
        
        console.log('\n' + '='.repeat(140));
        console.log('\n🔍 ROOT CAUSE ANALYSIS:');
        console.log('='.repeat(140));
        
        // Check if Palti ID 2 should have been blocked
        const palti2 = movements.find(m => m.id === 2);
        if (palti2) {
            const sourceKey = getKey('O2', 'mi green', '30.00');
            console.log('\n⚠️ PALTI ID 2 VALIDATION FAILURE:');
            console.log(`  Date: ${palti2.date}`);
            console.log(`  Requested: ${palti2.source_bags || palti2.bags} bags of mi green 30kg from O2`);
            console.log(`  Available before palti: ${stock[sourceKey] + (palti2.source_bags || palti2.bags)} bags`);
            console.log(`  Should have been: ${(stock[sourceKey] + (palti2.source_bags || palti2.bags)) >= (palti2.source_bags || palti2.bags) ? '✅ ALLOWED' : '❌ BLOCKED'}`);
            console.log(`  Actual result: ✅ ALLOWED (validation failed!)`);
        }
        
        await sequelize.close();
        console.log('\n✅ Done!');
    } catch(e) {
        console.error('❌ Error:', e.message);
        console.error(e.stack);
        process.exit(1);
    }
})();
