/**
 * src/utils/responseFormatter.js
 *
 * Standardise API response envelopes so every route returns the same shape.
 * This makes front-end code predictable and allows middleware to detect
 * success/failure reliably.
 */

'use strict';

/**
 * Build a success envelope.
 * @param {*}      data    – The payload (array or object)
 * @param {string} message – Optional human-readable message
 * @returns {{ success: true, data: *, count?: number, message?: string }}
 */
function success(data, message) {
  const envelope = { success: true, data };
  if (Array.isArray(data)) envelope.count = data.length;
  if (message) envelope.message = message;
  return envelope;
}

/**
 * Build an error envelope.
 * Stack traces are NEVER included here — they are logged server-side only.
 * @param {string} message – User-facing error description
 * @param {string} code    – Machine-readable error code (e.g. 'DISH_NOT_FOUND')
 * @returns {{ success: false, error: { message, code } }}
 */
function error(message, code = 'INTERNAL_ERROR') {
  return { success: false, error: { message, code } };
}

module.exports = { success, error };
