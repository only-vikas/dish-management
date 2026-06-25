/**
 * src/models/Dish.js
 *
 * Mongoose schema for the Dish collection.
 *
 * Design notes:
 *  - `dishId` is the *business* identifier — it travels in URLs and external
 *    JSON and is decoupled from MongoDB's internal `_id`. This lets us change
 *    storage backends or shard the collection without breaking API clients.
 *  - URL validation is done via a regex rather than a library to keep the model
 *    dependency-free.  The regex accepts http:// and https:// URLs which is
 *    sufficient for this domain.
 *  - `timestamps: true` adds `createdAt` and `updatedAt` automatically — visible
 *    evidence of real-time updates in the demo (updatedAt changes on every toggle).
 *  - The `toJSON` transform strips `__v` and exposes `_id` as `id` (string) so
 *    the API response is clean without any extra mapping in controllers/services.
 */

'use strict';

const mongoose = require('mongoose');

// Simple but robust URL pattern: must start with http:// or https://
const URL_REGEX = /^https?:\/\/.+/;

const dishSchema = new mongoose.Schema(
  {
    dishId: {
      type: String,
      required: [true, 'dishId is required'],
      unique: true,
      index: true,        // explicit index for fast lookups on the business key
      trim: true,
    },
    dishName: {
      type: String,
      required: [true, 'dishName is required'],
      trim: true,
      minlength: [2, 'dishName must be at least 2 characters'],
      maxlength: [120, 'dishName cannot exceed 120 characters'],
    },
    imageUrl: {
      type: String,
      required: [true, 'imageUrl is required'],
      trim: true,
      validate: {
        validator: (v) => URL_REGEX.test(v),
        message: (props) => `"${props.value}" is not a valid URL (must start with http:// or https://)`,
      },
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // adds createdAt + updatedAt — updated on every toggle

    // Remove __v and expose _id as a string "id" field in all JSON serialization
    toJSON: {
      virtuals: false,
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: { virtuals: false },
  }
);

module.exports = mongoose.model('Dish', dishSchema);
