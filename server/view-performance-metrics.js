/**
 * View Performance Metrics
 * Simple script to fetch and display performance data
 */

const { sequelize } = require('./config/database');

async function viewPerformanceMetrics() {
  try {
    console.log('\n🔍 FETCHING PERFORMANCE METRICS...\n');
    console.log('=' .repeat(80));

    // Check if performance_metrics table exists
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'performance_metrics'
    `);

    if (tables.length === 0) {
      console.log('⚠️  Performance metrics table not found.');
      console.log('💡 Run the server first to create the table automatically.');
      process.exit(0);
    }

    // Get total request count
    const [totalCount] = await sequelize.query(`
      SELECT COUNT(*) as total FROM performance_metrics
    `);
    console.log(`\n📊 TOTAL REQUESTS TRACKED: ${totalCount[0].total}\n`);

    if (totalCount[0].total === 0) {
      console.log('⚠️  No performance data collected yet.');
      console.log('💡 Make some API requests to see metrics here.');
      process.exit(0);
    }

    // Get summary metrics (last hour)
    console.log('📈 SUMMARY METRICS (Last Hour)');
    console.log('-'.repeat(80));
    
    const [summary] = await sequelize.query(`
      SELECT 
        COUNT(*) as total_requests,
        ROUND(AVG(duration_ms)::numeric, 2) as avg_response_time,
        MIN(duration_ms) as min_response_time,
        MAX(duration_ms) as max_response_time,
        ROUND((SUM(CASE WHEN cache_hit = true THEN 1 ELSE 0 END)::numeric * 100.0 / COUNT(*))::numeric, 2) as cache_hit_rate,
        SUM(CASE WHEN duration_ms > 100 THEN 1 ELSE 0 END) as slow_query_count,
        ROUND((SUM(CASE WHEN status_code >= 500 THEN 1 ELSE 0 END)::numeric * 100.0 / COUNT(*))::numeric, 2) as error_rate
      FROM performance_metrics
      WHERE timestamp >= NOW() - INTERVAL '1 hour'
    `);

    if (summary[0].total_requests > 0) {
      console.log(`Total Requests:     ${summary[0].total_requests}`);
      console.log(`Avg Response Time:  ${summary[0].avg_response_time}ms`);
      console.log(`Min Response Time:  ${summary[0].min_response_time}ms`);
      console.log(`Max Response Time:  ${summary[0].max_response_time}ms`);
      console.log(`Cache Hit Rate:     ${summary[0].cache_hit_rate}%`);
      console.log(`Slow Queries (>100ms): ${summary[0].slow_query_count}`);
      console.log(`Error Rate:         ${summary[0].error_rate}%`);
    } else {
      console.log('No requests in the last hour.');
    }

    // Get slowest endpoints (last 24 hours)
    console.log('\n\n🐌 SLOWEST ENDPOINTS (Last 24 Hours)');
    console.log('-'.repeat(80));
    
    const [slowest] = await sequelize.query(`
      SELECT 
        endpoint,
        method,
        COUNT(*) as request_count,
        ROUND(AVG(duration_ms)::numeric, 2) as avg_duration,
        MAX(duration_ms) as max_duration,
        MIN(duration_ms) as min_duration
      FROM performance_metrics
      WHERE timestamp >= NOW() - INTERVAL '24 hours'
      GROUP BY endpoint, method
      ORDER BY avg_duration DESC
      LIMIT 10
    `);

    if (slowest.length > 0) {
      console.log(
        'Rank'.padEnd(6) +
        'Method'.padEnd(8) +
        'Endpoint'.padEnd(45) +
        'Avg'.padEnd(10) +
        'Max'.padEnd(10) +
        'Count'
      );
      console.log('-'.repeat(80));
      
      slowest.forEach((row, index) => {
        const rank = `${index + 1}.`.padEnd(6);
        const method = row.method.padEnd(8);
        const endpoint = (row.endpoint.length > 42 
          ? row.endpoint.substring(0, 39) + '...' 
          : row.endpoint).padEnd(45);
        const avg = `${row.avg_duration}ms`.padEnd(10);
        const max = `${row.max_duration}ms`.padEnd(10);
        const count = row.request_count;
        
        console.log(`${rank}${method}${endpoint}${avg}${max}${count}`);
      });
    } else {
      console.log('No data available.');
    }

    // Get recent slow queries
    console.log('\n\n⚠️  RECENT SLOW QUERIES (>100ms, Last Hour)');
    console.log('-'.repeat(80));
    
    const [recentSlow] = await sequelize.query(`
      SELECT 
        endpoint,
        method,
        duration_ms,
        status_code,
        timestamp
      FROM performance_metrics
      WHERE duration_ms > 100
      AND timestamp >= NOW() - INTERVAL '1 hour'
      ORDER BY duration_ms DESC
      LIMIT 15
    `);

    if (recentSlow.length > 0) {
      console.log(
        'Time'.padEnd(20) +
        'Method'.padEnd(8) +
        'Endpoint'.padEnd(40) +
        'Duration'.padEnd(12) +
        'Status'
      );
      console.log('-'.repeat(80));
      
      recentSlow.forEach((row) => {
        const time = new Date(row.timestamp).toLocaleTimeString().padEnd(20);
        const method = row.method.padEnd(8);
        const endpoint = (row.endpoint.length > 37 
          ? row.endpoint.substring(0, 34) + '...' 
          : row.endpoint).padEnd(40);
        const duration = `${row.duration_ms}ms`.padEnd(12);
        const status = row.status_code;
        
        console.log(`${time}${method}${endpoint}${duration}${status}`);
      });
    } else {
      console.log('✅ No slow queries in the last hour! All requests under 100ms.');
    }

    // Get error requests
    console.log('\n\n❌ RECENT ERRORS (Status 500+, Last Hour)');
    console.log('-'.repeat(80));
    
    const [errors] = await sequelize.query(`
      SELECT 
        endpoint,
        method,
        duration_ms,
        status_code,
        timestamp
      FROM performance_metrics
      WHERE status_code >= 500
      AND timestamp >= NOW() - INTERVAL '1 hour'
      ORDER BY timestamp DESC
      LIMIT 10
    `);

    if (errors.length > 0) {
      console.log(
        'Time'.padEnd(20) +
        'Method'.padEnd(8) +
        'Endpoint'.padEnd(40) +
        'Status'.padEnd(10) +
        'Duration'
      );
      console.log('-'.repeat(80));
      
      errors.forEach((row) => {
        const time = new Date(row.timestamp).toLocaleTimeString().padEnd(20);
        const method = row.method.padEnd(8);
        const endpoint = (row.endpoint.length > 37 
          ? row.endpoint.substring(0, 34) + '...' 
          : row.endpoint).padEnd(40);
        const status = `${row.status_code}`.padEnd(10);
        const duration = `${row.duration_ms}ms`;
        
        console.log(`${time}${method}${endpoint}${status}${duration}`);
      });
    } else {
      console.log('✅ No errors in the last hour!');
    }

    // Get percentile metrics (last hour)
    console.log('\n\n📊 RESPONSE TIME PERCENTILES (Last Hour)');
    console.log('-'.repeat(80));
    
    const [percentiles] = await sequelize.query(`
      SELECT 
        PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY duration_ms) as p50,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) as p95,
        PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration_ms) as p99
      FROM performance_metrics
      WHERE timestamp >= NOW() - INTERVAL '1 hour'
    `);

    if (percentiles[0]) {
      console.log(`P50 (Median):  ${Math.round(percentiles[0].p50)}ms`);
      console.log(`P95:           ${Math.round(percentiles[0].p95)}ms`);
      console.log(`P99:           ${Math.round(percentiles[0].p99)}ms`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('✅ Performance metrics retrieved successfully!\n');

  } catch (error) {
    console.error('❌ Error fetching performance metrics:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

// Run the script
viewPerformanceMetrics();
