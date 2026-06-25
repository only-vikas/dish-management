/**
 * src/middlewares/requestLogger.js
 *
 * Logs every inbound HTTP request with method, path, status, and response time.
 * This is the middleware equivalent of an access log — crucial for debugging
 * race conditions and latency spikes in your demo.
 */

'use strict';

const logger = require('../utils/logger');

function requestLogger(req, res, next) {
  const start = Date.now();

  // Log when the response *finishes* so we capture the real status code
  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';

    logger[level](
      {
        event: 'http:request',
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        durationMs,
        ip: req.ip,
      },
      `${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`
    );
  });

  next();
}

module.exports = { requestLogger };
