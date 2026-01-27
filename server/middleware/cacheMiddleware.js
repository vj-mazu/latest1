const cache = require('../utils/cache');

/**
 * Cache middleware for GET requests
 * Automatically caches responses and serves from cache if available
 */
const cacheMiddleware = (ttlMs = 60000) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key from URL and query params
    const cacheKey = `${req.originalUrl || req.url}`;
    
    // Check cache
    const cachedResponse = cache.get(cacheKey);
    
    if (cachedResponse) {
      // Add cache hit header
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('X-Cache-Key', cacheKey);
      return res.json(cachedResponse);
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to cache response
    res.json = function(data) {
      // Cache the response
      cache.set(cacheKey, data, ttlMs);
      
      // Add cache miss header
      res.setHeader('X-Cache', 'MISS');
      res.setHeader('X-Cache-Key', cacheKey);
      
      // Call original json method
      return originalJson(data);
    };

    next();
  };
};

/**
 * Clear cache for specific patterns
 */
const clearCache = (pattern) => {
  if (pattern) {
    const stats = cache.stats();
    stats.keys.forEach(key => {
      if (key.includes(pattern)) {
        cache.delete(key);
      }
    });
  } else {
    cache.clear();
  }
};

module.exports = { cacheMiddleware, clearCache };
