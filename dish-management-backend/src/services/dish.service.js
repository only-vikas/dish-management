/**
 * src/services/dish.service.js
 *
 * Core business logic for Dish operations.
 *
 * Rules:
 *  - No knowledge of `req` or `res` — purely data in, data out.
 *  - All DB calls happen here, not in controllers.
 *  - Throws `AppError` for operational failures (not-found, etc.) so the central
 *    error handler can format the correct HTTP response without controllers needing
 *    try/catch around every service call.
 */

'use strict';

const Dish = require('../models/Dish');
const { AppError } = require('../middlewares/errorHandler');
const logger = require('../utils/logger');

/**
 * Return all dishes sorted by a caller-specified field.
 *
 * @param {{ sort: string, order: 'asc'|'desc' }} options
 * @returns {Promise<Dish[]>}
 */
async function getAllDishes({ sort = 'dishName', order = 'asc' } = {}) {
  const sortOrder = order === 'desc' ? -1 : 1;
  const dishes = await Dish.find({}).sort({ [sort]: sortOrder }).lean({ virtuals: false });

  // .lean() returns plain JS objects (no Mongoose overhead) — we manually apply
  // the same toJSON transform the schema defines for Mongoose documents.
  return dishes.map(cleanDish);
}

/**
 * Atomically toggle `isPublished` for the given `dishId`.
 *
 * WHY `$not` + `findOneAndUpdate` instead of read-then-write:
 *  - A plain "fetch → flip in JS → save" creates a race condition: two concurrent
 *    toggle requests could both read `false`, both set `true`, and the net result
 *    is wrong.
 *  - `$set: { isPublished: { $not: "$isPublished" } }` is a single atomic MongoDB
 *    operation — the flip happens inside the server with no gap for a second write
 *    to interleave.  This is safe at any concurrency level.
 *
 * @param {string} dishId
 * @returns {Promise<Dish>} the updated dish document
 */
async function togglePublished(dishId) {
  // The aggregation-pipeline form of findOneAndUpdate is needed to use $not on a field ref.
  const updated = await Dish.findOneAndUpdate(
    { dishId },
    [{ $set: { isPublished: { $not: '$isPublished' }, updatedAt: '$$NOW' } }],
    { new: true, runValidators: true }
  );

  if (!updated) {
    throw new AppError(`Dish with dishId '${dishId}' not found`, 404, 'DISH_NOT_FOUND');
  }

  logger.info(
    { event: 'dish:toggled', dishId, isPublished: updated.isPublished },
    `Dish "${updated.dishName}" toggled to isPublished=${updated.isPublished}`
  );

  return cleanDish(updated.toJSON());
}

/**
 * Apply the same field-cleanup that toJSON's transform does to `.lean()` results.
 * Lean queries bypass Mongoose document methods, so we do this manually.
 *
 * @param {object} doc
 * @returns {object}
 */
function cleanDish(doc) {
  const { _id, __v, ...rest } = doc;
  return { id: _id ? _id.toString() : undefined, ...rest };
}

/**
 * Create a new dish.
 *
 * @param {object} payload
 * @returns {Promise<Dish>}
 */
async function createDish(payload) {
  const dishId = 'dish-' + Math.random().toString(36).substring(2, 9);
  
  const dishData = {
    dishId,
    dishName: payload.dishName,
    imageUrl: payload.imageUrl || '',
    isPublished: payload.isPublished,
    description: payload.description || 'No description available',
    price: payload.price || (Math.floor(Math.random() * 20) + 10) + 0.99, // default random price if not provided
  };

  const newDish = new Dish(dishData);
  await newDish.save();

  logger.info(
    { event: 'dish:created', dishId: newDish.dishId },
    `Dish "${newDish.dishName}" created successfully`
  );

  return cleanDish(newDish.toJSON());
}

/**
 * Delete a dish.
 *
 * @param {string} dishId
 * @returns {Promise<void>}
 */
async function deleteDish(dishId) {
  const deleted = await Dish.findOneAndDelete({ dishId });
  if (!deleted) {
    throw new AppError(`Dish with dishId '${dishId}' not found`, 404, 'DISH_NOT_FOUND');
  }

  logger.info(
    { event: 'dish:deleted', dishId },
    `Dish "${deleted.dishName}" deleted successfully`
  );
}

module.exports = { getAllDishes, togglePublished, createDish, deleteDish };
