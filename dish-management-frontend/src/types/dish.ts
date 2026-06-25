// src/types/dish.ts
// Shared TypeScript types — mirrors the backend API response shape exactly

export interface Dish {
  id: string;           // MongoDB _id stringified
  dishId: string;       // Business identifier (e.g. "1")
  dishName: string;
  imageUrl: string;
  isPublished: boolean;
  createdAt: string;    // ISO 8601
  updatedAt: string;    // ISO 8601 — changes on every toggle
}

/** SSE event types emitted by the backend */
export type SSEEventType =
  | 'initial:dishes'   // Sent once on connect with the full list
  | 'dish:updated'     // Insert / update / replace detected by Change Stream
  | 'dish:deleted'     // Delete detected by Change Stream
  | 'server:shutdown'; // Server is going down

/** A single entry in the Live Order Rail */
export interface RailEvent {
  id: string;        // client-generated uuid for React key
  dishName: string;
  action: 'Published' | 'Unpublished';
  source: 'user' | 'external'; // "user" = my own toggle, "external" = SSE from backend
  timestamp: Date;
}

/** Standard API envelope from the backend */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  count?: number;
  message?: string;
}
