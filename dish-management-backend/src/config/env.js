/**
 * src/config/env.js
 *
 * Validate and export required environment variables at startup.
 * Fail fast with a descriptive message rather than crashing deep in
 * application code with a confusing "undefined" error.
 */

'use strict';

require('dotenv').config();

const REQUIRED_VARS = ['MONGO_URI', 'PORT'];

const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(
    `[env] FATAL: Missing required environment variables: ${missing.join(', ')}\n` +
    `       Copy .env.example to .env and fill in the values.`
  );
  process.exit(1);
}

module.exports = {
  MONGO_URI: process.env.MONGO_URI,
  PORT: parseInt(process.env.PORT, 10) || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  // Parse comma-separated origins into an array for the CORS whitelist
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173')
    .split(',')
    .map((o) => o.trim()),
};
