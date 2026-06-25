/**
 * src/scripts/simulate-change.js
 *
 * Admin simulation script — directly modifies a dish in MongoDB,
 * BYPASSING the Express API entirely.
 *
 * Run: npm run simulate
 *
 * PURPOSE — this script is the "proof of concept" for the real-time bonus:
 *  When you run this side-by-side with an open dashboard, the Change Stream
 *  (not the API) detects the write and broadcasts it via SSE.  This proves
 *  that the real-time engine watches the database, not just the API layer.
 *
 * Demo script for the video walkthrough:
 *  1. Open the dashboard in a browser.
 *  2. Open a second terminal window.
 *  3. Run: npm run simulate
 *  4. Watch the dashboard update instantly — no page refresh, no API call.
 *  5. Re-run to flip it back.
 */

'use strict';

require('../config/env');
require('dotenv').config();

const { connect, disconnect } = require('../config/database');
const Dish = require('../models/Dish');
const logger = require('../utils/logger');

async function simulateChange() {
  logger.info({ event: 'simulate:start' }, '🎬 Simulation script starting — connecting to MongoDB…');
  await connect();

  // Count total dishes so we can pick a random index
  const count = await Dish.countDocuments();
  if (count === 0) {
    logger.error({ event: 'simulate:no_dishes' }, 'No dishes in the collection — run npm run seed first');
    await disconnect();
    process.exit(1);
  }

  // Pick a random document using skip — simple enough for a small collection
  const randomSkip = Math.floor(Math.random() * count);
  const target = await Dish.findOne().skip(randomSkip);

  if (!target) {
    logger.error({ event: 'simulate:not_found' }, 'Could not retrieve a random dish');
    await disconnect();
    process.exit(1);
  }

  const previousState = target.isPublished;

  // ── Atomic toggle — same pattern as the REST API service ─────────────────
  // Using the aggregation-pipeline form of findOneAndUpdate for atomicity.
  // This write bypasses our Express API entirely and goes straight to MongoDB —
  // exactly simulating what a DBA would do in MongoDB Compass.
  const updated = await Dish.findOneAndUpdate(
    { dishId: target.dishId },
    [{ $set: { isPublished: { $not: '$isPublished' }, updatedAt: '$$NOW' } }],
    { new: true }
  );

  logger.info(
    {
      event: 'simulate:toggled',
      dishId: updated.dishId,
      dishName: updated.dishName,
      from: previousState,
      to: updated.isPublished,
    },
    `✅ Toggled "${updated.dishName}" (dishId: ${updated.dishId}) — isPublished: ${previousState} → ${updated.isPublished}`
  );

  console.log('\n─────────────────────────────────────────────');
  console.log(`  Dish: ${updated.dishName}`);
  console.log(`  ID:   ${updated.dishId}`);
  console.log(`  Was:  isPublished = ${previousState}`);
  console.log(`  Now:  isPublished = ${updated.isPublished}`);
  console.log('  → Your dashboard should update in ~1 second');
  console.log('─────────────────────────────────────────────\n');

  await disconnect();
  logger.info({ event: 'simulate:done' }, 'Simulation complete — connection closed');
}

simulateChange().catch((err) => {
  logger.error({ event: 'simulate:fatal', err }, 'Simulation script encountered a fatal error');
  process.exit(1);
});
