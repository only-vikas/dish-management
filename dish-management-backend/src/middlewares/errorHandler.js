/**
 * src/middlewares/errorHandler.js
 *
 * Centralised Express error handler — the single place all errors land.
 *
 * Conventions:
 *  - Operational errors (expected, user-facing) have `err.isOperational = true`
 *    and a meaningful `err.statusCode`.  We surface these to the client.
 *  - Unexpected errors (bugs, unhandled rejections) get a generic 500 and are
 *    logged with full stack — we never leak stack traces in responses.
 *  - All errors are logged with `logger.error` so they appear in your monitoring.
 *
 * Usage: mount this as the LAST middleware in app.js (after all routes).
 */

'use strict';

const logger = require('../utils/logger');
const { error: formatError } = require('../utils/responseFormatter');

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Log with full context regardless of type
  logger.error(
    {
      event: 'http:error',
      method: req.method,
      url: req.originalUrl,
      statusCode: err.statusCode || 500,
      message: err.message,
      stack: err.stack,
    },
    'Request error'
  );

  // Operational errors: 404, 400, 409, etc.
  if (err.isOperational) {
    return res
      .status(err.statusCode)
      .json(formatError(err.message, err.code || 'OPERATIONAL_ERROR'));
  }

  // Mongoose validation errors → treat as 400
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors)
      .map((e) => e.message)
      .join('; ');
    return res.status(400).json(formatError(messages, 'VALIDATION_ERROR'));
  }

  // Mongoose duplicate key errors → treat as 409 Conflict
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json(formatError(`Duplicate value for '${field}'`, 'DUPLICATE_KEY'));
  }

  // Everything else is an unexpected server error
  return res.status(500).json(formatError('An unexpected error occurred', 'INTERNAL_ERROR'));
}

/**
 * Typed custom error for intentional operational failures.
 *
 * Usage in services:
 *   throw new AppError('Dish not found', 404, 'DISH_NOT_FOUND');
 */
class AppError extends Error {
  /**
   * @param {string} message
   * @param {number} statusCode
   * @param {string} [code]
   */
  constructor(message, statusCode, code) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true; // signals: "I threw this intentionally"
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { errorHandler, AppError };
