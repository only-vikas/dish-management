/**
 * src/validators/dish.validator.js
 *
 * Zod schemas that validate request payloads *before* they reach a service or DB.
 *
 * WHY validate at this layer:
 *  - Services should never receive malformed input — they can assume data is clean.
 *  - Centralised Zod schemas are composable, testable, and self-documenting.
 *  - Zod's `.safeParse()` gives us a structured error object rather than a thrown
 *    exception, making it easy to format 400 responses in middleware.
 */

'use strict';

const { z } = require('zod');

/**
 * Validates the `dishId` path parameter from `/api/dishes/:dishId/toggle`.
 *
 * We reject empty strings up-front to avoid hitting the DB with useless queries.
 * The dishId is a business-defined string (not a Mongo ObjectId), so we only
 * enforce non-empty and max-length constraints here.
 */
const dishIdParamSchema = z.object({
  dishId: z
    .string({ required_error: 'dishId param is required' })
    .min(1, 'dishId cannot be empty')
    .max(100, 'dishId is too long'),
});

/**
 * Validates the optional query params for GET /api/dishes.
 * Future-proofing: allows callers to sort or filter without breaking changes.
 */
const getDishesQuerySchema = z.object({
  sort: z.enum(['dishName', 'createdAt', 'isPublished']).optional().default('dishName'),
  order: z.enum(['asc', 'desc']).optional().default('asc'),
});

module.exports = { dishIdParamSchema, getDishesQuerySchema };
