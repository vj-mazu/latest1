const { Sequelize } = require('sequelize');

// Database configuration with performance optimizations
let dbUrl = process.env.DATABASE_URL;

// Sanitize the URL if it exists (remove quotes and whitespace)
if (dbUrl) {
  dbUrl = dbUrl.trim();
  if ((dbUrl.startsWith('"') && dbUrl.endsWith('"')) || (dbUrl.startsWith("'") && dbUrl.endsWith("'"))) {
    dbUrl = dbUrl.slice(1, -1);
  }
}

if (dbUrl) {
  console.log('Attempting to connect with DATABASE_URL (masked):', dbUrl.replace(/:([^:@]+)@/, ':****@'));
} else {
  console.log('No DATABASE_URL found, using individual environment variables.');
}

const sequelize = dbUrl
  ? new Sequelize(dbUrl, {
    dialect: 'postgres',
    protocol: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Required for some PaaS providers like Render/Supabase
      },
      statement_timeout: 30000,
      idle_in_transaction_session_timeout: 60000,
      application_name: 'mother_india_stock_mgmt'
    },
    pool: {
      max: 50,  // Increased for 10 lakh records handling
      min: 10,  // Higher minimum for faster response under load
      acquire: 60000,
      idle: 10000,
      evict: 1000,
      maxUses: 2000  // Increased for high-volume operations
    },
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    }
  })
  : new Sequelize({
    database: process.env.DB_NAME || 'mother_india',
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '12345',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgresql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,

    // Connection pool configuration for better performance
    pool: {
      max: 50,  // Increased for 10 lakh records handling
      min: 10,  // Higher minimum for faster response under load
      acquire: 60000,
      idle: 10000,
      evict: 1000,
      maxUses: 2000  // Increased for high-volume operations
    },

    // Query optimization settings
    dialectOptions: {
      statement_timeout: 30000,
      idle_in_transaction_session_timeout: 60000,
      application_name: 'mother_india_stock_mgmt'
    },

    // Model defaults
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    },

    // Performance settings
    benchmark: process.env.NODE_ENV === 'development',
    logQueryParameters: process.env.NODE_ENV === 'development',

    // Retry configuration
    retry: {
      max: 3,
      match: [
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/,
        /TimeoutError/
      ]
    }
  });

module.exports = { sequelize };