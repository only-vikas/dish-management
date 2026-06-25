/**
 * src/middlewares/validate.js
 *
 * Generic Zod validation middleware factory.
 *
 * Usage:
 *   router.patch('/:dishId/toggle',
 *     validate('params', dishIdParamSchema),
 *     dishController.togglePublished
 *   );
 *
 * WHY a factory over per-route manual parsing:
 *  - DRY — one function handles params, query, and body validation uniformly.
 *  - Errors are forwarded via next(err) so they reach the central error handler
 *    without any try/catch boilerplate in route files.
 */

'use strict';

const { error: formatError } = require('../utils/responseFormatter');

/**
 * @param {'params'|'query'|'body'} source – Which part of `req` to validate
 * @param {import('zod').ZodSchema}  schema – The Zod schema to validate against
 */
function validate(source, schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const messages = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
      return res
        .status(400)
        .json(formatError(`Validation failed — ${messages}`, 'VALIDATION_ERROR'));
    }

    // Replace the raw req[source] with the Zod-coerced & defaulted data
    req[source] = result.data;
    next();
  };
}

module.exports = { validate };
