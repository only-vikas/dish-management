/**
 * src/config/database.js
 *
 * Centralised Mongoose connection logic.
 *
 * WHY a dedicated module:
 *  - Change Streams require a replica set or Atlas (already the case here).
 *  - We need the connection object in graceful-shutdown to close it explicitly.
 *  - Mongoose's connection events (error, disconnected) need consistent logging.
 */

'use strict';

const mongoose = require('mongoose');
const { MONGO_URI } = require('./env');
const logger = require('../utils/logger');

let _connection = null;

/**
 * Connect to MongoDB.
 * Returns the mongoose connection so callers (server.js, scripts) can
 * await it before doing any work that depends on the DB.
 */
async function connect() {
  if (_connection) return _connection;

  mongoose.connection.on('connected', () =>
    logger.info({ event: 'db:connected' }, 'MongoDB connection established')
  );
  mongoose.connection.on('error', (err) =>
    logger.error({ event: 'db:error', err }, 'MongoDB connection error')
  );
  mongoose.connection.on('disconnected', () =>
    logger.warn({ event: 'db:disconnected' }, 'MongoDB disconnected')
  );

  await mongoose.connect(MONGO_URI, {
    // Recommended options for production-grade Mongoose usage
    maxPoolSize: 10,        // limit connection pool to avoid hitting Atlas free-tier limits
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  _connection = mongoose.connection;
  return _connection;
}

/**
 * Gracefully close the Mongoose connection.
 * Called during SIGINT / SIGTERM shutdown sequences.
 */
async function disconnect() {
  if (_connection) {
    await mongoose.disconnect();
    logger.info({ event: 'db:disconnected' }, 'MongoDB connection closed (graceful)');
    _connection = null;
  }
}

/** Expose the raw connection (needed for Change Stream init in realtime service). */
function getConnection() {
  return _connection;
}

/** Returns true when Mongoose reports the connection is live. */
function isConnected() {
  return mongoose.connection.readyState === 1; // 1 = connected
}

module.exports = { connect, disconnect, getConnection, isConnected };
