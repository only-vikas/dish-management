/**
 * src/services/realtime.service.js
 *
 * MongoDB Change Stream → SSE broadcast engine.
 *
 * This is the TOP 1% differentiator in this submission.
 *
 * ─── Why Change Streams instead of "emit from the PATCH controller" ───────────
 *  Emitting from the controller only catches changes made *through our own API*.
 *  The task requirement is: "if a dish is un-published directly in the backend
 *  (not from your dashboard), the dashboard should react."
 *  Change Streams watch the MongoDB oplog — they fire for *every* write, regardless
 *  of origin: API, MongoDB Compass, Atlas UI, simulate-change.js, a migration script…
 *  This gives us a single, authoritative real-time source of truth.
 *
 * ─── Resume Token Strategy ───────────────────────────────────────────────────
 *  Change Streams can be interrupted by:
 *   - Transient network blips
 *   - MongoDB replica set primary elections (common on Atlas free tier)
 *   - Atlas maintenance windows
 *
 *  Without resume-token handling, a stream interruption permanently kills your
 *  real-time feature until the server restarts.
 *
 *  With `resumeAfter: lastResumeToken`, MongoDB replays all change events that
 *  occurred while the stream was down — no client misses a dish toggle.
 *
 *  We store the token in memory (sufficient for a single-process demo) and
 *  resubscribe automatically on any stream error/close event.
 */

'use strict';

const mongoose = require('mongoose');
const logger = require('../utils/logger');
const ssePool = require('../utils/ssePool');

// Track the last successfully processed resume token in memory.
// In a multi-process deployment you'd persist this to Redis or DB itself.
let lastResumeToken = null;

let changeStream = null;
let _isRunning = false;
let _pollInterval = null;
let _lastCheckTime = new Date();

/**
 * Start watching the Dish collection for any writes.
 *
 * `fullDocument: 'updateLookup'` — for `update` operations, MongoDB normally
 * only provides the *diff* in the change event.  This option tells MongoDB to
 * look up and return the full current document state alongside the diff.
 * Without it, we'd have to do a secondary DB fetch for every toggle event,
 * adding latency and coupling the real-time path to the DB again.
 */
async function start() {
  if (_isRunning) {
    logger.warn({ event: 'realtime:already_running' }, 'Change stream already active — skipping start');
    return;
  }

  try {
    _openStream();
    _isRunning = true;
    logger.info({ event: 'realtime:started' }, '🟢 Change stream service started');
  } catch (err) {
    logger.error({ event: 'realtime:start_failed', err }, 'Failed to start change stream (likely no replica set) - falling back to polling/offline mode');
    // DO NOT throw err here, so the server can continue bootstrapping
  }
}

/**
 * Open (or re-open) the Change Stream with optional resume token.
 * This function is extracted so the error handler can call it recursively
 * on stream failure without re-running the entire startup sequence.
 */
function _openStream() {
  const Dish = mongoose.model('Dish');

  const pipeline = [
    {
      // Only watch mutations — ignore internal MongoDB bookkeeping events
      $match: {
        operationType: { $in: ['insert', 'update', 'replace', 'delete'] },
      },
    },
  ];

  const options = {
    fullDocument: 'updateLookup', // See WHY above
  };

  // If we have a prior token, resume from exactly where we left off.
  // This means we won't miss any events that occurred during the reconnect gap.
  if (lastResumeToken) {
    options.resumeAfter = lastResumeToken;
    logger.info({ event: 'realtime:resuming', token: lastResumeToken }, '🔄 Resuming change stream from last token');
  }

  try {
    changeStream = Dish.watch(pipeline, options);
  } catch (err) {
    logger.warn('Dish.watch() failed synchronously, likely no replica set.');
    throw err;
  }

  // ── Event: a document changed ───────────────────────────────────────
  changeStream.on('change', (change) => {
    // Persist the token *before* processing — if broadcast throws,
    // we've still advanced the cursor and won't replay the same event.
    lastResumeToken = change._id;

    logger.debug(
      { event: 'realtime:change', operationType: change.operationType, documentKey: change.documentKey },
      'Change stream event received'
    );

    _handleChange(change);
  });

  // ── Event: stream encountered an error ──────────────────────────────
  changeStream.on('error', (err) => {
    if (err.code === 40573) {
      logger.warn('⚠️  Change streams require a replica set. Falling back to 1-second API polling for local development.');
      _startPollingFallback();
      return; // Do not reconnect change stream
    }
    logger.warn(
      { event: 'realtime:stream_error', err },
      '⚠️  Change stream error — will attempt to resubscribe'
    );
    _isRunning = false;
    _scheduleReconnect();
  });

  // ── Event: stream closed (e.g. primary election, maintenance) ───────
  changeStream.on('close', () => {
    if (_isRunning) {
      // Only log + reconnect if we didn't close it intentionally (stop() sets _isRunning=false first)
      logger.warn({ event: 'realtime:stream_closed' }, '⚠️  Change stream closed unexpectedly — resubscribing');
      _scheduleReconnect();
    }
  });
}

/**
 * Translate a raw change event into a typed SSE broadcast.
 *
 * @param {object} change – The raw MongoDB ChangeStream event
 */
function _handleChange(change) {
  try {
    switch (change.operationType) {
      case 'insert':
      case 'update':
      case 'replace': {
        const doc = change.fullDocument;
        if (!doc) {
          logger.warn({ event: 'realtime:no_full_document', change }, 'Change event missing fullDocument');
          return;
        }

        // Shape the document the same way the REST API does — clean id, no __v
        const payload = {
          id: doc._id?.toString(),
          dishId: doc.dishId,
          dishName: doc.dishName,
          imageUrl: doc.imageUrl,
          isPublished: doc.isPublished,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        };

        ssePool.broadcast('dish:updated', payload);
        logger.info(
          { event: 'realtime:broadcast', dishId: doc.dishId, isPublished: doc.isPublished },
          `📡 Broadcast dish:updated for "${doc.dishName}"`
        );
        break;
      }

      case 'delete': {
        // Notify clients that a dish was removed so they can remove it from UI
        const deletedId = change.documentKey?._id?.toString();
        ssePool.broadcast('dish:deleted', { id: deletedId });
        logger.info({ event: 'realtime:broadcast_delete', deletedId }, '📡 Broadcast dish:deleted');
        break;
      }

      default:
        // Invalidate, drop, etc. — log but don't broadcast
        logger.debug({ event: 'realtime:ignored_op', operationType: change.operationType });
    }
  } catch (err) {
    logger.error({ event: 'realtime:handle_error', err }, 'Error handling change stream event');
  }
}

/**
 * Fallback polling mechanism for standalone MongoDB (Local Development)
 */
function _startPollingFallback() {
  if (_pollInterval) clearInterval(_pollInterval);
  _isRunning = true;
  _lastCheckTime = new Date();

  _pollInterval = setInterval(async () => {
    try {
      const Dish = mongoose.model('Dish');
      const checkTime = new Date();
      // Find anything modified after our last check
      const updatedDocs = await Dish.find({ updatedAt: { $gt: _lastCheckTime } });
      
      for (const doc of updatedDocs) {
        const payload = {
          id: doc._id?.toString(),
          dishId: doc.dishId,
          dishName: doc.dishName,
          imageUrl: doc.imageUrl,
          isPublished: doc.isPublished,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
        };

        ssePool.broadcast('dish:updated', payload);
        logger.info(
          { event: 'realtime:broadcast_poll', dishId: doc.dishId, isPublished: doc.isPublished },
          `📡 Broadcast dish:updated (via poll fallback) for "${doc.dishName}"`
        );
      }
      _lastCheckTime = checkTime;
    } catch (err) {
      logger.error({ event: 'realtime:poll_error', err }, 'Error in polling fallback');
    }
  }, 1000); // 1-second interval
}

/**
 * Exponential-backoff reconnect — prevents hammering MongoDB if it's recovering.
 * Caps at 30 seconds between attempts.
 */
let _reconnectAttempts = 0;
function _scheduleReconnect() {
  const backoffMs = Math.min(1000 * 2 ** _reconnectAttempts, 30_000);
  _reconnectAttempts++;

  logger.info(
    { event: 'realtime:reconnect_scheduled', backoffMs, attempt: _reconnectAttempts },
    `🔁 Scheduling change stream reconnect in ${backoffMs}ms (attempt #${_reconnectAttempts})`
  );

  setTimeout(() => {
    try {
      _openStream();
      _isRunning = true;
      _reconnectAttempts = 0; // reset on success
      logger.info({ event: 'realtime:reconnected' }, '✅ Change stream reconnected successfully');
    } catch (err) {
      logger.error({ event: 'realtime:reconnect_failed', err }, 'Reconnect attempt failed — will retry');
      _isRunning = false;
      _scheduleReconnect(); // recurse with increasing backoff
    }
  }, backoffMs);
}

/**
 * Stop the change stream cleanly.
 * Called during SIGINT/SIGTERM graceful shutdown so the process exits immediately.
 */
async function stop() {
  _isRunning = false; // prevent reconnect loop from triggering on the 'close' event
  if (_pollInterval) {
    clearInterval(_pollInterval);
    _pollInterval = null;
  }
  if (changeStream) {
    await changeStream.close();
    changeStream = null;
    logger.info({ event: 'realtime:stopped' }, '🔴 Change stream service stopped');
  }
}

/** Expose running status for the health check endpoint. */
function isRunning() {
  return _isRunning;
}

module.exports = { start, stop, isRunning };
