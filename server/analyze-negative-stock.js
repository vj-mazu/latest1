/**
 * SAFE Analysis Script: Find Negative Stock Issues
 * 
 * This script ONLY analyzes and reports - it does NOT make any changes
 * 
 * Purpose: Identify historical data where stock went negative due to
 * palti and sale operations using the same stock before validation was added
 */

const { sequelize } = require('./config/database');

async function analyzeNegativeStock() {
  console.log('🔍 Analyzing Stock for Negative Balances\n');
  console.log('=' .repeat(80));
  console.log('⚠️  SAFE MODE: This script will ONLY analyze and report');
  console.log('⚠️  NO changes will be made to the database');
  console.log('=' .repeat(80));
  
  try {
    // Find all dates with movements
    const dates = await sequelize.query(`
      SELECT DISTINCT date 
      FROM rice_stock_movements 
      WHERE status = 'approved'
      ORDER BY date DESC
      LIMIT 30
    `, { type: sequelize.QueryTypes.SELECT });
    
    console.log(`\n📅 Analyzing last ${dates.length} dates with movements...\n`);
    
    const issues = [];
    
    for (const { date } of dates) {
      // Calculate stock for each group on this date
      const stockByGroup = await sequelize.query(`
        WITH stock_calculation AS (
          -- PURCHASES (before this date)
          SELECT 
            location_code,
            variety,
            product_type,
            packaging_id,
            SUM(bags) as movement_bags
          FROM rice_stock_movements
          WHERE status = 'approved'
            AND date < :date
            AND movement_type = 'purchase'
          GROUP BY location_code, variety, product_type, packaging_id
          
          UNION ALL
          
          -- SALES (before this date)
          SELECT 
            location_code,
            variety,
            product_type,
            packaging_id,
            SUM(-bags) as movement_bags
          FROM rice_stock_movements
          WHERE status = 'approved'
            AND date < :date
            AND movement_type = 'sale'
          GROUP BY location_code, variety, product_type, packaging_id
          
          UNION ALL
          
          -- PALTI SOURCE (before this date)
          SELECT 
            location_code,
            variety,
            product_type,
            source_packaging_id as packaging_id,
            SUM(-(COALESCE(source_bags, bags) + COALESCE(conversion_shortage_bags, 0))) as movement_bags
          FROM rice_stock_movements
          WHERE status = 'approved'
            AND date < :date
            AND movement_type = 'palti'
            AND source_packaging_id IS NOT NULL
          GROUP BY location_code, variety, product_type, source_packaging_id
          
          UNION ALL
          
          -- PALTI TARGET (before this date)
          SELECT 
            COALESCE(to_location, location_code) as location_code,
            variety,
            product_type,
            target_packaging_id as packaging_id,
            SUM(bags) as movement_bags
          FROM rice_stock_movements
          WHERE status = 'approved'
            AND date < :date
            AND movement_type = 'palti'
            AND target_packaging_id IS NOT NULL
          GROUP BY COALESCE(to_location, location_code), variety, product_type, target_packaging_id
          
          UNION ALL
          
          -- PRODUCTION (before this date)
          SELECT 
            rp."locationCode" as location_code,
            UPPER(o."allottedVariety" || ' ' || o.type) as variety,
            rp."productType" as product_type,
            rp."packagingId" as packaging_id,
            SUM(rp.bags) as movement_bags
          FROM rice_productions rp
          LEFT JOIN outturns o ON rp."outturnId" = o.id
          WHERE rp.status = 'approved'
            AND rp.date < :date
          GROUP BY rp."locationCode", o."allottedVariety", o.type, rp."productType", rp."packagingId"
        )
        SELECT 
          location_code,
          variety,
          product_type,
          packaging_id,
          SUM(movement_bags) as opening_stock
        FROM stock_calculation
        GROUP BY location_code, variety, product_type, packaging_id
      `, {
        replacements: { date },
        type: sequelize.QueryTypes.SELECT
      });
      
      // Get operations ON this date
      const operationsOnDate = await sequelize.query(`
        SELECT 
          id,
          date,
          movement_type,
          location_code,
          variety,
          product_type,
          packaging_id,
          source_packaging_id,
          target_packaging_id,
          bags,
          source_bags,
          conversion_shortage_bags
        FROM rice_stock_movements
        WHERE status = 'approved'
          AND date = :date
        ORDER BY created_at
      `, {
        replacements: { date },
        type: sequelize.QueryTypes.SELECT
      });
      
      // Check for negative stock after each operation
      for (const op of operationsOnDate) {
        if (op.movement_type === 'sale' || op.movement_type === 'palti') {
          const groupKey = `${op.location_code}|${op.variety}|${op.product_type}|${op.packaging_id || op.source_packaging_id}`;
          
          const opening = stockByGroup.find(s => 
            s.location_code === op.location_code &&
            s.variety === op.variety &&
            s.product_type === op.product_type &&
            s.packaging_id === (op.packaging_id || op.source_packaging_id)
          );
          
          const openingStock = opening ? parseInt(opening.opening_stock) : 0;
          
          // Calculate palti deductions before this operation
          const paltiDeductions = operationsOnDate
            .filter(o => 
              o.id < op.id &&
              o.movement_type === 'palti' &&
              o.location_code === op.location_code &&
              o.variety === op.variety &&
              o.product_type === op.product_type &&
              o.source_packaging_id === (op.packaging_id || op.source_packaging_id)
            )
            .reduce((sum, o) => sum + parseInt(o.source_bags || o.bags) + parseInt(o.conversion_shortage_bags || 0), 0);
          
          const remainingStock = openingStock - paltiDeductions;
          const requestedBags = op.movement_type === 'sale' 
            ? parseInt(op.bags)
            : parseInt(op.source_bags || op.bags) + parseInt(op.conversion_shortage_bags || 0);
          
          if (remainingStock < requestedBags) {
            issues.push({
              date: op.date,
              id: op.id,
              type: op.movement_type,
              location: op.location_code,
              variety: op.variety,
              productType: op.product_type,
              packagingId: op.packaging_id || op.source_packaging_id,
              openingStock,
              paltiDeductions,
              remainingStock,
              requestedBags,
              shortfall: requestedBags - remainingStock,
              groupKey
            });
          }
        }
      }
    }
    
    console.log('\n' + '='.repeat(80));
    console.log(`\n📊 ANALYSIS RESULTS: Found ${issues.length} operations with insufficient stock\n`);
    
    if (issues.length === 0) {
      console.log('✅ No negative stock issues found!');
      console.log('✅ All historical data is consistent');
    } else {
      console.log('⚠️  Issues found (these were created before validation was added):\n');
      
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.type.toUpperCase()} on ${issue.date}`);
        console.log(`   ID: ${issue.id}`);
        console.log(`   Location: ${issue.location}`);
        console.log(`   Variety: ${issue.variety}`);
        console.log(`   Product Type: ${issue.productType}`);
        console.log(`   Opening Stock: ${issue.openingStock} bags`);
        console.log(`   Palti Deductions: ${issue.paltiDeductions} bags`);
        console.log(`   Remaining: ${issue.remainingStock} bags`);
        console.log(`   Requested: ${issue.requestedBags} bags`);
        console.log(`   Shortfall: ${issue.shortfall} bags ❌`);
        console.log(`   Group: ${issue.groupKey}`);
        console.log('');
      });
      
      console.log('=' .repeat(80));
      console.log('\n💡 RECOMMENDATIONS:\n');
      console.log('These operations were created before validation was added.');
      console.log('Options to fix:');
      console.log('  1. Delete the problematic operations (safest)');
      console.log('  2. Adjust the quantities to match available stock');
      console.log('  3. Leave as-is (validation will prevent new issues)');
      console.log('\n⚠️  Contact administrator before making any changes');
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('\n✅ Analysis complete - NO changes were made\n');
    
  } catch (error) {
    console.error('\n❌ Analysis failed:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

// Run analysis
analyzeNegativeStock();
