/**
 * src/store/dishStore.ts
 *
 * Centralized React state for the dish list using useReducer.
 *
 * WHY useReducer over useState for this domain:
 *  - Optimistic UI has 3 distinct state transitions per toggle (optimistic,
 *    confirmed, rollback) — a reducer makes each transition explicit and auditable.
 *  - Reducer + dispatch pattern decouples "what happened" from "how state changes",
 *    which is critical when state is mutated from TWO sources: user actions AND SSE events.
 *
 * This is a shared module — both useDishes (REST) and useSSE (real-time) import it
 * to ensure they operate on the same single source of truth.
 */

import { useReducer, useCallback } from 'react';
import type { Dish } from '../types/dish';

// ── State shape ───────────────────────────────────────────────────────────────

export interface DishState {
  dishes: Dish[];
  loading: boolean;
  error: string | null;
}

const initialState: DishState = {
  dishes: [],
  loading: true,
  error: null,
};

// ── Action types ──────────────────────────────────────────────────────────────

type Action =
  | { type: 'FETCH_SUCCESS';    payload: Dish[] }
  | { type: 'FETCH_ERROR';      payload: string }
  // Optimistic toggle: flip the flag immediately in UI
  | { type: 'OPTIMISTIC_TOGGLE'; dishId: string }
  // Confirmed toggle: replace with the server's authoritative document
  | { type: 'CONFIRM_TOGGLE';   payload: Dish }
  // Rollback: restore the pre-toggle state after a failed PATCH
  | { type: 'ROLLBACK_TOGGLE';  dishId: string; previousValue: boolean }
  // SSE upsert: insert-or-update a dish received from Change Stream
  | { type: 'SSE_UPSERT';       payload: Dish }
  | { type: 'SSE_DELETE';       dishId: string };

// ── Reducer ───────────────────────────────────────────────────────────────────

function reducer(state: DishState, action: Action): DishState {
  switch (action.type) {

    case 'FETCH_SUCCESS':
      return { dishes: action.payload, loading: false, error: null };

    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };

    // Step 1 of optimistic update: flip the bit locally, fire the PATCH in parallel
    case 'OPTIMISTIC_TOGGLE':
      return {
        ...state,
        dishes: state.dishes.map((d) =>
          d.dishId === action.dishId ? { ...d, isPublished: !d.isPublished } : d
        ),
      };

    // Step 2a: PATCH succeeded — replace with server's document (includes new updatedAt)
    case 'CONFIRM_TOGGLE':
      return {
        ...state,
        dishes: state.dishes.map((d) =>
          d.dishId === action.payload.dishId ? action.payload : d
        ),
      };

    // Step 2b: PATCH failed — undo the optimistic flip
    case 'ROLLBACK_TOGGLE':
      return {
        ...state,
        dishes: state.dishes.map((d) =>
          d.dishId === action.dishId ? { ...d, isPublished: action.previousValue } : d
        ),
      };

    // SSE upsert — update existing dish or prepend a new one
    case 'SSE_UPSERT': {
      const exists = state.dishes.some((d) => d.dishId === action.payload.dishId);
      if (exists) {
        return {
          ...state,
          dishes: state.dishes.map((d) =>
            d.dishId === action.payload.dishId ? action.payload : d
          ),
        };
      }
      return { ...state, dishes: [action.payload, ...state.dishes] };
    }

    case 'SSE_DELETE':
      return {
        ...state,
        dishes: state.dishes.filter((d) => d.dishId !== action.dishId),
      };

    default:
      return state;
  }
}

// ── Hook export ───────────────────────────────────────────────────────────────

export function useDishStore() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const optimisticToggle = useCallback((dishId: string) =>
    dispatch({ type: 'OPTIMISTIC_TOGGLE', dishId }), []);

  const confirmToggle = useCallback((dish: Dish) =>
    dispatch({ type: 'CONFIRM_TOGGLE', payload: dish }), []);

  const rollbackToggle = useCallback((dishId: string, previousValue: boolean) =>
    dispatch({ type: 'ROLLBACK_TOGGLE', dishId, previousValue }), []);

  const sseUpsert = useCallback((dish: Dish) =>
    dispatch({ type: 'SSE_UPSERT', payload: dish }), []);

  const sseDelete = useCallback((dishId: string) =>
    dispatch({ type: 'SSE_DELETE', dishId }), []);

  const fetchSuccess = useCallback((dishes: Dish[]) =>
    dispatch({ type: 'FETCH_SUCCESS', payload: dishes }), []);

  const fetchError = useCallback((message: string) =>
    dispatch({ type: 'FETCH_ERROR', payload: message }), []);

  return {
    state,
    optimisticToggle,
    confirmToggle,
    rollbackToggle,
    sseUpsert,
    sseDelete,
    fetchSuccess,
    fetchError,
  };
}
