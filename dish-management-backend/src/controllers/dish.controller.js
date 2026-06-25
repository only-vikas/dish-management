/**
 * src/controllers/dish.controller.js
 *
 * Request/response boundary — translates HTTP concerns into service calls.
 *
 * Rules:
 *  - Never touches Mongoose directly.
 *  - Never contains business logic — delegates to dishService.
 *  - Passes errors to next(err) so the central error handler formats the response.
 *  - Each method is intentionally thin: validate → call service → format response.
 */

'use strict';

const dishService = require('../services/dish.service');
const { success } = require('../utils/responseFormatter');

/**
 * GET /api/dishes
 * Returns all dishes wrapped in a standard envelope.
 */
async function getAllDishes(req, res, next) {
  try {
    const dishes = await dishService.getAllDishes(req.query);
    res.json(success(dishes));
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/dishes/:dishId/toggle
 * Atomically flips `isPublished` and returns the updated dish.
 */
async function togglePublished(req, res, next) {
  try {
    const { dishId } = req.params;
    const updatedDish = await dishService.togglePublished(dishId);
    res.json(success(updatedDish, `Dish "${updatedDish.dishName}" toggled successfully`));
  } catch (err) {
    next(err);
  }
}

module.exports = { getAllDishes, togglePublished };
