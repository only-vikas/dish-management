/**
 * server.js
 *
 * Application entry point — owns the process lifecycle.
 *
 * Responsibilities:
 *  1. Load and validate env vars (fast-fail if misconfigured)
 *  2. Connect to MongoDB
 *  3. Start the Change Stream real-time service
 *  4. Start the SSE heartbeat
 *  5. Bind the HTTP server
 *  6. Wire graceful shutdown for SIGINT and SIGTERM
 *
 * Nothing else lives here.  Business logic belongs in services;
 * HTTP concerns belong in app.js.
 */

'use strict';

// Load env validation FIRST — before any other module imports config
const { PORT } = require('./src/config/env');
const { connect, disconnect } = require('./src/config/database');
const realtimeService = require('./src/services/realtime.service');
const ssePool = require('./src/utils/ssePool');
const logger = require('./src/utils/logger');
const app = require('./app');

let server;

async function bootstrap() {
  try {
    // 1. Connect to MongoDB (required before anything else)
    await connect();

    // 2. Start the Change Stream engine
    //    This must happen AFTER the DB connection is established.
    await realtimeService.start();

    // 3. Start the SSE heartbeat loop
    ssePool.startHeartbeat();

    // 4. Start the HTTP server
    server = app.listen(PORT, () => {
      logger.info({ event: 'server:started', port: PORT }, `🚀 Server listening on http://localhost:${PORT}`);
      logger.info({ event: 'server:started' }, `📡 SSE stream available at http://localhost:${PORT}/api/stream`);
      logger.info({ event: 'server:started' }, `💚 Health check: http://localhost:${PORT}/api/health`);
    });

    // Increase timeout for long-lived SSE connections
    server.keepAliveTimeout = 60_000;
    server.headersTimeout = 65_000;

  } catch (err) {
    logger.fatal({ event: 'server:bootstrap_failed', err }, 'Server failed to start');
    process.exit(1);
  }
}

/**
 * Graceful shutdown handler.
 *
 * WHY graceful shutdown matters:
 *  - Without it, Ctrl+C (SIGINT) or a container stop (SIGTERM) kills the process
 *    instantly, leaving SSE connections hanging, change streams abandoned, and
 *    in-flight DB writes potentially corrupted.
 *  - With it, we close connections cleanly, the Node.js event loop drains
 *    naturally, and exit code is 0 — no stack traces, no alarming output.
 *  - This is the difference between "it works in dev" and "it's production-ready."
 *
 * @param {string} signal – 'SIGINT' | 'SIGTERM'
 */
async function gracefulShutdown(signal) {
  logger.info({ event: 'server:shutdown_initiated', signal }, `${signal} received — shutting down gracefully`);

  try {
    // 1. Stop accepting new HTTP connections
    if (server) {
      await new Promise((resolve, reject) =>
        server.close((err) => (err ? reject(err) : resolve()))
      );
      logger.info({ event: 'server:http_closed' }, 'HTTP server closed');
    }

    // 2. Close all SSE connections (sends a shutdown event to clients)
    ssePool.shutdown();

    // 3. Stop the Change Stream
    await realtimeService.stop();

    // 4. Close the MongoDB connection
    await disconnect();

    logger.info({ event: 'server:shutdown_complete' }, '✅ Graceful shutdown complete');
    process.exit(0);
  } catch (err) {
    logger.error({ event: 'server:shutdown_error', err }, 'Error during graceful shutdown');
    process.exit(1);
  }
}

// ── Signal handlers ───────────────────────────────────────────────────────────
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// ── Unhandled rejection safety net ───────────────────────────────────────────
// Log unhandled promise rejections instead of silently swallowing them.
// In Node.js ≥ 15, an unhandled rejection crashes the process — we want
// visibility before that happens.
process.on('unhandledRejection', (reason, promise) => {
  logger.error({ event: 'process:unhandled_rejection', reason, promise }, 'Unhandled promise rejection');
});

process.on('uncaughtException', (err) => {
  logger.fatal({ event: 'process:uncaught_exception', err }, 'Uncaught exception — shutting down');
  process.exit(1);
});

// ── Boot ──────────────────────────────────────────────────────────────────────
bootstrap();
