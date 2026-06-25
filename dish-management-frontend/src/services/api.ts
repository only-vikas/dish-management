/**
 * src/services/api.ts
 *
 * Thin API client — all fetch calls live here.
 * Controllers (hooks) never construct URLs or parse responses directly.
 *
 * WHY a dedicated service layer:
 *  - Single source for the base URL (one change here covers everything).
 *  - Typed return values — TypeScript catches shape mismatches at compile time.
 *  - Error normalisation in one place — hooks receive plain Error objects.
 */

import type { Dish, ApiResponse } from '../types/dish';

// Vite's proxy (vite.config.ts) forwards /api → http://localhost:5000
const BASE = '/api';

/**
 * Fetch all dishes from the backend.
 * Sorted by dishName asc by default (backend default).
 */
export async function fetchDishes(): Promise<Dish[]> {
  const res = await fetch(`${BASE}/dishes`);
  if (!res.ok) throw new Error(`Failed to fetch dishes: ${res.status}`);
  const body: ApiResponse<Dish[]> = await res.json();
  return body.data;
}

/**
 * Toggle isPublished for a dish.
 * Returns the updated dish document.
 *
 * @param dishId – The business dishId (e.g. "1"), NOT the MongoDB _id
 */
export async function toggleDish(dishId: string): Promise<Dish> {
  const res = await fetch(`${BASE}/dishes/${dishId}/toggle`, { method: 'PATCH' });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? `Toggle failed: ${res.status}`);
  }
  const body: ApiResponse<Dish> = await res.json();
  return body.data;
}

/**
 * Create a new dish.
 * Returns the created dish document.
 */
export async function createDish(payload: Partial<Dish>): Promise<Dish> {
  const res = await fetch(`${BASE}/dishes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? `Failed to create dish: ${res.status}`);
  }
  const body: ApiResponse<Dish> = await res.json();
  return body.data;
}

/**
 * Delete a dish.
 */
export async function deleteDish(dishId: string): Promise<void> {
  const res = await fetch(`${BASE}/dishes/${dishId}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? `Failed to delete dish: ${res.status}`);
  }
}
