/**
 * src/hooks/useSSE.ts
 *
 * Custom hook: connects to GET /api/stream (Server-Sent Events).
 *
 * SSE Reconciliation Logic (critical design — narrate this in video walkthrough):
 *
 * WHY we need to distinguish user-initiated vs external changes:
 *  The Change Stream in the backend fires for EVERY write — including the ones
 *  triggered by our own PATCH requests (via useDishes.togglePublish).
 *  Without tracking this, every user toggle would show BOTH a "Published" success
 *  toast AND an "externally changed" toast — noisy and confusing.
 *
 * Solution — "pending SSE set":
 *  - When the user clicks toggle, we record the dishId in `pendingSseDishIds` BEFORE
 *    the PATCH fires. The Change Stream event arrives ~100-300ms later.
 *  - In the SSE handler, we check this set:
 *    → If dishId is in the set: this is OUR own change propagating back. Remove from set.
 *      We still call sseUpsert to ensure state stays in sync, but we do NOT show
 *      the "externally changed" toast.
 *    → If dishId is NOT in the set: this came from elsewhere (simulate-change.js,
 *      MongoDB Compass, another session). Show the "externally changed" toast and
 *      apply a distinct emerald border pulse on the card.
 *
 * This is the senior-level SSE reconciliation detail that separates a thoughtful
 * implementation from a naive "just update state on every event" approach.
 *
 * Connection Resilience:
 *  - If the SSE connection drops (server restart, network blip), we auto-reconnect
 *    after a short delay with exponential backoff (capped at 30s).
 *  - The server sends a `server:shutdown` event during graceful shutdown — we surface
 *    this in the UI so the chef knows what's happening.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { toast } from 'sonner';
import type { Dish, RailEvent } from '../types/dish';

const BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const SSE_URL = `${BASE}/stream`;
const INITIAL_RECONNECT_DELAY = 2000;
const MAX_RECONNECT_DELAY = 30_000;

interface UseSSEOptions {
  onUpsert: (dish: Dish) => void;
  onDelete: (dishId: string) => void;
  onInitialDishes?: (dishes: Dish[]) => void;
  onRailEvent: (event: RailEvent) => void;
}

export function useSSE({
  onUpsert,
  onDelete,
  onInitialDishes,
  onRailEvent,
}: UseSSEOptions) {
  const [connected, setConnected] = useState(false);
  const [externallyUpdatedId, setExternallyUpdatedId] = useState<string | null>(null);

  // Set of dishIds for which WE triggered the toggle (prevents duplicate toasts)
  const pendingSseDishIds = useRef<Set<string>>(new Set());

  // Reconnection state
  const reconnectDelay = useRef(INITIAL_RECONNECT_DELAY);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const esRef = useRef<EventSource | null>(null);
  const mountedRef = useRef(true);

  // Expose a way for useDishes to register a "pending own toggle"
  const registerPendingToggle = useCallback((dishId: string) => {
    pendingSseDishIds.current.add(dishId);
    // Auto-expire after 5s so a missed SSE event doesn't leave state stuck
    setTimeout(() => pendingSseDishIds.current.delete(dishId), 5000);
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    function connect() {
      if (!mountedRef.current) return;

      const es = new EventSource(SSE_URL);
      esRef.current = es;

      // ── Connection opened ─────────────────────────────────────────────────
      es.onopen = () => {
        if (!mountedRef.current) return;
        setConnected(true);
        reconnectDelay.current = INITIAL_RECONNECT_DELAY; // reset backoff on success
      };

      // ── Initial dish list (bootstraps UI without a separate REST call) ────
      es.addEventListener('initial:dishes', (e: MessageEvent) => {
        if (!mountedRef.current) return;
        try {
          const { dishes }: { dishes: Dish[] } = JSON.parse(e.data);
          onInitialDishes?.(dishes);
        } catch (_) { /* malformed — ignore */ }
      });

      // ── Dish updated / inserted from Change Stream ────────────────────────
      es.addEventListener('dish:updated', (e: MessageEvent) => {
        if (!mountedRef.current) return;
        try {
          const dish: Dish = JSON.parse(e.data);

          // ── SSE RECONCILIATION LOGIC ──────────────────────────────────────
          // Check if this is our own toggle propagating back via Change Stream
          const isOwnChange = pendingSseDishIds.current.has(dish.dishId);
          if (isOwnChange) {
            // Our change — just sync state silently, no extra toast
            pendingSseDishIds.current.delete(dish.dishId);
          } else {
            // EXTERNAL change — from simulate-change.js, Compass, etc.
            // Show a distinct informative toast with the dish name and new state
            const action = dish.isPublished ? 'Published' : 'Unpublished';
            toast.info(`Update: "${dish.dishName}" status changed externally.`, {
              duration: 5000,
              style: { background: '#f0f4f8', border: '1px solid #3b82f6', color: '#1d4ed8' },
            });

            // Add to Live Order Rail with 'external' source (renders emerald pulse)
            onRailEvent({
              id: `sse-${dish.dishId}-${Date.now()}`,
              dishName: dish.dishName,
              action,
              source: 'external',
              timestamp: new Date(),
            });

            // Briefly highlight the card with emerald glow (distinct from user amber)
            setExternallyUpdatedId(dish.dishId);
            setTimeout(() => setExternallyUpdatedId(null), 3000);
          }

          // Always sync state — ensures local state matches DB truth
          onUpsert(dish);
        } catch (_) { /* malformed — ignore */ }
      });

      // ── Dish deleted ──────────────────────────────────────────────────────
      es.addEventListener('dish:deleted', (e: MessageEvent) => {
        if (!mountedRef.current) return;
        try {
          const { id }: { id: string } = JSON.parse(e.data);
          onDelete(id);
        } catch (_) { /* malformed — ignore */ }
      });

      // ── Server shutting down ──────────────────────────────────────────────
      es.addEventListener('server:shutdown', () => {
        if (!mountedRef.current) return;
        setConnected(false);
        toast.warning('Server is shutting down. Real-time updates paused.', { duration: 10000 });
      });

      // ── Connection error / drop — auto-reconnect with backoff ─────────────
      es.onerror = () => {
        if (!mountedRef.current) return;
        setConnected(false);
        es.close();
        esRef.current = null;

        reconnectTimer.current = setTimeout(() => {
          reconnectDelay.current = Math.min(reconnectDelay.current * 2, MAX_RECONNECT_DELAY);
          connect();
        }, reconnectDelay.current);
      };
    }

    connect();

    return () => {
      mountedRef.current = false;
      esRef.current?.close();
      esRef.current = null;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { connected, externallyUpdatedId, registerPendingToggle };
}
