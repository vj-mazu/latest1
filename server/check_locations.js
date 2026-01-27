const { sequelize } = require('./config/database');
const RiceStockLocation = require('./models/RiceStockLocation');

async function check() {
    try {
        const locations = await RiceStockLocation.findAll({
            attributes: ['code', 'name', 'is_direct_load'],
            raw: true
        });
        console.log(JSON.stringify(locations, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
