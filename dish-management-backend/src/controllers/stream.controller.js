/**
 * src/controllers/stream.controller.js
 *
 * Handles the GET /api/stream SSE endpoint.
 *
 * This controller's job: set the correct headers, register the client in the
 * SSE pool, send the initial dish list so the client doesn't need a separate
 * REST call, and clean up on disconnect.
 *
 * The actual broadcasting of change events happens in realtime.service.js —
 * this controller knows nothing about Change Streams.
 */

'use strict';

const ssePool = require('../utils/ssePool');
const dishService = require('../services/dish.service');
const logger = require('../utils/logger');

/**
 * GET /api/stream
 *
 * Establishes a persistent SSE connection for a client.
 *
 * Header notes:
 *  - `Content-Type: text/event-stream` — tells the browser to treat this as SSE
 *  - `Cache-Control: no-cache`         — prevents proxies/CDNs from caching the stream
 *  - `Connection: keep-alive`          — hint to proxies not to close the TCP connection
 *  - `X-Accel-Buffering: no`           — disables nginx proxy buffering (very important!)
 */
async function subscribe(req, res) {
  // 1. Set SSE-required headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // nginx: don't buffer SSE

  // Flush headers immediately so the browser recognises this as a stream
  res.flushHeaders();

  // 2. Register client in the pool
  const clientId = ssePool.addClient(res);

  // 3. Send the initial dish list so the client can bootstrap its UI state
  //    without a separate GET /api/dishes race condition.
  try {
    const dishes = await dishService.getAllDishes();
    ssePool.sendToClient(clientId, 'initial:dishes', { dishes });
    logger.debug({ event: 'sse:initial_sent', clientId, count: dishes.length }, 'Initial dish list sent to new SSE client');
  } catch (err) {
    logger.error({ event: 'sse:initial_error', clientId, err }, 'Failed to send initial dish list');
  }

  // 4. Clean up when the client disconnects (tab closed, network loss, etc.)
  req.on('close', () => {
    ssePool.removeClient(clientId);
  });
}

module.exports = { subscribe };
