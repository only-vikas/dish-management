/**
 * src/scripts/seed.js
 *
 * Database seeding script — populates the Dish collection from dishes.json.
 *
 * Run: npm run seed
 *
 * Design decisions:
 *  - Validates each record against the Mongoose schema *before* inserting,
 *    so we catch bad data in the seed file, not in a production error log.
 *  - Wipes the collection first to make the script idempotent —
 *    running `npm run seed` twice gives the same result as running it once.
 *  - Closes the DB connection cleanly so the Node process exits naturally
 *    (no hanging `--exit` flag needed in your test runner).
 */

'use strict';

// Load env validation before anything else
require('../config/env');
require('dotenv').config();

const path = require('path');
const mongoose = require('mongoose');
const { connect, disconnect } = require('../config/database');
const Dish = require('../models/Dish');
const logger = require('../utils/logger');

const DISHES_FILE = path.join(__dirname, 'dishes.json');

async function seed() {
  await connect();
  logger.info({ event: 'seed:connected' }, 'Connected to MongoDB');

  // Load raw data
  let rawDishes;
  try {
    rawDishes = require(DISHES_FILE);
  } catch (err) {
    logger.error({ event: 'seed:file_error', err }, `Cannot load seed file: ${DISHES_FILE}`);
    process.exit(1);
  }

  logger.info({ event: 'seed:loaded', count: rawDishes.length }, `Loaded ${rawDishes.length} dishes from file`);

  // ── Validate each record before insert ───────────────────────────────────
  // We instantiate a Mongoose document and call .validateSync() — this runs
  // the same validators the schema defines without performing a DB write.
  // This catches missing required fields, bad URLs, etc. in the seed data.
  const valid = [];
  const invalid = [];

  for (const raw of rawDishes) {
    const doc = new Dish(raw);
    const validationError = doc.validateSync();

    if (validationError) {
      invalid.push({ raw, errors: validationError.message });
      logger.warn(
        { event: 'seed:validation_failed', dishId: raw.dishId, errors: validationError.message },
        `Record SKIPPED — validation failed for dishId "${raw.dishId}"`
      );
    } else {
      valid.push(raw);
    }
  }

  if (invalid.length > 0) {
    logger.warn(
      { event: 'seed:invalid_records', count: invalid.length },
      `⚠️  ${invalid.length} record(s) failed validation and will not be seeded`
    );
  }

  if (valid.length === 0) {
    logger.error({ event: 'seed:no_valid_records' }, 'No valid records to seed — aborting');
    await disconnect();
    process.exit(1);
  }

  // ── Wipe and re-seed ──────────────────────────────────────────────────────
  // deleteMany({}) + insertMany is NOT wrapped in a transaction here because
  // Atlas free-tier (M0) does not support multi-document transactions.
  // For a production seed, you'd use a session + transaction.
  logger.info({ event: 'seed:wiping' }, 'Wiping existing Dish collection…');
  const deleted = await Dish.deleteMany({});
  logger.info({ event: 'seed:wiped', deleted: deleted.deletedCount }, `Deleted ${deleted.deletedCount} existing records`);

  logger.info({ event: 'seed:inserting', count: valid.length }, `Inserting ${valid.length} dishes…`);
  const inserted = await Dish.insertMany(valid, { ordered: false });

  logger.info(
    { event: 'seed:complete', inserted: inserted.length, skipped: invalid.length },
    `✅ Seed complete — ${inserted.length} inserted, ${invalid.length} skipped`
  );

  await disconnect();
  logger.info({ event: 'seed:disconnected' }, 'Database connection closed — seed script exiting');
}

seed().catch((err) => {
  logger.error({ event: 'seed:fatal', err }, 'Seed script failed with an unhandled error');
  process.exit(1);
});
