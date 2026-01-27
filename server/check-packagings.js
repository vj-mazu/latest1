const { sequelize } = require('./config/database');

async function checkPackagings() {
  try {
    const packagings = await sequelize.query(
      'SELECT id, "brandName", "allottedKg" FROM packagings ORDER BY "brandName"',
      { type: sequelize.QueryTypes.SELECT }
    );
    
    console.log('📦 Available Packagings:\n');
    packagings.forEach(p => {
      console.log(`  ID: ${p.id}, Brand: ${p.brandName}, Size: ${p.allottedKg}kg`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkPackagings();
