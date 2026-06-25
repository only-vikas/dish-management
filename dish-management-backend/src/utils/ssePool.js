/**
 * src/utils/ssePool.js
 *
 * In-memory SSE (Server-Sent Events) connection pool.
 *
 * WHY a dedicated pool utility:
 *  - The Change Stream service needs to broadcast events to all connected clients
 *    without knowing anything about HTTP or Express — separation of concerns.
 *  - Storing clients in a plain Map (clientId → response) is O(1) add/remove
 *    and safe for single-process Node.js without any shared-memory race conditions.
 *  - The heartbeat keeps connections alive through proxies (nginx, AWS ALB) that
 *    silently kill "idle" connections after 60–120 s — without it your real-time
 *    demo will appear to stop working after a few minutes in production/staging.
 */

'use strict';

const { v4: uuidv4 } = require('uuid');
const logger = require('./logger');

// Map<clientId: string, res: express.Response>
const clients = new Map();

// SSE comment ping every 25 s — below the typical 30 s proxy idle timeout
const HEARTBEAT_INTERVAL_MS = 25_000;
let heartbeatTimer = null;

/** ─── Public API ──────────────────────────────────────────────────── */

/**
 * Register a new SSE client.
 * Returns the generated clientId so the caller (controller) can reference it.
 *
 * @param {import('express').Response} res
 * @returns {string} clientId
 */
function addClient(res) {
  const clientId = uuidv4();
  clients.set(clientId, res);
  logger.info({ event: 'sse:client_connected', clientId, total: clients.size }, 'SSE client connected');
  return clientId;
}

/**
 * Deregister a client (called from req.on('close', …)).
 * @param {string} clientId
 */
function removeClient(clientId) {
  clients.delete(clientId);
  logger.info({ event: 'sse:client_disconnected', clientId, total: clients.size }, 'SSE client disconnected');
}

/**
 * Broadcast a named SSE event to every connected client.
 *
 * SSE wire format (per spec):
 *   event: <name>\n
 *   data: <json>\n\n
 *
 * @param {string} eventName  – e.g. 'dish:updated'
 * @param {object} payload    – Will be JSON-stringified
 */
function broadcast(eventName, payload) {
  if (clients.size === 0) return; // short-circuit if nobody is listening

  const message = `event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`;
  let sent = 0;

  for (const [clientId, res] of clients) {
    try {
      res.write(message);
      sent++;
    } catch (err) {
      // If writing to a stale connection throws, remove it proactively
      logger.warn({ event: 'sse:write_error', clientId, err }, 'Removing stale SSE client');
      clients.delete(clientId);
    }
  }

  logger.debug({ event: 'sse:broadcast', eventName, sentTo: sent }, 'SSE event broadcast');
}

/**
 * Send a single event to one specific client.
 * Useful for the initial "connected" event with the current dish list.
 *
 * @param {string} clientId
 * @param {string} eventName
 * @param {object} payload
 */
function sendToClient(clientId, eventName, payload) {
  const res = clients.get(clientId);
  if (!res) return;
  try {
    res.write(`event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`);
  } catch (err) {
    logger.warn({ event: 'sse:write_error', clientId, err }, 'Failed to send to client, removing');
    clients.delete(clientId);
  }
}

/** Return current connected client count — exposed on health endpoint. */
function clientCount() {
  return clients.size;
}

/**
 * Start the heartbeat timer.
 * Called once at server startup (from app.js or server.js after the SSE route is mounted).
 *
 * WHY SSE comments (": keep-alive") instead of a real event:
 *  - Browser EventSource and most proxies treat SSE comment lines as a no-op.
 *  - They still count as TCP activity, preventing idle-connection teardown.
 *  - Real events would trigger the client's onmessage/addEventListener handlers,
 *    polluting application logic with heartbeat noise.
 */
function startHeartbeat() {
  if (heartbeatTimer) return; // idempotent — safe to call multiple times
  heartbeatTimer = setInterval(() => {
    const ping = ': keep-alive\n\n';
    for (const [clientId, res] of clients) {
      try {
        res.write(ping);
      } catch (_) {
        clients.delete(clientId);
      }
    }
  }, HEARTBEAT_INTERVAL_MS);

  // Prevent the timer from keeping the process alive during graceful shutdown
  heartbeatTimer.unref();
  logger.info({ event: 'sse:heartbeat_started', intervalMs: HEARTBEAT_INTERVAL_MS }, 'SSE heartbeat started');
}

/**
 * Stop the heartbeat and close all open SSE connections.
 * Called during graceful shutdown so the process can exit cleanly.
 */
function shutdown() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }

  // Send a final 'server:shutdown' event so clients can display a helpful message
  const shutdownMsg = `event: server:shutdown\ndata: ${JSON.stringify({ message: 'Server is shutting down' })}\n\n`;
  for (const [, res] of clients) {
    try {
      res.write(shutdownMsg);
      res.end();
    } catch (_) {
      /* already closed */
    }
  }
  clients.clear();
  logger.info({ event: 'sse:shutdown' }, 'SSE pool shut down; all connections closed');
}

module.exports = { addClient, removeClient, broadcast, sendToClient, clientCount, startHeartbeat, shutdown };
