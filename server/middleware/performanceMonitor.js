/**
 * Enhanced Performance Monitoring Middleware
 * Tracks response times, memory usage, logs slow queries, and stores metrics
 */

const PerformanceMonitor = require('../utils/PerformanceMonitor');

// Simple request ID generator
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

const performanceMonitorMiddleware = (req, res, next) => {
  const requestId = generateRequestId();
  const startTime = Date.now();
  const startMemory = process.memoryUsage().heapUsed;
  
  // Attach request ID for tracking
  req.requestId = requestId;
  req.queryCount = 0; // Track number of queries per request
  req.cacheHit = false; // Track if cache was used
  
  // Store original end function
  const originalEnd = res.end;
  
  // Override end function
  res.end = function(...args) {
    const responseTime = Date.now() - startTime;
    const memoryUsed = process.memoryUsage().heapUsed - startMemory;
    const memoryMB = (memoryUsed / 1024 / 1024).toFixed(2);
    
    // Add performance headers BEFORE ending response
    try {
      if (!res.headersSent) {
        res.setHeader('X-Response-Time', `${responseTime}ms`);
        res.setHeader('X-Memory-Used', `${memoryMB}MB`);
        res.setHeader('X-Request-ID', requestId);
      }
    } catch (error) {
      // Ignore header errors if response already sent
    }
    
    // Log metrics to database (async, non-blocking)
    PerformanceMonitor.logRequest({
      requestId,
      endpoint: req.originalUrl,
      method: req.method,
      duration: responseTime,
      queryCount: req.queryCount,
      cacheHit: req.cacheHit,
      statusCode: res.statusCode,
      memoryUsed
    }).catch(err => {
      // Silently fail - don't let monitoring break the app
    });
    
    // Check alert thresholds
    const alerts = PerformanceMonitor.checkThresholds({
      requestId,
      endpoint: req.originalUrl,
      method: req.method,
      duration: responseTime,
      statusCode: res.statusCode
    });
    
    // Log alerts
    alerts.forEach(alert => {
      if (alert.severity === 'critical') {
        console.error(`🚨 CRITICAL: ${alert.message}`);
      } else {
        console.warn(`⚠️  WARNING: ${alert.message}`);
      }
    });
    
    // Log all requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log({
        requestId,
        method: req.method,
        url: req.originalUrl,
        responseTime: `${responseTime}ms`,
        memoryUsed: `${memoryMB}MB`,
        queryCount: req.queryCount,
        cacheHit: req.cacheHit,
        statusCode: res.statusCode
      });
    }
    
    // Log slow queries (>100ms)
    if (responseTime > 100 && responseTime <= 1000) {
      console.warn(`⚠️  SLOW QUERY: ${req.method} ${req.originalUrl} - ${responseTime}ms (Memory: ${memoryMB}MB)`);
    }
    
    // Log very slow queries (>1000ms)
    if (responseTime > 1000) {
      console.error(`❌ VERY SLOW QUERY: ${req.method} ${req.originalUrl} - ${responseTime}ms (Memory: ${memoryMB}MB, Status: ${res.statusCode})`);
    }
    
    // Call original end
    originalEnd.apply(res, args);
  };
  
  next();
};

module.exports = performanceMonitorMiddleware;
