/**
 * src/utils/logger.js
 *
 * Application-wide Pino logger instance.
 *
 * WHY Pino over console.log:
 *  - JSON output in production = structured, easily parsed by log aggregators.
 *  - pino-pretty gives human-readable output in development.
 *  - Centralised instance means log level is controlled from one place (.env LOG_LEVEL).
 */

'use strict';

const pino = require('pino');
const { LOG_LEVEL, NODE_ENV } = require('../config/env');

const transport =
  NODE_ENV !== 'production'
    ? pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      })
    : undefined; // In production, pipe raw JSON to stdout for log aggregators

const logger = pino(
  {
    level: LOG_LEVEL,
    // Adds a baseline "service" field to every log line — easy filtering in Grafana/CloudWatch
    base: { service: 'dish-management-backend' },
  },
  transport
);

module.exports = logger;
