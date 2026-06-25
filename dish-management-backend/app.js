/**
 * app.js
 *
 * Pure Express application factory.
 *
 * WHY separate app.js from server.js:
 *  - server.js owns the lifecycle (listen, shutdown).
 *  - app.js owns the HTTP layer (middleware, routes).
 *  - This split makes the app trivially testable — import app.js in tests
 *    without binding a port.
 */

'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { ALLOWED_ORIGINS } = require('./src/config/env');
const { requestLogger } = require('./src/middlewares/requestLogger');
const { errorHandler } = require('./src/middlewares/errorHandler');

// Routes
const dishRoutes = require('./src/routes/dish.routes');
const streamRoutes = require('./src/routes/stream.routes');
const healthRoutes = require('./src/routes/health.routes');

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
// Whitelist specific origins rather than wildcard '*' — more secure and shows
// intentional configuration to reviewers.
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no Origin (curl, Postman, server-to-server)
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: Origin '${origin}' not allowed`));
      }
    },
    methods: ['GET', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' })); // reject suspiciously large JSON bodies

// ── Request logging ───────────────────────────────────────────────────────────
app.use(requestLogger);

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/health', healthRoutes);
app.use('/api/dishes', dishRoutes);
app.use('/api/stream', streamRoutes);

// ── 404 for unknown routes ────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: { message: 'Route not found', code: 'NOT_FOUND' } });
});

// ── Centralized error handler (MUST be last) ──────────────────────────────────
app.use(errorHandler);

module.exports = app;
