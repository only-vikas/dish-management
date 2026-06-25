/**
 * src/routes/dish.routes.js
 *
 * Thin router — wires HTTP verbs to controllers and applies middleware.
 * No business logic here; this is purely a routing configuration file.
 */

'use strict';

const { Router } = require('express');
const dishController = require('../controllers/dish.controller');
const { validate } = require('../middlewares/validate');
const { toggleRateLimiter } = require('../middlewares/rateLimiter');
const { dishIdParamSchema, getDishesQuerySchema } = require('../validators/dish.validator');

const router = Router();

/**
 * GET /api/dishes
 * Returns all dishes with optional sort/order query params.
 */
router.get('/', validate('query', getDishesQuerySchema), dishController.getAllDishes);

/**
 * PATCH /api/dishes/:dishId/toggle
 * Atomically toggles isPublished for the specified dish.
 *
 * Middleware order matters:
 *  1. Rate limiter   — reject abusive traffic early (cheap)
 *  2. Validator      — reject invalid params before hitting the DB
 *  3. Controller     — actual handler
 */
router.patch(
  '/:dishId/toggle',
  toggleRateLimiter,
  validate('params', dishIdParamSchema),
  dishController.togglePublished
);

module.exports = router;
