/**
 * src/routes/stream.routes.js
 *
 * SSE stream endpoint router.
 * Note: GET /api/stream is deliberately NOT behind the rate limiter —
 * SSE connections are long-lived and one connection per browser tab is expected.
 */

'use strict';

const { Router } = require('express');
const streamController = require('../controllers/stream.controller');

const router = Router();

/**
 * GET /api/stream
 * Establishes a persistent Server-Sent Events connection.
 */
router.get('/', streamController.subscribe);

module.exports = router;
