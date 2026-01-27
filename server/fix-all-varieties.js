const { sequelize } = require('./config/database');

(async () => {
    try {
        console.log('🔧 Fixing ALL variety names to match productions...\n');
        
        // Find all movements with "Raw" that should be "Steam"
        const wrongVarieties = await sequelize.query(`
            SELECT DISTINCT variety, COUNT(*) as count
            FROM rice_stock_movements
            WHERE variety LIKE '%Raw%'
            AND variety LIKE '%SUM25 RNR%'
            GROUP BY variety
        `, { type: sequelize.QueryTypes.SELECT });
        
        console.log('📦 Found movements with "Raw" variety:');
        console.log(JSON.stringify(wrongVarieties, null, 2));
        
        // Update all "Sum25 RNR Raw" to "SUM25 RNR STEAM"
        const result = await sequelize.query(`
            UPDATE rice_stock_movements
            SET variety = 'SUM25 RNR STEAM'
            WHERE variety LIKE '%Sum25 RNR Raw%'
            OR variety LIKE '%SUM25 RNR RAW%'
        `, { type: sequelize.QueryTypes.UPDATE });
        
        console.log(`\n✅ Updated ${result[1]} records from "Raw" to "STEAM"`);
        
        // Verify
        const verification = await sequelize.query(`
            SELECT DISTINCT variety, COUNT(*) as count
            FROM rice_stock_movements
            WHERE variety LIKE '%SUM25 RNR%'
            GROUP BY variety
        `, { type: sequelize.QueryTypes.SELECT });
        
        console.log('\n📊 All SUM25 RNR varieties after fix:');
        console.log(JSON.stringify(verification, null, 2));
        
        await sequelize.close();
        console.log('\n✅ Done!');
    } catch(e) {
        console.error('❌ Error:', e.message);
        console.error(e.stack);
        process.exit(1);
    }
})();
