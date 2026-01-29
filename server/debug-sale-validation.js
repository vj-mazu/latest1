const { sequelize } = require('./config/database');

async function debugSaleValidation() {
  try {
    console.log('🔍 Debugging Sale Validation for DIRECT_LOAD Broken Stock\n');

    const params = {
      locationCode: 'DIRECT_LOAD',
      variety: 'SUM25 RNR STEAM',
      productType: 'Broken',
      packagingBrand: 'mi premium',
      bagSizeKg: 30.00,
      saleDate: '2026-02-01'
    };

    console.log('📊 Parameters:', params);
    console.log('\n' + '='.repeat(80) + '\n');

    // 1. Check packaging resolution
    console.log('1️⃣ PACKAGING RESOLUTION:');
    const [packaging] = await sequelize.query(
      `SELECT id, "brandName", "allottedKg" FROM packagings WHERE LOWER("brandName") = LOWER(:brand)`,
      {
        replacements: { brand: params.packagingBrand },
        type: sequelize.QueryTypes.SELECT
      }
    );
    console.log('Packaging found:', packaging);
    console.log('\n' + '='.repeat(80) + '\n');

    // 2. Check all movements for this combination
    console.log('2️⃣ ALL MOVEMENTS (Broken, SUM25 RNR STEAM, mi premium 30kg):');
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
        rsm.source_bags,
        rsm.conversion_shortage_bags,
        rsm.status,
        p."brandName" as packaging_brand,
        p."allottedKg" as packaging_kg,
        sp."brandName" as source_packaging_brand,
        sp."allottedKg" as source_packaging_kg,
        tp."brandName" as target_packaging_brand,
        tp."allottedKg" as target_packaging_kg
      FROM rice_stock_movements rsm
      LEFT JOIN packagings p ON rsm.packaging_id = p.id
      LEFT JOIN packagings sp ON rsm.source_packaging_id = sp.id
      LEFT JOIN packagings tp ON rsm.target_packaging_id = tp.id
      WHERE rsm.status = 'approved'
        AND rsm.product_type = :productType
        AND (
          LOWER(TRIM(REGEXP_REPLACE(rsm.variety, '[_\\s-]+', ' ', 'g'))) = LOWER(TRIM(REGEXP_REPLACE(:variety, '[_\\s-]+', ' ', 'g')))
        )
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
      console.log(`  Bags: ${m.bags} | Source Bags: ${m.source_bags || 'N/A'} | Shortage: ${m.conversion_shortage_bags || 0}`);
      console.log(`  Packaging: ${m.packaging_brand || 'N/A'} (${m.packaging_kg || 'N/A'}kg)`);
      console.log(`  Source Pkg: ${m.source_packaging_brand || 'N/A'} (${m.source_packaging_kg || 'N/A'}kg)`);
      console.log(`  Target Pkg: ${m.target_packaging_brand || 'N/A'} (${m.target_packaging_kg || 'N/A'}kg)`);
    });
    console.log('\n' + '='.repeat(80) + '\n');

    // 3. Calculate opening stock (before sale date)
    console.log('3️⃣ OPENING STOCK CALCULATION (before 2026-02-01):');
    
    const openingStockQuery = `
      WITH stock_calculation AS (
        -- PURCHASES
        SELECT 
          'purchase' as type,
          rsm.date,
          rsm.bags as movement_bags,
          rsm.location_code
        FROM rice_stock_movements rsm
        LEFT JOIN packagings p ON rsm.packaging_id = p.id
        WHERE rsm.status = 'approved'
          AND rsm.date < :saleDate
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
        
        UNION ALL
        
        -- PALTI SOURCE (deduct source_bags + shortage)
        SELECT 
          'palti_source' as type,
          rsm.date,
          -(COALESCE(rsm.source_bags, rsm.bags) + COALESCE(rsm.conversion_shortage_bags, 0)) as movement_bags,
          rsm.location_code
        FROM rice_stock_movements rsm
        LEFT JOIN packagings sp ON rsm.source_packaging_id = sp.id
        WHERE rsm.status = 'approved'
          AND rsm.date < :saleDate
          AND rsm.movement_type = 'palti'
          AND rsm.location_code = :locationCode
          AND rsm.product_type = :productType
          AND sp."brandName" = :packagingBrand
          AND sp."allottedKg" = :bagSizeKg
          AND LOWER(TRIM(REGEXP_REPLACE(rsm.variety, '[_\\s-]+', ' ', 'g'))) = LOWER(TRIM(REGEXP_REPLACE(:variety, '[_\\s-]+', ' ', 'g')))
        
        UNION ALL
        
        -- PALTI TARGET (add target bags)
        -- CRITICAL FIX: Include same-date palti targets (date <= saleDate)
        SELECT 
          'palti_target' as type,
          rsm.date,
          rsm.bags as movement_bags,
          COALESCE(rsm.to_location, rsm.location_code) as location_code
        FROM rice_stock_movements rsm
        LEFT JOIN packagings tp ON rsm.target_packaging_id = tp.id
        WHERE rsm.status = 'approved'
          AND rsm.date <= :saleDate
          AND rsm.movement_type = 'palti'
          AND COALESCE(rsm.to_location, rsm.location_code) = :locationCode
          AND rsm.product_type = :productType
          AND tp."brandName" = :packagingBrand
          AND tp."allottedKg" = :bagSizeKg
          AND LOWER(TRIM(REGEXP_REPLACE(rsm.variety, '[_\\s-]+', ' ', 'g'))) = LOWER(TRIM(REGEXP_REPLACE(:variety, '[_\\s-]+', ' ', 'g')))
        
        UNION ALL
        
        -- PRODUCTION
        SELECT 
          'production' as type,
          rp.date,
          rp.bags as movement_bags,
          rp."locationCode" as location_code
        FROM rice_productions rp
        LEFT JOIN outturns o ON rp."outturnId" = o.id
        LEFT JOIN packagings p ON rp."packagingId" = p.id
        WHERE rp.status = 'approved'
          AND rp.date < :saleDate
          AND rp."locationCode" = :locationCode
          AND rp."productType" = :productType
          AND p."brandName" = :packagingBrand
          AND p."allottedKg" = :bagSizeKg
          AND LOWER(TRIM(REGEXP_REPLACE(o."allottedVariety" || ' ' || o.type, '[_\\s-]+', ' ', 'g'))) = LOWER(TRIM(REGEXP_REPLACE(:variety, '[_\\s-]+', ' ', 'g')))
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
    openingStockDetails.forEach(row => {
      console.log(`  ${row.date} | ${row.type.padEnd(15)} | ${String(row.movement_bags).padStart(5)} bags | Running: ${row.running_total} bags`);
    });
    
    const totalOpening = openingStockDetails.reduce((sum, row) => sum + parseInt(row.movement_bags), 0);
    console.log(`\n  📊 TOTAL OPENING STOCK: ${totalOpening} bags`);
    console.log('\n' + '='.repeat(80) + '\n');

    // 4. Check palti operations ON the sale date
    console.log('4️⃣ PALTI OPERATIONS ON SALE DATE (2026-02-01):');
    
    const paltiOnDateQuery = `
      SELECT 
        rsm.id,
        rsm.date,
        rsm.source_bags,
        rsm.bags as target_bags,
        rsm.conversion_shortage_bags,
        (COALESCE(rsm.source_bags, rsm.bags) + COALESCE(rsm.conversion_shortage_bags, 0)) as total_deduction,
        sp."brandName" as source_packaging,
        sp."allottedKg" as source_kg,
        tp."brandName" as target_packaging,
        tp."allottedKg" as target_kg
      FROM rice_stock_movements rsm
      LEFT JOIN packagings sp ON rsm.source_packaging_id = sp.id
      LEFT JOIN packagings tp ON rsm.target_packaging_id = tp.id
      WHERE rsm.status = 'approved'
        AND rsm.date = :saleDate
        AND rsm.movement_type = 'palti'
        AND rsm.location_code = :locationCode
        AND rsm.product_type = :productType
        AND sp."brandName" = :packagingBrand
        AND sp."allottedKg" = :bagSizeKg
        AND LOWER(TRIM(REGEXP_REPLACE(rsm.variety, '[_\\s-]+', ' ', 'g'))) = LOWER(TRIM(REGEXP_REPLACE(:variety, '[_\\s-]+', ' ', 'g')))
    `;
    
    const paltiOnDate = await sequelize.query(paltiOnDateQuery, {
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
    
    if (paltiOnDate.length > 0) {
      console.log(`Found ${paltiOnDate.length} palti operation(s):`);
      paltiOnDate.forEach(p => {
        console.log(`\n  ID: ${p.id}`);
        console.log(`  Source Bags: ${p.source_bags}`);
        console.log(`  Target Bags: ${p.target_bags}`);
        console.log(`  Shortage: ${p.conversion_shortage_bags || 0}`);
        console.log(`  Total Deduction: ${p.total_deduction}`);
        console.log(`  Source Pkg: ${p.source_packaging} (${p.source_kg}kg)`);
        console.log(`  Target Pkg: ${p.target_packaging} (${p.target_kg}kg)`);
      });
      
      const totalPaltiDeduction = paltiOnDate.reduce((sum, p) => sum + parseInt(p.total_deduction), 0);
      console.log(`\n  📊 TOTAL PALTI DEDUCTION: ${totalPaltiDeduction} bags`);
    } else {
      console.log('No palti operations found on this date');
    }
    
    console.log('\n' + '='.repeat(80) + '\n');

    // 5. Final calculation
    console.log('5️⃣ FINAL VALIDATION:');
    const paltiDeduction = paltiOnDate.reduce((sum, p) => sum + parseInt(p.total_deduction || 0), 0);
    const remainingStock = totalOpening - paltiDeduction;
    const requestedBags = 1;
    
    console.log(`  Opening Stock: ${totalOpening} bags`);
    console.log(`  Palti Deduction (same date): ${paltiDeduction} bags`);
    console.log(`  Remaining Stock: ${remainingStock} bags`);
    console.log(`  Requested: ${requestedBags} bags`);
    console.log(`  \n  ${remainingStock >= requestedBags ? '✅ VALIDATION PASSED' : '❌ VALIDATION FAILED'}`);
    
    if (remainingStock < requestedBags) {
      console.log(`  Shortfall: ${requestedBags - remainingStock} bags`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sequelize.close();
  }
}

debugSaleValidation();
