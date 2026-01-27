/**
 * Enhanced Performance Monitoring Middleware
 * Tracks response times, memory usage, and logs slow queries
 */

const performanceMonitor = (req, res, next) => {
  const startTime = Date.now();
  const startMemory = process.memoryUsage().heapUsed;
  
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
      }
    } catch (error) {
      // Ignore header errors if response already sent
    }
    
    // Log all requests in development
    if (process.env.NODE_ENV === 'development') {
      console.log({
        method: req.method,
        url: req.originalUrl,
        responseTime: `${responseTime}ms`,
        memoryUsed: `${memoryMB}MB`,
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

module.exports = performanceMonitor;
