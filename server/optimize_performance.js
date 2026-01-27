const { sequelize } = require('./config/database');

async function optimizePerformance() {
  try {
    console.log('🚀 Starting performance optimization for 10 lakh records...');

    // Create indexes for rice_stock_movements table
    console.log('📊 Creating indexes for rice_stock_movements...');

    const indexes = [
      // Date-based indexes for fast filtering
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rice_stock_movements_date ON rice_stock_movements(date DESC);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rice_stock_movements_year_month ON rice_stock_movements(EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date));',

      // Status and movement type indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rice_stock_movements_status ON rice_stock_movements(status);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rice_stock_movements_movement_type ON rice_stock_movements(movement_type);',

      // Composite indexes for common queries
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rice_stock_movements_date_status ON rice_stock_movements(date DESC, status);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rice_stock_movements_status_movement_type ON rice_stock_movements(status, movement_type);',

      // Location and product type indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rice_stock_movements_location ON rice_stock_movements(location_code);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rice_stock_movements_product_type ON rice_stock_movements(product_type);',

      // Foreign key indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rice_stock_movements_packaging_id ON rice_stock_movements(packaging_id);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rice_stock_movements_source_packaging_id ON rice_stock_movements(source_packaging_id);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rice_stock_movements_target_packaging_id ON rice_stock_movements(target_packaging_id);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rice_stock_movements_created_by ON rice_stock_movements(created_by);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rice_stock_movements_approved_by ON rice_stock_movements(approved_by);'
    ];

    for (const indexQuery of indexes) {
      try {
        await sequelize.query(indexQuery);
        console.log('✅ Created index:', indexQuery.split(' ')[5]);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('⚠️ Index already exists:', indexQuery.split(' ')[5]);
        } else {
          console.error('❌ Error creating index:', error.message);
        }
      }
    }

    // Create indexes for rice_productions table
    console.log('📊 Creating indexes for rice_productions...');

    // ====== CRITICAL: ARRIVALS TABLE INDEXES FOR 10 LAKH RECORDS ======
    console.log('📊 Creating indexes for arrivals table (CRITICAL for 10 lakh records)...');

    const arrivalsIndexes = [
      // Primary date index - most queries filter by date
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_arrivals_date ON arrivals(date DESC);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_arrivals_year_month ON arrivals(EXTRACT(YEAR FROM date), EXTRACT(MONTH FROM date));',

      // Status indexes - frequently filtered
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_arrivals_status ON arrivals(status);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_arrivals_admin_approved ON arrivals("adminApprovedBy");',

      // Movement type index
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_arrivals_movement_type ON arrivals("movementType");',

      // Variety index (normalized for UPPER/TRIM queries)
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_arrivals_variety ON arrivals(variety);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_arrivals_variety_upper ON arrivals(UPPER(TRIM(variety)));',

      // Location foreign key indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_arrivals_to_kunchinittu ON arrivals("toKunchinintuId");',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_arrivals_from_kunchinittu ON arrivals("fromKunchinintuId");',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_arrivals_to_warehouse ON arrivals("toWarehouseId");',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_arrivals_from_warehouse ON arrivals("fromWarehouseId");',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_arrivals_to_warehouse_shift ON arrivals("toWarehouseShiftId");',

      // Outturn index for production tracking
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_arrivals_outturn ON arrivals("outturnId");',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_arrivals_from_outturn ON arrivals("fromOutturnId");',

      // User tracking indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_arrivals_created_by ON arrivals("createdBy");',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_arrivals_approved_by ON arrivals("approvedBy");',

      // ====== COMPOSITE INDEXES FOR COMMON QUERY PATTERNS ======
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_arrivals_date_status ON arrivals(date DESC, status);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_arrivals_movement_status_date ON arrivals("movementType", status, date DESC);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_arrivals_kunchinittu_date ON arrivals("toKunchinintuId", date DESC);',

      // ====== PARTIAL INDEXES FOR PENDING/APPROVED STATUS ======
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_arrivals_pending ON arrivals(date DESC, "createdBy") WHERE status = \'pending\';',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_arrivals_approved ON arrivals(date DESC) WHERE status = \'approved\' AND "adminApprovedBy" IS NOT NULL;',

      // ====== TEXT SEARCH INDEXES ======
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_arrivals_sl_no ON arrivals("slNo");',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_arrivals_wb_no ON arrivals("wbNo");',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_arrivals_lorry_number ON arrivals("lorryNumber");',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_arrivals_broker ON arrivals(broker);'
    ];

    for (const indexQuery of arrivalsIndexes) {
      try {
        await sequelize.query(indexQuery);
        console.log('✅ Created arrivals index:', indexQuery.split(' ')[5]);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('⚠️ Arrivals index already exists:', indexQuery.split(' ')[5]);
        } else {
          console.error('❌ Error creating arrivals index:', error.message);
        }
      }
    }


    const riceProductionIndexes = [
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rice_productions_date ON rice_productions(date DESC);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rice_productions_status ON rice_productions(status);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rice_productions_outturn_id ON rice_productions("outturnId");',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rice_productions_packaging_id ON rice_productions("packagingId");',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rice_productions_product_type ON rice_productions("productType");',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rice_productions_date_status ON rice_productions(date DESC, status);'
    ];

    for (const indexQuery of riceProductionIndexes) {
      try {
        await sequelize.query(indexQuery);
        console.log('✅ Created index:', indexQuery.split(' ')[5]);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('⚠️ Index already exists:', indexQuery.split(' ')[5]);
        } else {
          console.error('❌ Error creating index:', error.message);
        }
      }
    }

    // Create indexes for rice_hamali_entries table
    console.log('📊 Creating indexes for rice_hamali_entries...');

    const hamaliIndexes = [
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rice_hamali_entries_rice_production_id ON rice_hamali_entries(rice_production_id);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rice_hamali_entries_rice_stock_movement_id ON rice_hamali_entries(rice_stock_movement_id);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rice_hamali_entries_is_active ON rice_hamali_entries(is_active);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rice_hamali_entries_created_at ON rice_hamali_entries(created_at DESC);',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_rice_hamali_entries_entry_type ON rice_hamali_entries(entry_type);'
    ];

    for (const indexQuery of hamaliIndexes) {
      try {
        await sequelize.query(indexQuery);
        console.log('✅ Created index:', indexQuery.split(' ')[5]);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('⚠️ Index already exists:', indexQuery.split(' ')[5]);
        } else {
          console.error('❌ Error creating index:', error.message);
        }
      }
    }

    // Analyze tables for better query planning
    console.log('📊 Analyzing tables for better query planning...');

    const analyzeTables = [
      'ANALYZE rice_stock_movements;',
      'ANALYZE rice_productions;',
      'ANALYZE rice_hamali_entries;',
      'ANALYZE packagings;',
      'ANALYZE outturns;',
      'ANALYZE users;'
    ];

    for (const analyzeQuery of analyzeTables) {
      try {
        await sequelize.query(analyzeQuery);
        console.log('✅ Analyzed table:', analyzeQuery.split(' ')[1].replace(';', ''));
      } catch (error) {
        console.error('❌ Error analyzing table:', error.message);
      }
    }

    // Check table sizes
    console.log('📊 Checking table sizes...');

    const [tableSizes] = await sequelize.query(`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
        pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename IN ('rice_stock_movements', 'rice_productions', 'rice_hamali_entries', 'arrivals')
      ORDER BY size_bytes DESC;
    `);

    console.log('📊 Table sizes:');
    tableSizes.forEach(table => {
      console.log(`  ${table.tablename}: ${table.size}`);
    });

    // Performance recommendations
    console.log('\n🚀 Performance optimization complete!');
    console.log('📋 Recommendations for 10 lakh records:');
    console.log('  1. Use pagination with limit 250-500 records per page');
    console.log('  2. Always filter by date ranges (month/year)');
    console.log('  3. Use status filters to reduce result sets');
    console.log('  4. Consider archiving old data (>1 year)');
    console.log('  5. Monitor query performance with EXPLAIN ANALYZE');

  } catch (error) {
    console.error('❌ Error optimizing performance:', error);
  } finally {
    await sequelize.close();
  }
}

optimizePerformance();