const { sequelize } = require('./config/database');

async function check() {
    try {
        const movements = await sequelize.query(
            `SELECT DISTINCT location_code, UPPER(location_code) as uc, LOWER(location_code) as lc FROM rice_stock_movements`,
            { type: sequelize.QueryTypes.SELECT }
        );
        console.log('Movements Location Codes:', JSON.stringify(movements, null, 2));

        const productions = await sequelize.query(
            `SELECT DISTINCT "locationCode" FROM rice_productions`,
            { type: sequelize.QueryTypes.SELECT }
        );
        console.log('Productions Location Codes:', JSON.stringify(productions, null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
