const { sequelize } = require('./config/database');

async function check() {
    try {
        const [movementsCount] = await sequelize.query(`SELECT COUNT(*) as count FROM rice_stock_movements`);
        const [productionsCount] = await sequelize.query(`SELECT COUNT(*) as count FROM rice_productions`);
        console.log(`Movements Count: ${movementsCount[0].count}`);
        console.log(`Productions Count: ${productionsCount[0].count}`);

        const sampleMovements = await sequelize.query(`SELECT * FROM rice_stock_movements LIMIT 5`, { type: sequelize.QueryTypes.SELECT });
        console.log('Sample Movements:', JSON.stringify(sampleMovements, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
