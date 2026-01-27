const { sequelize } = require('./config/database');

(async () => {
    try {
        console.log('🔍 Tracing where 86 bags comes from...\n');
        
        // Get ALL movements for SUM25 RNR STEAM Rice at O2 with MI GREEN packaging
        console.log('📦 All movements for SUM25 RNR STEAM Rice at O2 (MI GREEN 30kg):');
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
            AND rsm.location_code = 'O2'
            AND rsm.date <= '2026-01-29'
            ORDER BY rsm.date ASC, rsm.id ASC
        `, { 
            type: sequelize.QueryTypes.SELECT 
        });
        
        console.log(`Found ${movements.length} movements:`);
        
        let runningBalance = {
            'mi green 30': 0,
            'mi blue 26': 0
        };
        
        console.log('\n📊 Running balance calculation:');
        console.log('='.repeat(120));
        
        for (const m of movements) {
            const key = `${m.packaging || m.target_packaging} ${m.bag_size || m.target_bag_size}`;
            const sourceKey = `${m.source_packaging} ${m.source_bag_size}`;
            
            let impact = '';
            let bagsChange = 0;
            
            if (m.movement_type === 'production' || m.movement_type === 'purchase') {
                bagsChange = m.bags;
                runningBalance[key] = (runningBalance[key] || 0) + m.bags;
                impact = `+${m.bags} bags (${key})`;
            } else if (m.movement_type === 'sale') {
                bagsChange = -m.bags;
                runningBalance[key] = (runningBalance[key] || 0) - m.bags;
                impact = `-${m.bags} bags (${key})`;
            } else if (m.movement_type === 'palti') {
                // Palti: deduct source, add target
                const sourceBags = m.source_bags || m.bags;
                
                // Deduct from source packaging
                runningBalance[sourceKey] = (runningBalance[sourceKey] || 0) - sourceBags;
                
                // Add to target packaging
                runningBalance[key] = (runningBalance[key] || 0) + m.bags;
                
                impact = `Palti: -${sourceBags} ${sourceKey} → +${m.bags} ${key}`;
            }
            
            console.log(`\n[${m.date}] ID ${m.id} - ${m.movement_type.toUpperCase()}`);
            console.log(`  ${impact}`);
            console.log(`  Bill: ${m.bill_number || 'N/A'}`);
            console.log(`  Balance: mi green 30 = ${runningBalance['mi green 30'] || 0} bags, mi blue 26 = ${runningBalance['mi blue 26'] || 0} bags`);
        }
        
        console.log('\n' + '='.repeat(120));
        console.log('\n📊 Final Balance:');
        console.log(JSON.stringify(runningBalance, null, 2));
        
        // Now check: where does 86 come from in the opening stock display?
        console.log('\n\n🔍 Checking opening stock calculation logic...');
        console.log('The 86 bags shown in opening stock might be:');
        console.log('1. A palti TARGET (86 bags received from O1)');
        console.log('2. Incorrectly showing target bags instead of source bags');
        
        // Check the palti from O1 to O2
        const paltiFromO1 = movements.find(m => m.from_location === 'O1' && m.to_location === 'O2');
        if (paltiFromO1) {
            console.log('\n✅ Found Palti from O1 to O2:');
            console.log(`  Source: ${paltiFromO1.source_bags} bags × ${paltiFromO1.source_packaging} (${paltiFromO1.source_bag_size}kg)`);
            console.log(`  Target: ${paltiFromO1.bags} bags × ${paltiFromO1.target_packaging} (${paltiFromO1.target_bag_size}kg)`);
            console.log(`\n  ⚠️ The 86 bags is the TARGET of this palti!`);
            console.log(`  ⚠️ This should be shown as INCOMING stock, not as source for another palti!`);
        }
        
        await sequelize.close();
        console.log('\n✅ Done!');
    } catch(e) {
        console.error('❌ Error:', e.message);
        console.error(e.stack);
        process.exit(1);
    }
})();
