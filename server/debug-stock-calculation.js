const { sequelize } = require('./config/database');

(async () => {
    try {
        console.log('🔍 Checking all movements at O2 on 2026-01-29...\n');
        
        const movements = await sequelize.query(`
            SELECT 
                id,
                date,
                movement_type,
                product_type,
                variety,
                bags,
                quantity_quintals,
                location_code,
                from_location,
                to_location,
                packaging_id,
                source_packaging_id,
                target_packaging_id,
                status
            FROM rice_stock_movements
            WHERE (location_code = 'O2' OR from_location = 'O2' OR to_location = 'O2')
            AND date = '2026-01-29'
            AND product_type = 'Rice'
            ORDER BY id
        `, { type: sequelize.QueryTypes.SELECT });
        
        console.log('📦 All Rice movements involving O2 on 2026-01-29:');
        console.log(JSON.stringify(movements, null, 2));
        
        // Calculate net impact on O2
        let netBags = 0;
        movements.forEach(m => {
            if (m.movement_type === 'production' || m.movement_type === 'purchase') {
                netBags += parseInt(m.bags || 0);
            } else if (m.movement_type === 'sale') {
                netBags -= parseInt(m.bags || 0);
            } else if (m.movement_type === 'palti') {
                if (m.from_location === 'O2' || (m.location_code === 'O2' && !m.to_location)) {
                    netBags -= parseInt(m.bags || 0);
                    console.log(`  Palti OUT: -${m.bags} bags`);
                }
                if (m.to_location === 'O2') {
                    netBags += parseInt(m.bags || 0);
                    console.log(`  Palti IN: +${m.bags} bags`);
                }
            }
        });
        
        console.log(`\n📊 Net impact on O2 on 2026-01-29: ${netBags} bags`);
        
        await sequelize.close();
    } catch(e) {
        console.error('❌ Error:', e.message);
        console.error(e.stack);
        process.exit(1);
    }
})();
