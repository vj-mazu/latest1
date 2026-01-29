const { sequelize } = require('./config/database');

async function debugBranSaleValidation() {
  try {
    console.log('🔍 Debugging Bran Sale Validation for DIRECT_LOAD\n');

    const params = {
      locationCode: 'DIRECT_LOAD',
      variety: 'SUM25 RNR STEAM',
      productType: 'Bran',
      packagingBrand: 'mi premium',
      bagSizeKg: 30.00,
      saleDate: '2026-01-29'
    };

    console.log('📊 Parameters:', params);
    console.log('\n' + '='.repeat(80) + '\n');

    // 1. Check all Bran movements
    console.log('1️⃣ ALL BRAN MOVEMENTS (SUM25 RNR STEAM, mi premium 30kg):');
    const movements = await sequelize.query(
      `SELECT 
        rsm.id,
        rsm.date,
        rsm.movement_type,
        rsm.variety,
        rsm.product_type,
        rsm.location_code,
        rsm.to_location,
        rsm.bags,
        rsm.status,
        p."brandName" as packaging_brand,
        p."allottedKg" as packaging_kg
      FROM rice_stock_movements rsm
      LEFT JOIN packagings p ON rsm.packaging_id = p.id
      WHERE rsm.status = 'approved'
        AND rsm.product_type = :productType
        AND LOWER(TRIM(REGEXP_REPLACE(rsm.variety, '[_\\s-]+', ' ', 'g'))) = LOWER(TRIM(REGEXP_REPLACE(:variety, '[_\\s-]+', ' ', 'g')))
      ORDER BY rsm.date, rsm.id`,
      {
        replacements: {
          productType: params.productType,
          variety: params.variety
        },
        type: sequelize.QueryTypes.SELECT
      }
    );
    
    console.log(`Found ${movements.length} movements:`);
    movements.forEach(m => {
      console.log(`\n  ID: ${m.id} | Date: ${m.date} | Type: ${m.movement_type}`);
      console.log(`  Location: ${m.location_code} → ${m.to_location || 'N/A'}`);
      console.log(`  Variety: ${m.variety}`);
      console.log(`  Bags: ${m.bags}`);
      console.log(`  Packaging: ${m.packaging_brand || 'N/A'} (${m.packaging_kg || 'N/A'}kg)`);
    });
    console.log('\n' + '='.repeat(80) + '\n');

    // 2. Calculate opening stock (WITH FIX: date <= saleDate for purchases)
    console.log('2️⃣ OPENING STOCK CALCULATION (WITH FIX - date <= 2026-01-29):');
    
    const openingStockQuery = `
      WITH stock_calculation AS (
        -- PURCHASES (FIXED: date <= saleDate)
        SELECT 
          'purchase' as type,
          rsm.date,
          rsm.bags as movement_bags,
          rsm.location_code
        FROM rice_stock_movements rsm
        LEFT JOIN packagings p ON rsm.packaging_id = p.id
        WHERE rsm.status = 'approved'
          AND rsm.date <= :saleDate
          AND rsm.movement_type = 'purchase'
          AND rsm.location_code = :locationCode
          AND rsm.product_type = :productType
          AND p."brandName" = :packagingBrand
          AND p."allottedKg" = :bagSizeKg
          AND LOWER(TRIM(REGEXP_REPLACE(rsm.variety, '[_\\s-]+', ' ', 'g'))) = LOWER(TRIM(REGEXP_REPLACE(:variety, '[_\\s-]+', ' ', 'g')))
        
        UNION ALL
        
        -- SALES
        SELECT 
          'sale' as type,
          rsm.date,
          -rsm.bags as movement_bags,
          rsm.location_code
        FROM rice_stock_movements rsm
        LEFT JOIN packagings p ON rsm.packaging_id = p.id
        WHERE rsm.status = 'approved'
          AND rsm.date < :saleDate
          AND rsm.movement_type = 'sale'
          AND rsm.location_code = :locationCode
          AND rsm.product_type = :productType
          AND p."brandName" = :packagingBrand
          AND p."allottedKg" = :bagSizeKg
          AND LOWER(TRIM(REGEXP_REPLACE(rsm.variety, '[_\\s-]+', ' ', 'g'))) = LOWER(TRIM(REGEXP_REPLACE(:variety, '[_\\s-]+', ' ', 'g')))
      )
      SELECT 
        type,
        date,
        movement_bags,
        location_code,
        SUM(movement_bags) OVER (ORDER BY date, type) as running_total
      FROM stock_calculation
      ORDER BY date, type
    `;
    
    const openingStockDetails = await sequelize.query(openingStockQuery, {
      replacements: {
        saleDate: params.saleDate,
        locationCode: params.locationCode,
        productType: params.productType,
        packagingBrand: params.packagingBrand,
        bagSizeKg: params.bagSizeKg,
        variety: params.variety
      },
      type: sequelize.QueryTypes.SELECT
    });
    
    console.log('Opening stock movements:');
    if (openingStockDetails.length > 0) {
      openingStockDetails.forEach(row => {
        console.log(`  ${row.date} | ${row.type.padEnd(15)} | ${String(row.movement_bags).padStart(5)} bags | Running: ${row.running_total} bags`);
      });
      
      const totalOpening = openingStockDetails.reduce((sum, row) => sum + parseInt(row.movement_bags), 0);
      console.log(`\n  📊 TOTAL OPENING STOCK: ${totalOpening} bags`);
    } else {
      console.log('  No movements found');
      console.log(`\n  📊 TOTAL OPENING STOCK: 0 bags`);
    }
    
    console.log('\n' + '='.repeat(80) + '\n');

    // 3. Final validation
    console.log('3️⃣ FINAL VALIDATION:');
    const totalOpening = openingStockDetails.reduce((sum, row) => sum + parseInt(row.movement_bags || 0), 0);
    const requestedBags = 100;
    
    console.log(`  Opening Stock: ${totalOpening} bags`);
    console.log(`  Requested: ${requestedBags} bags`);
    console.log(`  \n  ${totalOpening >= requestedBags ? '✅ VALIDATION PASSED' : '❌ VALIDATION FAILED'}`);
    
    if (totalOpening < requestedBags) {
      console.log(`  Shortfall: ${requestedBags - totalOpening} bags`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

debugBranSaleValidation();
