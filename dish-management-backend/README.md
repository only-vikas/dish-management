# Dish Management Backend — Phase 1

Production-grade Node.js/Express/MongoDB backend for the Dish Management Dashboard.
Implements real-time change propagation via **MongoDB Change Streams → Server-Sent Events**, ensuring the dashboard reacts to *any* write — whether through the API, MongoDB Compass, or the admin simulation script.

---

## Architecture

```
server.js          → Process lifecycle, graceful shutdown
app.js             → Express app, middleware registration
src/
  config/          → env validation, MongoDB connection
  models/          → Mongoose schemas
  routes/          → Thin HTTP routers (no logic)
  controllers/     → Request/response translation only
  services/        → Business logic + DB calls
    dish.service.js      → CRUD with atomic toggle
    realtime.service.js  → Change Stream engine with resume-token resilience
  validators/      → Zod schemas (params, query)
  middlewares/     → errorHandler, requestLogger, rateLimiter, validate
  utils/
    logger.js            → Pino structured logger
    ssePool.js           → SSE connection pool + heartbeat
    responseFormatter.js → Standard { success, data, count } envelope
  scripts/
    seed.js              → Idempotent DB seeder
    simulate-change.js   → Bypass-API DB toggle (for Change Stream demo)
```

---

## Prerequisites

- Node.js ≥ 18
- A MongoDB Atlas cluster (M10+ recommended; M0 free tier works but Change Streams require replica set which Atlas provides)
- npm ≥ 9

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env and fill in your MONGO_URI

# 3. Seed the database
npm run seed

# 4. Start the development server
npm run dev
```

---

## Available Scripts

| Script | Command | Description |
|---|---|---|
| `dev` | `npm run dev` | Start server with nodemon (hot reload) |
| `start` | `npm start` | Start server (production) |
| `seed` | `npm run seed` | Wipe + re-seed the Dish collection |
| `simulate` | `npm run simulate` | Toggle a random dish directly in DB (bypass API) |

---

## API Endpoints

### `GET /api/health`
Returns the operational status of all subsystems.

**Response `200`:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "subsystems": {
    "database": "connected",
    "changeStream": "running",
    "sseClients": 2
  }
}
```

---

### `GET /api/dishes`
Returns all dishes sorted alphabetically.

**Query params:** `sort` (dishName | createdAt | isPublished), `order` (asc | desc)

**Response `200`:**
```json
{
  "success": true,
  "data": [...],
  "count": 10
}
```

---

### `PATCH /api/dishes/:dishId/toggle`
Atomically flips `isPublished` for the given dish.

> Uses MongoDB aggregation-pipeline update (`$not: "$isPublished"`) — race-condition-safe at any concurrency.

**Response `200`:**
```json
{
  "success": true,
  "data": { "dishId": "1", "dishName": "Margherita Pizza", "isPublished": false, ... },
  "message": "Dish \"Margherita Pizza\" toggled successfully"
}
```

**Response `404`:**
```json
{ "success": false, "error": { "message": "Dish with dishId '99' not found", "code": "DISH_NOT_FOUND" } }
```

---

### `GET /api/stream`
Establishes a persistent **Server-Sent Events** connection.

```bash
# Test with curl:
curl -N http://localhost:5000/api/stream
```

**Events emitted:**

| Event | Trigger |
|---|---|
| `initial:dishes` | Sent immediately on connection with full dish list |
| `dish:updated` | Any insert/update/replace detected by Change Stream |
| `dish:deleted` | Any delete detected by Change Stream |
| `server:shutdown` | Server is shutting down gracefully |

---

## Real-Time Architecture

```
MongoDB Write (any source)
        │
        ▼
   Change Stream (oplog watcher)
   realtime.service.js
        │
        ├─ fullDocument: 'updateLookup'  → always full doc, not just diff
        ├─ Resume token saved            → stream survives replica set elections
        └─ Exponential backoff reconnect → self-healing on transient failures
        │
        ▼
   SSE Pool (ssePool.js)
   broadcast('dish:updated', payload)
        │
        ├─ 25s heartbeat pings → prevents proxy idle-timeout disconnections
        └─ Clean shutdown      → sends 'server:shutdown' event, closes all res
        │
        ▼
   Every connected browser client
```

---

## Demonstrating Real-Time (for the video)

1. Start the server: `npm run dev`
2. Open the dashboard in a browser (connects to `/api/stream`)
3. Open a **second terminal**
4. Run: `npm run simulate`
5. Watch the dashboard update instantly — no page refresh, no API call
6. The server logs will show:
   - `realtime:change` — Change Stream detected the write
   - `sse:broadcast` — Event fan-out to all connected clients

---

## Error Response Format

All errors follow a consistent shape:
```json
{
  "success": false,
  "error": {
    "message": "Human-readable description",
    "code": "MACHINE_READABLE_CODE"
  }
}
```

Stack traces are **never** included in responses — they are logged server-side only.

---

## Environment Variables

See [`.env.example`](./.env.example) for full documentation.

| Variable | Required | Default | Description |
|---|---|---|---|
| `MONGO_URI` | ✅ | — | MongoDB Atlas connection string |
| `PORT` | ✅ | 5000 | HTTP server port |
| `ALLOWED_ORIGINS` | ❌ | localhost:3000,5173 | CORS whitelist |
| `LOG_LEVEL` | ❌ | info | Pino log level |
| `NODE_ENV` | ❌ | development | Environment mode |
